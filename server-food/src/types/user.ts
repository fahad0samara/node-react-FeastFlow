import { Document } from 'mongoose';
import { Address, Coordinates, BaseDocument } from './common';

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
}

export enum DriverStatus {
  OFFLINE = 'OFFLINE',
  AVAILABLE = 'AVAILABLE',
  BUSY = 'BUSY',
  ON_BREAK = 'ON_BREAK',
}

export interface DietaryPreferences {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHalal: boolean;
  isKosher: boolean;
  allergies: string[];
  excludedIngredients: string[];
}

export interface HealthMetrics {
  height?: number;
  weight?: number;
  bmi?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'very_active';
  healthConditions?: string[];
  dailyCalorieGoal?: number;
}

export interface PaymentMethod {
  type: 'card' | 'bank_account';
  isDefault: boolean;
  details: {
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
}

export interface LoyaltyInfo {
  points: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  pointsHistory: {
    amount: number;
    reason: string;
    timestamp: Date;
  }[];
  rewards: {
    id: string;
    name: string;
    cost: number;
    expiryDate: Date;
  }[];
}

export interface DriverProfile {
  status: DriverStatus;
  currentLocation?: Coordinates;
  vehicle: {
    type: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  documents: {
    license: {
      number: string;
      expiryDate: Date;
      verified: boolean;
    };
    insurance: {
      provider: string;
      policyNumber: string;
      expiryDate: Date;
      verified: boolean;
    };
  };
  stats: {
    totalDeliveries: number;
    averageRating: number;
    completionRate: number;
    totalEarnings: number;
  };
}

export interface IUser extends BaseDocument {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  addresses: {
    type: 'home' | 'work' | 'other';
    isDefault: boolean;
    address: Address;
  }[];
  dietaryPreferences?: DietaryPreferences;
  healthMetrics?: HealthMetrics;
  paymentMethods: PaymentMethod[];
  loyalty: LoyaltyInfo;
  driverProfile?: DriverProfile;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    currency: string;
  };
  status: {
    isActive: boolean;
    isVerified: boolean;
    isBanned: boolean;
    banReason?: string;
  };
}

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: UserRole;
  address: Address;
}

export interface UpdateUserInput {
  name?: string;
  phone?: string;
  addresses?: {
    type: 'home' | 'work' | 'other';
    isDefault: boolean;
    address: Address;
  }[];
  dietaryPreferences?: Partial<DietaryPreferences>;
  healthMetrics?: Partial<HealthMetrics>;
  preferences?: Partial<{
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    language: string;
    currency: string;
  }>;
}
