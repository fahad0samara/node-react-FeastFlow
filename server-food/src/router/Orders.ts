import express, {Request, Response} from "express";
import {Order} from "../Model/Orders";
import {Cart} from "../Model/Cart";
import {Admin, User} from "../Model/Auth";
import {Category, Menu} from "../Model/Category";
const router = express.Router();
router.get("/orders", async (req, res) => {
  try {
    // Find all orders with populated user and item details
    const orders = await Order.find({})
      .populate({
        path: "user",
        model: "User",
        select: "firstName email",
      })
      .populate({
        path: "items",
        model: "Menu",
        select: "name price image",
      });

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

router.get("/orders/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    // Find orders for the specified user with populated user and item details
    const orders = await Order.find({user: userId})
      .populate({
        path: "user",
        model: "User",
        select: "firstName email",
      })
      .populate({
        path: "items",
        model: "Menu",
        select: "name price image",
      });

    res.status(200).json({
      message: "Orders retrieved successfully",
      orders: orders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});

//
router.get("/count", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    const CartCount = await Cart.countDocuments();
    const CategoryCount = await Category.countDocuments();
      const UserCount = await User.countDocuments();
      const AdminCount = await Admin.countDocuments()
      const MenuCount = await Menu.countDocuments();


      
      

    // In a real scenario, you would fetch the counts for the previous month from your database
    // For demonstration purposes, let's assume the previous month's counts are as follows:
      const prevOrderCount = 100;
      
    const prevCartCount = 80;
    const prevCategoryCount = 120;
      const prevUserCount = 200;
      
    const prevSalesCount = 400; // Hypothetical previous month's sales count
    const salesCount = 600; // Hypothetical current month's sales count
    const prevRevenueCount = 5000; // Hypothetical previous month's revenue count
    const revenueCount = 7500; // Hypothetical current month's revenue count
    const prevExpenseCount = 2000; // Hypothetical previous month's expense count
      const expenseCount = 2500; // Hypothetical current month's expense count


      

    const orderPercentageDiff =
      ((orderCount - prevOrderCount) / prevOrderCount) * 100;
    const cartPercentageDiff =
      ((CartCount - prevCartCount) / prevCartCount) * 100;
    const categoryPercentageDiff =
      ((CategoryCount - prevCategoryCount) / prevCategoryCount) * 100;
    const userPercentageDiff =
      ((UserCount - prevUserCount) / prevUserCount) * 100;
    const salesPercentageDiff =
      ((salesCount - prevSalesCount) / prevSalesCount) * 100;
    const revenuePercentageDiff =
      ((revenueCount - prevRevenueCount) / prevRevenueCount) * 100;
    const expensePercentageDiff =
          ((expenseCount - prevExpenseCount) / prevExpenseCount) * 100;
      
      

    res.status(200).json({
      message: "Counts retrieved successfully",
      orderCount: orderCount,
      CartCount: CartCount,
        UserCount: UserCount,
        AdminCount: AdminCount,

        MenuCount: MenuCount,
      CategoryCount: CategoryCount,
      SalesCount: salesCount,
      RevenueCount: revenueCount,
        ExpenseCount: expenseCount,
      
      orderPercentageDiff: orderPercentageDiff,
      cartPercentageDiff: cartPercentageDiff,
      categoryPercentageDiff: categoryPercentageDiff,
      userPercentageDiff: userPercentageDiff,
      salesPercentageDiff: salesPercentageDiff,
      revenuePercentageDiff: revenuePercentageDiff,
      expensePercentageDiff: expensePercentageDiff,
    });
  } catch (error) {
    console.error("Error getting counts:", error);
    res.status(500).json({error: "Internal server error"});
  }
});

router.get("/recent-orders", async (req, res) => {
  try {
    // Find the most recent orders with populated user and item details
    const recentOrders = await Order.find({})
      .sort({date: -1}) // Sort by date in descending order to get the most recent orders first
      .limit(10) // Fetch the 10 most recent orders (you can adjust this limit as per your requirement)
      .populate({
        path: "user",
        model: "User",
        select: "firstName email",
      })
      .populate({
        path: "items",
        model: "Menu",
        select: "name price image",
      });

    res.status(200).json({
      message: "Recent orders retrieved successfully",
      orders: recentOrders,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});



router.get("/most-ordered-items", async (req, res) => {
  try {
    const mostOrderedItems = await Order.aggregate([
      {
        $unwind: "$items", // Deconstruct the 'items' array
      },
      {
        $group: {
          _id: "$items",
          count: {$sum: 1}, // Count the occurrences of each item
        },
      },
      {
        $lookup: {
          from: "menus", // Assuming the 'Menu' model collection name is 'menus'
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails", // Store the matched 'Menu' document in 'itemDetails'
        },
      },
      {
        $unwind: "$itemDetails", // Deconstruct the 'itemDetails' array
      },
      {
        $project: {
          _id: 0,
          itemId: "$itemDetails._id",
          itemName: "$itemDetails.name",
          itemPrice: "$itemDetails.price",
          itemImage: "$itemDetails.image",
          totalOrders: "$count",
        },
      },
      {
        $sort: {totalOrders: -1}, // Sort by the totalOrders count in descending order
      },
      {
        $limit: 9, // Fetch the top 10 most ordered items (you can adjust this limit)
      },
    ]);

    res.status(200).json({
      message: "Most ordered items retrieved successfully",
      mostOrderedItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
      error,
    });
  }
});


// Add this function to your existing code

async function calculateTotalRevenue() {
  try {
    // Fetch all orders from the database
    const orders = await Order.find({});
    
    // Calculate the total revenue by summing up the 'totalAmount' of each order
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    
    return totalRevenue;
  } catch (error) {
    console.error("Error calculating total revenue:", error);
    throw error;
  }
}

router.get("/dashboard-analytics", async (req, res) => {
  try {
    const orderCount = await Order.countDocuments();
    const totalRevenue = await calculateTotalRevenue();
    const averageOrderValue = totalRevenue / orderCount;

    // Fetch most popular items from orders
    const mostOrderedItems = await Order.aggregate([
      {
        $unwind: "$items", // Deconstruct the 'items' array
      },
      {
        $group: {
          _id: "$items",
          count: {$sum: 1}, // Count the occurrences of each item
        },
      },
      {
        $lookup: {
          from: "menus", // Assuming the 'Menu' model collection name is 'menus'
          localField: "_id",
          foreignField: "_id",
          as: "itemDetails", // Store the matched 'Menu' document in 'itemDetails'
        },
      },
      {
        $unwind: "$itemDetails", // Deconstruct the 'itemDetails' array
      },
      {
        $project: {
          _id: 0,
          itemId: "$itemDetails._id",
          itemName: "$itemDetails.name",
          itemPrice: "$itemDetails.price",
          itemImage: "$itemDetails.image",
          totalOrders: "$count",
        },
      },
      {
        $sort: {totalOrders: -1}, // Sort by the totalOrders count in descending order
      },
      {
        $limit: 10, // Fetch the top 10 most ordered items (you can adjust this limit)
      },
    ]);

    res.status(200).json({
      orderCount,
      totalRevenue,
      averageOrderValue,
      mostOrderedItems,
      // Include other KPIs as needed...
    });
  } catch (error) {
    console.error("Error getting dashboard analytics:", error);
    res.status(500).json({error: "Internal server error"});
  }
});








export default router;
