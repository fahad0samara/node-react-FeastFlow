import { Schema, model, Document } from 'mongoose';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  sugar: number;
  vitamins?: {
    [key: string]: number;
  };
  minerals?: {
    [key: string]: number;
  };
}

interface INutritionLog extends Document {
  user: Schema.Types.ObjectId;
  date: Date;
  meals: {
    type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    time: Date;
    items: Array<{
      menuItem: Schema.Types.ObjectId;
      quantity: number;
      nutrition: NutritionInfo;
    }>;
    totalNutrition: NutritionInfo;
  }[];
  dailyTotalNutrition: NutritionInfo;
  waterIntake: number;
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

const nutritionLogSchema = new Schema<INutritionLog>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
      items: [{
        menuItem: {
          type: Schema.Types.ObjectId,
          ref: 'MenuItem',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        nutrition: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
          fiber: Number,
          sodium: Number,
          sugar: Number,
          vitamins: {
            type: Map,
            of: Number,
          },
          minerals: {
            type: Map,
            of: Number,
          },
        },
      }],
      totalNutrition: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sodium: Number,
        sugar: Number,
        vitamins: {
          type: Map,
          of: Number,
        },
        minerals: {
          type: Map,
          of: Number,
        },
      },
    }],
    dailyTotalNutrition: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
      fiber: Number,
      sodium: Number,
      sugar: Number,
      vitamins: {
        type: Map,
        of: Number,
      },
      minerals: {
        type: Map,
        of: Number,
      },
    },
    waterIntake: {
      type: Number,
      default: 0,
      min: 0,
    },
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
nutritionLogSchema.index({ user: 1, date: -1 });
nutritionLogSchema.index({ user: 1, 'meals.time': -1 });

// Pre-save middleware to calculate total nutrition
nutritionLogSchema.pre('save', function(next) {
  // Calculate meal totals
  this.meals.forEach(meal => {
    meal.totalNutrition = meal.items.reduce((total, item) => {
      Object.keys(item.nutrition).forEach(key => {
        if (key !== 'vitamins' && key !== 'minerals') {
          total[key] = (total[key] || 0) + (item.nutrition[key] * item.quantity);
        }
      });
      return total;
    }, {} as NutritionInfo);
  });

  // Calculate daily total
  this.dailyTotalNutrition = this.meals.reduce((total, meal) => {
    Object.keys(meal.totalNutrition).forEach(key => {
      if (key !== 'vitamins' && key !== 'minerals') {
        total[key] = (total[key] || 0) + meal.totalNutrition[key];
      }
    });
    return total;
  }, {} as NutritionInfo);

  next();
});

export const NutritionLog = model<INutritionLog>('NutritionLog', nutritionLogSchema);
