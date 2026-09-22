import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Phone } from 'lucide-react';
import { useFollowUps } from '../hooks/useFollowUps';
import { FollowUpStatus } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';

const CalendarPage: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { data: followUpsData } = useFollowUps({ limit: 100 });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get follow-ups for a specific day
  const getFollowUpsForDay = (date: Date) => {
    return followUpsData?.data?.filter((f) => {
      const followUpDate = new Date(f.followUpDate);
      return isSameDay(followUpDate, date) && f.status === FollowUpStatus.PENDING;
    }) || [];
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-500 mt-1">View your scheduled follow-ups</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card p-6">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="btn btn-outline btn-icon"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="btn btn-outline btn-icon"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month start */}
          {Array.from({ length: monthStart.getDay() }).map((_, i) => (
            <div key={`empty-${i}`} className="h-24 bg-gray-50 rounded-lg" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const dayFollowUps = getFollowUpsForDay(day);
            const hasFollowUps = dayFollowUps.length > 0;

            return (
              <div
                key={day.toISOString()}
                className={`h-24 p-2 rounded-lg border ${
                  isToday(day)
                    ? 'border-indigo-500 bg-indigo-50'
                    : hasFollowUps
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-gray-200'
                }`}
              >
                <div className={`text-sm font-medium ${isToday(day) ? 'text-indigo-600' : 'text-gray-900'}`}>
                  {format(day, 'd')}
                </div>
                {hasFollowUps && (
                  <div className="mt-1 space-y-1 overflow-hidden">
                    {dayFollowUps.slice(0, 2).map((f) => (
                      <Link
                        key={f.id}
                        to={`/leads/${f.leadId}`}
                        className="block text-xs bg-blue-100 text-blue-800 rounded px-1 truncate"
                      >
                        <Phone className="w-3 h-3 inline mr-1" />
                        {f.leadName.slice(0, 10)}
                      </Link>
                    ))}
                    {dayFollowUps.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayFollowUps.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CalendarPage;
