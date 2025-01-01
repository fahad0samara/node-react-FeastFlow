import { Schema, model, Document } from 'mongoose';

interface MealSchedule {
  date: Date;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    time: Date;
    recipe: Schema.Types.ObjectId;
    servings: number;
    notes?: string;
    prepInstructions?: string;
    status: 'planned' | 'prepped' | 'cooked' | 'completed';
  }[];
}

interface GroceryList {
  ingredients: {
    item: string;
    amount: number;
    unit: string;
    estimated_cost: number;
    store_suggestions: string[];
    alternatives?: {
      item: string;
      amount: number;
      unit: string;
      estimated_cost: number;
    }[];
  }[];
  totalCost: number;
  optimizedStores: {
    store: string;
    items: string[];
    subtotal: number;
  }[];
}

interface PrepSchedule {
  date: Date;
  tasks: {
    recipe: Schema.Types.ObjectId;
    step: string;
    duration: number;
    startTime: Date;
    endTime: Date;
    dependencies?: string[];
    equipment: string[];
    status: 'pending' | 'in_progress' | 'completed';
  }[];
}

interface IMealPlan extends Document {
  user: Schema.Types.ObjectId;
  startDate: Date;
  endDate: Date;
  budget: {
    total: number;
    perMeal: number;
    spent: number;
    remaining: number;
  };
  schedule: MealSchedule[];
  groceryList: GroceryList;
  prepSchedule: PrepSchedule[];
  preferences: {
    cuisines: string[];
    excludedIngredients: string[];
    maxPrepTime: number;
    mealSize: 'small' | 'medium' | 'large';
    leftoverPreference: boolean;
    varietyPreference: number;
  };
  nutritionTargets: {
    daily: {
      calories: { min: number; max: number };
      protein: { min: number; max: number };
      carbs: { min: number; max: number };
      fat: { min: number; max: number };
    };
    weekly: {
      calories: { min: number; max: number };
      protein: { min: number; max: number };
      carbs: { min: number; max: number };
      fat: { min: number; max: number };
    };
  };
  status: 'draft' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

const mealPlanSchema = new Schema<IMealPlan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    budget: {
      total: {
        type: Number,
        required: true,
      },
      perMeal: {
        type: Number,
        required: true,
      },
      spent: {
        type: Number,
        default: 0,
      },
      remaining: {
        type: Number,
        required: true,
      },
    },
    schedule: [{
      date: {
        type: Date,
        required: true,
      },
      meals: [{
        type: {
          type: String,
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          required: true,
        },
        time: {
          type: Date,
          required: true,
        },
        recipe: {
          type: Schema.Types.ObjectId,
          ref: 'Recipe',
          required: true,
        },
        servings: {
          type: Number,
          required: true,
          min: 1,
        },
        notes: String,
        prepInstructions: String,
        status: {
          type: String,
          enum: ['planned', 'prepped', 'cooked', 'completed'],
          default: 'planned',
        },
      }],
    }],
    groceryList: {
      ingredients: [{
        item: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
        unit: {
          type: String,
          required: true,
        },
        estimated_cost: {
          type: Number,
          required: true,
        },
        store_suggestions: [String],
        alternatives: [{
          item: String,
          amount: Number,
          unit: String,
          estimated_cost: Number,
        }],
      }],
      totalCost: {
        type: Number,
        required: true,
      },
      optimizedStores: [{
        store: String,
        items: [String],
        subtotal: Number,
      }],
    },
    prepSchedule: [{
      date: {
        type: Date,
        required: true,
      },
      tasks: [{
        recipe: {
          type: Schema.Types.ObjectId,
          ref: 'Recipe',
          required: true,
        },
        step: {
          type: String,
          required: true,
        },
        duration: {
          type: Number,
          required: true,
        },
        startTime: {
          type: Date,
          required: true,
        },
        endTime: {
          type: Date,
          required: true,
        },
        dependencies: [String],
        equipment: [String],
        status: {
          type: String,
          enum: ['pending', 'in_progress', 'completed'],
          default: 'pending',
        },
      }],
    }],
    preferences: {
      cuisines: [String],
      excludedIngredients: [String],
      maxPrepTime: {
        type: Number,
        required: true,
      },
      mealSize: {
        type: String,
        enum: ['small', 'medium', 'large'],
        required: true,
      },
      leftoverPreference: {
        type: Boolean,
        required: true,
      },
      varietyPreference: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
    },
    nutritionTargets: {
      daily: {
        calories: {
          min: Number,
          max: Number,
        },
        protein: {
          min: Number,
          max: Number,
        },
        carbs: {
          min: Number,
          max: Number,
        },
        fat: {
          min: Number,
          max: Number,
        },
      },
      weekly: {
        calories: {
          min: Number,
          max: Number,
        },
        protein: {
          min: Number,
          max: Number,
        },
        carbs: {
          min: Number,
          max: Number,
        },
        fat: {
          min: Number,
          max: Number,
        },
      },
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
mealPlanSchema.index({ user: 1, startDate: -1 });
mealPlanSchema.index({ status: 1 });
mealPlanSchema.index({ 'schedule.date': 1 });
mealPlanSchema.index({ 'budget.remaining': 1 });

export const MealPlan = model<IMealPlan>('MealPlan', mealPlanSchema);
export { MealSchedule, GroceryList, PrepSchedule };
