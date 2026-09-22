import { Router } from 'express';
import {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  getTodayFollowUps,
  getOverdueFollowUps,
} from '../controllers/followups.js';

const router = Router();

router.get('/today', getTodayFollowUps);
router.get('/overdue', getOverdueFollowUps);
router.get('/:id', getFollowUpById);
router.get('/', getFollowUps);
router.post('/', createFollowUp);
router.patch('/:id', updateFollowUp);
router.delete('/:id', deleteFollowUp);

export default router;
