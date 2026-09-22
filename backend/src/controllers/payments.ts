import { Response } from 'express';
import { z } from 'zod';
import { PaymentModel } from '../data/models-payment.js';
import { LeadModel } from '../data/models.js';
import { FollowUpModel } from '../data/models-followup.js';
import { NotificationModel } from '../data/models-notification.js';
import { PaymentStatus, Payment, PaginatedResult } from '../models/index.js';
import { evaluateLead, isPaymentOverdue } from '../services/businessRules.js';

// Validation schemas
const createPaymentSchema = z.object({
  leadId: z.string().min(1, 'Lead ID is required'),
  leadName: z.string().min(1, 'Lead name is required'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  paymentType: z.enum(['booking', 'full', 'partial', 'remainder']),
  paymentMethod: z.enum(['upi', 'card', 'bank_transfer', 'cash', 'other']).optional().default('upi'),
  paymentStatus: z.nativeEnum(PaymentStatus).optional().default(PaymentStatus.PENDING),
  paymentDueDate: z.string().optional(),
  paymentDate: z.string().optional(),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

const updatePaymentSchema = createPaymentSchema.partial();

// Convert to JSON
const paymentToJson = (doc: any): Payment => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  leadId: doc.leadId,
  leadName: doc.leadName,
  amount: doc.amount,
  paymentType: doc.paymentType,
  paymentMethod: doc.paymentMethod,
  paymentStatus: doc.paymentStatus,
  paymentDueDate: doc.paymentDueDate,
  paymentDate: doc.paymentDate,
  transactionId: doc.transactionId,
  notes: doc.notes,
  createdBy: doc.createdBy,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
});

// Get all payments
export const getPayments = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, status, leadId, dateFrom, dateTo } = req.query;
    
    const query: any = {};
    if (status) query.paymentStatus = status;
    if (leadId) query.leadId = leadId;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await PaymentModel.countDocuments(query);
    const payments = await PaymentModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    res.json({
      data: payments.map(paymentToJson),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    } as PaginatedResult<Payment>);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
};

// Get payment by ID
export const getPaymentById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const payment = await PaymentModel.findById(id).lean();
    
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }
    
    res.json(paymentToJson(payment));
  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({ error: 'Failed to fetch payment' });
  }
};

// Create new payment
export const createPayment = async (req: any, res: Response): Promise<void> => {
  try {
    const data = createPaymentSchema.parse(req.body);
    
    // Update lead's bookingPaid if this is a booking payment
    if (data.paymentType === 'booking' && (data.paymentStatus === PaymentStatus.PAID || !data.paymentStatus)) {
      await LeadModel.findByIdAndUpdate(data.leadId, {
        bookingPaid: true,
        bookingAmount: data.amount,
      });
    }

    const payment = await PaymentModel.create({
      ...data,
      paymentStatus: data.paymentStatus || PaymentStatus.PAID,
      paymentDate: data.paymentDate || (data.paymentStatus === PaymentStatus.PAID ? new Date().toISOString() : undefined),
      createdBy: req.user?.id || 'system',
    });

    // Re-evaluate lead
    await reEvaluateLeadPayments(data.leadId);

    // Create notification
    await NotificationModel.create({
      type: 'payment_received',
      title: 'Payment Received',
      message: `Payment of ₹${data.amount.toLocaleString()} received from ${data.leadName}`,
      relatedLeadId: data.leadId,
      relatedPaymentId: payment._id.toString(),
      isRead: false,
      priority: 'medium',
    });

    res.status(201).json(paymentToJson(payment));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error creating payment:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
};

// Update payment
export const updatePayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updatePaymentSchema.parse(req.body);
    
    const payment = await PaymentModel.findById(id);
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Update payment
    Object.assign(payment, data);
    if (data.paymentStatus === PaymentStatus.PAID && !payment.paymentDate) {
      payment.paymentDate = new Date().toISOString();
    }
    await payment.save();

    // Re-evaluate lead
    await reEvaluateLeadPayments(payment.leadId);

    // Create notification for payment status change
    if (data.paymentStatus === PaymentStatus.PAID) {
      await NotificationModel.create({
        type: 'payment_received',
        title: 'Payment Received',
        message: `Payment of ₹${payment.amount.toLocaleString()} confirmed for ${payment.leadName}`,
        relatedLeadId: payment.leadId,
        relatedPaymentId: payment._id.toString(),
        isRead: false,
        priority: 'medium',
      });
    }

    res.json(paymentToJson(await PaymentModel.findById(id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
};

// Delete payment
export const deletePayment = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const payment = await PaymentModel.findById(id);
    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    const leadId = payment.leadId;
    await PaymentModel.findByIdAndDelete(id);
    
    // Re-evaluate lead
    await reEvaluateLeadPayments(leadId);
    
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
};

// Helper function to re-evaluate lead after payment changes
async function reEvaluateLeadPayments(leadId: string): Promise<void> {
  const lead = await LeadModel.findById(leadId).lean();
  if (!lead) return;

  const payments = await PaymentModel.find({ leadId }).lean();
  const followUps = await FollowUpModel.find({ leadId }).lean();

  const totalPaid = payments
    .filter((p: any) => p.paymentStatus === PaymentStatus.PAID)
    .reduce((sum: number, p: any) => sum + p.amount, 0);

  const hasOverduePayment = payments.some((p: any) =>
    p.paymentDueDate && new Date(p.paymentDueDate) < new Date() && p.paymentStatus !== PaymentStatus.PAID
  );

  const hasOverdueFollowUp = followUps.some((f: any) =>
    new Date(f.followUpDate) < new Date() && f.status !== 'completed'
  );

  const evaluation = evaluateLead(
    {
      ...lead,
      id: lead._id.toString(),
      _id: lead._id.toString(),
      remainingAmount: lead.courseAmount - totalPaid,
    },
    totalPaid,
    hasOverduePayment,
    hasOverdueFollowUp
  );

  await LeadModel.findByIdAndUpdate(leadId, {
    remainingAmount: evaluation.remainingAmount,
    paymentStatus: evaluation.paymentStatus,
    status: evaluation.status,
    priority: evaluation.priority,
    $inc: { __v: 1 },
  });

  // If converted, close related follow-ups
  if (evaluation.isConverted) {
    await FollowUpModel.updateMany(
      { leadId, status: { $ne: 'completed' } },
      { status: 'completed', outcome: 'Lead converted - auto-closed' }
    );

    await NotificationModel.create({
      type: 'lead_converted',
      title: 'Lead Converted! 🎉',
      message: `${lead.name} has been converted successfully!`,
      relatedLeadId: lead._id.toString(),
      isRead: false,
      priority: 'low',
    });
  }
}

// Export reEvaluateLeadPayments for use in other controllers
export { reEvaluateLeadPayments };
