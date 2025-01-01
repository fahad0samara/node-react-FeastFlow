import { Order } from '../models/Order';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { AppError } from '../middleware/errorHandler';

interface TimeRange {
  startDate: Date;
  endDate: Date;
}

interface AnalyticsMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  topRestaurants: any[];
  topDishes: any[];
  peakHours: any[];
  customerRetention: number;
}

interface RestaurantMetrics {
  totalOrders: number;
  revenue: number;
  averagePreparationTime: number;
  popularDishes: any[];
  customerRatings: number;
  peakHours: any[];
}

interface DriverMetrics {
  totalDeliveries: number;
  averageDeliveryTime: number;
  ratings: number;
  earnings: number;
  acceptanceRate: number;
}

class AnalyticsService {
  async getPlatformMetrics(timeRange: TimeRange): Promise<AnalyticsMetrics> {
    const { startDate, endDate } = timeRange;

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate('restaurant items.menuItem');

    const metrics: AnalyticsMetrics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      averageOrderValue: 0,
      topRestaurants: [],
      topDishes: [],
      peakHours: [],
      customerRetention: 0,
    };

    // Calculate average order value
    metrics.averageOrderValue = metrics.totalRevenue / metrics.totalOrders;

    // Get top restaurants
    const restaurantStats = new Map();
    orders.forEach(order => {
      const restaurantId = order.restaurant._id.toString();
      const current = restaurantStats.get(restaurantId) || { orders: 0, revenue: 0 };
      restaurantStats.set(restaurantId, {
        orders: current.orders + 1,
        revenue: current.revenue + order.total,
      });
    });

    metrics.topRestaurants = Array.from(restaurantStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Get top dishes
    const dishStats = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const dishId = item.menuItem._id.toString();
        const current = dishStats.get(dishId) || { quantity: 0, revenue: 0 };
        dishStats.set(dishId, {
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity),
        });
      });
    });

    metrics.topDishes = Array.from(dishStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Calculate peak hours
    const hourlyOrders = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyOrders[hour]++;
    });

    metrics.peakHours = hourlyOrders
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    // Calculate customer retention
    const uniqueCustomers = new Set(orders.map(order => order.user.toString()));
    const repeatCustomers = new Set();
    orders.forEach(order => {
      const userId = order.user.toString();
      if (repeatCustomers.has(userId)) return;
      
      const customerOrders = orders.filter(o => o.user.toString() === userId);
      if (customerOrders.length > 1) {
        repeatCustomers.add(userId);
      }
    });

    metrics.customerRetention = (repeatCustomers.size / uniqueCustomers.size) * 100;

    return metrics;
  }

  async getRestaurantMetrics(
    restaurantId: string,
    timeRange: TimeRange
  ): Promise<RestaurantMetrics> {
    const { startDate, endDate } = timeRange;

    const orders = await Order.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
    }).populate('items.menuItem');

    const metrics: RestaurantMetrics = {
      totalOrders: orders.length,
      revenue: orders.reduce((sum, order) => sum + order.total, 0),
      averagePreparationTime: 0,
      popularDishes: [],
      customerRatings: 0,
      peakHours: [],
    };

    // Calculate average preparation time
    const preparationTimes = orders
      .filter(order => order.preparationStartTime && order.preparationEndTime)
      .map(order => {
        const start = new Date(order.preparationStartTime!).getTime();
        const end = new Date(order.preparationEndTime!).getTime();
        return (end - start) / 1000 / 60; // Convert to minutes
      });

    metrics.averagePreparationTime = preparationTimes.length
      ? preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length
      : 0;

    // Get popular dishes
    const dishStats = new Map();
    orders.forEach(order => {
      order.items.forEach(item => {
        const dishId = item.menuItem._id.toString();
        const current = dishStats.get(dishId) || {
          name: item.menuItem.name,
          quantity: 0,
          revenue: 0,
        };
        dishStats.set(dishId, {
          name: item.menuItem.name,
          quantity: current.quantity + item.quantity,
          revenue: current.revenue + (item.price * item.quantity),
        });
      });
    });

    metrics.popularDishes = Array.from(dishStats.entries())
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Calculate average customer rating
    const ratings = await Rating.find({
      restaurant: restaurantId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    metrics.customerRatings = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;

    // Calculate peak hours
    const hourlyOrders = new Array(24).fill(0);
    orders.forEach(order => {
      const hour = new Date(order.createdAt).getHours();
      hourlyOrders[hour]++;
    });

    metrics.peakHours = hourlyOrders
      .map((count, hour) => ({ hour, count }))
      .sort((a, b) => b.count - a.count);

    return metrics;
  }

  async getDriverMetrics(
    driverId: string,
    timeRange: TimeRange
  ): Promise<DriverMetrics> {
    const { startDate, endDate } = timeRange;

    const orders = await Order.find({
      driver: driverId,
      status: 'delivered',
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const metrics: DriverMetrics = {
      totalDeliveries: orders.length,
      averageDeliveryTime: 0,
      ratings: 0,
      earnings: orders.reduce((sum, order) => sum + order.deliveryFee, 0),
      acceptanceRate: 0,
    };

    // Calculate average delivery time
    const deliveryTimes = orders
      .filter(order => order.pickupTime && order.deliveredTime)
      .map(order => {
        const start = new Date(order.pickupTime!).getTime();
        const end = new Date(order.deliveredTime!).getTime();
        return (end - start) / 1000 / 60; // Convert to minutes
      });

    metrics.averageDeliveryTime = deliveryTimes.length
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0;

    // Get driver ratings
    const ratings = await Rating.find({
      driver: driverId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    metrics.ratings = ratings.length
      ? ratings.reduce((sum, rating) => sum + rating.rating, 0) / ratings.length
      : 0;

    // Calculate acceptance rate
    const allAssignedOrders = await Order.find({
      assignedDriver: driverId,
      createdAt: { $gte: startDate, $lte: endDate },
    });

    metrics.acceptanceRate = allAssignedOrders.length
      ? (orders.length / allAssignedOrders.length) * 100
      : 0;

    return metrics;
  }

  async generateRevenueReport(timeRange: TimeRange) {
    const { startDate, endDate } = timeRange;

    const orders = await Order.find({
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'delivered',
    }).populate('restaurant');

    const report = {
      totalRevenue: orders.reduce((sum, order) => sum + order.total, 0),
      platformFees: orders.reduce((sum, order) => sum + order.platformFee, 0),
      deliveryFees: orders.reduce((sum, order) => sum + order.deliveryFee, 0),
      restaurantPayouts: orders.reduce((sum, order) => sum + order.restaurantPayout, 0),
      byRestaurant: new Map(),
      byDay: new Map(),
      byPaymentMethod: new Map(),
    };

    // Group by restaurant
    orders.forEach(order => {
      const restaurantId = order.restaurant._id.toString();
      const current = report.byRestaurant.get(restaurantId) || {
        name: order.restaurant.name,
        orders: 0,
        revenue: 0,
        payout: 0,
      };
      report.byRestaurant.set(restaurantId, {
        name: order.restaurant.name,
        orders: current.orders + 1,
        revenue: current.revenue + order.total,
        payout: current.payout + order.restaurantPayout,
      });
    });

    // Group by day
    orders.forEach(order => {
      const day = order.createdAt.toISOString().split('T')[0];
      const current = report.byDay.get(day) || {
        orders: 0,
        revenue: 0,
      };
      report.byDay.set(day, {
        orders: current.orders + 1,
        revenue: current.revenue + order.total,
      });
    });

    // Group by payment method
    orders.forEach(order => {
      const method = order.paymentMethod;
      const current = report.byPaymentMethod.get(method) || {
        orders: 0,
        revenue: 0,
      };
      report.byPaymentMethod.set(method, {
        orders: current.orders + 1,
        revenue: current.revenue + order.total,
      });
    });

    return {
      ...report,
      byRestaurant: Array.from(report.byRestaurant.entries()),
      byDay: Array.from(report.byDay.entries()),
      byPaymentMethod: Array.from(report.byPaymentMethod.entries()),
    };
  }
}

export const analyticsService = new AnalyticsService();
