import { User } from '../models/User';
import { Order } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs-node';
import { WeatherService } from './weather.service';
import { EventService } from './event.service';
import { SocialService } from './social.service';

interface RecommendationContext {
  userId: string;
  location?: {
    lat: number;
    lon: number;
  };
  time?: Date;
  weather?: {
    temperature: number;
    condition: string;
  };
  occasion?: string;
}

interface RecommendationScore {
  itemId: string;
  score: number;
  factors: {
    userPreference: number;
    timeContext: number;
    weatherContext: number;
    socialContext: number;
    seasonality: number;
    popularity: number;
  };
}

class SmartRecommendationService {
  private readonly MODEL_CACHE_KEY = 'ml:model:';
  private readonly CACHE_TTL = 3600; // 1 hour
  private model: tf.LayersModel | null = null;

  constructor(
    private weatherService: WeatherService,
    private eventService: EventService,
    private socialService: SocialService
  ) {
    this.initializeModel();
  }

  async getSmartRecommendations(context: RecommendationContext) {
    try {
      // Get base recommendations
      const baseRecommendations = await this.getBaseRecommendations(context);

      // Enrich with contextual data
      const enrichedRecommendations = await this.enrichRecommendations(
        baseRecommendations,
        context
      );

      // Apply ML model for final scoring
      const scoredRecommendations = await this.applyMLModel(
        enrichedRecommendations,
        context
      );

      // Sort and return top recommendations
      return this.rankRecommendations(scoredRecommendations);
    } catch (error) {
      console.error('Error getting smart recommendations:', error);
      throw new AppError('Failed to get smart recommendations', 500);
    }
  }

  async getSocialRecommendations(userId: string) {
    try {
      // Get user's social connections
      const connections = await this.socialService.getUserConnections(userId);

      // Get recent orders from connections
      const socialOrders = await Order.find({
        user: { $in: connections.map(c => c.userId) },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      }).populate(['restaurant', 'items.menuItem']);

      // Analyze social patterns
      const recommendations = this.analyzeSocialPatterns(socialOrders);

      return recommendations;
    } catch (error) {
      console.error('Error getting social recommendations:', error);
      throw new AppError('Failed to get social recommendations', 500);
    }
  }

  async getTimeBasedRecommendations(
    userId: string,
    time: Date = new Date()
  ) {
    try {
      // Determine meal type based on time
      const mealType = this.getMealType(time);

      // Get user's preferences for this meal type
      const preferences = await this.getUserMealPreferences(userId, mealType);

      // Get appropriate restaurants and items
      const recommendations = await this.getTimeAppropriateItems(
        preferences,
        mealType,
        time
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting time-based recommendations:', error);
      throw new AppError('Failed to get time-based recommendations', 500);
    }
  }

  async getWeatherBasedRecommendations(
    userId: string,
    location: { lat: number; lon: number }
  ) {
    try {
      // Get current weather
      const weather = await this.weatherService.getCurrentWeather(location);

      // Get weather-appropriate recommendations
      const recommendations = await this.getWeatherAppropriateItems(
        userId,
        weather
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting weather-based recommendations:', error);
      throw new AppError('Failed to get weather-based recommendations', 500);
    }
  }

  async getEventBasedRecommendations(
    userId: string,
    date: Date = new Date()
  ) {
    try {
      // Get relevant events
      const events = await this.eventService.getEvents(date);

      // Get event-appropriate recommendations
      const recommendations = await this.getEventAppropriateItems(
        userId,
        events
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting event-based recommendations:', error);
      throw new AppError('Failed to get event-based recommendations', 500);
    }
  }

  async getDietaryProfileRecommendations(userId: string) {
    try {
      // Get user's dietary profile
      const user = await User.findById(userId).populate('dietaryProfile');

      if (!user || !user.dietaryProfile) {
        throw new AppError('User dietary profile not found', 404);
      }

      // Get matching recommendations
      const recommendations = await this.getDietaryMatchingItems(
        user.dietaryProfile
      );

      return recommendations;
    } catch (error) {
      console.error('Error getting dietary recommendations:', error);
      throw new AppError('Failed to get dietary recommendations', 500);
    }
  }

  private async initializeModel() {
    try {
      // Try to load model from cache
      const cachedModel = await redis.get(`${this.MODEL_CACHE_KEY}latest`);
      if (cachedModel) {
        this.model = await tf.loadLayersModel(tf.io.fromMemory(JSON.parse(cachedModel)));
        return;
      }

      // Create and train new model
      this.model = await this.createAndTrainModel();

      // Cache the model
      await redis.setex(
        `${this.MODEL_CACHE_KEY}latest`,
        this.CACHE_TTL,
        JSON.stringify(await this.model.save(tf.io.withSaveHandler(async modelArtifacts => modelArtifacts)))
      );
    } catch (error) {
      console.error('Error initializing ML model:', error);
    }
  }

  private async createAndTrainModel() {
    // Create a simple neural network for recommendation scoring
    const model = tf.sequential();
    
    model.add(tf.layers.dense({
      units: 64,
      activation: 'relu',
      inputShape: [12], // Input features
    }));
    
    model.add(tf.layers.dense({
      units: 32,
      activation: 'relu',
    }));
    
    model.add(tf.layers.dense({
      units: 1,
      activation: 'sigmoid',
    }));

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'binaryCrossentropy',
      metrics: ['accuracy'],
    });

    // Train the model (in production, this would use real historical data)
    const dummyData = this.generateDummyTrainingData();
    await model.fit(dummyData.inputs, dummyData.labels, {
      epochs: 10,
      batchSize: 32,
      validationSplit: 0.2,
    });

    return model;
  }

  private generateDummyTrainingData() {
    // In production, this would use real historical data
    const numSamples = 1000;
    const inputDim = 12;
    
    return {
      inputs: tf.randomNormal([numSamples, inputDim]),
      labels: tf.randomUniform([numSamples, 1]),
    };
  }

  private async getBaseRecommendations(context: RecommendationContext) {
    const user = await User.findById(context.userId)
      .populate('preferences')
      .populate('dietaryProfile');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get recommendations based on user preferences
    const baseRecommendations = await Restaurant.find({
      cuisine: { $in: user.preferences?.cuisines || [] },
      'dietaryOptions.types': { $all: user.dietaryProfile?.restrictions || [] },
    }).limit(20);

    return baseRecommendations;
  }

  private async enrichRecommendations(
    recommendations: any[],
    context: RecommendationContext
  ) {
    const enriched = [];

    for (const item of recommendations) {
      const enrichedItem = {
        ...item.toObject(),
        contextualFactors: {
          timeRelevance: await this.calculateTimeRelevance(item, context.time),
          weatherRelevance: await this.calculateWeatherRelevance(item, context.weather),
          socialRelevance: await this.calculateSocialRelevance(item, context.userId),
          seasonalRelevance: this.calculateSeasonalRelevance(item, context.time),
        },
      };

      enriched.push(enrichedItem);
    }

    return enriched;
  }

  private async applyMLModel(
    recommendations: any[],
    context: RecommendationContext
  ) {
    if (!this.model) {
      throw new AppError('ML model not initialized', 500);
    }

    const scores: RecommendationScore[] = [];

    for (const item of recommendations) {
      // Prepare input features
      const features = await this.prepareFeatures(item, context);
      
      // Get prediction from model
      const prediction = this.model.predict(features) as tf.Tensor;
      const score = (await prediction.data())[0];

      scores.push({
        itemId: item._id,
        score,
        factors: {
          userPreference: item.contextualFactors.userPreference || 0,
          timeContext: item.contextualFactors.timeRelevance || 0,
          weatherContext: item.contextualFactors.weatherRelevance || 0,
          socialContext: item.contextualFactors.socialRelevance || 0,
          seasonality: item.contextualFactors.seasonalRelevance || 0,
          popularity: item.popularity || 0,
        },
      });

      prediction.dispose();
    }

    return scores;
  }

  private async prepareFeatures(item: any, context: RecommendationContext) {
    // Convert item and context data into numerical features
    const features = [
      item.rating || 0,
      item.popularity || 0,
      item.price || 0,
      item.contextualFactors.timeRelevance || 0,
      item.contextualFactors.weatherRelevance || 0,
      item.contextualFactors.socialRelevance || 0,
      item.contextualFactors.seasonalRelevance || 0,
      context.time?.getHours() || 0,
      context.time?.getDay() || 0,
      context.weather?.temperature || 0,
      context.location?.lat || 0,
      context.location?.lon || 0,
    ];

    return tf.tensor2d([features], [1, features.length]);
  }

  private rankRecommendations(scores: RecommendationScore[]) {
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  private getMealType(time: Date) {
    const hour = time.getHours();
    
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 16) return 'lunch';
    if (hour >= 16 && hour < 22) return 'dinner';
    return 'lateNight';
  }

  private async getUserMealPreferences(userId: string, mealType: string) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Get user's historical orders for this meal type
    const orders = await Order.find({
      user: userId,
      'orderTime.mealType': mealType,
    }).populate(['restaurant', 'items.menuItem']);

    return this.analyzeMealPreferences(orders);
  }

  private analyzeMealPreferences(orders: any[]) {
    const preferences = {
      cuisines: new Map<string, number>(),
      categories: new Map<string, number>(),
      priceRange: {
        min: Infinity,
        max: -Infinity,
        avg: 0,
        count: 0,
      },
    };

    orders.forEach(order => {
      // Analyze cuisine preferences
      const cuisine = order.restaurant.cuisine;
      preferences.cuisines.set(
        cuisine,
        (preferences.cuisines.get(cuisine) || 0) + 1
      );

      // Analyze menu item preferences
      order.items.forEach((item: any) => {
        const category = item.menuItem.category;
        preferences.categories.set(
          category,
          (preferences.categories.get(category) || 0) + item.quantity
        );

        // Track price preferences
        const price = item.price;
        preferences.priceRange.min = Math.min(preferences.priceRange.min, price);
        preferences.priceRange.max = Math.max(preferences.priceRange.max, price);
        preferences.priceRange.avg += price;
        preferences.priceRange.count++;
      });
    });

    if (preferences.priceRange.count > 0) {
      preferences.priceRange.avg /= preferences.priceRange.count;
    }

    return preferences;
  }

  private async getTimeAppropriateItems(
    preferences: any,
    mealType: string,
    time: Date
  ) {
    // Get restaurants that are open at this time
    const restaurants = await Restaurant.find({
      'openingHours.day': time.getDay(),
      'openingHours.open': { $lte: time.toTimeString().slice(0, 5) },
      'openingHours.close': { $gte: time.toTimeString().slice(0, 5) },
      cuisine: {
        $in: Array.from(preferences.cuisines.keys()),
      },
    }).limit(20);

    return restaurants;
  }

  private async getWeatherAppropriateItems(
    userId: string,
    weather: any
  ) {
    // Define weather-food mappings
    const weatherMappings = {
      cold: ['soup', 'hotPot', 'curry', 'stew'],
      hot: ['salad', 'iceCream', 'coldNoodles', 'smoothie'],
      rainy: ['soup', 'comfort food', 'hot beverage'],
      sunny: ['grill', 'barbecue', 'fresh', 'light'],
    };

    const condition = this.categorizeWeather(weather);
    const appropriateCategories = weatherMappings[condition];

    // Get matching restaurants and items
    const restaurants = await Restaurant.find({
      'menu.category': { $in: appropriateCategories },
    }).limit(20);

    return restaurants;
  }

  private categorizeWeather(weather: any) {
    const temp = weather.temperature;
    if (temp < 15) return 'cold';
    if (temp > 25) return 'hot';
    if (weather.condition.includes('rain')) return 'rainy';
    return 'sunny';
  }

  private async getEventAppropriateItems(
    userId: string,
    events: any[]
  ) {
    // Define event-food mappings
    const eventMappings: { [key: string]: string[] } = {
      birthday: ['cake', 'party', 'celebration'],
      holiday: ['traditional', 'festive', 'special'],
      sports: ['snacks', 'finger food', 'group meals'],
      cultural: ['traditional', 'authentic', 'regional'],
    };

    const appropriateCategories = events.flatMap(
      event => eventMappings[event.type] || []
    );

    // Get matching restaurants and items
    const restaurants = await Restaurant.find({
      'menu.category': { $in: appropriateCategories },
    }).limit(20);

    return restaurants;
  }

  private async getDietaryMatchingItems(dietaryProfile: any) {
    // Get restaurants that match dietary restrictions
    const restaurants = await Restaurant.find({
      'dietaryOptions.types': { $all: dietaryProfile.restrictions },
      'allergens': { $nin: dietaryProfile.allergies },
    })
    .populate('menu')
    .limit(20);

    return restaurants;
  }

  private async calculateTimeRelevance(item: any, time?: Date) {
    if (!time) return 0.5;

    const hour = time.getHours();
    const itemPopularHours = item.popularHours || [];

    return itemPopularHours.includes(hour) ? 1 : 0.5;
  }

  private async calculateWeatherRelevance(item: any, weather?: any) {
    if (!weather) return 0.5;

    const temp = weather.temperature;
    const isHotFood = item.tags?.includes('hot');
    const isColdFood = item.tags?.includes('cold');

    if (temp > 25 && isColdFood) return 1;
    if (temp < 15 && isHotFood) return 1;
    return 0.5;
  }

  private async calculateSocialRelevance(item: any, userId: string) {
    const socialOrders = await this.socialService.getFriendsOrders(userId);
    const orderCount = socialOrders.filter(
      order => order.restaurant.toString() === item._id.toString()
    ).length;

    return Math.min(orderCount / 5, 1); // Normalize to 0-1
  }

  private calculateSeasonalRelevance(item: any, time?: Date) {
    if (!time) return 0.5;

    const month = time.getMonth();
    const season = Math.floor(month / 3) % 4; // 0:Winter, 1:Spring, 2:Summer, 3:Fall

    const seasonalTags = item.seasonalTags || [];
    const seasonMap = ['winter', 'spring', 'summer', 'fall'];

    return seasonalTags.includes(seasonMap[season]) ? 1 : 0.5;
  }

  private analyzeSocialPatterns(orders: any[]) {
    const patterns = {
      popularRestaurants: new Map<string, number>(),
      popularItems: new Map<string, number>(),
      popularTimes: new Map<number, number>(),
    };

    orders.forEach(order => {
      // Track restaurant popularity
      const restaurantId = order.restaurant._id.toString();
      patterns.popularRestaurants.set(
        restaurantId,
        (patterns.popularRestaurants.get(restaurantId) || 0) + 1
      );

      // Track item popularity
      order.items.forEach((item: any) => {
        const itemId = item.menuItem._id.toString();
        patterns.popularItems.set(
          itemId,
          (patterns.popularItems.get(itemId) || 0) + item.quantity
        );
      });

      // Track popular times
      const hour = new Date(order.createdAt).getHours();
      patterns.popularTimes.set(
        hour,
        (patterns.popularTimes.get(hour) || 0) + 1
      );
    });

    return patterns;
  }
}

export const smartRecommendationService = new SmartRecommendationService(
  new WeatherService(),
  new EventService(),
  new SocialService()
);
