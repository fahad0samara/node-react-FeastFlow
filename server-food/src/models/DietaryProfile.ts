import { Schema, model, Document } from 'mongoose';

interface NutritionGoals {
  calories?: {
    min: number;
    max: number;
  };
  protein?: {
    min: number;
    max: number;
  };
  carbs?: {
    min: number;
    max: number;
  };
  fat?: {
    min: number;
    max: number;
  };
  fiber?: {
    min: number;
    max: number;
  };
  sodium?: {
    min: number;
    max: number;
  };
  sugar?: {
    min: number;
    max: number;
  };
}

interface IDietaryProfile extends Document {
  user: Schema.Types.ObjectId;
  dietaryType: string[];
  allergies: string[];
  intolerances: string[];
  restrictions: string[];
  preferences: {
    liked: string[];
    disliked: string[];
    spiceLevel: number;
  };
  nutritionGoals: NutritionGoals;
  healthConditions: string[];
  culturalPreferences: string[];
  mealPreferences: {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks: string[];
  };
  excludedIngredients: string[];
  createdAt: Date;
  updatedAt: Date;
}

const dietaryProfileSchema = new Schema<IDietaryProfile>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    dietaryType: [{
      type: String,
      enum: [
        'vegan',
        'vegetarian',
        'pescatarian',
        'flexitarian',
        'keto',
        'paleo',
        'halal',
        'kosher',
        'gluten-free',
        'dairy-free',
      ],
    }],
    allergies: [{
      type: String,
      enum: [
        'peanuts',
        'tree-nuts',
        'milk',
        'eggs',
        'fish',
        'shellfish',
        'soy',
        'wheat',
      ],
    }],
    intolerances: [{
      type: String,
      enum: [
        'lactose',
        'gluten',
        'fructose',
        'histamine',
        'sulfites',
      ],
    }],
    restrictions: [{
      type: String,
    }],
    preferences: {
      liked: [String],
      disliked: [String],
      spiceLevel: {
        type: Number,
        min: 0,
        max: 5,
        default: 2,
      },
    },
    nutritionGoals: {
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
      fiber: {
        min: Number,
        max: Number,
      },
      sodium: {
        min: Number,
        max: Number,
      },
      sugar: {
        min: Number,
        max: Number,
      },
    },
    healthConditions: [{
      type: String,
      enum: [
        'diabetes',
        'hypertension',
        'heart-disease',
        'celiac',
        'ibs',
      ],
    }],
    culturalPreferences: [{
      type: String,
    }],
    mealPreferences: {
      breakfast: [String],
      lunch: [String],
      dinner: [String],
      snacks: [String],
    },
    excludedIngredients: [String],
  },
  {
    timestamps: true,
  }
);

// Indexes
dietaryProfileSchema.index({ user: 1 });
dietaryProfileSchema.index({ dietaryType: 1 });
dietaryProfileSchema.index({ allergies: 1 });
dietaryProfileSchema.index({ healthConditions: 1 });

export const DietaryProfile = model<IDietaryProfile>('DietaryProfile', dietaryProfileSchema);
