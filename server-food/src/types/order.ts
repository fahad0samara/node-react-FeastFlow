import { Document } from 'mongoose';
import { Coordinates, Address, BaseDocument } from './common';

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  OUT_FOR_DELIVERY = 'OUT_FOR_DELIVERY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  CAPTURED = 'CAPTURED',
  REFUNDED = 'REFUNDED',
  FAILED = 'FAILED',
}

export interface OrderItem {
  menuItem: string; // Reference to MenuItem
  quantity: number;
  price: number;
  customizations?: {
    option: string;
    choice: string;
    price: number;
  }[];
  specialInstructions?: string;
}

export interface DeliveryDetails {
  address: Address;
  instructions?: string;
  contactPreference?: 'call' | 'text' | 'none';
  estimatedTime?: Date;
  actualTime?: Date;
  driver?: string; // Reference to User (driver)
  trackingHistory: {
    status: OrderStatus;
    timestamp: Date;
    location?: Coordinates;
    note?: string;
  }[];
}

export interface OrderTotals {
  subtotal: number;
  tax: number;
  deliveryFee: number;
  tip?: number;
  discount?: {
    code: string;
    amount: number;
  };
  total: number;
}

export interface IOrder extends BaseDocument {
  orderNumber: string;
  user: string; // Reference to User
  restaurant: string; // Reference to Restaurant
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: string; // Reference to PaymentMethod
  delivery: DeliveryDetails;
  totals: OrderTotals;
  rating?: {
    food: number;
    delivery: number;
    comment?: string;
  };
  refund?: {
    amount: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    processedAt?: Date;
  };
}

export interface CreateOrderInput {
  restaurantId: string;
  items: {
    menuItemId: string;
    quantity: number;
    customizations?: {
      option: string;
      choice: string;
    }[];
    specialInstructions?: string;
  }[];
  deliveryAddress: Address;
  deliveryInstructions?: string;
  paymentMethodId: string;
  tip?: number;
  promoCode?: string;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  note?: string;
  location?: Coordinates;
}
