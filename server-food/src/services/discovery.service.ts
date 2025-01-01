import { Order } from '../models/Order';
import { MenuItem } from '../models/MenuItem';
import { Restaurant } from '../models/Restaurant';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { searchService } from './search.service';
import { redis } from '../config/redis';

interface TrendingItem {
  id: string;
  type: 'restaurant' | 'menuItem';
  score: number;
  data: any;
}

interface UserPreferences {
  cuisines: string[];
  dietary: string[];
  priceRange: {
    min: number;
    max: number;
  };
  spicyLevel: number;
  allergens: string[];
}

class DiscoveryService {
  private readonly TRENDING_CACHE_KEY = 'trending:';
  private readonly CACHE_TTL = 3600; // 1 hour

  async getTrendingItems(
    location?: { lat: number; lon: number },
    limit: number = 10
  ): Promise<TrendingItem[]> {
    try {
      // Try to get from cache first
      const cacheKey = `${this.TRENDING_CACHE_KEY}${location?.lat || 'all'}:${location?.lon || 'all'}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Calculate trending items
      const trending = await this.calculateTrendingItems(location);

      // Cache the results
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(trending));

      return trending.slice(0, limit);
    } catch (error) {
      console.error('Error getting trending items:', error);
      throw new AppError('Failed to get trending items', 500);
    }
  }

  async getPersonalizedRecommendations(
    userId: string,
    location?: { lat: number; lon: number }
  ) {
    try {
      // Get user preferences and order history
      const user = await User.findById(userId)
        .populate('preferences')
        .populate({
          path: 'orderHistory',
          populate: ['restaurant', 'items.menuItem'],
        });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get recommendations based on preferences
      const preferenceBasedRecs = await searchService.getRecommendations(
        userId,
        location
      );

      // Get recommendations based on order history
      const historyBasedRecs = await this.getHistoryBasedRecommendations(
        user.orderHistory
      );

      // Get trending items
      const trendingItems = await this.getTrendingItems(location, 5);

      // Combine and rank recommendations
      return this.rankRecommendations(
        preferenceBasedRecs,
        historyBasedRecs,
        trendingItems,
        user.preferences
      );
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      throw new AppError('Failed to get recommendations', 500);
    }
  }

  async updateUserPreferences(
    userId: string,
    preferences: Partial<UserPreferences>
  ): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Update user preferences
      user.preferences = {
        ...user.preferences,
        ...preferences,
      };
      await user.save();

      // Invalidate related caches
      await this.invalidateUserCaches(userId);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new AppError('Failed to update preferences', 500);
    }
  }

  async getSimilarRestaurants(
    restaurantId: string,
    limit: number = 5
  ) {
    try {
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
      }

      // Search for similar restaurants based on cuisine and price range
      const similar = await searchService.searchRestaurants(
        '',
        {
          cuisine: [restaurant.cuisine],
          priceRange: restaurant.priceRange,
          location: restaurant.location,
        },
        1,
        limit + 1 // Add 1 to exclude the current restaurant
      );

      // Remove the current restaurant from results
      return similar.restaurants.filter(r => r.id !== restaurantId);
    } catch (error) {
      console.error('Error getting similar restaurants:', error);
      throw new AppError('Failed to get similar restaurants', 500);
    }
  }

  async getSimilarMenuItems(
    menuItemId: string,
    limit: number = 5
  ) {
    try {
      const menuItem = await MenuItem.findById(menuItemId);
      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }

      // Search for similar menu items based on category and characteristics
      const similar = await searchService.searchMenuItems(
        '',
        {
          category: [menuItem.category],
          dietary: menuItem.dietary,
          spicyLevel: menuItem.spicyLevel,
          priceRange: {
            min: menuItem.price * 0.8,
            max: menuItem.price * 1.2,
          },
        },
        menuItem.restaurant.toString(),
        1,
        limit + 1
      );

      // Remove the current item from results
      return similar.items.filter(item => item.id !== menuItemId);
    } catch (error) {
      console.error('Error getting similar menu items:', error);
      throw new AppError('Failed to get similar menu items', 500);
    }
  }

  private async calculateTrendingItems(
    location?: { lat: number; lon: number }
  ): Promise<TrendingItem[]> {
    const trending: TrendingItem[] = [];

    // Get recent orders (last 24 hours)
    const recentOrders = await Order.find({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    }).populate(['restaurant', 'items.menuItem']);

    // Calculate restaurant scores
    const restaurantScores = new Map<string, number>();
    recentOrders.forEach(order => {
      const restaurantId = order.restaurant._id.toString();
      const currentScore = restaurantScores.get(restaurantId) || 0;
      restaurantScores.set(restaurantId, currentScore + 1);
    });

    // Add trending restaurants
    for (const [restaurantId, score] of restaurantScores.entries()) {
      const restaurant = await Restaurant.findById(restaurantId);
      if (restaurant) {
        trending.push({
          id: restaurantId,
          type: 'restaurant',
          score,
          data: restaurant,
        });
      }
    }

    // Calculate menu item scores
    const menuItemScores = new Map<string, number>();
    recentOrders.forEach(order => {
      order.items.forEach(item => {
        const menuItemId = item.menuItem._id.toString();
        const currentScore = menuItemScores.get(menuItemId) || 0;
        menuItemScores.set(menuItemId, currentScore + item.quantity);
      });
    });

    // Add trending menu items
    for (const [menuItemId, score] of menuItemScores.entries()) {
      const menuItem = await MenuItem.findById(menuItemId);
      if (menuItem) {
        trending.push({
          id: menuItemId,
          type: 'menuItem',
          score,
          data: menuItem,
        });
      }
    }

    // Sort by score
    trending.sort((a, b) => b.score - a.score);

    return trending;
  }

  private async getHistoryBasedRecommendations(orderHistory: any[]) {
    if (!orderHistory?.length) return [];

    // Analyze order patterns
    const cuisinePreferences = new Map<string, number>();
    const categoryPreferences = new Map<string, number>();
    const priceRangePreferences = {
      min: Infinity,
      max: -Infinity,
      avg: 0,
      count: 0,
    };

    orderHistory.forEach(order => {
      // Track cuisine preferences
      const cuisine = order.restaurant.cuisine;
      cuisinePreferences.set(cuisine, (cuisinePreferences.get(cuisine) || 0) + 1);

      // Track menu item category preferences
      order.items.forEach((item: any) => {
        const category = item.menuItem.category;
        categoryPreferences.set(
          category,
          (categoryPreferences.get(category) || 0) + item.quantity
        );

        // Track price preferences
        const price = item.price;
        priceRangePreferences.min = Math.min(priceRangePreferences.min, price);
        priceRangePreferences.max = Math.max(priceRangePreferences.max, price);
        priceRangePreferences.avg += price;
        priceRangePreferences.count++;
      });
    });

    priceRangePreferences.avg /= priceRangePreferences.count;

    // Get recommendations based on preferences
    const recommendations = await searchService.searchRestaurants(
      '',
      {
        cuisine: Array.from(cuisinePreferences.keys()),
        priceRange: {
          min: priceRangePreferences.min * 0.8,
          max: priceRangePreferences.max * 1.2,
        },
      },
      1,
      10
    );

    return recommendations.restaurants;
  }

  private rankRecommendations(
    preferenceBasedRecs: any[],
    historyBasedRecs: any[],
    trendingItems: TrendingItem[],
    userPreferences: UserPreferences
  ) {
    const recommendations = new Map();

    // Combine all recommendations with weights
    preferenceBasedRecs.forEach(rec => {
      recommendations.set(rec.id, {
        ...rec,
        score: (rec.score || 0) * 1.5, // Preference-based recommendations get higher weight
      });
    });

    historyBasedRecs.forEach(rec => {
      const existing = recommendations.get(rec.id);
      if (existing) {
        existing.score += (rec.score || 0);
      } else {
        recommendations.set(rec.id, {
          ...rec,
          score: (rec.score || 0),
        });
      }
    });

    trendingItems
      .filter(item => item.type === 'restaurant')
      .forEach(item => {
        const existing = recommendations.get(item.id);
        if (existing) {
          existing.score += item.score * 0.5; // Trending items get lower weight
        } else {
          recommendations.set(item.id, {
            ...item.data,
            score: item.score * 0.5,
          });
        }
      });

    // Convert to array and sort by score
    return Array.from(recommendations.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private async invalidateUserCaches(userId: string): Promise<void> {
    const keys = await redis.keys(`${this.TRENDING_CACHE_KEY}*`);
    if (keys.length) {
      await redis.del(keys);
    }
  }
}

export const discoveryService = new DiscoveryService();
