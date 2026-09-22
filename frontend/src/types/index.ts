// Enums (matching backend)
export enum LeadStatus {
  NEW = 'new',
  INTERESTED = 'interested',
  BOOKING_PAID = 'booking_paid',
  IN_PROGRESS = 'in_progress',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

export enum FollowUpStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  OTHER = 'other',
}

// Interfaces (matching backend)
export interface Lead {
  _id: string;
  id: string;
  name: string;
  phone: string;
  email?: string;
  location?: string;
  courseId: string;
  courseName: string;
  courseAmount: number;
  bookingAmount: number;
  bookingPaid: boolean;
  paymentLinkGenerated: boolean;
  remainingAmount: number;
  paymentStatus: PaymentStatus;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  bdId: string;
  bdName: string;
  expectedConversionDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  id: string;
  leadId: string;
  leadName: string;
  amount: number;
  paymentType: 'booking' | 'full' | 'partial' | 'remainder';
  paymentMethod: 'upi' | 'card' | 'bank_transfer' | 'cash' | 'other';
  paymentStatus: PaymentStatus;
  paymentDueDate?: string;
  paymentDate?: string;
  transactionId?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUp {
  _id: string;
  id: string;
  leadId: string;
  leadName: string;
  followUpDate: string;
  followUpType: 'call' | 'email' | 'whatsapp' | 'meeting' | 'other';
  status: FollowUpStatus;
  priority: LeadPriority;
  notes?: string;
  delayReason?: string;
  outcome?: string;
  nextFollowUpDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  id: string;
  type: 'follow_up_due' | 'payment_overdue' | 'payment_received' | 'lead_converted' | 'high_priority' | 'system';
  title: string;
  message: string;
  relatedLeadId?: string;
  relatedPaymentId?: string;
  relatedFollowUpId?: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export interface Course {
  _id: string;
  id: string;
  name: string;
  description?: string;
  duration: string;
  amount: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  interestedLeads: number;
  convertedLeads: number;
  highPriorityLeads: number;
  overdueFollowUps: number;
  overduePayments: number;
  totalRevenue: number;
  pendingPayments: number;
  followUpsToday: number;
  unreadNotifications?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Helper functions for display
export const getLeadStatusLabel = (status: LeadStatus): string => {
  const labels: Record<LeadStatus, string> = {
    [LeadStatus.NEW]: 'New',
    [LeadStatus.INTERESTED]: 'Interested',
    [LeadStatus.BOOKING_PAID]: 'Booking Paid',
    [LeadStatus.IN_PROGRESS]: 'In Progress',
    [LeadStatus.CONVERTED]: 'Converted',
    [LeadStatus.LOST]: 'Lost',
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority: LeadPriority): string => {
  const labels: Record<LeadPriority, string> = {
    [LeadPriority.LOW]: 'Low',
    [LeadPriority.MEDIUM]: 'Medium',
    [LeadPriority.HIGH]: 'High',
    [LeadPriority.URGENT]: 'Urgent',
  };
  return labels[priority] || priority;
};

export const getPaymentStatusLabel = (status: PaymentStatus): string => {
  const labels: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'Pending',
    [PaymentStatus.PARTIAL]: 'Partial',
    [PaymentStatus.PAID]: 'Paid',
    [PaymentStatus.OVERDUE]: 'Overdue',
  };
  return labels[status] || status;
};

export const getSourceLabel = (source: LeadSource): string => {
  const labels: Record<LeadSource, string> = {
    [LeadSource.WEBSITE]: 'Website',
    [LeadSource.REFERRAL]: 'Referral',
    [LeadSource.SOCIAL_MEDIA]: 'Social Media',
    [LeadSource.COLD_CALL]: 'Cold Call',
    [LeadSource.EVENT]: 'Event',
    [LeadSource.OTHER]: 'Other',
  };
  return labels[source] || source;
};

// Status Colors
export const getStatusColor = (status: LeadStatus): string => {
  const colors: Record<LeadStatus, string> = {
    [LeadStatus.NEW]: 'bg-blue-100 text-blue-800',
    [LeadStatus.INTERESTED]: 'bg-yellow-100 text-yellow-800',
    [LeadStatus.BOOKING_PAID]: 'bg-purple-100 text-purple-800',
    [LeadStatus.IN_PROGRESS]: 'bg-orange-100 text-orange-800',
    [LeadStatus.CONVERTED]: 'bg-green-100 text-green-800',
    [LeadStatus.LOST]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority: LeadPriority): string => {
  const colors: Record<LeadPriority, string> = {
    [LeadPriority.LOW]: 'bg-gray-100 text-gray-800',
    [LeadPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
    [LeadPriority.HIGH]: 'bg-red-100 text-red-800',
    [LeadPriority.URGENT]: 'bg-red-500 text-white',
  };
  return colors[priority] || 'bg-gray-100 text-gray-800';
};

export const getPaymentStatusColor = (status: PaymentStatus): string => {
  const colors: Record<PaymentStatus, string> = {
    [PaymentStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
    [PaymentStatus.PARTIAL]: 'bg-blue-100 text-blue-800',
    [PaymentStatus.PAID]: 'bg-green-100 text-green-800',
    [PaymentStatus.OVERDUE]: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};
