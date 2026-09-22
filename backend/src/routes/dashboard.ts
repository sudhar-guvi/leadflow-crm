import { Router } from 'express';
import {
  getDashboardSummary,
  getLeadStatusDistribution,
  getBDPerformanceReport,
  getRevenueReport,
  getSourceDistribution,
  getCoursePopularityReport,
} from '../controllers/dashboard.js';

const router = Router();

router.get('/summary', getDashboardSummary);

export default router;
