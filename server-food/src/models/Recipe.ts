import { Schema, model, Document } from 'mongoose';

interface Ingredient {
  item: string;
  amount: number;
  unit: string;
  substitutes?: {
    item: string;
    amount: number;
    unit: string;
  }[];
  estimatedCost?: number;
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    vitamins?: { [key: string]: number };
    minerals?: { [key: string]: number };
  };
}

interface CookingStep {
  order: number;
  description: string;
  duration: number; // in minutes
  temperature?: {
    value: number;
    unit: 'C' | 'F';
  };
  equipment?: string[];
  techniques?: string[];
  tips?: string[];
}

interface IRecipe extends Document {
  name: string;
  description: string;
  cuisine: string[];
  category: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  prepTime: number;
  cookTime: number;
  totalTime: number;
  servings: number;
  ingredients: Ingredient[];
  steps: CookingStep[];
  nutrition: {
    perServing: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      vitamins?: { [key: string]: number };
      minerals?: { [key: string]: number };
    };
    total: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber?: number;
      vitamins?: { [key: string]: number };
      minerals?: { [key: string]: number };
    };
  };
  estimatedCost: {
    perServing: number;
    total: number;
  };
  dietaryInfo: {
    isVegan: boolean;
    isVegetarian: boolean;
    isGlutenFree: boolean;
    isDairyFree: boolean;
    isNutFree: boolean;
    isKeto: boolean;
    isPaleo: boolean;
    isLowCarb: boolean;
    isLowFat: boolean;
    isLowCalorie: boolean;
  };
  allergens: string[];
  tips: string[];
  variations: {
    name: string;
    description: string;
    ingredientModifications: {
      original: string;
      replacement: string;
      amount?: number;
      unit?: string;
    }[];
  }[];
  pairings: {
    dishes: string[];
    wines: string[];
    sides: string[];
  };
  storage: {
    method: string;
    duration: number; // in hours
    instructions: string;
  };
  reheating: {
    method: string;
    instructions: string;
    duration: number; // in minutes
  };
  createdBy: Schema.Types.ObjectId;
  ratings: {
    average: number;
    count: number;
    reviews: {
      user: Schema.Types.ObjectId;
      rating: number;
      comment: string;
      date: Date;
    }[];
  };
  tags: string[];
  images: string[];
  video?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recipeSchema = new Schema<IRecipe>(
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
    cuisine: [{
      type: String,
      required: true,
    }],
    category: [{
      type: String,
      required: true,
    }],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    prepTime: {
      type: Number,
      required: true,
      min: 0,
    },
    cookTime: {
      type: Number,
      required: true,
      min: 0,
    },
    totalTime: {
      type: Number,
      required: true,
      min: 0,
    },
    servings: {
      type: Number,
      required: true,
      min: 1,
    },
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
      substitutes: [{
        item: String,
        amount: Number,
        unit: String,
      }],
      estimatedCost: Number,
      nutritionPer100g: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
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
    steps: [{
      order: {
        type: Number,
        required: true,
      },
      description: {
        type: String,
        required: true,
      },
      duration: {
        type: Number,
        required: true,
      },
      temperature: {
        value: Number,
        unit: {
          type: String,
          enum: ['C', 'F'],
        },
      },
      equipment: [String],
      techniques: [String],
      tips: [String],
    }],
    nutrition: {
      perServing: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        vitamins: {
          type: Map,
          of: Number,
        },
        minerals: {
          type: Map,
          of: Number,
        },
      },
      total: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        vitamins: {
          type: Map,
          of: Number,
        },
        minerals: {
          type: Map,
          of: Number,
        },
      },
    },
    estimatedCost: {
      perServing: Number,
      total: Number,
    },
    dietaryInfo: {
      isVegan: Boolean,
      isVegetarian: Boolean,
      isGlutenFree: Boolean,
      isDairyFree: Boolean,
      isNutFree: Boolean,
      isKeto: Boolean,
      isPaleo: Boolean,
      isLowCarb: Boolean,
      isLowFat: Boolean,
      isLowCalorie: Boolean,
    },
    allergens: [String],
    tips: [String],
    variations: [{
      name: String,
      description: String,
      ingredientModifications: [{
        original: String,
        replacement: String,
        amount: Number,
        unit: String,
      }],
    }],
    pairings: {
      dishes: [String],
      wines: [String],
      sides: [String],
    },
    storage: {
      method: String,
      duration: Number,
      instructions: String,
    },
    reheating: {
      method: String,
      instructions: String,
      duration: Number,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
      reviews: [{
        user: {
          type: Schema.Types.ObjectId,
          ref: 'User',
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        comment: String,
        date: {
          type: Date,
          default: Date.now,
        },
      }],
    },
    tags: [String],
    images: [String],
    video: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
recipeSchema.index({ name: 'text', description: 'text', tags: 'text' });
recipeSchema.index({ cuisine: 1 });
recipeSchema.index({ category: 1 });
recipeSchema.index({ 'ratings.average': -1 });
recipeSchema.index({ createdAt: -1 });
recipeSchema.index({ 'estimatedCost.perServing': 1 });

// Pre-save middleware to calculate total time and update nutrition totals
recipeSchema.pre('save', function(next) {
  // Calculate total time
  this.totalTime = this.prepTime + this.cookTime;

  // Calculate total nutrition
  if (this.nutrition.perServing) {
    const total: any = {};
    Object.keys(this.nutrition.perServing).forEach(key => {
      if (typeof this.nutrition.perServing[key] === 'number') {
        total[key] = this.nutrition.perServing[key] * this.servings;
      }
    });
    this.nutrition.total = total;
  }

  next();
});

export const Recipe = model<IRecipe>('Recipe', recipeSchema);
export { Ingredient, CookingStep };
