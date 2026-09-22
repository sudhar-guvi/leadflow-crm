import { Response } from 'express';
import { z } from 'zod';
import { FollowUpModel } from '../data/models-followup.js';
import { LeadModel } from '../data/models.js';
import { NotificationModel } from '../data/models-notification.js';
import { FollowUpStatus, FollowUp, PaginatedResult } from '../models/index.js';
import { isFollowUpOverdue } from '../services/businessRules.js';

// Validation schemas
const createFollowUpSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  leadName: z.string().min(1, 'Lead name is required'),
  followUpDate: z.string().min(1, 'Follow-up date is required'),
  followUpType: z.enum(['call', 'email', 'whatsapp', 'meeting', 'other']).optional().default('call'),
  status: z.nativeEnum(FollowUpStatus).optional().default(FollowUpStatus.PENDING),
  priority: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  notes: z.string().optional(),
  delayReason: z.string().optional(),
  outcome: z.string().optional(),
  nextFollowUpDate: z.string().optional(),
});

const updateFollowUpSchema = createFollowUpSchema.partial();

// Convert to JSON
const followUpToJson = (doc: any): FollowUp => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  leadId: doc.leadId,
  leadName: doc.leadName,
  followUpDate: doc.followUpDate,
  followUpType: doc.followUpType,
  status: doc.status,
  priority: doc.priority,
  notes: doc.notes,
  delayReason: doc.delayReason,
  outcome: doc.outcome,
  nextFollowUpDate: doc.nextFollowUpDate,
  createdBy: doc.createdBy,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
});

// Get all follow-ups
export const getFollowUps = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, leadId, dateFrom, dateTo, overdue } = req.query;
    
    const query: any = {};
    if (status) query.status = status;
    if (leadId) query.leadId = leadId;
    if (dateFrom || dateTo) {
      query.followUpDate = {};
      if (dateFrom) query.followUpDate.$gte = dateFrom;
      if (dateTo) query.followUpDate.$lte = dateTo;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await FollowUpModel.countDocuments(query);
    let followUps = await FollowUpModel.find(query)
      .sort({ followUpDate: 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Filter overdue if requested
    if (overdue === 'true') {
      const today = new Date().toISOString().split('T')[0];
      followUps = followUps.filter((f: any) => 
        f.followUpDate < today && f.status !== FollowUpStatus.COMPLETED && f.status !== FollowUpStatus.CANCELLED
      );
    }

    res.json({
      data: followUps.map(followUpToJson),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    } as PaginatedResult<FollowUp>);
  } catch (error) {
    console.error('Error fetching follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch follow-ups' });
  }
};

// Get follow-up by ID
export const getFollowUpById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const followUp = await FollowUpModel.findById(id).lean();
    
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }
    
    res.json(followUpToJson(followUp));
  } catch (error) {
    console.error('Error fetching follow-up:', error);
    res.status(500).json({ error: 'Failed to fetch follow-up' });
  }
};

// Create new follow-up
export const createFollowUp = async (req: any, res: Response): Promise<void> => {
  try {
    const data = createFollowUpSchema.parse(req.body);
    const lead = await LeadModel.findById(data.leadId).lean();
    
    const followUp = await FollowUpModel.create({
      ...data,
      priority: lead?.priority || 'medium',
      createdBy: req.user?.id || 'system',
    });

    // Create notification for today's follow-ups
    const today = new Date().toISOString().split('T')[0];
    if (data.followUpDate === today) {
      await NotificationModel.create({
        type: 'follow_up_due',
        title: 'Follow-up Due Today',
        message: `Follow-up with ${data.leadName} is scheduled for today`,
        relatedLeadId: data.leadId,
        relatedFollowUpId: followUp._id.toString(),
        isRead: false,
        priority: 'medium',
      });
    }

    res.status(201).json(followUpToJson(await FollowUpModel.findById(followUp._id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error creating follow-up:', error);
    res.status(500).json({ error: 'Failed to create follow-up' });
  }
};

// Update follow-up
export const updateFollowUp = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateFollowUpSchema.parse(req.body);
    
    const followUp = await FollowUpModel.findById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    // Update follow-up
    Object.assign(followUp, data);
    await followUp.save();

    // If completed and next follow-up date provided, create new follow-up
    if (data.status === FollowUpStatus.COMPLETED && data.nextFollowUpDate) {
      const newFollowUp = await FollowUpModel.create({
        leadId: followUp.leadId,
        leadName: followUp.leadName,
        followUpDate: data.nextFollowUpDate,
        followUpType: followUp.followUpType,
        status: FollowUpStatus.PENDING,
        priority: followUp.priority,
        notes: `Created from previous follow-up: ${followUp.notes || ''}`,
        createdBy: followUp.createdBy,
      });

      await NotificationModel.create({
        type: 'follow_up_due',
        title: 'New Follow-up Scheduled',
        message: `Follow-up with ${followUp.leadName} scheduled for ${data.nextFollowUpDate}`,
        relatedLeadId: followUp.leadId,
        relatedFollowUpId: newFollowUp._id.toString(),
        isRead: false,
        priority: 'medium',
      });
    }

    res.json(followUpToJson(await FollowUpModel.findById(id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error updating follow-up:', error);
    res.status(500).json({ error: 'Failed to update follow-up' });
  }
};

// Delete follow-up
export const deleteFollowUp = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const followUp = await FollowUpModel.findById(id);
    if (!followUp) {
      res.status(404).json({ error: 'Follow-up not found' });
      return;
    }

    await FollowUpModel.findByIdAndDelete(id);
    
    res.json({ message: 'Follow-up deleted successfully' });
  } catch (error) {
    console.error('Error deleting follow-up:', error);
    res.status(500).json({ error: 'Failed to delete follow-up' });
  }
};

// Get follow-ups due today
export const getTodayFollowUps = async (req: any, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const followUps = await FollowUpModel.find({
      followUpDate: today,
      status: { $nin: [FollowUpStatus.COMPLETED, FollowUpStatus.CANCELLED] },
    })
      .sort({ followUpDate: 1 })
      .lean();

    res.json(followUps.map(followUpToJson));
  } catch (error) {
    console.error('Error fetching today\'s follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch today\'s follow-ups' });
  }
};

// Get overdue follow-ups
export const getOverdueFollowUps = async (req: any, res: Response): Promise<void> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const followUps = await FollowUpModel.find({
      followUpDate: { $lt: today },
      status: { $nin: [FollowUpStatus.COMPLETED, FollowUpStatus.CANCELLED] },
    })
      .sort({ followUpDate: 1 })
      .lean();

    res.json(followUps.map(followUpToJson));
  } catch (error) {
    console.error('Error fetching overdue follow-ups:', error);
    res.status(500).json({ error: 'Failed to fetch overdue follow-ups' });
  }
};
