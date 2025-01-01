import express from "express";
const router = express.Router();
import bcrypt from "bcryptjs";
require("dotenv").config();
import jwt from "jsonwebtoken";
import {User, Admin} from "../Model/Auth";
import {userValidation, adminValidation, Loginadmin} from "../validate/schemas";
import { Cart } from "../Model/Cart";
import { OAuth2Client } from 'google-auth-library';
import fetch from 'node-fetch';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Route to handle user and admin registration requests
router.post("/register", async (req: any, res: any) => {
  try {
    const { firstName, email, password, role = "user" } = req.body;

    // Validate based on role
    const { error } = role === "admin" ? adminValidation(req.body) : userValidation(req.body);
    if (error) {
      return res.status(400).json({ 
        status: 'error',
        message: error.details[0].message 
      });
    }

    // Check if email exists in either collection
    const existingUser = await User.findOne({ email });
    const existingAdmin = await Admin.findOne({ email });
    
    if (existingUser || existingAdmin) {
      return res.status(400).json({ 
        status: 'error',
        message: "Email already exists" 
      });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user/admin
    const Model = role === "admin" ? Admin : User;
    const newUser = new Model({
      firstName,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    // Create cart for new user if it's not an admin
    if (role === "user") {
      const cart = new Cart({
        userId: newUser._id,
        items: []
      });
      await cart.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );

    res.status(201).json({
      status: 'success',
      data: {
        token,
        user: {
          id: newUser._id,
          firstName: newUser.firstName,
          email: newUser.email,
          role: newUser.role
        }
      }
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    res.status(500).json({
      status: 'error',
      message: "Registration failed. Please try again."
    });
  }
});

router.post("/login", async (req, res) => {
  // Validate the request body for login
  const {error} = Loginadmin(req.body);
  if (error) {
    return res.status(400).json({message: error.details[0].message});
  }

  const {email, password} = req.body;

  try {
    // Find the user or admin based on the email
    let user = await User.findOne({email});
    let isAdmin = false;

    // Check if the user exists
    if (!user) {
      // If user not found, check if admin exists
      user = await Admin.findOne({email});
      isAdmin = true;
    }

    // Check if the user or admin exists
    if (!user) {
      return res.status(407).json({
        message: `
        the email ${email}
        does not exist`,
      });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({message: "Invalid email or password"});
    }

    // Create a JWT token
    const role = isAdmin ? "admin" : "user";
    const token = jwt.sign({userId: user._id, role}, "your-secret-key", {
      expiresIn: "10d",
    });

    // Return the token to the client
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        firstName: user.firstName,

        email: user.email,
      },
      isAdmin,
    });
  } catch (err: any) {
    // Send an error response to the client
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

// Middleware to extract the token from the request headers
const extractToken = (req: any, res: any, next: any) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (token) {
    req.token = token;
  }
  next();
};

// Middleware to verify the token and attach the user to the request object
const verifyToken = (req: any, res: any, next: any) => {
  try {
    const verified = jwt.verify(req.token, "your-secret-key") as any;
    console.log(verified); // Log the verified object
    req.user = verified.userId; // Assign the userId directly
    next();
  } catch (err) {
    res.status(401).json({message: "Invalid token"});
  }
};
// Route handler to get user and admin info based on the token

router.get("/me", extractToken, verifyToken, async (req: any, res: any) => {
  try {
    // Find the user or admin based on the user id
    const user = await User.findById(req.user);
    const admin = await Admin.findById(req.user);
    if (user) {
      return res.status(200).json({
        user: {
          _id: user._id,
          firstName: user.firstName,

          email: user.email,
        },
        isAdmin: false,
      });
    } else if (admin) {
      return res.status(200).json({
        user: {
          _id: admin._id,

          firstName: admin.firstName,

          email: admin.email,
        },
        isAdmin: true,
      });
    } else {
      return res.status(404).json({message: "User not found"});
    }
  } catch (err: any) {
    // Send an error response to the client
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

//logout
router.post("/logout", extractToken, verifyToken, (req, res) => {
  const authHeader = req.headers.authorization;
  console.log(authHeader, "console.log(authHeader);");
  if (!authHeader) {
    return res.status(401).json({message: "Unauthorized"});
  }
  const token = authHeader.split(" ")[1];
  console.log(token);

  if (!token) {
    return res.status(401).json({message: "Unauthorized"});
  }
  res.status(200).json({message: "Logout successful"});
});

// Google login route
router.post("/google", async (req, res) => {
  try {
    const { token } = req.body;
    console.log('Received token:', token);

    if (!token) {
      return res.status(400).json({ 
        status: 'error',
        message: "No token provided" 
      });
    }

    // Fetch user info using the access token
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch user info:', response.statusText);
      return res.status(401).json({ 
        status: 'error',
        message: "Invalid token" 
      });
    }

    const payload = await response.json();
    console.log('User info:', payload);

    if (!payload || !payload.email) {
      return res.status(400).json({ 
        status: 'error',
        message: "Invalid user info received" 
      });
    }
    
    const { email, name, sub: googleId } = payload;
    
    // Check if user exists
    let user = await User.findOne({ $or: [{ email }, { googleId }] });
    console.log('Existing user:', user);
    
    if (!user) {
      console.log('Creating new user with:', { name, email, googleId });
      // Create new user if they don't exist
      user = new User({
        firstName: name,
        email,
        googleId,
        role: "user"
      });
      await user.save();
      console.log('New user created:', user);
      
      // Create cart for new user
      const cart = new Cart({
        userId: user._id,
        items: []
      });
      await cart.save();
      console.log('Cart created for user');
    } else if (!user.googleId) {
      // If user exists but doesn't have googleId, update it
      user.googleId = googleId;
      await user.save();
      console.log('Updated existing user with Google ID');
    }
    
    // Generate JWT token
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1d' }
    );
    
    console.log('Sending successful response');
    res.status(200).json({
      status: 'success',
      data: {
        token: jwtToken,
        user: {
          id: user._id,
          firstName: user.firstName,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ 
      status: 'error',
      message: "Failed to authenticate with Google" 
    });
  }
});

// PUT route to make a user an admin
router.put("/make-admin/:userId", async (req: any, res: any) => {
  try {
    const {userId} = req.params;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    const admin = new Admin({
      firstName: user.firstName,
      email: user.email,
      password: user.password,
   
      role: "admin",
    });
    await admin.save();

    await User.findByIdAndDelete(userId);

    res.status(200).json({message: "User is now an admin"});
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

// DELETE route to delete a user by ID
router.delete("/users/:userId", async (req, res) => {
  try {
    const {userId} = req.params;
    const user = await User.findByIdAndRemove(userId);

    if (!user) {
      return res.status(404).json({message: "User not found"});
    }

    // Delete the user's cart
    await Cart.findOneAndRemove({user: userId});

    // // Delete the user's orders
    // await Order.deleteMany({user: userId});

    res.status(200).json({message: "User deleted successfully"});
  } catch (error: any) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// DELETE route to delete an admin by ID
router.delete("/admins/:adminId", async (req, res) => {
  try {
    const {adminId} = req.params;
    const admin = await Admin.findByIdAndRemove(adminId);
    if (!admin) {
      return res.status(404).json({message: "Admin not found"});
    }
    res.status(200).json({message: "Admin deleted successfully"});
  } catch (error: any) {
    console.error("Error deleting admin:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

// GET route to get all users and admins
const ITEMS_PER_PAGE = 10; // Number of items per page

router.get("/users-admins", async (req, res) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1; // Type assertion to treat req.query.page as string
    const skip = (page - 1) * ITEMS_PER_PAGE; // Calculate the number of items to skip based on the requested page

    const usersCount = await User.countDocuments();
    const adminsCount = await Admin.countDocuments();

    const users = await User.find({}, "_id firstName email role created_at")
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const admins = await Admin.find({}, "_id firstName email role created_at")
      .skip(skip)
      .limit(ITEMS_PER_PAGE);

    const allUsers = [...users, ...admins];

    const totalPages = Math.ceil((usersCount + adminsCount) / ITEMS_PER_PAGE);

    res.status(200).json({
      users: allUsers,
      currentPage: page,
      totalPages: totalPages,
      itemPerPage: ITEMS_PER_PAGE,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

router.get("/recent-registrations", async (req: any, res: any) => {
  try {
    const limit = 10; // Define the maximum number of recent registrations to display

    // Find the most recent user and admin registrations and select specific fields
    const recentUsers = await User.find()
      .sort({timestamp: -1})
      .limit(limit)
      .select("role email firstName");
    const recentAdmins = await Admin.find()
      .sort({timestamp: -1})
      .limit(limit)
      .select("role email firstName");

    res.status(200).json({
      recentUsers,
      recentAdmins,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      message: "Internal server error",
      error: err.message,
    });
  }
});

export default router;
