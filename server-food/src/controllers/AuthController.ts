import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../middleware/errorHandler';
import { UserRole } from '../models/User';

class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name, role } = req.body;
      
      const result = await authService.register({
        email,
        password,
        name,
        role: role as UserRole,
      });

      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      
      const result = await authService.refreshToken(refreshToken);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      
      await authService.verifyEmail(token);

      res.status(200).json({
        status: 'success',
        message: 'Email verified successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      
      await authService.forgotPassword(email);

      res.status(200).json({
        status: 'success',
        message: 'Password reset email sent successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      await authService.resetPassword(token, password);

      res.status(200).json({
        status: 'success',
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new AppError('No token provided', 400);
      }

      console.log('Received Google login request with token:', token.substring(0, 10) + '...');
      
      const result = await authService.googleLogin(token);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      console.error('Google login controller error:', error);
      next(error);
    }
  }

  async facebookLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = req.body;
      
      const result = await authService.facebookLogin(accessToken);

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.userId) {
        throw new AppError('Not authenticated', 401);
      }

      await authService.logout(req.userId);

      res.status(200).json({
        status: 'success',
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
