import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from './User';
import { IMenu } from './Menu';
import { Route } from '../utils/delivery';

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY_FOR_PICKUP = 'ready_for_pickup',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

interface GeoJSONPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

interface IOrderItem {
  menuItem: IMenu;
  quantity: number;
  price: number;
  customizations?: Record<string, any>[];
  specialInstructions?: string;
}

interface IDeliveryLocation {
  address: string;
  coordinates: [number, number]; // [longitude, latitude]
  instructions?: string;
}

export interface ITrackingHistory {
  status: OrderStatus;
  timestamp: Date;
  location: GeoJSONPoint;
  note?: string;
}

interface IGroupParticipant {
  user: IUser;
  items: IOrderItem[];
  totalAmount: number;
  paymentStatus: PaymentStatus;
}

export interface IOrder extends Document {
  orderNumber: string;
  user: IUser;
  restaurant: any; // Replace with IRestaurant when available
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  deliveryLocation: IDeliveryLocation;
  driver?: IUser;
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  trackingHistory: ITrackingHistory[];
  route?: Route;
  lastUpdated: Date;
  groupOrder?: {
    creator: IUser;
    participants: IGroupParticipant[];
    totalAmount: number;
    status: 'open' | 'closed';
  };
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  items: [{
    menuItem: {
      type: Schema.Types.ObjectId,
      ref: 'Menu',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    customizations: [{
      type: Map,
      of: Schema.Types.Mixed
    }],
    specialInstructions: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  tax: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryFee: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    required: true
  },
  paymentMethod: {
    type: String
  },
  deliveryLocation: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      validate: {
        validator: function(v: number[]) {
          return v.length === 2 && 
            v[0] >= -180 && v[0] <= 180 && // longitude
            v[1] >= -90 && v[1] <= 90;     // latitude
        },
        message: 'Invalid coordinates'
      }
    },
    instructions: String
  },
  driver: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  estimatedDeliveryTime: {
    type: Date,
    required: true
  },
  actualDeliveryTime: {
    type: Date
  },
  trackingHistory: [{
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function(v: number[]) {
            return v.length === 2 && 
              v[0] >= -180 && v[0] <= 180 && // longitude
              v[1] >= -90 && v[1] <= 90;     // latitude
          },
          message: 'Invalid coordinates'
        }
      }
    },
    note: String
  }],
  route: {
    type: Map,
    of: Schema.Types.Mixed
  },
  lastUpdated: {
    type: Date,
    required: true,
    default: Date.now
  },
  groupOrder: {
    creator: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    participants: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      items: [{
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: 'Menu'
        },
        quantity: Number,
        price: Number,
        customizations: [{
          type: Map,
          of: Schema.Types.Mixed
        }],
        specialInstructions: String
      }],
      totalAmount: Number,
      paymentStatus: {
        type: String,
        enum: Object.values(PaymentStatus)
      }
    }],
    totalAmount: Number,
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open'
    }
  }
}, {
  timestamps: true
});

// Indexes
OrderSchema.index({ 'deliveryLocation.coordinates': '2dsphere' });
OrderSchema.index({ orderNumber: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ restaurant: 1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ createdAt: 1 });
OrderSchema.index({ lastUpdated: 1 });

// Ensure estimatedDeliveryTime is set
OrderSchema.pre('save', function(next) {
  if (!this.estimatedDeliveryTime) {
    this.estimatedDeliveryTime = new Date(Date.now() + 30 * 60 * 1000); // Default to 30 minutes
  }
  this.lastUpdated = new Date();
  next();
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
