import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models/User';
import { AppError } from './errorHandler';

declare global {
  namespace Express {
    interface Request {
      user?: any;
      userId?: string;
      userRole?: UserRole;
    }
  }
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Get token from header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Please log in to access this resource', 401));
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
    };

    // 3) Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // 4) Check if user is active
    if (!user.isActive) {
      return next(new AppError('User account is deactivated', 401));
    }

    // 5) Grant access
    req.user = user;
    req.userId = user._id;
    req.userRole = user.role;
    next();
  } catch (error) {
    next(new AppError('Invalid token', 401));
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }
    next();
  };
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      role: UserRole;
    };

    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = user;
      req.userId = user._id;
      req.userRole = user.role;
    }

    next();
  } catch (error) {
    next();
  }
};
