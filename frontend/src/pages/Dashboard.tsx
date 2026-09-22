import React from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserPlus,
  TrendingUp,
  AlertCircle,
  Phone,
  Clock,
  CreditCard,
  IndianRupee,
} from 'lucide-react';
import { useDashboardSummary } from '../hooks/useDashboard';
import { format } from 'date-fns';

const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  link?: string;
}> = ({ title, value, icon, color, link }) => {
  const content = (
    <div className="card p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
};

const Dashboard: React.FC = () => {
  const { data: summary, isLoading, error } = useDashboardSummary();

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
        <p>Failed to load dashboard data. Please try again.</p>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back! Here's your business overview for today.
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Leads"
          value={summary?.totalLeads || 0}
          icon={<Users className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-100"
          link="/leads"
        />
        <StatCard
          title="New Leads"
          value={summary?.newLeads || 0}
          icon={<UserPlus className="w-6 h-6 text-green-600" />}
          color="bg-green-100"
          link="/leads?status=new"
        />
        <StatCard
          title="High Priority"
          value={summary?.highPriorityLeads || 0}
          icon={<AlertCircle className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
          link="/leads?priority=high"
        />
        <StatCard
          title="Converted"
          value={summary?.convertedLeads || 0}
          icon={<TrendingUp className="w-6 h-6 text-emerald-600" />}
          color="bg-emerald-100"
          link="/leads?status=converted"
        />
      </div>

      {/* Second Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Follow-ups Today"
          value={summary?.followUpsToday || 0}
          icon={<Phone className="w-6 h-6 text-blue-600" />}
          color="bg-blue-100"
          link="/follow-ups"
        />
        <StatCard
          title="Overdue Follow-ups"
          value={summary?.overdueFollowUps || 0}
          icon={<Clock className="w-6 h-6 text-orange-600" />}
          color="bg-orange-100"
          link="/follow-ups?overdue=true"
        />
        <StatCard
          title="Overdue Payments"
          value={summary?.overduePayments || 0}
          icon={<CreditCard className="w-6 h-6 text-red-600" />}
          color="bg-red-100"
          link="/payments?status=overdue"
        />
        <StatCard
          title="Pending Amount"
          value={formatCurrency(summary?.pendingPayments || 0)}
          icon={<IndianRupee className="w-6 h-6 text-purple-600" />}
          color="bg-purple-100"
          link="/payments"
        />
      </div>

      {/* Revenue Card */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
            <p className="text-indigo-100 text-sm">Total Revenue</p>
            <p className="text-3xl font-bold mt-2">
              {formatCurrency(summary?.totalRevenue || 0)}
            </p>
            <p className="text-indigo-200 text-sm mt-2">
              From {summary?.convertedLeads || 0} converted leads
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Lead Pipeline</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">New</span>
                <span className="font-medium">{summary?.newLeads || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Interested</span>
                <span className="font-medium">{summary?.interestedLeads || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Converted</span>
                <span className="font-medium">{summary?.convertedLeads || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-sm font-medium text-gray-500">Attention Needed</h3>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">High Priority Leads</span>
                <span className="font-medium text-red-600">{summary?.highPriorityLeads || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue Follow-ups</span>
                <span className="font-medium text-orange-600">{summary?.overdueFollowUps || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Overdue Payments</span>
                <span className="font-medium text-red-600">{summary?.overduePayments || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            to="/leads"
            className="btn btn-outline flex-col py-6"
          >
            <UserPlus className="w-6 h-6 mb-2" />
            <span>Add Lead</span>
          </Link>
          <Link
            to="/follow-ups"
            className="btn btn-outline flex-col py-6"
          >
            <Phone className="w-6 h-6 mb-2" />
            <span>Schedule Follow-up</span>
          </Link>
          <Link
            to="/payments"
            className="btn btn-outline flex-col py-6"
          >
            <CreditCard className="w-6 h-6 mb-2" />
            <span>Record Payment</span>
          </Link>
          <Link
            to="/reports"
            className="btn btn-outline flex-col py-6"
          >
            <TrendingUp className="w-6 h-6 mb-2" />
            <span>View Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
