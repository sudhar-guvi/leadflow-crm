import { Response } from 'express';
import { LeadModel } from '../data/models.js';
import { PaymentModel } from '../data/models-payment.js';
import { FollowUpModel } from '../data/models-followup.js';
import { NotificationModel } from '../data/models-notification.js';
import { DashboardSummary, LeadStatus, LeadPriority, PaymentStatus, FollowUpStatus } from '../models/index.js';

// Get dashboard summary
export const getDashboardSummary = async (req: any, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];

    // Get all counts in parallel
    const [
      totalLeads,
      newLeads,
      interestedLeads,
      convertedLeads,
      highPriorityLeads,
      overdueFollowUps,
      overduePayments,
      totalRevenue,
      pendingPayments,
      followUpsToday,
      unreadNotifications,
    ] = await Promise.all([
      LeadModel.countDocuments({ status: { $ne: LeadStatus.LOST } }),
      LeadModel.countDocuments({ status: LeadStatus.NEW }),
      LeadModel.countDocuments({ status: LeadStatus.INTERESTED }),
      LeadModel.countDocuments({ status: LeadStatus.CONVERTED }),
      LeadModel.countDocuments({ priority: LeadPriority.HIGH, status: { $ne: LeadStatus.CONVERTED } }),
      FollowUpModel.countDocuments({
        followUpDate: { $lt: todayStr },
        status: { $nin: [FollowUpStatus.COMPLETED, FollowUpStatus.CANCELLED] },
      }),
      PaymentModel.countDocuments({
        paymentDueDate: { $lt: today.toISOString() },
        paymentStatus: { $ne: PaymentStatus.PAID },
      }),
      PaymentModel.aggregate([
        { $match: { paymentStatus: PaymentStatus.PAID } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      LeadModel.aggregate([
        { $match: { status: { $ne: LeadStatus.CONVERTED } } },
        { $group: { _id: null, total: { $sum: '$remainingAmount' } } },
      ]),
      FollowUpModel.countDocuments({
        followUpDate: todayStr,
        status: { $nin: [FollowUpStatus.COMPLETED, FollowUpStatus.CANCELLED] },
      }),
      NotificationModel.countDocuments({ isRead: false }),
    ]);

    const summary: DashboardSummary = {
      totalLeads,
      newLeads,
      interestedLeads,
      convertedLeads,
      highPriorityLeads,
      overdueFollowUps,
      overduePayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingPayments: pendingPayments[0]?.total || 0,
      followUpsToday,
    };

    res.json({ ...summary, unreadNotifications });
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};

// Get lead status distribution
export const getLeadStatusDistribution = async (req: any, res: Response): Promise<void> => {
  try {
    const distribution = await LeadModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$courseAmount' },
        },
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          amount: '$totalAmount',
          _id: 0,
        },
      },
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching lead status distribution:', error);
    res.status(500).json({ error: 'Failed to fetch lead status distribution' });
  }
};

// Get BD performance report
export const getBDPerformanceReport = async (req: any, res: Response): Promise<void> => {
  try {
    const report = await LeadModel.aggregate([
      {
        $group: {
          _id: { bdId: '$bdId', bdName: '$bdName' },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $eq: ['$status', LeadStatus.CONVERTED] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', LeadStatus.CONVERTED] }, '$courseAmount', 0] },
          },
        },
      },
      {
        $project: {
          bdId: '$_id.bdId',
          bdName: '$_id.bdName',
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100],
          },
          revenue: 1,
          _id: 0,
        },
      },
      { $sort: { revenue: -1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Error fetching BD performance report:', error);
    res.status(500).json({ error: 'Failed to fetch BD performance report' });
  }
};

// Get revenue report (monthly)
export const getRevenueReport = async (req: any, res: Response): Promise<void> => {
  try {
    const year = new Date().getFullYear();
    const report = await PaymentModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.PAID,
          createdAt: { $gte: new Date(`${year}-01-01`) },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$amount' },
          conversions: { $sum: 1 },
        },
      },
      {
        $project: {
          month: {
            $let: {
              vars: {
                months: ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
              },
              in: { $arrayElemAt: ['$$months', '$_id'] },
            },
          },
          revenue: 1,
          conversions: 1,
          _id: 0,
        },
      },
      { $sort: { month: 1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Error fetching revenue report:', error);
    res.status(500).json({ error: 'Failed to fetch revenue report' });
  }
};

// Get source distribution report
export const getSourceDistribution = async (req: any, res: Response): Promise<void> => {
  try {
    const distribution = await LeadModel.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          convertedCount: {
            $sum: { $cond: [{ $eq: ['$status', LeadStatus.CONVERTED] }, 1, 0] },
          },
          revenue: {
            $sum: { $cond: [{ $eq: ['$status', LeadStatus.CONVERTED] }, '$courseAmount', 0] },
          },
        },
      },
      {
        $project: {
          source: '$_id',
          count: 1,
          convertedCount: 1,
          conversionRate: {
            $multiply: [{ $divide: ['$convertedCount', '$count'] }, 100],
          },
          revenue: 1,
          _id: 0,
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json(distribution);
  } catch (error) {
    console.error('Error fetching source distribution:', error);
    res.status(500).json({ error: 'Failed to fetch source distribution' });
  }
};

// Get course popularity report
export const getCoursePopularityReport = async (req: any, res: Response): Promise<void> => {
  try {
    const report = await LeadModel.aggregate([
      {
        $group: {
          _id: { courseId: '$courseId', courseName: '$courseName' },
          totalLeads: { $sum: 1 },
          convertedLeads: {
            $sum: { $cond: [{ $eq: ['$status', LeadStatus.CONVERTED] }, 1, 0] },
          },
          revenue: { $sum: '$courseAmount' },
        },
      },
      {
        $project: {
          courseId: '$_id.courseId',
          courseName: '$_id.courseName',
          totalLeads: 1,
          convertedLeads: 1,
          conversionRate: {
            $multiply: [{ $divide: ['$convertedLeads', '$totalLeads'] }, 100],
          },
          revenue: 1,
          _id: 0,
        },
      },
      { $sort: { totalLeads: -1 } },
    ]);

    res.json(report);
  } catch (error) {
    console.error('Error fetching course popularity report:', error);
    res.status(500).json({ error: 'Failed to fetch course popularity report' });
  }
};
