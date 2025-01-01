import { Schema, model, Document } from 'mongoose';

interface LeftoverItem {
  recipe: Schema.Types.ObjectId;
  quantity: number;
  unit: string;
  storageDate: Date;
  expiryDate: Date;
  storageLocation: string;
  storageInstructions?: string;
  reheatingInstructions?: string;
  nutritionRemaining: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  qualityRating?: number;
  notes?: string;
}

interface ILeftover extends Document {
  user: Schema.Types.ObjectId;
  items: {
    item: LeftoverItem;
    history: {
      date: Date;
      action: 'stored' | 'consumed' | 'discarded';
      quantity: number;
      qualityRating?: number;
      notes?: string;
    }[];
  }[];
  analytics: {
    totalItems: number;
    expiringItems: number;
    wastedItems: number;
    savedMoney: number;
    sustainabilityScore: number;
  };
  recommendations: {
    useBy: {
      date: Date;
      items: Schema.Types.ObjectId[];
    }[];
    recipes: {
      recipe: Schema.Types.ObjectId;
      matchingLeftovers: Schema.Types.ObjectId[];
      additionalIngredients: {
        item: string;
        quantity: number;
        unit: string;
      }[];
    }[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const leftoverSchema = new Schema<ILeftover>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      item: {
        recipe: {
          type: Schema.Types.ObjectId,
          ref: 'Recipe',
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
        storageDate: {
          type: Date,
          required: true,
        },
        expiryDate: {
          type: Date,
          required: true,
        },
        storageLocation: {
          type: String,
          required: true,
        },
        storageInstructions: String,
        reheatingInstructions: String,
        nutritionRemaining: {
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
        },
        qualityRating: {
          type: Number,
          min: 1,
          max: 5,
        },
        notes: String,
      },
      history: [{
        date: {
          type: Date,
          required: true,
        },
        action: {
          type: String,
          enum: ['stored', 'consumed', 'discarded'],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        qualityRating: {
          type: Number,
          min: 1,
          max: 5,
        },
        notes: String,
      }],
    }],
    analytics: {
      totalItems: {
        type: Number,
        required: true,
        default: 0,
      },
      expiringItems: {
        type: Number,
        required: true,
        default: 0,
      },
      wastedItems: {
        type: Number,
        required: true,
        default: 0,
      },
      savedMoney: {
        type: Number,
        required: true,
        default: 0,
      },
      sustainabilityScore: {
        type: Number,
        required: true,
        default: 0,
      },
    },
    recommendations: {
      useBy: [{
        date: {
          type: Date,
          required: true,
        },
        items: [{
          type: Schema.Types.ObjectId,
          ref: 'LeftoverItem',
        }],
      }],
      recipes: [{
        recipe: {
          type: Schema.Types.ObjectId,
          ref: 'Recipe',
        },
        matchingLeftovers: [{
          type: Schema.Types.ObjectId,
          ref: 'LeftoverItem',
        }],
        additionalIngredients: [{
          item: String,
          quantity: Number,
          unit: String,
        }],
      }],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
leftoverSchema.index({ user: 1 });
leftoverSchema.index({ 'items.item.expiryDate': 1 });
leftoverSchema.index({ 'items.item.storageDate': -1 });

// Pre-save middleware to update analytics
leftoverSchema.pre('save', function(next) {
  // Calculate total items
  this.analytics.totalItems = this.items.reduce(
    (total, item) => total + item.item.quantity,
    0
  );

  // Count expiring items (within next 2 days)
  const twoDaysFromNow = new Date();
  twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
  this.analytics.expiringItems = this.items.filter(
    item => item.item.expiryDate <= twoDaysFromNow
  ).length;

  // Calculate wasted items
  this.analytics.wastedItems = this.items.reduce(
    (total, item) => total + item.history.filter(h => h.action === 'discarded')
      .reduce((sum, h) => sum + h.quantity, 0),
    0
  );

  // Calculate saved money (based on original recipe cost)
  this.analytics.savedMoney = this.items.reduce(
    (total, item) => total + item.history.filter(h => h.action === 'consumed')
      .reduce((sum, h) => sum + h.quantity, 0) * 10, // Assuming $10 per meal
    0
  );

  // Calculate sustainability score (0-100)
  const wasteRatio = this.analytics.wastedItems / this.analytics.totalItems;
  this.analytics.sustainabilityScore = Math.max(0, 100 - (wasteRatio * 100));

  next();
});

export const Leftover = model<ILeftover>('Leftover', leftoverSchema);
export { LeftoverItem };
