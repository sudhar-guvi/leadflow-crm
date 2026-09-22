import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle, AlertCircle, IndianRupee, TrendingUp, Phone } from 'lucide-react';
import { useNotifications, useMarkAllAsRead } from '../hooks/useNotifications';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Notifications: React.FC = () => {
  const { data, isLoading } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();

  const getIcon = (type: string) => {
    switch (type) {
      case 'follow_up_due':
        return <Phone className="w-5 h-5 text-blue-600" />;
      case 'payment_overdue':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'payment_received':
        return <IndianRupee className="w-5 h-5 text-green-600" />;
      case 'lead_converted':
        return <TrendingUp className="w-5 h-5 text-emerald-600" />;
      case 'high_priority':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead.mutateAsync();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">
            {data?.unreadCount || 0} unread notifications
          </p>
        </div>
        {data?.unreadCount && data.unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn btn-outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Mark All Read
          </button>
        )}
      </div>

      {/* List */}
      <div className="space-y-4">
        {data?.data?.map((notification) => (
          <div
            key={notification.id}
            className={`card p-4 border-l-4 ${
              notification.isRead ? 'border-l-gray-300' : 'border-l-indigo-500 bg-indigo-50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                notification.isRead ? 'bg-gray-100' : 'bg-indigo-100'
              }`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{notification.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                {notification.relatedLeadId && (
                  <Link
                    to={`/leads/${notification.relatedLeadId}`}
                    className="text-sm text-indigo-600 hover:text-indigo-800 mt-2 inline-block"
                  >
                    View Lead →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}

        {data?.data?.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notifications</h3>
            <p className="text-gray-500">You're all caught up!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
