import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// Create a limiter for general API endpoints
export const apiLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a stricter limiter for authentication endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 5 requests per windowMs
  message: 'Too many login attempts from this IP, please try again after an hour.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a limiter for user-specific actions
export const userActionLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30, // Limit each IP to 30 requests per windowMs
  message: 'Too many actions performed, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
