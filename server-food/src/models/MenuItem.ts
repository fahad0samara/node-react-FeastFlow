import { Schema, model, Document } from 'mongoose';

interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  vitamins?: {
    [key: string]: number;
  };
  minerals?: {
    [key: string]: number;
  };
}

interface Ingredient {
  item: Schema.Types.ObjectId;
  quantity: number;
  unit: string;
  isOptional: boolean;
  alternatives?: Schema.Types.ObjectId[];
}

interface IMenuItem extends Document {
  name: string;
  description: string;
  category: string[];
  price: number;
  ingredients: Ingredient[];
  nutritionalInfo: NutritionalInfo;
  preparationTime: number;
  spicyLevel: number;
  allergens: string[];
  dietaryInfo: {
    isVegetarian: boolean;
    isVegan: boolean;
    isGlutenFree: boolean;
    isHalal: boolean;
    isKosher: boolean;
  };
  image: string;
  availability: {
    isAvailable: boolean;
    nextAvailableAt?: Date;
    customMessage?: string;
  };
  ratings: {
    average: number;
    count: number;
  };
  customization: {
    options: {
      name: string;
      choices: {
        name: string;
        price: number;
      }[];
      required: boolean;
      multiple: boolean;
    }[];
    specialInstructions: boolean;
  };
  popularity: {
    orderCount: number;
    trend: 'rising' | 'stable' | 'falling';
    rank: number;
  };
  seasonality: {
    isSeasonalItem: boolean;
    availableFrom?: Date;
    availableUntil?: Date;
  };
  promotions: {
    isPromoted: boolean;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
      validFrom: Date;
      validUntil: Date;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const menuItemSchema = new Schema<IMenuItem>(
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
    category: [{
      type: String,
      required: true,
    }],
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    ingredients: [{
      item: {
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
      },
      isOptional: {
        type: Boolean,
        default: false,
      },
      alternatives: [{
        type: Schema.Types.ObjectId,
        ref: 'Ingredient',
      }],
    }],
    nutritionalInfo: {
      calories: {
        type: Number,
        required: true,
      },
      protein: {
        type: Number,
        required: true,
      },
      carbs: {
        type: Number,
        required: true,
      },
      fat: {
        type: Number,
        required: true,
      },
      fiber: {
        type: Number,
        required: true,
      },
      vitamins: {
        type: Map,
        of: Number,
      },
      minerals: {
        type: Map,
        of: Number,
      },
    },
    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },
    spicyLevel: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    allergens: [{
      type: String,
      required: true,
    }],
    dietaryInfo: {
      isVegetarian: {
        type: Boolean,
        required: true,
        default: false,
      },
      isVegan: {
        type: Boolean,
        required: true,
        default: false,
      },
      isGlutenFree: {
        type: Boolean,
        required: true,
        default: false,
      },
      isHalal: {
        type: Boolean,
        required: true,
        default: false,
      },
      isKosher: {
        type: Boolean,
        required: true,
        default: false,
      },
    },
    image: {
      type: String,
      required: true,
    },
    availability: {
      isAvailable: {
        type: Boolean,
        required: true,
        default: true,
      },
      nextAvailableAt: Date,
      customMessage: String,
    },
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
        min: 0,
      },
    },
    customization: {
      options: [{
        name: {
          type: String,
          required: true,
        },
        choices: [{
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
        }],
        required: {
          type: Boolean,
          default: false,
        },
        multiple: {
          type: Boolean,
          default: false,
        },
      }],
      specialInstructions: {
        type: Boolean,
        default: true,
      },
    },
    popularity: {
      orderCount: {
        type: Number,
        required: true,
        default: 0,
      },
      trend: {
        type: String,
        enum: ['rising', 'stable', 'falling'],
        required: true,
        default: 'stable',
      },
      rank: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    seasonality: {
      isSeasonalItem: {
        type: Boolean,
        required: true,
        default: false,
      },
      availableFrom: Date,
      availableUntil: Date,
    },
    promotions: {
      isPromoted: {
        type: Boolean,
        required: true,
        default: false,
      },
      discount: {
        type: {
          type: String,
          enum: ['percentage', 'fixed'],
        },
        value: {
          type: Number,
          min: 0,
        },
        validFrom: Date,
        validUntil: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
menuItemSchema.index({ name: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ 'popularity.rank': -1 });
menuItemSchema.index({ 'ratings.average': -1 });
menuItemSchema.index({ price: 1 });
menuItemSchema.index({ 'availability.isAvailable': 1 });
menuItemSchema.index({ 'seasonality.isSeasonalItem': 1 });
menuItemSchema.index({ 'promotions.isPromoted': 1 });

// Virtual for calculating final price with promotions
menuItemSchema.virtual('finalPrice').get(function() {
  if (!this.promotions.isPromoted || !this.promotions.discount) {
    return this.price;
  }

  const now = new Date();
  const { discount } = this.promotions;

  if (now < discount.validFrom || now > discount.validUntil) {
    return this.price;
  }

  if (discount.type === 'percentage') {
    return this.price * (1 - discount.value / 100);
  }

  return Math.max(0, this.price - discount.value);
});

// Pre-save middleware to update popularity trend
menuItemSchema.pre('save', function(next) {
  const TREND_THRESHOLD = 10; // Minimum order difference to change trend
  const previousOrderCount = this.get('popularity.orderCount');
  
  if (this.isModified('popularity.orderCount')) {
    const orderDifference = this.popularity.orderCount - previousOrderCount;
    
    if (Math.abs(orderDifference) >= TREND_THRESHOLD) {
      this.popularity.trend = orderDifference > 0 ? 'rising' : 'falling';
    } else {
      this.popularity.trend = 'stable';
    }
  }

  next();
});

export const MenuItem = model<IMenuItem>('MenuItem', menuItemSchema);
export { NutritionalInfo, Ingredient };
