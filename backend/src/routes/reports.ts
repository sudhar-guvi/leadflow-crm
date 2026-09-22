import { Router } from 'express';
import {
  getLeadStatusDistribution,
  getBDPerformanceReport,
  getRevenueReport,
  getSourceDistribution,
  getCoursePopularityReport,
} from '../controllers/dashboard.js';

const router = Router();

router.get('/lead-status', getLeadStatusDistribution);
router.get('/bd-performance', getBDPerformanceReport);
router.get('/revenue', getRevenueReport);
router.get('/source-distribution', getSourceDistribution);
router.get('/course-popularity', getCoursePopularityReport);

export default router;
