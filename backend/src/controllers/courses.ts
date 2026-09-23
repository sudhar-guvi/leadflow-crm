import { Response } from 'express';
import { z } from 'zod';
import { CourseModel } from '../data/models-course.js';
import { Course, PaginatedResult } from '../models/index.js';

// Validation schemas
const createCourseSchema = z.object({
  name: z.string().min(1, 'Course name is required'),
  description: z.string().optional(),
  duration: z.string().min(1, 'Duration is required'),
  amount: z.number().min(0, 'Amount must be at least 0'),
  category: z.string().min(1, 'Category is required'),
  isActive: z.boolean().optional().default(true),
});

const updateCourseSchema = createCourseSchema.partial();

// Convert to JSON
const courseToJson = (doc: any): Course => ({
  _id: doc._id.toString(),
  id: doc._id.toString(),
  name: doc.name,
  code: doc.code,
  description: doc.description,
  duration: doc.duration,
  amount: doc.amount,
  category: doc.category,
  isActive: doc.isActive,
  createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
  updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
});

// Get all courses
export const getCourses = async (req: any, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20, category, activeOnly } = req.query;
    
    const query: any = {};
    if (category) query.category = category;
    if (activeOnly === 'true') query.isActive = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await CourseModel.countDocuments(query);
    const courses = await CourseModel.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    res.json({
      data: courses.map(courseToJson),
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
    } as PaginatedResult<Course>);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// Get course by ID
export const getCourseById = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const course = await CourseModel.findById(id).lean();
    
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    
    res.json(courseToJson(course));
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
};

// Create new course
export const createCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const data = createCourseSchema.parse(req.body);
    
    const course = await CourseModel.create(data);
    
    res.status(201).json(courseToJson(course));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error creating course:', error);
    res.status(500).json({ error: 'Failed to create course' });
  }
};

// Update course
export const updateCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateCourseSchema.parse(req.body);
    
    const course = await CourseModel.findById(id);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    Object.assign(course, data);
    await course.save();
    
    res.json(courseToJson(await CourseModel.findById(id)));
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors });
      return;
    }
    console.error('Error updating course:', error);
    res.status(500).json({ error: 'Failed to update course' });
  }
};

// Delete course
export const deleteCourse = async (req: any, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    const course = await CourseModel.findById(id);
    if (!course) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    await CourseModel.findByIdAndDelete(id);
    
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: 'Failed to delete course' });
  }
};

// Get course categories
export const getCourseCategories = async (req: any, res: Response): Promise<void> => {
  try {
    const categories = await CourseModel.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
};
