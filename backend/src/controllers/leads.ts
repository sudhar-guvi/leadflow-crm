import { Response } from 'express';
import { z } from 'zod';
import { LeadModel } from '../data/models.js';
import { PaymentModel } from '../data/models-payment.js';
import { FollowUpModel } from '../data/models-followup.js';
import { NotificationModel } from '../data/models-notification.js';
import { LeadStatus, LeadPriority, LeadSource, PaymentStatus, Lead, PaginatedResult, LeadFilters } from '../models/index.js';
import { evaluateLead } from '../services/businessRules.js';

// Validation schemas
const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  location: z.string().optional(),
  courseId: z.string().min(1, 'Course is required'),
  courseName: z.string().min(1, 'Course name is required'),
  courseAmount: z.number().min(0),
  bookingAmount: z.number().min(0).optional().default(0),
  bookingPaid: z.boolean().optional().default(false),
  paymentLinkGenerated: z.boolean().optional().default(false),
  source: z.nativeEnum(LeadSource).optional().default(LeadSource.WEBSITE),
  bdId: z.string().min(1, 'BD ID is required'),
  bdName: z.string().min(1, 'BD Name is required'),
  expectedConversionDate: z.string().optional(),
  notes: z.string().optional(),
});

const updateLeadSchema = createLeadSchema.partial();

// Convert MongoDB document to JSON
const leadToJson = (doc: any): Lead => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  name: doc.name,
  phone: doc.phone,
  email: doc.email,
  location: doc.location,
  courseId: doc.courseId,
  courseName: doc.courseName,
  courseAmount: doc.courseAmount,
  bookingAmount: doc.bookingAmount,
  bookingPaid: doc.bookingPaid,
  paymentLinkGenerated: doc.paymentLinkGenerated,
  remainingAmount: doc.remainingAmount,
  paymentStatus: doc.paymentStatus,
  status: doc.status,
  priority: doc.priority,
  source: doc.source,
  bdId: doc.bdId,
  bdName: doc.bdName,
  expectedConversionDate: doc.expectedConversionDate,
  notes: doc.notes,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
});

// Get all leads with filters and pagination
export const getLeads = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, priority, source, bdId, courseId, search } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (source) query.source = source;
    if (bdId) query.bdId = bdId;
    if (courseId) query.courseId = courseId;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await LeadModel.countDocuments(query);
    const leads = await LeadModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const result: PaginatedResult<Lead> = {
      data: leads.map(leadToJson),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
};

// Get single lead by ID
export const getLeadById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await LeadModel.findById(id).lean();
    
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Get related data
    const payments = await PaymentModel.find({ leadId: id }).lean();
    const followUps = await FollowUpModel.find({ leadId: id }).lean();
    
    const totalPaid = payments
      .filter((p: any) => p.paymentStatus === PaymentStatus.PAID)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    
    const hasOverduePayment = payments.some((p: any) => 
      p.paymentDueDate && new Date(p.paymentDueDate) < new Date() && p.paymentStatus !== PaymentStatus.PAID
    );
    
    const hasOverdueFollowUp = followUps.some((f: any) => 
      new Date(f.followUpDate) < new Date() && f.status !== 'completed'
    );

    // Re-evaluate lead
    const evaluation = evaluateLead(leadToJson(lead), totalPaid, hasOverduePayment, hasOverdueFollowUp);

    // Update lead if evaluation changed
    if (lead.priority !== evaluation.priority || lead.status !== evaluation.status) {
      await LeadModel.findByIdAndUpdate(id, {
        priority: evaluation.priority,
        status: evaluation.status,
        paymentStatus: evaluation.paymentStatus,
        remainingAmount: evaluation.remainingAmount,
      });
      // Re-fetch updated lead
      const updatedLead = await LeadModel.findById(id).lean();
      res.json({
        ...leadToJson(updatedLead || lead),
        evaluation,
        payments: payments.map(p => ({ ...p, id: p._id.toString() })),
        followUps: followUps.map(f => ({ ...f, id: f._id.toString() })),
      });
      return;
    }

    res.json({
      ...leadToJson(lead),
      evaluation,
      payments: payments.map((p: any) => ({ ...p, id: p._id.toString() })),
      followUps: followUps.map((f: any) => ({ ...f, id: f._id.toString() })),
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ error: 'Failed to fetch lead' });
  }
};

// Create new lead
export const createLead = async (req: any, res: Response): Promise<void> => {
  try {
    const data = createLeadSchema.parse(req.body);
    
    const lead = await LeadModel.create({
      ...data,
      remainingAmount: data.courseAmount - (data.bookingPaid ? data.bookingAmount : 0),
      paymentStatus: data.bookingPaid ? PaymentStatus.PARTIAL : PaymentStatus.PENDING,
      status: data.bookingPaid ? LeadStatus.BOOKING_PAID : LeadStatus.NEW,
      priority: LeadPriority.LOW,
    });

    // Create initial notification
    await NotificationModel.create({
      type: 'system',
      title: 'New Lead Created',
      message: `New lead ${data.name} has been added to the system`,
      relatedLeadId: lead._id.toString(),
      isRead: false,
      priority: 'low',
    });

    // Evaluate and update priority
    const evaluation = evaluateLead(
      leadToJson(lead),
      data.bookingPaid ? data.bookingAmount : 0,
      false,
      false
    );

    await LeadModel.findByIdAndUpdate(lead._id, {
      priority: evaluation.priority,
    });

    res.status(201).json(leadToJson(await LeadModel.findById(lead._id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error creating lead:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
};

// Update lead
export const updateLead = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateLeadSchema.parse(req.body);
    
    const existingLead = await LeadModel.findById(id);
    if (!existingLead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Get all payments for this lead
    const payments = await PaymentModel.find({ leadId: id }).lean();
    const totalPaid = payments
      .filter((p: any) => p.paymentStatus === PaymentStatus.PAID)
      .reduce((sum: number, p: any) => sum + p.amount, 0);
    
    const hasOverduePayment = payments.some((p: any) => 
      p.paymentDueDate && new Date(p.paymentDueDate) < new Date() && p.paymentStatus !== PaymentStatus.PAID
    );

    const followUps = await FollowUpModel.find({ leadId: id }).lean();
    const hasOverdueFollowUp = followUps.some((f: any) => 
      new Date(f.followUpDate) < new Date() && f.status !== 'completed'
    );

    // Calculate updated values
    const updatedData: any = { ...data };
    if (data.bookingPaid || data.bookingAmount !== undefined) {
      const bookingAmount = data.bookingAmount ?? existingLead.bookingAmount;
      updatedData.remainingAmount = existingLead.courseAmount - totalPaid;
    }

    // Update lead
    await LeadModel.findByIdAndUpdate(id, updatedData);
    
    // Re-evaluate after update
    const updatedLead = await LeadModel.findById(id);
    if (!updatedLead) {
      res.status(404).json({ error: 'Lead not found after update' });
      return;
    }

    const evaluation = evaluateLead(
      leadToJson(updatedLead),
      totalPaid,
      hasOverduePayment,
      hasOverdueFollowUp
    );

    await LeadModel.findByIdAndUpdate(id, {
      priority: evaluation.priority,
      status: evaluation.status,
      paymentStatus: evaluation.paymentStatus,
      remainingAmount: evaluation.remainingAmount,
    });

    // Create notification for conversion
    if (evaluation.isConverted) {
      await NotificationModel.create({
        type: 'lead_converted',
        title: 'Lead Converted! 🎉',
        message: `${updatedLead.name} has been converted successfully!`,
        relatedLeadId: updatedLead._id.toString(),
        isRead: false,
        priority: 'low',
      });
      
      // Close open payment-related follow-ups
      await FollowUpModel.updateMany(
        { leadId: id, status: { $ne: 'completed' } },
        { status: 'completed', outcome: 'Lead converted - auto-closed' }
      );
    }

    res.json(leadToJson(await LeadModel.findById(id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error updating lead:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
};

// Delete lead
export const deleteLead = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const lead = await LeadModel.findById(id);
    if (!lead) {
      res.status(404).json({ error: 'Lead not found' });
      return;
    }

    // Delete related records
    await Promise.all([
      PaymentModel.deleteMany({ leadId: id }),
      FollowUpModel.deleteMany({ leadId: id }),
      NotificationModel.deleteMany({ relatedLeadId: id }),
    ]);
    
    await LeadModel.findByIdAndDelete(id);
    
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ error: 'Failed to delete lead' });
  }
};

// Get lead count by status
export const getLeadStats = async (req: any, res: Response): Promise<void> => {
  try {
    const stats = await LeadModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$courseAmount' },
        },
      },
    ]);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching lead stats:', error);
    res.status(500).json({ error: 'Failed to fetch lead stats' });
  }
};
