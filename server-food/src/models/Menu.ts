import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuDietaryInfo {
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isHalal: boolean;
  containsNuts: boolean;
  containsLactose: boolean;
  spicyLevel?: number; // 0-3
}

export interface IMenuAvailability {
  isAvailable: boolean;
  availableFrom?: Date;
  availableTo?: Date;
  daysAvailable?: string[]; // ['monday', 'tuesday', etc.]
  timingsAvailable?: {
    from: string; // HH:mm format
    to: string;
  }[];
}

export interface IMenu extends Document {
  name: string;
  description: string;
  category: mongoose.Types.ObjectId;
  subCategories: mongoose.Types.ObjectId[];
  price: number;
  discountedPrice?: number;
  image: string;
  images?: string[];
  tags?: string[];
  dietaryInfo: IMenuDietaryInfo;
  availability: IMenuAvailability;
  preparationTime?: number; // in minutes
  popularity?: number; // calculated field
  ratings: {
    average: number;
    count: number;
  };
  customizable: boolean;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MenuSchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name for the menu item'],
    trim: true,
    index: true,
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true,
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Please specify a category'],
  },
  subCategories: [{
    type: Schema.Types.ObjectId,
    ref: 'Category',
  }],
  price: {
    type: Number,
    required: [true, 'Please specify a price'],
    min: [0, 'Price cannot be negative'],
  },
  discountedPrice: {
    type: Number,
    validate: {
      validator: function(this: IMenu, value: number) {
        return value <= this.price;
      },
      message: 'Discounted price must be less than or equal to regular price'
    }
  },
  image: {
    type: String,
    required: [true, 'Please provide an image URL'],
  },
  images: [{
    type: String,
  }],
  tags: [{
    type: String,
    trim: true,
  }],
  dietaryInfo: {
    isVegetarian: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    isHalal: { type: Boolean, default: false },
    containsNuts: { type: Boolean, default: false },
    containsLactose: { type: Boolean, default: false },
    spicyLevel: { 
      type: Number, 
      min: 0, 
      max: 3,
      default: 0
    }
  },
  availability: {
    isAvailable: { type: Boolean, default: true },
    availableFrom: Date,
    availableTo: Date,
    daysAvailable: [{
      type: String,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    }],
    timingsAvailable: [{
      from: String,
      to: String
    }]
  },
  preparationTime: {
    type: Number,
    min: 0
  },
  popularity: {
    type: Number,
    default: 0
  },
  ratings: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  customizable: {
    type: Boolean,
    default: false
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
MenuSchema.index({ name: 1 });
MenuSchema.index({ category: 1 });
MenuSchema.index({ tags: 1 });
MenuSchema.index({ 'dietaryInfo.isVegetarian': 1 });
MenuSchema.index({ 'dietaryInfo.isVegan': 1 });
MenuSchema.index({ featured: 1 });
MenuSchema.index({ popularity: -1 });

// Virtual for customizations
MenuSchema.virtual('customizations', {
  ref: 'MenuCustomization',
  localField: '_id',
  foreignField: 'menuItem',
  justOne: true
});

// Instance method to check if item is currently available
MenuSchema.methods.isCurrentlyAvailable = function(): boolean {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  
  if (!this.availability.isAvailable) return false;
  
  // Check date range if specified
  if (this.availability.availableFrom && this.availability.availableTo) {
    if (now < this.availability.availableFrom || now > this.availability.availableTo) {
      return false;
    }
  }
  
  // Check if available on current day
  if (this.availability.daysAvailable && 
      this.availability.daysAvailable.length > 0 && 
      !this.availability.daysAvailable.includes(day)) {
    return false;
  }
  
  // Check current time if timings are specified
  if (this.availability.timingsAvailable && this.availability.timingsAvailable.length > 0) {
    const currentTime = now.getHours() * 60 + now.getMinutes();
    return this.availability.timingsAvailable.some(timing => {
      const [fromHour, fromMin] = timing.from.split(':').map(Number);
      const [toHour, toMin] = timing.to.split(':').map(Number);
      const fromTime = fromHour * 60 + fromMin;
      const toTime = toHour * 60 + toMin;
      return currentTime >= fromTime && currentTime <= toTime;
    });
  }
  
  return true;
};

// Static method to find by category
MenuSchema.statics.findByCategory = function(category: string) {
  return this.find({ category: category }).populate('category');
};

// Static method to find available items
MenuSchema.statics.findAvailable = function() {
  const now = new Date();
  const day = now.toLocaleLowerCase();
  
  return this.find({
    'availability.isAvailable': true,
    $or: [
      { 'availability.daysAvailable': { $exists: false } },
      { 'availability.daysAvailable': day }
    ],
    $or: [
      {
        'availability.availableFrom': { $exists: false },
        'availability.availableTo': { $exists: false }
      },
      {
        'availability.availableFrom': { $lte: now },
        'availability.availableTo': { $gte: now }
      }
    ]
  });
};

// Static method to search by dietary preferences
MenuSchema.statics.findByDietary = function(preferences: Partial<IMenuDietaryInfo>) {
  const query = Object.entries(preferences).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[`dietaryInfo.${key}`] = value;
    }
    return acc;
  }, {} as any);
  
  return this.find(query);
};

export const Menu = mongoose.model<IMenu>('Menu', MenuSchema);
