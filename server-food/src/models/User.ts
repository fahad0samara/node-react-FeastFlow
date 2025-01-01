import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { GeoJSONPoint } from '../utils/delivery';

export enum UserRole {
  CUSTOMER = 'customer',
  DRIVER = 'driver',
  RESTAURANT_OWNER = 'restaurant_owner',
  ADMIN = 'admin'
}

export interface IOAuthProfile {
  provider: 'google' | 'facebook';
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

export interface IVehicle {
  type: string;
  model: string;
  color: string;
  licensePlate: string;
}

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  isEmailVerified: boolean;
  phoneNumber?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  currentLocation?: GeoJSONPoint;
  vehicle?: IVehicle;
  oauthProfiles?: IOAuthProfile[];
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
}

const UserSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(v);
      },
      message: 'Please enter a valid email address',
    },
  },
  password: {
    type: String,
    required: [
      function(this: IUser) {
        return !this.oauthProfiles || this.oauthProfiles.length === 0;
      },
      'Password is required for email/password registration',
    ],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function(v: string) {
        return /^\+?[\d\s-]+$/.test(v);
      },
      message: 'Please enter a valid phone number',
    },
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
  },
  currentLocation: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
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
  vehicle: {
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'bicycle', 'scooter'],
    },
    model: String,
    color: String,
    licensePlate: {
      type: String,
      validate: {
        validator: function(v: string) {
          return /^[A-Z0-9-\s]+$/i.test(v);
        },
        message: 'Please enter a valid license plate number',
      },
    },
  },
  oauthProfiles: [{
    _id: false,
    provider: {
      type: String,
      enum: ['google', 'facebook'],
      required: true,
    },
    id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    name: String,
    picture: String,
  }],
  refreshToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  lastLogin: Date,
  isActive: {
    type: Boolean,
    default: true,
  },
  stripeCustomerId: String,
}, {
  timestamps: true,
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ 'currentLocation': '2dsphere' });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password!, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Error comparing passwords');
  }
};

// Create password reset token
UserSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

// Create email verification token
UserSchema.methods.createEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return verificationToken;
};

export const User = mongoose.model<IUser>('User', UserSchema);
