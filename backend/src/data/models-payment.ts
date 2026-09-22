import mongoose, { Schema, Document } from 'mongoose';
import { Payment, PaymentStatus } from '../models/index.js';

const paymentSchema = new Schema<Payment & Document>(
  {
    leadId: { type: String, required: true, index: true },
    leadName: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    paymentType: { 
      type: String, 
      enum: ['booking', 'full', 'partial', 'remainder'], 
      required: true 
    },
    paymentMethod: { 
      type: String, 
      enum: ['upi', 'card', 'bank_transfer', 'cash', 'other'], 
      default: 'upi' 
    },
    paymentStatus: { 
      type: String, 
      enum: Object.values(PaymentStatus), 
      default: PaymentStatus.PENDING 
    },
    paymentDueDate: { type: String },
    paymentDate: { type: String },
    transactionId: { type: String },
    notes: { type: String },
    createdBy: { type: String, required: true },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

paymentSchema.virtual('id').get(function(this: any) {
  return this._id.toString();
});

paymentSchema.pre('save', function(next) {
  if (!this.id) {
    this.id = this._id.toString();
  }
  next();
});

export const PaymentModel = mongoose.model<Payment & Document>('Payment', paymentSchema);
