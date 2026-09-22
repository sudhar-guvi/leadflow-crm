import mongoose, { Schema, Document } from 'mongoose';
import { Course } from '../models/index.js';

const courseSchema = new Schema<Course & Document>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    duration: { type: String, required: true, default: '3 months' },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

courseSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

courseSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

export const CourseModel = mongoose.model<Course & Document>('Course', courseSchema);
