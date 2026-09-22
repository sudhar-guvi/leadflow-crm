import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, IndianRupee } from 'lucide-react';
import { usePayments } from '../hooks/usePayments';
import { PaymentStatus, getPaymentStatusLabel, getPaymentStatusColor } from '../types';
import { format } from 'date-fns';

const Payments: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = usePayments(filters);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-6 rounded-lg">
        <p>Failed to load payments. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-500 mt-1">Track all payment transactions</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <select
              className="input"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            >
              <option value="">All Status</option>
              <option value={PaymentStatus.PENDING}>Pending</option>
              <option value={PaymentStatus.PARTIAL}>Partial</option>
              <option value={PaymentStatus.PAID}>Paid</option>
              <option value={PaymentStatus.OVERDUE}>Overdue</option>
            </select>
          </div>
          <button
            onClick={() => setFilters({ status: '', page: 1, limit: 20 })}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Paid</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(
                  data?.data?.filter((p) => p.paymentStatus === PaymentStatus.PAID).reduce((sum, p) => sum + p.amount, 0) || 0
                )}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.data?.filter((p) => p.paymentStatus === PaymentStatus.PENDING).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-100 flex items-center justify-center">
              <IndianRupee className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.data?.filter((p) => p.paymentStatus === PaymentStatus.OVERDUE).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lead</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/leads/${payment.leadId}`} className="text-indigo-600 hover:text-indigo-800">
                      {payment.leadName}
                    </Link>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatCurrency(payment.amount)}</td>
                  <td className="px-6 py-4 capitalize">{payment.paymentType}</td>
                  <td className="px-6 py-4 capitalize">{payment.paymentMethod}</td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getPaymentStatusColor(payment.paymentStatus)}`}>
                      {getPaymentStatusLabel(payment.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {payment.paymentDate
                      ? format(new Date(payment.paymentDate), 'MMM d, yyyy')
                      : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <Link
                      to={`/leads/${payment.leadId}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm"
                    >
                      View Lead
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
