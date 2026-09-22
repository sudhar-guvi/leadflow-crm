import { Router } from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseCategories,
} from '../controllers/courses.js';

const router = Router();

router.get('/categories', getCourseCategories);
router.get('/:id', getCourseById);
router.get('/', getCourses);
router.post('/', createCourse);
router.patch('/:id', updateCourse);
router.delete('/:id', deleteCourse);

export default router;
