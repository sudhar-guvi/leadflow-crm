import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { useReports } from '../hooks/useDashboard';
import { formatCurrency } from '../types';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const Reports: React.FC = () => {
  const { leadStatusReport, bdPerformanceReport, revenueReport, sourceDistribution } = useReports();

  const isLoading = leadStatusReport.isLoading || bdPerformanceReport.isLoading;

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Analytics and insights</p>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Status Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadStatusReport.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="count" fill="#3b82f6" name="Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={sourceDistribution.data}
                dataKey="count"
                nameKey="source"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ source, percent }) => `${source}: ${(percent * 100).toFixed(0)}%`}
              >
                {sourceDistribution.data?.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Report */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueReport.data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* BD Performance */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">BD Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bdPerformanceReport.data} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="bdName" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalLeads" fill="#93c5fd" name="Total Leads" />
              <Bar dataKey="convertedLeads" fill="#10b981" name="Converted" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* BD Revenue Table */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">BD Revenue Breakdown</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">BD Name</th>
                  <th className="text-left py-2">Total Leads</th>
                  <th className="text-left py-2">Converted</th>
                  <th className="text-left py-2">Conversion Rate</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {bdPerformanceReport.data?.map((bd) => (
                  <tr key={bd.bdId} className="border-b">
                    <td className="py-3 font-medium">{bd.bdName}</td>
                    <td>{bd.totalLeads}</td>
                    <td>{bd.convertedLeads}</td>
                    <td>{bd.conversionRate.toFixed(1)}%</td>
                    <td className="text-right font-medium text-green-600">
                      {formatCurrency(bd.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
