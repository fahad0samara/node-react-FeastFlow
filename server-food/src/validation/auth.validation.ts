import Joi from 'joi';
import { UserRole } from '../models/User';

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      }),
    name: Joi.string().required(),
    role: Joi.string().valid(...Object.values(UserRole)),
    phoneNumber: Joi.string().pattern(/^\+?[\d\s-]+$/),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string(),
    }),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    password: Joi.string()
      .min(8)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
      .required()
      .messages({
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
      }),
  }),

  googleLogin: Joi.object({
    idToken: Joi.string().required(),
  }),

  facebookLogin: Joi.object({
    accessToken: Joi.string().required(),
  }),
};
