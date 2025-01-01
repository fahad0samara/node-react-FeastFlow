import axios from 'axios';
import { redis } from '../config/redis';
import { AppError } from '../middleware/errorHandler';
import { config } from '../config';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  forecast: {
    date: Date;
    temperature: {
      min: number;
      max: number;
    };
    condition: string;
  }[];
}

class WeatherService {
  private readonly CACHE_KEY = 'weather:';
  private readonly CACHE_TTL = 1800; // 30 minutes

  async getCurrentWeather(location: { lat: number; lon: number }): Promise<WeatherData> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}${location.lat}:${location.lon}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Fetch from OpenWeatherMap API
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: config.openWeatherMap.apiKey,
            units: 'metric',
          },
        }
      );

      const weatherData: WeatherData = {
        temperature: response.data.main.temp,
        condition: response.data.weather[0].main,
        humidity: response.data.main.humidity,
        windSpeed: response.data.wind.speed,
        precipitation: response.data.rain?.['1h'] || 0,
        forecast: [], // Will be populated with forecast data
      };

      // Get forecast data
      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast`,
        {
          params: {
            lat: location.lat,
            lon: location.lon,
            appid: config.openWeatherMap.apiKey,
            units: 'metric',
          },
        }
      );

      // Process forecast data
      weatherData.forecast = forecastResponse.data.list
        .filter((_: any, index: number) => index % 8 === 0) // Get one forecast per day
        .map((item: any) => ({
          date: new Date(item.dt * 1000),
          temperature: {
            min: item.main.temp_min,
            max: item.main.temp_max,
          },
          condition: item.weather[0].main,
        }));

      // Cache the weather data
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(weatherData));

      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      throw new AppError('Failed to fetch weather data', 500);
    }
  }

  getFoodRecommendations(weather: WeatherData) {
    const recommendations = {
      categories: [] as string[],
      characteristics: [] as string[],
      avoid: [] as string[],
    };

    // Temperature-based recommendations
    if (weather.temperature < 10) {
      recommendations.categories.push('soup', 'hotPot', 'stew');
      recommendations.characteristics.push('hot', 'warming', 'hearty');
      recommendations.avoid.push('ice cream', 'cold drinks');
    } else if (weather.temperature > 25) {
      recommendations.categories.push('salad', 'cold noodles', 'ice cream');
      recommendations.characteristics.push('cold', 'refreshing', 'light');
      recommendations.avoid.push('hot soup', 'heavy meals');
    }

    // Condition-based recommendations
    switch (weather.condition.toLowerCase()) {
      case 'rain':
        recommendations.categories.push('comfort food', 'soup', 'hot beverages');
        recommendations.characteristics.push('warming', 'comforting');
        break;
      case 'snow':
        recommendations.categories.push('hot pot', 'stew', 'hot chocolate');
        recommendations.characteristics.push('warming', 'hearty');
        break;
      case 'clear':
        recommendations.categories.push('grilled', 'barbecue', 'outdoor food');
        recommendations.characteristics.push('fresh', 'light');
        break;
      case 'clouds':
        recommendations.categories.push('comfort food', 'baked goods');
        recommendations.characteristics.push('satisfying', 'warming');
        break;
    }

    // Humidity-based recommendations
    if (weather.humidity > 70) {
      recommendations.characteristics.push('light', 'refreshing');
      recommendations.avoid.push('heavy meals', 'fried foods');
    }

    return recommendations;
  }

  async shouldDeliverInCurrentWeather(location: { lat: number; lon: number }): Promise<boolean> {
    const weather = await this.getCurrentWeather(location);

    // Define weather conditions that are unsafe for delivery
    const unsafeConditions = [
      'thunderstorm',
      'tornado',
      'hurricane',
      'blizzard',
    ];

    // Check if current weather is unsafe
    if (unsafeConditions.includes(weather.condition.toLowerCase())) {
      return false;
    }

    // Check wind speed (e.g., above 50 km/h is unsafe)
    if (weather.windSpeed > 13.89) { // 13.89 m/s = 50 km/h
      return false;
    }

    // Check heavy precipitation (e.g., above 7.6mm/h is heavy rain)
    if (weather.precipitation > 7.6) {
      return false;
    }

    return true;
  }

  getDeliveryTimeAdjustment(weather: WeatherData): number {
    let additionalMinutes = 0;

    // Adjust for rain
    if (weather.condition.toLowerCase() === 'rain') {
      if (weather.precipitation < 2.5) {
        additionalMinutes += 5; // Light rain
      } else if (weather.precipitation < 7.6) {
        additionalMinutes += 10; // Moderate rain
      } else {
        additionalMinutes += 15; // Heavy rain
      }
    }

    // Adjust for snow
    if (weather.condition.toLowerCase() === 'snow') {
      additionalMinutes += 20;
    }

    // Adjust for wind
    if (weather.windSpeed > 8.33) { // > 30 km/h
      additionalMinutes += 5;
    }

    // Adjust for extreme temperatures
    if (weather.temperature < 0 || weather.temperature > 35) {
      additionalMinutes += 5;
    }

    return additionalMinutes;
  }
}

export { WeatherService, WeatherData };
