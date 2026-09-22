import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  X,
  Phone,
} from 'lucide-react';
import { useLeads, useCreateLead, useDeleteLead } from '../hooks/useLeads';
import { useCourses } from '../hooks/useCourses';
import {
  Lead,
  LeadStatus,
  LeadPriority,
  LeadSource,
  getLeadStatusLabel,
  getPriorityLabel,
  getSourceLabel,
  getStatusColor,
  getPriorityColor,
} from '../types';
import toast from 'react-hot-toast';

// Form Schema
const leadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  location: z.string().optional(),
  courseId: z.string().min(1, 'Course is required'),
  courseName: z.string().min(1, 'Course name required'),
  courseAmount: z.number().min(0),
  bookingAmount: z.number().min(0).optional(),
  source: z.nativeEnum(LeadSource),
  bdId: z.string().default('bd-001'),
  bdName: z.string().default('Rahul Sharma'),
  expectedConversionDate: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

const statusOptions = Object.values(LeadStatus);
const priorityOptions = Object.values(LeadPriority);
const sourceOptions = Object.values(LeadSource);

const Leads: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    search: '',
    page: 1,
    limit: 20,
  });

  const { data, isLoading, error } = useLeads(filters);
  const { data: coursesData } = useCourses();
  const createLead = useCreateLead();
  const deleteLead = useDeleteLead();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      source: LeadSource.WEBSITE,
      bookingAmount: 0,
    },
  });

  const watchCourseId = watch('courseId');

  useEffect(() => {
    if (watchCourseId && coursesData?.data) {
      const course = coursesData.data.find((c) => c.id === watchCourseId);
      if (course) {
        setValue('courseName', course.name);
        setValue('courseAmount', course.amount);
      }
    }
  }, [watchCourseId, coursesData, setValue]);

  const handleCreateLead = async (data: LeadFormData) => {
    try {
      await createLead.mutateAsync({
        ...data,
        bookingPaid: false,
        paymentLinkGenerated: false,
        remainingAmount: data.courseAmount,
        status: LeadStatus.NEW,
        priority: LeadPriority.LOW,
      } as any);
      toast.success('Lead created successfully');
      setShowModal(false);
      reset();
    } catch (error) {
      toast.error('Failed to create lead');
    }
  };

  const handleDeleteLead = async () => {
    if (!selectedLead) return;
    try {
      await deleteLead.mutateAsync(selectedLead.id);
      toast.success('Lead deleted successfully');
      setShowDeleteModal(false);
      setSelectedLead(null);
    } catch (error) {
      toast.error('Failed to delete lead');
    }
  };

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
        <p>Failed to load leads. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="text-gray-500 mt-1">Manage your leads and track conversions</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Lead
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search leads..."
              className="input pl-9"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <select
            className="input"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="">All Status</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {getLeadStatusLabel(status)}
              </option>
            ))}
          </select>
          <select
            className="input"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}
          >
            <option value="">All Priority</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {getPriorityLabel(priority)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setFilters({ status: '', priority: '', search: '', page: 1, limit: 20 })}
            className="btn btn-outline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data?.data?.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-medium">
                        {lead.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{lead.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          <Phone className="w-3 h-3" />
                          {lead.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{lead.courseName}</div>
                    <div className="text-sm text-gray-500">{formatCurrency(lead.courseAmount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getStatusColor(lead.status)}`}>
                      {getLeadStatusLabel(lead.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`badge ${getPriorityColor(lead.priority)}`}>
                      {getPriorityLabel(lead.priority)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {formatCurrency(lead.remainingAmount)} remaining
                    </div>
                    <div className="text-sm text-gray-500">
                      {lead.bookingPaid ? 'Booking Paid' : 'No booking'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/leads/${lead.id}`}
                        className="btn btn-ghost p-2 text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => {
                          setSelectedLead(lead);
                          setShowDeleteModal(true);
                        }}
                        className="btn btn-ghost p-2 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.totalPages && data.totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(data.page - 1) * data.limit + 1} to {Math.min(data.page * data.limit, data.total)} of {data.total} results
            </div>
            <div className="flex gap-2">
              <button
                disabled={data.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="btn btn-outline btn-sm"
              >
                Previous
              </button>
              <button
                disabled={data.page === data.totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="btn btn-outline btn-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Add New Lead</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleCreateLead)} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Name *</label>
                  <input {...register('name')} className="input" placeholder="Full name" />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Phone *</label>
                  <input {...register('phone')} className="input" placeholder="Phone number" />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input {...register('email')} className="input" placeholder="Email address" type="email" />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Location</label>
                  <input {...register('location')} className="input" placeholder="City" />
                </div>
                <div>
                  <label className="label">Course *</label>
                  <select {...register('courseId')} className="input">
                    <option value="">Select Course</option>
                    {coursesData?.data?.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name} - {formatCurrency(course.amount)}
                      </option>
                    ))}
                  </select>
                  {errors.courseId && <p className="text-red-500 text-sm mt-1">{errors.courseId.message}</p>}
                </div>
                <div>
                  <label className="label">Source</label>
                  <select {...register('source')} className="input">
                    {sourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {getSourceLabel(source)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Notes</label>
                  <textarea {...register('notes')} className="input" placeholder="Additional notes" rows={3} />
                </div>
              </div>
              <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Delete Lead</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{selectedLead.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button onClick={handleDeleteLead} className="btn btn-destructive">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leads;
