import { Router } from 'express';
import {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  getLeadStats,
} from '../controllers/leads.js';

const router = Router();

router.get('/stats', getLeadStats);
router.get('/', getLeads);
router.get('/:id', getLeadById);
router.post('/', createLead);
router.patch('/:id', updateLead);
router.delete('/:id', deleteLead);

export default router;
