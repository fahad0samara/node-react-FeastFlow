import express, {Request, Response} from "express";
import {User} from "../Model/Auth";
import {Menu} from "../Model/Category";
import {Cart, CartItem} from "../Model/Cart";
import { Order } from "../Model/Orders";
const router = express.Router();
const stripe = require("stripe")(
  "sk_test_51L9ELNKirGI4xLuFFgSzzyzl0WGZNb1YQz0QgW11XAEzNfK2EanmnH09kNKrd7j7I6IS4H9dGZ7HnsL8Aow3D5OF00oInvXMYq"
);
router.post("/add", async (req, res) => {
  const {userId, itemId, quantity} = req.body;

  try {
    // Find user and menu item
    const user = await User.findById(userId);
    const menuItem = await Menu.findById(itemId);

    // Check if user and menu item exist
    if (!user || !menuItem) {
      return res.status(404).json({message: "User or menu item not found"});
    }

    // Find user's cart or create a new cart if it doesn't exist
    let cart = await Cart.findOne({user: user._id});
    if (!cart) {
      cart = new Cart({
        user: user._id,
        items: [],
      });
    }

    // Find index of item in cart
    const itemIndex = cart.items.findIndex(
      item => item.item.toString() === itemId.toString()
    );

    // If item already exists in cart, update its quantity
    if (itemIndex !== -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Otherwise, add a new item to the cart
      const cartItem = new CartItem({
        item: menuItem._id,
        quantity,
      });
      cart.items.push(cartItem);
    }

    // Save the cart to the database
    await cart.save();

    res.status(200).json({
      message: "Item added to cart",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server error"});
  }
});

/// delete all the cart
router.delete("/clear/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find user's cart
    const cart = await Cart.findOne({user: userId});

    if (!cart) {
      return res.status(404).json({message: "Cart not found"});
    }

    // Clear the cart by removing all items
    cart.items = [];

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Cart cleared",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server error"});
  }
});

router.get("/cart/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find user's cart
    const cart = await Cart.findOne({user: userId}).populate({
      path: "items.item",
      model: "Menu",
    });

    if (!cart) {
      return res.status(404).json({message: "Cart not found"});
    }

    res.status(200).json({
      message: "Cart retrieved successfully",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

router.put("/updateQuantity/:userId/:itemId", async (req, res) => {
  const {userId, itemId} = req.params;
  const {quantity} = req.body;

  try {
    // Find user and cart
    const user = await User.findById(userId);
    const cart = await Cart.findOne({user: userId});

    // Check if user and cart exist
    if (!user || !cart) {
      return res.status(404).json({message: "User or cart not found"});
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex(
      item => item.item.toString() === itemId
    );
    if (itemIndex === -1) {
      return res.status(404).json({message: "Item not found in cart"});
    }

    // Update the quantity of the item
    cart.items[itemIndex].quantity = quantity;

    // Save the updated cart
    await cart.save();

    res.status(200).json({
      message: "Item quantity updated in cart",
      cart,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server error"});
  }
});

// This route removes an item from the user's cart.
router.delete("/delete/:userId/:itemId", async (req, res) => {
  // Get the user ID and item ID from the request parameters.
  const {userId, itemId} = req.params;

  try {
    // Find the user's cart.
    console.log("userId:", userId);
    const cart = await Cart.findOne({user: userId});


    // If the cart does not exist, return an error.
    if (!cart) {
      return res.status(404).json({message: "Cart not found"});
    }

    // Find the item in the cart.
    const item = cart.items.find(item => item.item._id.toString() === itemId);
    console.log("item:", item);

    // If the item does not exist in the cart, return an error.
    if (!item) {
      return res.status(404).json({message: "Item not found in cart"});
    }

    // Remove the item from the cart.
    cart.items = cart.items.filter(
      cartItem => cartItem.item._id.toString() !== item.item._id.toString()
    );

    // Save the cart to the database.
    await cart.save();

    // Return a success message.
    res.status(200).json({
      message: "Item removed from cart",
      cart,
    });
  } catch (error) {
    // Return an error message.
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

// Endpoint to handle the Stripe payment
// Route to handle the payment process

// Route to handle the payment process

router.post("/checkout", async (req, res) => {
  const paymentInfo = req.body;

  try {
    // Create a payment intent with the Stripe API
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentInfo.totalAmount * 100, // The amount in cents (e.g., $10.00)
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: paymentInfo.userId,
        email: paymentInfo.email,
      },
    });

    // Save the order to the database
    const order = new Order({
      user: paymentInfo.userId,
      items: paymentInfo.items, // Assuming paymentInfo.items contains the menu item IDs for the order
      totalAmount: paymentInfo.totalAmount,
    });
    await order.save();

    // Send the client secret and order ID to the client-side for completing the payment
    res.json({
      clientSecret: paymentIntent.client_secret,
      orderId: order._id,
    });
  } catch (error:any) {
    res.status(500).json({
      message: "An error occurred while trying to process the payment",
      error: error.message
    });
  }
});
export default router;





