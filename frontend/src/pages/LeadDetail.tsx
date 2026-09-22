import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  IndianRupee,
  FileText,
} from 'lucide-react';
import { useLeads } from '../hooks/useLeads';
import { usePayments, useCreatePayment } from '../hooks/usePayments';
import { useFollowUps, useCreateFollowUp } from '../hooks/useFollowUps';
import {
  PaymentStatus,
  FollowUpStatus,
  getLeadStatusLabel,
  getPriorityLabel,
  getStatusColor,
  getPriorityColor,
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from '../types';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount is required'),
  paymentType: z.enum(['booking', 'full', 'partial', 'remainder']),
  paymentMethod: z.enum(['upi', 'card', 'bank_transfer', 'cash', 'other']),
  notes: z.string().optional(),
});

const followUpSchema = z.object({
  followUpDate: z.string().min(1, 'Date is required'),
  followUpType: z.enum(['call', 'email', 'whatsapp', 'meeting', 'other']),
  notes: z.string().optional(),
});

const LeadDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);

  const { data: leadData, isLoading: leadLoading } = useLeads();
  
  // Get payments and follow-ups for this lead
  const { data: paymentsData } = usePayments({ leadId: id, limit: 100 });
  const { data: followUpsData } = useFollowUps({ leadId: id, limit: 100 });

  const createPayment = useCreatePayment();
  const createFollowUp = useCreateFollowUp();

  const lead = leadData?.data?.find((l) => l.id === id);
  const payments = paymentsData?.data || [];
  const followUps = followUpsData?.data || [];

  const paymentForm = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      paymentType: 'partial' as const,
      paymentMethod: 'upi' as const,
      notes: '',
    },
  });

  const followUpForm = useForm({
    resolver: zodResolver(followUpSchema),
    defaultValues: {
      followUpType: 'call' as const,
      followUpDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const handleAddPayment = async (data: any) => {
    if (!lead) return;
    try {
      await createPayment.mutateAsync({
        leadId: lead.id,
        leadName: lead.name,
        amount: data.amount,
        paymentType: data.paymentType,
        paymentMethod: data.paymentMethod,
        paymentStatus: PaymentStatus.PAID,
        paymentDate: new Date().toISOString(),
        notes: data.notes,
      });
      toast.success('Payment added successfully');
      setShowPaymentModal(false);
      paymentForm.reset();
    } catch (error) {
      toast.error('Failed to add payment');
    }
  };

  const handleAddFollowUp = async (data: any) => {
    if (!lead) return;
    try {
      await createFollowUp.mutateAsync({
        leadId: lead.id,
        leadName: lead.name,
        followUpDate: data.followUpDate,
        followUpType: data.followUpType,
        status: FollowUpStatus.PENDING,
        priority: lead.priority,
        notes: data.notes,
      });
      toast.success('Follow-up scheduled successfully');
      setShowFollowUpModal(false);
      followUpForm.reset();
    } catch (error) {
      toast.error('Failed to schedule follow-up');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (leadLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Lead not found</h2>
        <Link to="/leads" className="text-indigo-600 hover:text-indigo-800 mt-4 inline-block">
          ← Back to Leads
        </Link>
      </div>
    );
  }

  const totalPayments = payments
    .filter((p) => p.paymentStatus === PaymentStatus.PAID)
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/leads')} className="btn btn-ghost btn-icon">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{lead.name}</h1>
            <p className="text-gray-500">{lead.courseName}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowPaymentModal(true)} className="btn btn-primary">
            <IndianRupee className="w-4 h-4 mr-2" />
            Add Payment
          </button>
          <button onClick={() => setShowFollowUpModal(true)} className="btn btn-outline">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Follow-up
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Info Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Information</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-2">
                <Phone className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-gray-900">{lead.phone}</p>
                </div>
              </div>
              {lead.email && (
                <div className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-gray-900">{lead.email}</p>
                  </div>
                </div>
              )}
              {lead.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Location</p>
                    <p className="text-gray-900">{lead.location}</p>
                  </div>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Source</p>
                <p className="text-gray-900">{lead.source}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">BD Owner</p>
                <p className="text-gray-900">{lead.bdName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-gray-900">{format(new Date(lead.createdAt), 'MMM d, yyyy')}</p>
              </div>
            </div>
            {lead.notes && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="text-gray-900">{lead.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment History</h2>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments recorded yet</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-sm text-gray-500">
                        {payment.paymentType} • {format(new Date(payment.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <span className={`badge ${getPaymentStatusColor(payment.paymentStatus)}`}>
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Follow-up History */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Follow-up History</h2>
            {followUps.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No follow-ups scheduled</p>
            ) : (
              <div className="space-y-3">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium capitalize">{fu.followUpType}</p>
                      <p className="text-sm text-gray-500">
                        {format(new Date(fu.followUpDate), 'MMM d, yyyy')}
                        {fu.notes && ` • ${fu.notes}`}
                      </p>
                    </div>
                    <span className={`badge ${fu.status === FollowUpStatus.COMPLETED ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {fu.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <div className="card p-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <span className={`badge ${getStatusColor(lead.status)}`}>
                  {getLeadStatusLabel(lead.status)}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Priority</p>
                <span className={`badge ${getPriorityColor(lead.priority)}`}>
                  {getPriorityLabel(lead.priority)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Course Amount</span>
                <span className="font-medium">{formatCurrency(lead.courseAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-medium text-green-600">{formatCurrency(totalPayments)}</span>
              </div>
              <div className="flex justify-between pt-3 border-t">
                <span className="text-gray-900 font-medium">Remaining</span>
                <span className="font-bold text-indigo-600">{formatCurrency(lead.remainingAmount)}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">Payment Status</span>
                <span className={`badge ${getPaymentStatusColor(lead.paymentStatus)}`}>
                  {getPaymentStatusLabel(lead.paymentStatus)}
                </span>
              </div>
            </div>
          </div>

          {/* Flags */}
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Flags</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Booking Paid</span>
                <span className={`${lead.bookingPaid ? 'text-green-600' : 'text-gray-400'}`}>
                  {lead.bookingPaid ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">Payment Link Generated</span>
                <span className={`${lead.paymentLinkGenerated ? 'text-green-600' : 'text-gray-400'}`}>
                  {lead.paymentLinkGenerated ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Add Payment</h2>
            <form onSubmit={paymentForm.handleSubmit(handleAddPayment)} className="space-y-4">
              <div>
                <label className="label">Amount (₹)</label>
                <input
                  type="number"
                  {...paymentForm.register('amount', { valueAsNumber: true })}
                  className="input"
                />
                {paymentForm.formState.errors.amount && (
                  <p className="text-red-500 text-sm mt-1">
                    {paymentForm.formState.errors.amount.message}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Payment Type</label>
                <select {...paymentForm.register('paymentType')} className="input">
                  <option value="booking">Booking</option>
                  <option value="partial">Partial</option>
                  <option value="remainder">Remainder</option>
                  <option value="full">Full</option>
                </select>
              </div>
              <div>
                <label className="label">Payment Method</label>
                <select {...paymentForm.register('paymentMethod')} className="input">
                  <option value="upi">UPI</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea {...paymentForm.register('notes')} className="input" rows={2} />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Follow-up Modal */}
      {showFollowUpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Schedule Follow-up</h2>
            <form onSubmit={followUpForm.handleSubmit(handleAddFollowUp)} className="space-y-4">
              <div>
                <label className="label">Follow-up Date</label>
                <input
                  type="date"
                  {...followUpForm.register('followUpDate')}
                  className="input"
                />
              </div>
              <div>
                <label className="label">Type</label>
                <select {...followUpForm.register('followUpType')} className="input">
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">Meeting</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea {...followUpForm.register('notes')} className="input" rows={2} />
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowFollowUpModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
