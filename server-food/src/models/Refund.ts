import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from './Order';
import { IUser } from './User';

export enum RefundStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PROCESSED = 'processed',
  CANCELLED = 'cancelled'
}

export enum RefundReason {
  WRONG_ITEM = 'wrong_item',
  MISSING_ITEM = 'missing_item',
  QUALITY_ISSUE = 'quality_issue',
  LATE_DELIVERY = 'late_delivery',
  ORDER_NOT_RECEIVED = 'order_not_received',
  RESTAURANT_CANCELLED = 'restaurant_cancelled',
  OTHER = 'other'
}

export interface IRefund extends Document {
  order: IOrder;
  user: IUser;
  amount: number;
  reason: RefundReason;
  description: string;
  status: RefundStatus;
  evidence?: string[]; // URLs to uploaded images
  approvedBy?: IUser;
  processedAt?: Date;
  refundTransactionId?: string;
  paymentMethod: string;
  isPartialRefund: boolean;
  items?: {
    orderItem: string;
    quantity: number;
    amount: number;
  }[];
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema: Schema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  reason: {
    type: String,
    enum: Object.values(RefundReason),
    required: true,
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  status: {
    type: String,
    enum: Object.values(RefundStatus),
    default: RefundStatus.PENDING,
  },
  evidence: [{
    type: String,
    validate: {
      validator: (v: string) => /^https?:\/\/.+/.test(v),
      message: 'Evidence must be valid URLs',
    },
  }],
  approvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  processedAt: Date,
  refundTransactionId: String,
  paymentMethod: {
    type: String,
    required: true,
  },
  isPartialRefund: {
    type: Boolean,
    default: false,
  },
  items: [{
    orderItem: {
      type: Schema.Types.ObjectId,
      ref: 'OrderItem',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  adminNotes: {
    type: String,
    maxlength: 1000,
  },
}, {
  timestamps: true,
});

// Indexes
RefundSchema.index({ order: 1 });
RefundSchema.index({ user: 1 });
RefundSchema.index({ status: 1 });
RefundSchema.index({ createdAt: 1 });

export const Refund = mongoose.model<IRefund>('Refund', RefundSchema);
