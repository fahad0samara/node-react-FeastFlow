import { DietaryService } from './dietary.service';
import { NutritionLog } from '../models/NutritionLog';
import { DietaryProfile } from '../models/DietaryProfile';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';

interface HealthMetrics {
  bmi?: number;
  weight?: number;
  height?: number;
  activityLevel?: number;
  sleepQuality?: number;
  stressLevel?: number;
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  bloodSugar?: number;
  cholesterol?: {
    total: number;
    hdl: number;
    ldl: number;
    triglycerides: number;
  };
}

interface HealthGoals {
  targetWeight?: number;
  targetBmi?: number;
  targetCalories?: number;
  targetSteps?: number;
  targetSleep?: number;
  targetWater?: number;
}

interface HealthInsights {
  nutritionBalance: {
    score: number;
    improvements: string[];
  };
  mealTiming: {
    score: number;
    improvements: string[];
  };
  hydration: {
    score: number;
    improvements: string[];
  };
  dietaryAdherence: {
    score: number;
    improvements: string[];
  };
  healthConditionManagement: {
    score: number;
    improvements: string[];
  };
}

class HealthService {
  private readonly CACHE_KEY = 'health:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private dietaryService: DietaryService;

  constructor() {
    this.dietaryService = new DietaryService();
  }

  async updateHealthMetrics(userId: string, metrics: HealthMetrics) {
    try {
      const profile = await DietaryProfile.findOne({ user: userId });
      if (!profile) {
        throw new AppError('Dietary profile not found', 404);
      }

      // Update BMI if weight and height are provided
      if (metrics.weight && metrics.height) {
        metrics.bmi = this.calculateBMI(metrics.weight, metrics.height);
      }

      // Update nutrition goals based on new metrics
      const updatedGoals = this.calculateNutritionGoals(metrics, profile);
      await this.dietaryService.updateDietaryProfile(userId, {
        nutritionGoals: updatedGoals,
      });

      // Store metrics in health log
      await this.logHealthMetrics(userId, metrics);

      // Invalidate cache
      const cacheKey = `${this.CACHE_KEY}metrics:${userId}`;
      await redis.del(cacheKey);

      return metrics;
    } catch (error) {
      console.error('Error updating health metrics:', error);
      throw new AppError('Failed to update health metrics', 500);
    }
  }

  async setHealthGoals(userId: string, goals: HealthGoals) {
    try {
      const profile = await DietaryProfile.findOne({ user: userId });
      if (!profile) {
        throw new AppError('Dietary profile not found', 404);
      }

      // Validate goals
      this.validateHealthGoals(goals, profile);

      // Update goals in profile
      profile.nutritionGoals = {
        ...profile.nutritionGoals,
        calories: {
          min: goals.targetCalories ? goals.targetCalories * 0.9 : undefined,
          max: goals.targetCalories ? goals.targetCalories * 1.1 : undefined,
        },
      };

      await profile.save();

      // Store goals in health log
      await this.logHealthGoals(userId, goals);

      return goals;
    } catch (error) {
      console.error('Error setting health goals:', error);
      throw new AppError('Failed to set health goals', 500);
    }
  }

  async getHealthInsights(userId: string): Promise<HealthInsights> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}insights:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const [profile, nutritionLogs] = await Promise.all([
        this.dietaryService.getDietaryProfile(userId),
        NutritionLog.find({
          user: userId,
          date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        }),
      ]);

      const insights = {
        nutritionBalance: this.analyzeNutritionBalance(nutritionLogs, profile),
        mealTiming: this.analyzeMealTiming(nutritionLogs),
        hydration: this.analyzeHydration(nutritionLogs),
        dietaryAdherence: this.analyzeDietaryAdherence(nutritionLogs, profile),
        healthConditionManagement: this.analyzeHealthConditions(nutritionLogs, profile),
      };

      // Cache insights
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(insights));

      return insights;
    } catch (error) {
      console.error('Error getting health insights:', error);
      throw new AppError('Failed to get health insights', 500);
    }
  }

  async getHealthRecommendations(userId: string): Promise<string[]> {
    try {
      const insights = await this.getHealthInsights(userId);
      const recommendations: string[] = [];

      // Collect all improvements
      Object.values(insights).forEach(category => {
        recommendations.push(...category.improvements);
      });

      // Prioritize and deduplicate recommendations
      return Array.from(new Set(recommendations))
        .sort((a, b) => {
          // Prioritization logic
          const priorityA = this.getRecommendationPriority(a);
          const priorityB = this.getRecommendationPriority(b);
          return priorityB - priorityA;
        })
        .slice(0, 5); // Return top 5 recommendations
    } catch (error) {
      console.error('Error getting health recommendations:', error);
      throw new AppError('Failed to get health recommendations', 500);
    }
  }

  private calculateBMI(weight: number, height: number): number {
    // Weight in kg, height in meters
    return weight / (height * height);
  }

  private calculateNutritionGoals(metrics: HealthMetrics, profile: any) {
    const goals: any = {};

    if (metrics.weight && metrics.height && metrics.activityLevel) {
      // Calculate BMR using Harris-Benedict equation
      const bmr = this.calculateBMR(metrics.weight, metrics.height, profile);
      
      // Calculate TDEE (Total Daily Energy Expenditure)
      const activityMultipliers = {
        1: 1.2, // Sedentary
        2: 1.375, // Light activity
        3: 1.55, // Moderate activity
        4: 1.725, // Very active
        5: 1.9, // Extra active
      };
      const tdee = bmr * activityMultipliers[metrics.activityLevel];

      // Set calorie goals based on weight goals
      goals.calories = {
        min: tdee * 0.9,
        max: tdee * 1.1,
      };

      // Set macronutrient goals
      goals.protein = {
        min: (metrics.weight * 1.6), // 1.6g per kg for active individuals
        max: (metrics.weight * 2.2), // 2.2g per kg upper limit
      };

      goals.carbs = {
        min: (tdee * 0.45) / 4, // 45% of calories from carbs
        max: (tdee * 0.65) / 4, // 65% of calories from carbs
      };

      goals.fat = {
        min: (tdee * 0.20) / 9, // 20% of calories from fat
        max: (tdee * 0.35) / 9, // 35% of calories from fat
      };
    }

    return goals;
  }

  private calculateBMR(weight: number, height: number, profile: any): number {
    // Harris-Benedict equation
    const age = this.calculateAge(profile.dateOfBirth);
    if (profile.gender === 'male') {
      return 88.362 + (13.397 * weight) + (4.799 * height * 100) - (5.677 * age);
    } else {
      return 447.593 + (9.247 * weight) + (3.098 * height * 100) - (4.330 * age);
    }
  }

  private calculateAge(dateOfBirth: Date): number {
    return Math.floor((Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }

  private validateHealthGoals(goals: HealthGoals, profile: any) {
    if (goals.targetBmi) {
      if (goals.targetBmi < 18.5 || goals.targetBmi > 30) {
        throw new AppError('Target BMI is outside healthy range', 400);
      }
    }

    if (goals.targetCalories) {
      const bmr = this.calculateBMR(profile.weight, profile.height, profile);
      if (goals.targetCalories < bmr * 0.8 || goals.targetCalories > bmr * 1.5) {
        throw new AppError('Target calories are outside safe range', 400);
      }
    }
  }

  private async logHealthMetrics(userId: string, metrics: HealthMetrics) {
    // Implementation of health metrics logging
  }

  private async logHealthGoals(userId: string, goals: HealthGoals) {
    // Implementation of health goals logging
  }

  private analyzeNutritionBalance(logs: any[], profile: any) {
    // Implementation of nutrition balance analysis
    return {
      score: 0,
      improvements: [],
    };
  }

  private analyzeMealTiming(logs: any[]) {
    // Implementation of meal timing analysis
    return {
      score: 0,
      improvements: [],
    };
  }

  private analyzeHydration(logs: any[]) {
    // Implementation of hydration analysis
    return {
      score: 0,
      improvements: [],
    };
  }

  private analyzeDietaryAdherence(logs: any[], profile: any) {
    // Implementation of dietary adherence analysis
    return {
      score: 0,
      improvements: [],
    };
  }

  private analyzeHealthConditions(logs: any[], profile: any) {
    // Implementation of health conditions analysis
    return {
      score: 0,
      improvements: [],
    };
  }

  private getRecommendationPriority(recommendation: string): number {
    // Implementation of recommendation prioritization
    return 0;
  }
}

export { HealthService, HealthMetrics, HealthGoals, HealthInsights };
