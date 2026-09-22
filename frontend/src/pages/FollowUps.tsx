import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone, Clock, CheckCircle, XCircle, CalendarDays } from 'lucide-react';
import { useFollowUps, useUpdateFollowUp } from '../hooks/useFollowUps';
import { FollowUpStatus, getPriorityLabel, getPriorityColor } from '../types';
import { format, isToday, isPast } from 'date-fns';
import toast from 'react-hot-toast';

const FollowUps: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    overdue: false,
    page: 1,
    limit: 20,
  });

  const { data, isLoading } = useFollowUps(filters);
  const updateFollowUp = useUpdateFollowUp();

  const handleComplete = async (id: string) => {
    try {
      await updateFollowUp.mutateAsync({
        id,
        data: { status: FollowUpStatus.COMPLETED },
      });
      toast.success('Follow-up marked as complete');
    } catch (error) {
      toast.error('Failed to update follow-up');
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateFollowUp.mutateAsync({
        id,
        data: { status: FollowUpStatus.CANCELLED },
      });
      toast.success('Follow-up cancelled');
    } catch (error) {
      toast.error('Failed to cancel follow-up');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-gray-500 mt-1">Manage your scheduled follow-ups</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-4">
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Status</option>
            <option value={FollowUpStatus.PENDING}>Pending</option>
            <option value={FollowUpStatus.COMPLETED}>Completed</option>
            <option value={FollowUpStatus.CANCELLED}>Cancelled</option>
          </select>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={filters.overdue}
              onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm">Overdue Only</span>
          </label>
          <button
            onClick={() => setFilters({ status: '', overdue: false, page: 1, limit: 20 })}
            className="btn btn-outline"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.data?.filter((f) => f.status === FollowUpStatus.PENDING).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Overdue</p>
              <p className="text-2xl font-bold text-red-600">
                {data?.data?.filter((f) => f.status === FollowUpStatus.PENDING && isPast(new Date(f.followUpDate))).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">
                {data?.data?.filter((f) => f.status === FollowUpStatus.COMPLETED).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {data?.data?.map((followUp) => {
          const followUpDate = new Date(followUp.followUpDate);
          const isOverdue = followUp.status === FollowUpStatus.PENDING && followUpDate < new Date();
          
          return (
            <div
              key={followUp.id}
              className={`card p-6 border-l-4 ${
                isOverdue ? 'border-l-red-500' : 
                followUp.status === FollowUpStatus.COMPLETED ? 'border-l-green-500' :
                followUp.status === FollowUpStatus.CANCELLED ? 'border-l-gray-500' : 'border-l-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isOverdue ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Phone className={`w-5 h-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                  </div>
                  <div>
                    <Link
                      to={`/leads/${followUp.leadId}`}
                      className="font-semibold text-gray-900 hover:text-indigo-600"
                    >
                      {followUp.leadName}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-4 h-4" />
                        {isToday(followUpDate)
                          ? 'Today'
                          : format(followUpDate, 'MMM d, yyyy')}
                      </span>
                      <span className="capitalize">{followUp.followUpType}</span>
                      <span className={`badge ${getPriorityColor(followUp.priority)}`}>
                        {getPriorityLabel(followUp.priority)}
                      </span>
                    </div>
                    {followUp.notes && (
                      <p className="text-sm text-gray-600 mt-2">{followUp.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge ${
                    followUp.status === FollowUpStatus.COMPLETED ? 'bg-green-100 text-green-800' :
                    followUp.status === FollowUpStatus.CANCELLED ? 'bg-gray-100 text-gray-800' :
                    isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {followUp.status}
                  </span>
                  {followUp.status === FollowUpStatus.PENDING && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleComplete(followUp.id)}
                        className="btn btn-outline btn-sm text-green-600"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCancel(followUp.id)}
                        className="btn btn-outline btn-sm text-red-600"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FollowUps;
