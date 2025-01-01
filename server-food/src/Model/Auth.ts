import mongoose, {Document, Model, Schema} from "mongoose";
import bcrypt from "bcryptjs";
import {NextFunction} from "express";

interface IUser extends Document {
  firstName: string;
  email: string;
  password?: string;  
  role: "user" | "admin";
  created_at: Date;
  googleId?: string;
}

interface IAdmin extends IUser {}

const userSchema: Schema<IUser> = new mongoose.Schema<IUser>({
  firstName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId; 
    },
    validate: {
      validator: function(password: string) {
        // Only validate if it's not a hashed password (during user creation)
        if (password && password.length < 60) { // bcrypt hashes are 60 chars
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
          return password.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        }
        return true;
      },
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ["user", "admin"],
    default: "user"
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  }
});

// Hash password before saving
userSchema.pre('save', async function(next: NextFunction) {
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const adminSchema = new mongoose.Schema<IAdmin>({
  firstName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function(this: any) {
      return !this.googleId;
    },
    validate: {
      validator: function(password: string) {
        // Only validate if it's not a hashed password (during user creation)
        if (password && password.length < 60) { // bcrypt hashes are 60 chars
          const hasUpperCase = /[A-Z]/.test(password);
          const hasLowerCase = /[a-z]/.test(password);
          const hasNumber = /[0-9]/.test(password);
          const hasSpecialChar = /[^A-Za-z0-9]/.test(password);
          return password.length >= 8 && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
        }
        return true;
      },
      message: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }
  },
  role: {
    type: String,
    required: true,
    enum: ["admin"],
    default: "admin"
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true
  }
});

// Hash password before saving
adminSchema.pre('save', async function(next: NextFunction) {
  if (this.isModified('password') && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }
  next();
});

export const User: Model<IUser> = mongoose.model<IUser>("User", userSchema);
export const Admin: Model<IAdmin> = mongoose.model<IAdmin>("Admin", adminSchema);
