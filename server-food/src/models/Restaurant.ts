import { Schema, model, Document } from 'mongoose';

interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

interface DeliveryZone {
  coordinates: number[][];
  estimatedTime: number;
  minimumOrder: number;
  deliveryFee: number;
}

interface IRestaurant extends Document {
  name: string;
  description: string;
  cuisineType: string[];
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    location: {
      type: string;
      coordinates: [number, number]; // [longitude, latitude]
    };
  };
  contact: {
    phone: string;
    email: string;
    website?: string;
    socialMedia?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  businessHours: BusinessHours[];
  ratings: {
    average: number;
    count: number;
    breakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  menu: Schema.Types.ObjectId[];
  features: {
    hasDelivery: boolean;
    hasTakeout: boolean;
    hasDineIn: boolean;
    hasOnlineOrdering: boolean;
    hasReservation: boolean;
    isVegetarianFriendly: boolean;
    isVeganFriendly: boolean;
    hasParking: boolean;
    hasWifi: boolean;
    isAccessible: boolean;
  };
  deliveryZones: DeliveryZone[];
  capacity: {
    totalSeats: number;
    currentOccupancy: number;
    tables: {
      size: number;
      count: number;
      available: number;
    }[];
  };
  financials: {
    minimumOrder: number;
    averageOrderValue: number;
    taxRate: number;
    currency: string;
    paymentMethods: string[];
  };
  status: {
    isOpen: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    nextAvailableTime?: Date;
    customMessage?: string;
  };
  compliance: {
    healthScore: number;
    lastInspectionDate: Date;
    certifications: string[];
    licenses: {
      type: string;
      number: string;
      expiryDate: Date;
    }[];
  };
  analytics: {
    totalOrders: number;
    averagePreparationTime: number;
    popularHours: {
      day: string;
      hour: number;
      orderCount: number;
    }[];
    customerSatisfaction: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const restaurantSchema = new Schema<IRestaurant>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    cuisineType: [{
      type: String,
      required: true,
    }],
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          required: true,
        },
      },
    },
    contact: {
      phone: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      website: String,
      socialMedia: {
        facebook: String,
        instagram: String,
        twitter: String,
      },
    },
    businessHours: [{
      day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      },
      open: {
        type: String,
        required: true,
      },
      close: {
        type: String,
        required: true,
      },
      isOpen: {
        type: Boolean,
        required: true,
        default: true,
      },
    }],
    ratings: {
      average: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 5,
      },
      count: {
        type: Number,
        required: true,
        default: 0,
      },
      breakdown: {
        5: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        1: { type: Number, default: 0 },
      },
    },
    menu: [{
      type: Schema.Types.ObjectId,
      ref: 'MenuItem',
    }],
    features: {
      hasDelivery: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasTakeout: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasDineIn: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasOnlineOrdering: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasReservation: {
        type: Boolean,
        required: true,
        default: false,
      },
      isVegetarianFriendly: {
        type: Boolean,
        required: true,
        default: false,
      },
      isVeganFriendly: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasParking: {
        type: Boolean,
        required: true,
        default: false,
      },
      hasWifi: {
        type: Boolean,
        required: true,
        default: false,
      },
      isAccessible: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    deliveryZones: [{
      coordinates: [[Number]],
      estimatedTime: {
        type: Number,
        required: true,
      },
      minimumOrder: {
        type: Number,
        required: true,
      },
      deliveryFee: {
        type: Number,
        required: true,
      },
    }],
    capacity: {
      totalSeats: {
        type: Number,
        required: true,
      },
      currentOccupancy: {
        type: Number,
        required: true,
        default: 0,
      },
      tables: [{
        size: {
          type: Number,
          required: true,
        },
        count: {
          type: Number,
          required: true,
        },
        available: {
          type: Number,
          required: true,
        },
      }],
    },
    financials: {
      minimumOrder: {
        type: Number,
        required: true,
        min: 0,
      },
      averageOrderValue: {
        type: Number,
        required: true,
        default: 0,
      },
      taxRate: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      currency: {
        type: String,
        required: true,
        default: 'USD',
      },
      paymentMethods: [{
        type: String,
        required: true,
      }],
    },
    status: {
      isOpen: {
        type: Boolean,
        required: true,
        default: true,
      },
      isSuspended: {
        type: Boolean,
        required: true,
        default: false,
      },
      suspensionReason: String,
      nextAvailableTime: Date,
      customMessage: String,
    },
    compliance: {
      healthScore: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
      },
      lastInspectionDate: {
        type: Date,
        required: true,
      },
      certifications: [String],
      licenses: [{
        type: {
          type: String,
          required: true,
        },
        number: {
          type: String,
          required: true,
        },
        expiryDate: {
          type: Date,
          required: true,
        },
      }],
    },
    analytics: {
      totalOrders: {
        type: Number,
        required: true,
        default: 0,
      },
      averagePreparationTime: {
        type: Number,
        required: true,
        default: 0,
      },
      popularHours: [{
        day: {
          type: String,
          required: true,
        },
        hour: {
          type: Number,
          required: true,
        },
        orderCount: {
          type: Number,
          required: true,
          default: 0,
        },
      }],
      customerSatisfaction: {
        type: Number,
        required: true,
        default: 0,
        min: 0,
        max: 100,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
restaurantSchema.index({ name: 1 });
restaurantSchema.index({ cuisineType: 1 });
restaurantSchema.index({ 'address.city': 1 });
restaurantSchema.index({ 'address.location': '2dsphere' });
restaurantSchema.index({ 'ratings.average': -1 });
restaurantSchema.index({ 'status.isOpen': 1 });
restaurantSchema.index({ 'compliance.healthScore': -1 });

// Methods
restaurantSchema.methods.isCurrentlyOpen = function(): boolean {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', { weekday: 'long' });
  const time = now.toLocaleTimeString('en-US', { hour12: false });

  const todayHours = this.businessHours.find((h: { day: string; }) => h.day === day);
  if (!todayHours || !todayHours.isOpen) return false;

  return time >= todayHours.open && time <= todayHours.close;
};

restaurantSchema.methods.updateOccupancy = function(change: number): boolean {
  const newOccupancy = this.capacity.currentOccupancy + change;
  if (newOccupancy < 0 || newOccupancy > this.capacity.totalSeats) return false;

  this.capacity.currentOccupancy = newOccupancy;
  return true;
};

restaurantSchema.methods.calculateDeliveryFee = function(coordinates: [number, number]): number {
  // Implementation of delivery fee calculation based on coordinates
  return 0;
};

export const Restaurant = model<IRestaurant>('Restaurant', restaurantSchema);
export { BusinessHours, DeliveryZone };
