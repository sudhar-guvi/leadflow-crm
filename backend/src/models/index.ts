// Lead Status Enum
export enum LeadStatus {
  NEW = 'new',
  INTERESTED = 'interested',
  BOOKING_PAID = 'booking_paid',
  IN_PROGRESS = 'in_progress',
  CONVERTED = 'converted',
  LOST = 'lost',
}

// Lead Priority Enum
export enum LeadPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

// Follow-up Status Enum
export enum FollowUpStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

// Lead Source Enum
export enum LeadSource {
  WEBSITE = 'website',
  REFERRAL = 'referral',
  SOCIAL_MEDIA = 'social_media',
  COLD_CALL = 'cold_call',
  EVENT = 'event',
  OTHER = 'other',
}

// Lead Interface
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

// Payment Interface
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

// Follow-up Interface
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

// Notification Interface
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

// Course Interface
export interface Course {
  _id: string;
  id: string;
  name: string;
  code: string;
  description?: string;
  duration: string;
  amount: number;
  category: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard Summary Interface
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
}

// Report Aggregations
export interface LeadStatusReport {
  status: string;
  count: number;
  amount: number;
}

export interface RevenueReport {
  month: string;
  revenue: number;
  conversions: number;
}

export interface BDPerformanceReport {
  bdId: string;
  bdName: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
  revenue: number;
}

// Pagination
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Options
export interface LeadFilters {
  status?: LeadStatus;
  priority?: LeadPriority;
  source?: LeadSource;
  bdId?: string;
  courseId?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface FollowUpFilters {
  status?: FollowUpStatus;
  leadId?: string;
  dateFrom?: string;
  dateTo?: string;
  overdue?: boolean;
}
