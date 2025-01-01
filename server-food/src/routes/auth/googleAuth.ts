import express from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import User from '../../models/User';

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google', async (req, res) => {
  try {
    const { credential } = req.body;
    
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    
    const payload = ticket.getPayload();
    if (!payload) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const { email, name, picture } = payload;
    
    // Check if user exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        email,
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ')[1] || '',
        profilePicture: picture,
        isEmailVerified: true, // Google accounts are already verified
        password: Math.random().toString(36).slice(-8), // Random password for Google users
      });
      
      await user.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ message: 'Authentication failed' });
  }
});

export default router;
