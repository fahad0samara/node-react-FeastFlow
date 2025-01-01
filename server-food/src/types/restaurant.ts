import { Document } from 'mongoose';
import { Address, BaseDocument, TimeWindow } from './common';

export interface BusinessHours {
  day: string;
  open: string;
  close: string;
  isOpen: boolean;
}

export interface MenuItem {
  name: string;
  description: string;
  price: number;
  category: string[];
  image: string;
  nutritionalInfo: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    vitamins?: Record<string, number>;
    minerals?: Record<string, number>;
  };
  allergens: string[];
  customization?: {
    options: {
      name: string;
      choices: {
        name: string;
        price: number;
      }[];
      required: boolean;
      multiple: boolean;
    }[];
  };
  availability: {
    isAvailable: boolean;
    nextAvailableAt?: Date;
  };
}

export interface DeliveryZone {
  coordinates: number[][];
  estimatedTime: number;
  minimumOrder: number;
  deliveryFee: number;
}

export interface RestaurantCapacity {
  totalSeats: number;
  currentOccupancy: number;
  tables: {
    size: number;
    count: number;
    available: number;
  }[];
}

export interface RestaurantFeatures {
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
}

export interface RestaurantCompliance {
  healthScore: number;
  lastInspectionDate: Date;
  certifications: string[];
  licenses: {
    type: string;
    number: string;
    expiryDate: Date;
  }[];
}

export interface RestaurantAnalytics {
  totalOrders: number;
  averagePreparationTime: number;
  popularHours: {
    day: string;
    hour: number;
    orderCount: number;
  }[];
  customerSatisfaction: number;
}

export interface IRestaurant extends BaseDocument {
  name: string;
  description: string;
  cuisineType: string[];
  address: Address;
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
  menu: MenuItem[];
  features: RestaurantFeatures;
  deliveryZones: DeliveryZone[];
  capacity: RestaurantCapacity;
  financials: {
    minimumOrder: number;
    averageOrderValue: number;
    taxRate: number;
    currency: string;
    paymentMethods: string[];
  };
  ratings: {
    average: number;
    count: number;
    breakdown: Record<number, number>;
  };
  status: {
    isOpen: boolean;
    isSuspended: boolean;
    suspensionReason?: string;
    nextAvailableTime?: Date;
    customMessage?: string;
  };
  compliance: RestaurantCompliance;
  analytics: RestaurantAnalytics;
}

export interface CreateRestaurantInput {
  name: string;
  description: string;
  cuisineType: string[];
  address: Address;
  contact: {
    phone: string;
    email: string;
    website?: string;
  };
  businessHours: BusinessHours[];
  features: RestaurantFeatures;
  minimumOrder: number;
  taxRate: number;
  currency: string;
}

export interface UpdateRestaurantInput {
  name?: string;
  description?: string;
  cuisineType?: string[];
  address?: Partial<Address>;
  contact?: Partial<{
    phone: string;
    email: string;
    website: string;
    socialMedia: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  }>;
  businessHours?: BusinessHours[];
  features?: Partial<RestaurantFeatures>;
  status?: Partial<{
    isOpen: boolean;
    isSuspended: boolean;
    suspensionReason: string;
    nextAvailableTime: Date;
    customMessage: string;
  }>;
}
