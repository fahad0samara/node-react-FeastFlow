import { OAuth2Client } from 'google-auth-library';
import bcrypt from 'bcryptjs';
import { User, UserRole, IOAuthProfile } from '../models/User';
import { emailService } from './email.service';
import { AppError } from '../middleware/errorHandler';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

class AuthService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly googleClient: OAuth2Client;

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-jwt-secret';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || 'your-jwt-refresh-secret';
    if (!process.env.GOOGLE_CLIENT_ID) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is required');
    }
    this.googleClient = new OAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    });
  }

  private generateTokens(userId: string, role: UserRole) {
    const accessToken = jwt.sign(
      { userId, role },
      this.jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    const refreshToken = jwt.sign(
      { userId, role },
      this.jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
  }) {
    try {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }

      // Create user
      const user = await User.create({
        ...userData,
        role: userData.role || UserRole.CUSTOMER, // Default to customer if no role provided
        isEmailVerified: false,
      });

      // Generate verification token
      const verificationToken = user.createEmailVerificationToken();
      await user.save();

      // Send welcome email
      await emailService.sendWelcomeEmail(user.email, user.name);

      // Generate tokens
      const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);
      
      user.refreshToken = refreshToken;
      await user.save();

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new AppError(
        error instanceof AppError ? error.message : 'Failed to register user',
        400
      );
    }
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 401);
    }

    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email first', 401);
    }

    const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);
    
    user.refreshToken = refreshToken;
    user.lastLogin = new Date();
    await user.save();

    return {
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(oldRefreshToken: string) {
    try {
      const decoded = jwt.verify(oldRefreshToken, this.jwtRefreshSecret) as {
        userId: string;
        role: UserRole;
      };

      const user = await User.findById(decoded.userId).select('+refreshToken');
      if (!user || user.refreshToken !== oldRefreshToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);
      
      user.refreshToken = refreshToken;
      await user.save();

      return { accessToken, refreshToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async verifyEmail(token: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return true;
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No user found with this email address', 404);
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    try {
      await emailService.sendPasswordReset(user.email, resetToken);
      return true;
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('Error sending password reset email', 500);
    }
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return true;
  }

  async googleLogin(token: string) {
    try {
      console.log('Starting Google login process with token:', token.substring(0, 10) + '...');
      
      // Verify token and get user info
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const { sub, email, name, picture } = userInfoResponse.data;
      if (!email) {
        console.error('No email in user info:', userInfoResponse.data);
        throw new AppError('Invalid token: no email found', 401);
      }

      console.log('Token verified, user info:', { sub, email, name });

      // Check if user exists
      console.log('Looking for existing user with email:', email);
      let user = await User.findOne({ email });

      const oauthProfile: IOAuthProfile = {
        provider: 'google',
        id: sub,
        email,
        name: name || email.split('@')[0],
        picture,
      };

      if (!user) {
        console.log('Creating new user for:', email);
        // Create new user
        user = await User.create({
          email,
          name: name || email.split('@')[0],
          password: await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10),
          role: UserRole.CUSTOMER,
          isEmailVerified: true,
          oauthProfiles: [oauthProfile],
        });
        console.log('New user created:', user._id);
      } else {
        console.log('Updating existing user:', user.email);
        // Update existing user's OAuth profile
        const existingProfile = user.oauthProfiles?.find(p => p.provider === 'google' && p.id === sub);
        if (!existingProfile) {
          console.log('Adding new Google profile to user');
          user.oauthProfiles = [
            ...(user.oauthProfiles || []),
            oauthProfile,
          ];
          await user.save();
        } else if (
          existingProfile.name !== name ||
          existingProfile.picture !== picture
        ) {
          console.log('Updating existing Google profile');
          Object.assign(existingProfile, {
            name,
            picture,
          });
          await user.save();
        }
      }

      const { accessToken, refreshToken } = this.generateTokens(user._id, user.role);
      
      user.refreshToken = refreshToken;
      user.lastLogin = new Date();
      await user.save();

      console.log('Successfully authenticated user:', user.email);
      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.oauthProfiles?.find(p => p.provider === 'google')?.picture,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Google login error:', error);
      if (error instanceof AppError) {
        throw error;
      }
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        throw new AppError('Invalid or expired Google token', 401);
      }
      throw new AppError('Failed to authenticate with Google', 500);
    }
  }

  async facebookLogin(accessToken: string) {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`
      );

      const { id, email, name } = response.data;
      if (!email) {
        throw new AppError('Email not provided by Facebook', 400);
      }

      let user = await User.findOne({ email });

      const oauthProfile = {
        provider: 'facebook' as const,
        id,
        email,
        name,
      };

      if (!user) {
        // Create new user
        user = await User.create({
          email,
          name,
          isEmailVerified: true,
          oauthProfiles: [oauthProfile],
        });
      } else {
        // Update existing user's OAuth profile
        const existingProfile = user.oauthProfiles?.find(p => p.provider === 'facebook' && p.id === id);
        if (!existingProfile) {
          user.oauthProfiles = [
            ...(user.oauthProfiles || []),
            oauthProfile,
          ];
          await user.save();
        } else if (existingProfile.name !== name) {
          // Update profile if name has changed
          Object.assign(existingProfile, {
            name,
          });
          await user.save();
        }
      }

      const tokens = this.generateTokens(user._id, user.role);
      
      user.refreshToken = tokens.refreshToken;
      user.lastLogin = new Date();
      await user.save();

      return {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.oauthProfiles?.find(p => p.provider === 'facebook')?.picture,
        },
        ...tokens,
      };
    } catch (error) {
      throw new AppError('Failed to authenticate with Facebook', 401);
    }
  }

  async logout(userId: string) {
    await User.findByIdAndUpdate(userId, {
      $unset: { refreshToken: 1 },
    });
    return true;
  }
}

export const authService = new AuthService();
