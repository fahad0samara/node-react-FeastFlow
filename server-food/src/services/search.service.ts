import { Client } from '@elastic/elasticsearch';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { Category } from '../models/Category';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

const client = new Client({
  node: config.elasticsearch.url,
  auth: {
    username: config.elasticsearch.username,
    password: config.elasticsearch.password,
  },
});

interface SearchFilters {
  cuisine?: string[];
  priceRange?: {
    min?: number;
    max?: number;
  };
  rating?: number;
  dietary?: string[];
  location?: {
    lat: number;
    lon: number;
    radius: number; // in kilometers
  };
  openNow?: boolean;
  deliveryTime?: number; // maximum delivery time in minutes
  sort?: {
    field: 'rating' | 'deliveryTime' | 'distance' | 'price';
    order: 'asc' | 'desc';
  };
}

interface MenuSearchFilters {
  category?: string[];
  dietary?: string[];
  spicyLevel?: number;
  priceRange?: {
    min?: number;
    max?: number;
  };
  allergens?: string[];
  popular?: boolean;
}

class SearchService {
  async indexRestaurant(restaurant: any): Promise<void> {
    try {
      await client.index({
        index: 'restaurants',
        id: restaurant._id.toString(),
        document: {
          name: restaurant.name,
          description: restaurant.description,
          cuisine: restaurant.cuisine,
          location: {
            lat: restaurant.location.coordinates[1],
            lon: restaurant.location.coordinates[0],
          },
          rating: restaurant.rating,
          priceRange: restaurant.priceRange,
          openingHours: restaurant.openingHours,
          deliveryTime: restaurant.averageDeliveryTime,
          menu: restaurant.menu,
          dietary: restaurant.dietary,
          popular: restaurant.popular,
          featured: restaurant.featured,
          createdAt: restaurant.createdAt,
          updatedAt: restaurant.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error indexing restaurant:', error);
      throw new AppError('Failed to index restaurant', 500);
    }
  }

  async indexMenuItem(menuItem: any): Promise<void> {
    try {
      await client.index({
        index: 'menu_items',
        id: menuItem._id.toString(),
        document: {
          name: menuItem.name,
          description: menuItem.description,
          category: menuItem.category,
          price: menuItem.price,
          restaurantId: menuItem.restaurant.toString(),
          dietary: menuItem.dietary,
          spicyLevel: menuItem.spicyLevel,
          allergens: menuItem.allergens,
          ingredients: menuItem.ingredients,
          popular: menuItem.popular,
          featured: menuItem.featured,
          createdAt: menuItem.createdAt,
          updatedAt: menuItem.updatedAt,
        },
      });
    } catch (error) {
      console.error('Error indexing menu item:', error);
      throw new AppError('Failed to index menu item', 500);
    }
  }

  async searchRestaurants(
    query: string,
    filters: SearchFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const must: any[] = [];
      const filter: any[] = [];

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2', 'cuisine'],
            fuzziness: 'AUTO',
          },
        });
      }

      // Cuisine filter
      if (filters.cuisine?.length) {
        filter.push({
          terms: { cuisine: filters.cuisine },
        });
      }

      // Price range filter
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          filter.push({
            range: {
              'priceRange.min': { gte: filters.priceRange.min },
            },
          });
        }
        if (filters.priceRange.max !== undefined) {
          filter.push({
            range: {
              'priceRange.max': { lte: filters.priceRange.max },
            },
          });
        }
      }

      // Rating filter
      if (filters.rating) {
        filter.push({
          range: {
            rating: { gte: filters.rating },
          },
        });
      }

      // Dietary requirements filter
      if (filters.dietary?.length) {
        filter.push({
          terms: { dietary: filters.dietary },
        });
      }

      // Location filter
      if (filters.location) {
        filter.push({
          geo_distance: {
            distance: `${filters.location.radius}km`,
            location: {
              lat: filters.location.lat,
              lon: filters.location.lon,
            },
          },
        });
      }

      // Open now filter
      if (filters.openNow) {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const timeString = now.toTimeString().slice(0, 5);

        filter.push({
          nested: {
            path: 'openingHours',
            query: {
              bool: {
                must: [
                  { match: { 'openingHours.day': dayOfWeek } },
                  {
                    range: {
                      'openingHours.open': { lte: timeString },
                    },
                  },
                  {
                    range: {
                      'openingHours.close': { gte: timeString },
                    },
                  },
                ],
              },
            },
          },
        });
      }

      // Delivery time filter
      if (filters.deliveryTime) {
        filter.push({
          range: {
            deliveryTime: { lte: filters.deliveryTime },
          },
        });
      }

      // Build sort
      const sort: any[] = [];
      if (filters.sort) {
        switch (filters.sort.field) {
          case 'rating':
            sort.push({ rating: { order: filters.sort.order } });
            break;
          case 'deliveryTime':
            sort.push({ deliveryTime: { order: filters.sort.order } });
            break;
          case 'distance':
            if (filters.location) {
              sort.push({
                _geo_distance: {
                  location: {
                    lat: filters.location.lat,
                    lon: filters.location.lon,
                  },
                  order: filters.sort.order,
                  unit: 'km',
                },
              });
            }
            break;
          case 'price':
            sort.push({ 'priceRange.min': { order: filters.sort.order } });
            break;
        }
      }

      // Execute search
      const response = await client.search({
        index: 'restaurants',
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort,
          from: (page - 1) * limit,
          size: limit,
        },
      });

      // Format results
      const hits = response.hits.hits;
      const total = response.hits.total as any;

      return {
        restaurants: hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
          distance: hit.sort?.[0], // If sorted by distance
        })),
        pagination: {
          total: total.value,
          page,
          limit,
          pages: Math.ceil(total.value / limit),
        },
      };
    } catch (error) {
      console.error('Error searching restaurants:', error);
      throw new AppError('Failed to search restaurants', 500);
    }
  }

  async searchMenuItems(
    query: string,
    filters: MenuSearchFilters = {},
    restaurantId?: string,
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const must: any[] = [];
      const filter: any[] = [];

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['name^3', 'description^2', 'ingredients'],
            fuzziness: 'AUTO',
          },
        });
      }

      // Restaurant filter
      if (restaurantId) {
        filter.push({
          term: { restaurantId },
        });
      }

      // Category filter
      if (filters.category?.length) {
        filter.push({
          terms: { category: filters.category },
        });
      }

      // Dietary requirements filter
      if (filters.dietary?.length) {
        filter.push({
          terms: { dietary: filters.dietary },
        });
      }

      // Spicy level filter
      if (filters.spicyLevel !== undefined) {
        filter.push({
          range: {
            spicyLevel: { lte: filters.spicyLevel },
          },
        });
      }

      // Price range filter
      if (filters.priceRange) {
        if (filters.priceRange.min !== undefined) {
          filter.push({
            range: {
              price: { gte: filters.priceRange.min },
            },
          });
        }
        if (filters.priceRange.max !== undefined) {
          filter.push({
            range: {
              price: { lte: filters.priceRange.max },
            },
          });
        }
      }

      // Allergens filter
      if (filters.allergens?.length) {
        filter.push({
          bool: {
            must_not: {
              terms: { allergens: filters.allergens },
            },
          },
        });
      }

      // Popular items filter
      if (filters.popular) {
        filter.push({
          term: { popular: true },
        });
      }

      // Execute search
      const response = await client.search({
        index: 'menu_items',
        body: {
          query: {
            bool: {
              must,
              filter,
            },
          },
          sort: [
            { popular: { order: 'desc' } },
            { _score: { order: 'desc' } },
          ],
          from: (page - 1) * limit,
          size: limit,
        },
      });

      // Format results
      const hits = response.hits.hits;
      const total = response.hits.total as any;

      return {
        items: hits.map(hit => ({
          id: hit._id,
          ...hit._source,
          score: hit._score,
        })),
        pagination: {
          total: total.value,
          page,
          limit,
          pages: Math.ceil(total.value / limit),
        },
      };
    } catch (error) {
      console.error('Error searching menu items:', error);
      throw new AppError('Failed to search menu items', 500);
    }
  }

  async getRecommendations(
    userId: string,
    location?: { lat: number; lon: number }
  ) {
    try {
      // Get user preferences and order history
      const user = await User.findById(userId)
        .populate('preferences')
        .populate('orderHistory');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const must: any[] = [];
      const should: any[] = [];
      const filter: any[] = [];

      // Consider user's dietary preferences
      if (user.preferences?.dietary?.length) {
        filter.push({
          terms: { dietary: user.preferences.dietary },
        });
      }

      // Consider user's favorite cuisines
      if (user.preferences?.cuisines?.length) {
        should.push({
          terms: { cuisine: user.preferences.cuisines, boost: 2 },
        });
      }

      // Consider previously ordered restaurants
      const orderedRestaurants = user.orderHistory
        ?.map(order => order.restaurant.toString())
        .filter((v, i, a) => a.indexOf(v) === i);

      if (orderedRestaurants?.length) {
        should.push({
          terms: { _id: orderedRestaurants, boost: 1.5 },
        });
      }

      // Consider location if provided
      if (location) {
        filter.push({
          geo_distance: {
            distance: '10km',
            location: {
              lat: location.lat,
              lon: location.lon,
            },
          },
        });

        // Boost nearby restaurants
        should.push({
          function_score: {
            gauss: {
              location: {
                origin: { lat: location.lat, lon: location.lon },
                scale: '2km',
                offset: '0km',
                decay: 0.5,
              },
            },
          },
        });
      }

      // Execute search
      const response = await client.search({
        index: 'restaurants',
        body: {
          query: {
            bool: {
              must,
              should,
              filter,
              minimum_should_match: 1,
            },
          },
          sort: [
            { _score: { order: 'desc' } },
            { rating: { order: 'desc' } },
          ],
          size: 10,
        },
      });

      return response.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
        score: hit._score,
      }));
    } catch (error) {
      console.error('Error getting recommendations:', error);
      throw new AppError('Failed to get recommendations', 500);
    }
  }

  async reindexAll(): Promise<void> {
    try {
      // Reindex restaurants
      const restaurants = await Restaurant.find();
      for (const restaurant of restaurants) {
        await this.indexRestaurant(restaurant);
      }

      // Reindex menu items
      const menuItems = await MenuItem.find();
      for (const menuItem of menuItems) {
        await this.indexMenuItem(menuItem);
      }
    } catch (error) {
      console.error('Error reindexing data:', error);
      throw new AppError('Failed to reindex data', 500);
    }
  }
}

export const searchService = new SearchService();
