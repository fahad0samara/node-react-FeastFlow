import { DietaryProfile } from '../models/DietaryProfile';
import { NutritionLog } from '../models/NutritionLog';
import { MenuItem } from '../models/MenuItem';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';

interface NutritionSummary {
  daily: {
    average: any;
    trend: any[];
  };
  weekly: {
    average: any;
    trend: any[];
  };
  monthly: {
    average: any;
    trend: any[];
  };
}

class DietaryService {
  private readonly CACHE_KEY = 'dietary:';
  private readonly CACHE_TTL = 3600; // 1 hour

  async getDietaryProfile(userId: string) {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}profile:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const profile = await DietaryProfile.findOne({ user: userId });
      if (!profile) {
        throw new AppError('Dietary profile not found', 404);
      }

      // Cache the profile
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(profile));

      return profile;
    } catch (error) {
      console.error('Error getting dietary profile:', error);
      throw new AppError('Failed to get dietary profile', 500);
    }
  }

  async updateDietaryProfile(userId: string, updates: Partial<DietaryProfile>) {
    try {
      const profile = await DietaryProfile.findOneAndUpdate(
        { user: userId },
        { $set: updates },
        { new: true, upsert: true }
      );

      // Invalidate cache
      const cacheKey = `${this.CACHE_KEY}profile:${userId}`;
      await redis.del(cacheKey);

      return profile;
    } catch (error) {
      console.error('Error updating dietary profile:', error);
      throw new AppError('Failed to update dietary profile', 500);
    }
  }

  async logMeal(userId: string, mealData: any) {
    try {
      const { type, items, time } = mealData;
      const date = new Date(time);
      date.setHours(0, 0, 0, 0);

      // Get nutrition info for menu items
      const itemsWithNutrition = await Promise.all(
        items.map(async (item: any) => {
          const menuItem = await MenuItem.findById(item.menuItemId);
          if (!menuItem) {
            throw new AppError(`Menu item not found: ${item.menuItemId}`, 404);
          }
          return {
            menuItem: menuItem._id,
            quantity: item.quantity,
            nutrition: menuItem.nutrition,
          };
        })
      );

      // Find or create nutrition log for the day
      let log = await NutritionLog.findOne({
        user: userId,
        date,
      });

      if (!log) {
        log = new NutritionLog({
          user: userId,
          date,
          meals: [],
        });
      }

      // Add new meal
      log.meals.push({
        type,
        time: new Date(time),
        items: itemsWithNutrition,
      });

      await log.save();

      // Invalidate nutrition summary cache
      const cacheKey = `${this.CACHE_KEY}summary:${userId}`;
      await redis.del(cacheKey);

      return log;
    } catch (error) {
      console.error('Error logging meal:', error);
      throw new AppError('Failed to log meal', 500);
    }
  }

  async getNutritionSummary(userId: string): Promise<NutritionSummary> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}summary:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const logs = await NutritionLog.find({
        user: userId,
        date: { $gte: thirtyDaysAgo },
      }).sort({ date: 1 });

      const summary = this.calculateNutritionSummary(logs);

      // Cache the summary
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(summary));

      return summary;
    } catch (error) {
      console.error('Error getting nutrition summary:', error);
      throw new AppError('Failed to get nutrition summary', 500);
    }
  }

  async checkDietaryCompatibility(userId: string, menuItemId: string): Promise<{
    compatible: boolean;
    reasons: string[];
  }> {
    try {
      const [profile, menuItem] = await Promise.all([
        this.getDietaryProfile(userId),
        MenuItem.findById(menuItemId),
      ]);

      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      const incompatibilities: string[] = [];

      // Check allergies
      if (profile.allergies.some(allergy => 
        menuItem.allergens.includes(allergy)
      )) {
        incompatibilities.push('Contains allergens');
      }

      // Check intolerances
      if (profile.intolerances.some(intolerance =>
        menuItem.ingredients.some(ingredient =>
          ingredient.toLowerCase().includes(intolerance.toLowerCase())
        )
      )) {
        incompatibilities.push('Contains ingredients you are intolerant to');
      }

      // Check dietary type compatibility
      if (profile.dietaryType.includes('vegan') && menuItem.containsAnimalProducts) {
        incompatibilities.push('Not vegan');
      }

      // Check health conditions
      if (profile.healthConditions.includes('diabetes') && menuItem.nutrition.sugar > 20) {
        incompatibilities.push('High sugar content');
      }

      return {
        compatible: incompatibilities.length === 0,
        reasons: incompatibilities,
      };
    } catch (error) {
      console.error('Error checking dietary compatibility:', error);
      throw new AppError('Failed to check dietary compatibility', 500);
    }
  }

  async getMealPlan(userId: string, date: Date): Promise<any> {
    try {
      const profile = await this.getDietaryProfile(userId);
      const nutritionSummary = await this.getNutritionSummary(userId);

      // Get compatible menu items
      const menuItems = await MenuItem.find({});
      const compatibleItems = await Promise.all(
        menuItems.map(async item => {
          const compatibility = await this.checkDietaryCompatibility(
            userId,
            item._id
          );
          return compatibility.compatible ? item : null;
        })
      );

      // Generate meal plan based on nutrition goals and preferences
      const mealPlan = this.generateMealPlan(
        profile,
        nutritionSummary,
        compatibleItems.filter(item => item !== null)
      );

      return mealPlan;
    } catch (error) {
      console.error('Error getting meal plan:', error);
      throw new AppError('Failed to get meal plan', 500);
    }
  }

  private calculateNutritionSummary(logs: any[]): NutritionSummary {
    // Group logs by day, week, and month
    const dailyData = this.groupLogsByPeriod(logs, 'day');
    const weeklyData = this.groupLogsByPeriod(logs, 'week');
    const monthlyData = this.groupLogsByPeriod(logs, 'month');

    return {
      daily: {
        average: this.calculateAverage(dailyData),
        trend: this.calculateTrend(dailyData),
      },
      weekly: {
        average: this.calculateAverage(weeklyData),
        trend: this.calculateTrend(weeklyData),
      },
      monthly: {
        average: this.calculateAverage(monthlyData),
        trend: this.calculateTrend(monthlyData),
      },
    };
  }

  private groupLogsByPeriod(logs: any[], period: 'day' | 'week' | 'month') {
    // Implementation of grouping logic
    return [];
  }

  private calculateAverage(data: any[]) {
    // Implementation of average calculation
    return {};
  }

  private calculateTrend(data: any[]) {
    // Implementation of trend calculation
    return [];
  }

  private generateMealPlan(
    profile: any,
    nutritionSummary: NutritionSummary,
    compatibleItems: any[]
  ) {
    // Implementation of meal plan generation
    return {
      breakfast: [],
      lunch: [],
      dinner: [],
      snacks: [],
    };
  }
}

export { DietaryService };
