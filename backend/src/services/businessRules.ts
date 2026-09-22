import { Lead, PaymentStatus, LeadStatus, LeadPriority } from '../models/index.js';

/**
 * BUSINESS RULES SERVICE
 * 
 * All business logic computed server-side in one place.
 * Ensures frontend never duplicates these calculations.
 */

// Check if a lead is HIGH PRIORITY
export function isHighPriority(lead: Lead): boolean {
  return (
    lead.bookingPaid === true &&
    lead.remainingAmount > 0 &&
    lead.paymentLinkGenerated === true &&
    lead.paymentStatus !== 'paid'
  );
}

// Check if a follow-up is overdue
export function isFollowUpOverdue(followUpDate: string, status: string): boolean {
  if (status === 'completed' || status === 'cancelled') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpDt = new Date(followUpDate);
  followUpDt.setHours(0, 0, 0, 0);
  return followUpDt < today;
}

// Check if a payment is overdue
export function isPaymentOverdue(paymentDueDate: string | undefined, paymentStatus: string): boolean {
  if (!paymentDueDate) return false;
  const isPaid = paymentStatus === 'paid' || paymentStatus === PaymentStatus.PAID;
  if (isPaid) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(paymentDueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Calculate payment status based on payments
export function calculatePaymentStatus(
  courseAmount: number,
  totalPaid: number,
  hasOverduePayment: boolean
): PaymentStatus {
  if (totalPaid >= courseAmount) return PaymentStatus.PAID;
  if (hasOverduePayment) return PaymentStatus.OVERDUE;
  if (totalPaid > 0) return PaymentStatus.PARTIAL;
  return PaymentStatus.PENDING;
}

// Calculate remaining amount
export function calculateRemainingAmount(courseAmount: number, totalPaid: number): number {
  return Math.max(0, courseAmount - totalPaid);
}

// Determine lead status based on payments
export function determineLeadStatus(
  currentStatus: LeadStatus,
  totalPaid: number,
  courseAmount: number
): LeadStatus {
  if (totalPaid >= courseAmount) {
    return LeadStatus.CONVERTED;
  }
  if (totalPaid > 0 && currentStatus === LeadStatus.INTERESTED) {
    return LeadStatus.BOOKING_PAID;
  }
  if (totalPaid > 0 && !currentStatus.includes('booking')) {
    return LeadStatus.IN_PROGRESS;
  }
  return currentStatus;
}

// Calculate priority based on multiple factors
export function calculatePriority(lead: Lead, hasOverdueFollowUp: boolean): LeadPriority {
  // HIGH PRIORITY case
  if (isHighPriority(lead)) {
    return LeadPriority.HIGH;
  }
  
  // Overdue follow-ups
  if (hasOverdueFollowUp) {
    return LeadPriority.HIGH;
  }
  
  // Payment overdue
  if (lead.paymentStatus === PaymentStatus.OVERDUE) {
    return LeadPriority.HIGH;
  }
  
  // Converted leads are low priority
  if (lead.status === LeadStatus.CONVERTED) {
    return LeadPriority.LOW;
  }
  
  // Booking paid with outstanding amount
  if (lead.status === LeadStatus.BOOKING_PAID && lead.remainingAmount > 0) {
    return LeadPriority.MEDIUM;
  }
  
  // Interested leads
  if (lead.status === LeadStatus.INTERESTED) {
    return LeadPriority.MEDIUM;
  }
  
  // New leads
  if (lead.status === LeadStatus.NEW) {
    return LeadPriority.LOW;
  }
  
  return LeadPriority.LOW;
}

// Complete business evaluation for a lead
export function evaluateLead(
  lead: Lead,
  totalPaid: number,
  hasOverduePayment: boolean,
  hasOverdueFollowUp: boolean
): {
  priority: LeadPriority;
  status: LeadStatus;
  paymentStatus: PaymentStatus;
  remainingAmount: number;
  isConverted: boolean;
} {
  const remainingAmount = calculateRemainingAmount(lead.courseAmount, totalPaid);
  const paymentStatus = calculatePaymentStatus(lead.courseAmount, totalPaid, hasOverduePayment);
  const status = determineLeadStatus(lead.status, totalPaid, lead.courseAmount);
  const isConverted = remainingAmount === 0 && totalPaid >= lead.courseAmount;
  const priority = calculatePriority(
    {
      ...lead,
      paymentStatus,
      status: isConverted ? LeadStatus.CONVERTED : status,
      remainingAmount,
    },
    hasOverdueFollowUp
  );

  return {
    priority,
    status: isConverted ? LeadStatus.CONVERTED : status,
    paymentStatus,
    remainingAmount,
    isConverted,
  };
}

// Generate notifications based on state changes
export function generateNotifications(
  oldLead: Lead | null,
  newLead: Lead,
  followUps: any[]
): Array<{
  type: 'high_priority' | 'payment_overdue' | 'lead_converted' | 'follow_up_due';
  title: string;
  message: string;
  relatedLeadId: string;
  priority: 'low' | 'medium' | 'high';
}> {
  const notifications: Array<{
    type: 'high_priority' | 'payment_overdue' | 'lead_converted' | 'follow_up_due';
    title: string;
    message: string;
    relatedLeadId: string;
    priority: 'low' | 'medium' | 'high';
  }> = [];

  // Check for conversion
  if (newLead.status === LeadStatus.CONVERTED && (!oldLead || oldLead.status !== LeadStatus.CONVERTED)) {
    notifications.push({
      type: 'lead_converted',
      title: 'Lead Converted! 🎉',
      message: `${newLead.name} has been converted successfully!`,
      relatedLeadId: newLead.id,
      priority: 'low',
    });
  }

  // Check for high priority
  if (isHighPriority(newLead) && (!oldLead || !isHighPriority(oldLead))) {
    notifications.push({
      type: 'high_priority',
      title: 'High Priority Lead Alert',
      message: `${newLead.name} requires immediate attention`,
      relatedLeadId: newLead.id,
      priority: 'high',
    });
  }

  // Check for overdue follow-ups
  const overdueFollowUp = followUps.find((f: any) => 
    f.leadId === newLead.id && 
    isFollowUpOverdue(f.followUpDate, f.status)
  );
  if (overdueFollowUp && newLead.status !== LeadStatus.CONVERTED) {
    notifications.push({
      type: 'follow_up_due',
      title: 'Overdue Follow-up',
      message: `${newLead.name} has an overdue follow-up`,
      relatedLeadId: newLead.id,
      priority: 'high',
    });
  }

  // Check for payment overdue
  if (newLead.paymentStatus === PaymentStatus.OVERDUE && 
      (!oldLead || oldLead.paymentStatus !== PaymentStatus.OVERDUE)) {
    notifications.push({
      type: 'payment_overdue',
      title: 'Payment Overdue',
      message: `${newLead.name} has an overdue payment`,
      relatedLeadId: newLead.id,
      priority: 'high',
    });
  }

  return notifications;
}
