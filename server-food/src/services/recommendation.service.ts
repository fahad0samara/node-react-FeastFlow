import { Order } from '../models/Order';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';
import { Rating } from '../models/Rating';
import { AppError } from '../middleware/errorHandler';

interface RecommendationScore {
  item: any;
  score: number;
}

class RecommendationService {
  async getPersonalizedRecommendations(
    userId: string,
    options: {
      limit?: number;
      cuisine?: string;
      maxPrice?: number;
      dietaryPreferences?: string[];
    } = {}
  ): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's order history
    const orderHistory = await Order.find({ user: userId })
      .populate('restaurant')
      .populate('items.menuItem');

    // Get user's ratings
    const userRatings = await Rating.find({ user: userId })
      .populate('restaurant');

    // Calculate user preferences
    const preferences = await this.calculateUserPreferences(
      orderHistory,
      userRatings
    );

    // Get candidate items
    let candidates = await this.getCandidateItems(options);

    // Score and rank items
    const scoredItems = await this.scoreItems(
      candidates,
      preferences,
      user,
      options
    );

    // Sort by score and return top N items
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, options.limit || 10)
      .map(item => item.item);
  }

  async getPopularItems(
    options: {
      timeframe?: 'day' | 'week' | 'month';
      cuisine?: string;
      location?: [number, number];
      radius?: number;
    } = {}
  ): Promise<any[]> {
    const timeframeHours = {
      day: 24,
      week: 168,
      month: 720,
    };

    const startDate = new Date();
    startDate.setHours(
      startDate.getHours() - (timeframeHours[options.timeframe || 'week'])
    );

    // Get orders within timeframe
    const orders = await Order.find({
      createdAt: { $gte: startDate },
      status: 'delivered',
    })
      .populate('items.menuItem')
      .populate('restaurant');

    // Calculate item popularity scores
    const popularityScores = new Map<string, number>();
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem._id.toString();
        const currentScore = popularityScores.get(itemId) || 0;
        
        // Score based on quantity ordered and rating
        let score = item.quantity;
        if (order.ratings?.food) {
          score *= (order.ratings.food / 5);
        }
        
        popularityScores.set(itemId, currentScore + score);
      });
    });

    // Get menu items with their scores
    const menuItems = await Menu.find({
      _id: { $in: Array.from(popularityScores.keys()) },
    }).populate('restaurant');

    // Filter by cuisine if specified
    const filteredItems = menuItems.filter(item => {
      if (options.cuisine && item.cuisine !== options.cuisine) {
        return false;
      }
      return true;
    });

    // Sort by popularity score
    return filteredItems
      .map(item => ({
        item,
        score: popularityScores.get(item._id.toString()) || 0,
      }))
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item);
  }

  async getSimilarItems(itemId: string): Promise<any[]> {
    const item = await Menu.findById(itemId).populate('restaurant');
    if (!item) {
      throw new AppError('Item not found', 404);
    }

    // Get items with similar characteristics
    const similarItems = await Menu.find({
      _id: { $ne: itemId },
      $or: [
        { cuisine: item.cuisine },
        { category: item.category },
        { tags: { $in: item.tags } },
      ],
    }).populate('restaurant');

    // Score items based on similarity
    const scoredItems = similarItems.map(similarItem => ({
      item: similarItem,
      score: this.calculateItemSimilarity(item, similarItem),
    }));

    // Return top similar items
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ item }) => item);
  }

  async getRecommendedBundles(
    userId: string,
    occasion?: string
  ): Promise<any[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's preferences
    const orderHistory = await Order.find({ user: userId })
      .populate('items.menuItem')
      .populate('restaurant');

    const preferences = await this.calculateUserPreferences(
      orderHistory,
      []
    );

    // Define bundle templates based on occasion
    const bundleTemplates = this.getBundleTemplates(occasion);

    // Generate personalized bundles
    const personalizedBundles = await Promise.all(
      bundleTemplates.map(async template => {
        const items = await this.findBundleItems(template, preferences);
        return {
          name: template.name,
          description: template.description,
          items,
          totalPrice: items.reduce((sum, item) => sum + item.price, 0),
          discount: template.discount,
        };
      })
    );

    return personalizedBundles;
  }

  private async calculateUserPreferences(
    orders: any[],
    ratings: any[]
  ): Promise<any> {
    const preferences = {
      cuisines: new Map<string, number>(),
      categories: new Map<string, number>(),
      priceRange: new Map<string, number>(),
      spiceLevel: new Map<string, number>(),
      tags: new Map<string, number>(),
      timePatterns: new Map<string, number>(),
    };

    // Analyze orders
    orders.forEach(order => {
      const orderDate = new Date(order.createdAt);
      const timeSlot = `${orderDate.getHours()}-${orderDate.getHours() + 1}`;
      
      order.items.forEach((item: any) => {
        // Update cuisine preferences
        this.incrementMapValue(
          preferences.cuisines,
          item.menuItem.cuisine,
          item.quantity
        );

        // Update category preferences
        this.incrementMapValue(
          preferences.categories,
          item.menuItem.category,
          item.quantity
        );

        // Update price range preferences
        const priceRange = this.getPriceRange(item.menuItem.price);
        this.incrementMapValue(
          preferences.priceRange,
          priceRange,
          item.quantity
        );

        // Update spice level preferences
        if (item.menuItem.spiceLevel) {
          this.incrementMapValue(
            preferences.spiceLevel,
            item.menuItem.spiceLevel,
            item.quantity
          );
        }

        // Update tag preferences
        item.menuItem.tags?.forEach((tag: string) => {
          this.incrementMapValue(preferences.tags, tag, item.quantity);
        });
      });

      // Update time patterns
      this.incrementMapValue(preferences.timePatterns, timeSlot, 1);
    });

    // Analyze ratings
    ratings.forEach(rating => {
      const weight = rating.foodRating / 5;
      
      this.incrementMapValue(
        preferences.cuisines,
        rating.restaurant.cuisine,
        weight
      );

      rating.restaurant.tags?.forEach((tag: string) => {
        this.incrementMapValue(preferences.tags, tag, weight);
      });
    });

    return preferences;
  }

  private async getCandidateItems(
    options: any
  ): Promise<any[]> {
    const query: any = {};

    if (options.cuisine) {
      query.cuisine = options.cuisine;
    }

    if (options.maxPrice) {
      query.price = { $lte: options.maxPrice };
    }

    if (options.dietaryPreferences?.length) {
      query.dietaryTags = { $all: options.dietaryPreferences };
    }

    return Menu.find(query).populate('restaurant');
  }

  private async scoreItems(
    items: any[],
    preferences: any,
    user: any,
    options: any
  ): Promise<RecommendationScore[]> {
    return items.map(item => {
      let score = 0;

      // Score based on cuisine preference
      score += (preferences.cuisines.get(item.cuisine) || 0) * 0.3;

      // Score based on category preference
      score += (preferences.categories.get(item.category) || 0) * 0.2;

      // Score based on price range
      const priceRange = this.getPriceRange(item.price);
      score += (preferences.priceRange.get(priceRange) || 0) * 0.15;

      // Score based on tags
      item.tags?.forEach((tag: string) => {
        score += (preferences.tags.get(tag) || 0) * 0.1;
      });

      // Adjust score based on current time
      const currentHour = new Date().getHours();
      const timeSlot = `${currentHour}-${currentHour + 1}`;
      score *= (1 + (preferences.timePatterns.get(timeSlot) || 0) * 0.1);

      // Penalize recently ordered items
      const lastOrdered = user.recentOrders?.find(
        (order: any) => order.menuItem.toString() === item._id.toString()
      );
      if (lastOrdered) {
        const daysSinceOrdered = (Date.now() - lastOrdered.timestamp) / (1000 * 60 * 60 * 24);
        score *= Math.min(1, daysSinceOrdered / 7); // Reduce score for items ordered within last 7 days
      }

      return { item, score };
    });
  }

  private calculateItemSimilarity(item1: any, item2: any): number {
    let similarity = 0;

    // Compare cuisine (highest weight)
    if (item1.cuisine === item2.cuisine) {
      similarity += 0.4;
    }

    // Compare category
    if (item1.category === item2.category) {
      similarity += 0.3;
    }

    // Compare tags
    const commonTags = item1.tags.filter((tag: string) =>
      item2.tags.includes(tag)
    );
    similarity += (commonTags.length / Math.max(item1.tags.length, item2.tags.length)) * 0.2;

    // Compare price range
    if (this.getPriceRange(item1.price) === this.getPriceRange(item2.price)) {
      similarity += 0.1;
    }

    return similarity;
  }

  private getBundleTemplates(occasion?: string): any[] {
    const templates = [
      {
        name: 'Family Feast',
        description: 'Perfect for family gatherings',
        requirements: {
          mainDishes: 2,
          sideDishes: 3,
          desserts: 1,
        },
        discount: 15,
      },
      {
        name: 'Party Pack',
        description: 'Great for celebrations',
        requirements: {
          appetizers: 3,
          mainDishes: 3,
          desserts: 2,
        },
        discount: 20,
      },
      // Add more templates based on occasion
    ];

    return occasion
      ? templates.filter(t => t.occasion === occasion)
      : templates;
  }

  private async findBundleItems(
    template: any,
    preferences: any
  ): Promise<any[]> {
    const items = [];

    for (const [category, count] of Object.entries(template.requirements)) {
      const categoryItems = await Menu.find({ category })
        .sort({ price: 1 })
        .limit(count as number);
      
      items.push(...categoryItems);
    }

    return items;
  }

  private getPriceRange(price: number): string {
    if (price <= 10) return 'budget';
    if (price <= 20) return 'moderate';
    if (price <= 40) return 'premium';
    return 'luxury';
  }

  private incrementMapValue(
    map: Map<string, number>,
    key: string,
    increment: number
  ): void {
    map.set(key, (map.get(key) || 0) + increment);
  }
}

export const recommendationService = new RecommendationService();
