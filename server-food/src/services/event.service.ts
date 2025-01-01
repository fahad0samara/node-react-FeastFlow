import axios from 'axios';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

interface Event {
  id: string;
  name: string;
  type: 'holiday' | 'sports' | 'cultural' | 'local';
  date: Date;
  description: string;
  location?: {
    lat: number;
    lon: number;
    address: string;
  };
  foodAssociations: {
    categories: string[];
    dishes: string[];
    ingredients: string[];
  };
}

class EventService {
  private readonly CACHE_KEY = 'events:';
  private readonly CACHE_TTL = 86400; // 24 hours

  private readonly holidayFoodMap = new Map([
    ['Christmas', {
      categories: ['traditional', 'festive'],
      dishes: ['turkey', 'ham', 'pudding'],
      ingredients: ['cranberry', 'cinnamon', 'nutmeg'],
    }],
    ['New Year', {
      categories: ['celebration', 'traditional'],
      dishes: ['dumplings', 'noodles', 'cake'],
      ingredients: ['seafood', 'meat', 'vegetables'],
    }],
    ['Thanksgiving', {
      categories: ['traditional', 'family'],
      dishes: ['turkey', 'stuffing', 'pie'],
      ingredients: ['pumpkin', 'cranberry', 'potato'],
    }],
    // Add more holiday mappings
  ]);

  async getEvents(date: Date): Promise<Event[]> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}${date.toISOString().split('T')[0]}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Combine events from different sources
      const [holidays, sportsEvents, culturalEvents, localEvents] = await Promise.all([
        this.getHolidays(date),
        this.getSportsEvents(date),
        this.getCulturalEvents(date),
        this.getLocalEvents(date),
      ]);

      const events = [
        ...holidays,
        ...sportsEvents,
        ...culturalEvents,
        ...localEvents,
      ];

      // Cache the events
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(events));

      return events;
    } catch (error) {
      console.error('Error fetching events:', error);
      throw new AppError('Failed to fetch events', 500);
    }
  }

  async getEventFoodRecommendations(event: Event) {
    try {
      let recommendations = {
        categories: [] as string[],
        dishes: [] as string[],
        ingredients: [] as string[],
      };

      switch (event.type) {
        case 'holiday':
          recommendations = await this.getHolidayFoodRecommendations(event);
          break;
        case 'sports':
          recommendations = this.getSportsFoodRecommendations(event);
          break;
        case 'cultural':
          recommendations = await this.getCulturalFoodRecommendations(event);
          break;
        case 'local':
          recommendations = await this.getLocalEventFoodRecommendations(event);
          break;
      }

      return recommendations;
    } catch (error) {
      console.error('Error getting event food recommendations:', error);
      throw new AppError('Failed to get event food recommendations', 500);
    }
  }

  private async getHolidays(date: Date): Promise<Event[]> {
    try {
      // Use a holiday API (e.g., Nager.Date, Abstract API, etc.)
      const response = await axios.get(
        `https://holidays.abstractapi.com/v1/`,
        {
          params: {
            api_key: config.abstractApi.apiKey,
            country: 'US', // Configurable
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        }
      );

      return response.data.map((holiday: any) => ({
        id: `holiday-${holiday.name}`,
        name: holiday.name,
        type: 'holiday',
        date: new Date(holiday.date),
        description: holiday.description || '',
        foodAssociations: this.holidayFoodMap.get(holiday.name) || {
          categories: ['traditional'],
          dishes: [],
          ingredients: [],
        },
      }));
    } catch (error) {
      console.error('Error fetching holidays:', error);
      return [];
    }
  }

  private async getSportsEvents(date: Date): Promise<Event[]> {
    try {
      // Use a sports API (e.g., SportRadar, ESPN API, etc.)
      const response = await axios.get(
        `https://api.sportradar.com/events`,
        {
          params: {
            api_key: config.sportRadar.apiKey,
            date: date.toISOString().split('T')[0],
          },
        }
      );

      return response.data.map((event: any) => ({
        id: `sports-${event.id}`,
        name: event.name,
        type: 'sports',
        date: new Date(event.start_time),
        description: event.description,
        location: event.venue ? {
          lat: event.venue.latitude,
          lon: event.venue.longitude,
          address: event.venue.address,
        } : undefined,
        foodAssociations: {
          categories: ['snacks', 'finger food', 'group meals'],
          dishes: ['wings', 'pizza', 'nachos'],
          ingredients: ['cheese', 'meat', 'chips'],
        },
      }));
    } catch (error) {
      console.error('Error fetching sports events:', error);
      return [];
    }
  }

  private async getCulturalEvents(date: Date): Promise<Event[]> {
    // Implementation would depend on available cultural events APIs
    return [];
  }

  private async getLocalEvents(date: Date): Promise<Event[]> {
    try {
      // Use a local events API (e.g., Eventbrite, Meetup, etc.)
      const response = await axios.get(
        `https://www.eventbriteapi.com/v3/events/search/`,
        {
          headers: {
            Authorization: `Bearer ${config.eventbrite.apiKey}`,
          },
          params: {
            start_date: date.toISOString(),
            end_date: new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString(),
          },
        }
      );

      return response.data.events.map((event: any) => ({
        id: `local-${event.id}`,
        name: event.name.text,
        type: 'local',
        date: new Date(event.start.utc),
        description: event.description.text,
        location: event.venue ? {
          lat: event.venue.latitude,
          lon: event.venue.longitude,
          address: event.venue.address.localized_address_display,
        } : undefined,
        foodAssociations: {
          categories: ['local', 'event'],
          dishes: [],
          ingredients: [],
        },
      }));
    } catch (error) {
      console.error('Error fetching local events:', error);
      return [];
    }
  }

  private async getHolidayFoodRecommendations(event: Event) {
    const holidayFoods = this.holidayFoodMap.get(event.name) || {
      categories: ['traditional'],
      dishes: [],
      ingredients: [],
    };

    return holidayFoods;
  }

  private getSportsFoodRecommendations(event: Event) {
    return {
      categories: ['snacks', 'finger food', 'group meals'],
      dishes: ['wings', 'pizza', 'nachos', 'burgers'],
      ingredients: ['cheese', 'meat', 'chips'],
    };
  }

  private async getCulturalFoodRecommendations(event: Event) {
    // Implementation would depend on the cultural event type
    return {
      categories: ['traditional', 'authentic'],
      dishes: [],
      ingredients: [],
    };
  }

  private async getLocalEventFoodRecommendations(event: Event) {
    // Implementation would depend on the local event type
    return {
      categories: ['local', 'casual'],
      dishes: [],
      ingredients: [],
    };
  }
}

export { EventService, Event };
