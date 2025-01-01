import mongoose, { Schema, Document } from 'mongoose';
import { IMenu } from './Menu';

export interface IOrderItemCustomization {
  name: string;
  options: string[];
  price: number;
}

export interface IOrderItem extends Document {
  menuItem: IMenu;
  quantity: number;
  basePrice: number;
  customizations: IOrderItemCustomization[];
  specialInstructions?: string;
  totalPrice: number;
  discountApplied?: {
    type: 'percentage' | 'fixed';
    value: number;
    code?: string;
  };
}

const OrderItemSchema: Schema = new Schema({
  menuItem: {
    type: Schema.Types.ObjectId,
    ref: 'Menu',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  customizations: [{
    name: {
      type: String,
      required: true,
    },
    options: [{
      type: String,
      required: true,
    }],
    price: {
      type: Number,
      required: true,
      default: 0,
    },
  }],
  specialInstructions: {
    type: String,
    maxlength: 500,
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  discountApplied: {
    type: {
      type: String,
      enum: ['percentage', 'fixed'],
    },
    value: Number,
    code: String,
  },
});

// Calculate total price before saving
OrderItemSchema.pre('save', function(next) {
  let total = this.basePrice * this.quantity;
  
  // Add customization prices
  this.customizations.forEach(customization => {
    total += customization.price * this.quantity;
  });

  // Apply discount if any
  if (this.discountApplied) {
    if (this.discountApplied.type === 'percentage') {
      total *= (1 - this.discountApplied.value / 100);
    } else {
      total -= this.discountApplied.value;
    }
  }

  this.totalPrice = Math.max(0, total); // Ensure price doesn't go below 0
  next();
});

export const OrderItem = mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
