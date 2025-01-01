import { Order, OrderStatus, IOrder } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { User, IUser, IVehicle } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';
import {
  calculateDistance,
  estimateDeliveryTime,
  getTrafficMultiplier,
  calculateOptimalRoute,
  Route,
  Coordinates,
  GeoJSONPoint,
  coordinatesToGeoJSON,
  geoJSONToCoordinates,
} from '../utils/delivery';
import { Types } from 'mongoose';

interface ITrackingHistory {
  status: OrderStatus;
  timestamp: Date;
  location: GeoJSONPoint;
  note?: string;
}

interface TrackingUpdate {
  location: GeoJSONPoint;
  estimatedDeliveryTime: Date;
  status: OrderStatus;
}

interface DriverAssignment {
  driverId: string;
  driverName: string;
  estimatedDeliveryTime: Date;
  route: Route;
  vehicleDetails?: IVehicle;
}

interface DeliveryNotification {
  orderId: string;
  newEstimatedTime: Date;
  status: OrderStatus;
  reason?: string;
}

interface DriverAssignmentNotification {
  driverName: string;
  estimatedDeliveryTime: Date;
  vehicleDetails?: IVehicle;
}

interface OrderDeliveredNotification {
  orderId: string;
  deliveryTime: Date;
}

interface OrderTracking {
  status: OrderStatus;
  trackingHistory: ITrackingHistory[];
  estimatedDeliveryTime: Date;
  actualDeliveryTime?: Date;
  driver?: IUser;
  currentLocation?: GeoJSONPoint;
  route?: Route;
  lastUpdated: Date;
}

class TrackingService {
  private readonly SIGNIFICANT_TIME_CHANGE = 5 * 60 * 1000; // 5 minutes in milliseconds

  async updateDriverLocation(
    orderId: string,
    driverId: string,
    coordinates: Coordinates
  ): Promise<void> {
    const order = await Order.findById(orderId).populate('driver').populate('user');
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.driver || order.driver._id.toString() !== driverId) {
      throw new AppError('Not authorized to update this order location', 403);
    }

    if (!order.deliveryLocation?.coordinates) {
      throw new AppError('Delivery location not set', 400);
    }

    // Calculate new estimated delivery time based on current location
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (!restaurant.address?.location?.coordinates) {
      throw new AppError('Restaurant location not set', 400);
    }

    const deliveryLocation: Coordinates = {
      latitude: order.deliveryLocation.coordinates[1],
      longitude: order.deliveryLocation.coordinates[0],
    };

    const restaurantLocation: Coordinates = {
      latitude: restaurant.address.location.coordinates[1],
      longitude: restaurant.address.location.coordinates[0],
    };

    const distance = calculateDistance(
      coordinates,
      deliveryLocation
    );

    const currentHour = new Date().getHours();
    const trafficMultiplier = getTrafficMultiplier(currentHour);
    
    const newEstimatedDeliveryTime = estimateDeliveryTime(
      distance,
      trafficMultiplier
    );

    // Initialize estimatedDeliveryTime if not set
    order.estimatedDeliveryTime = newEstimatedDeliveryTime;

    // Create location object in GeoJSON format
    const location = coordinatesToGeoJSON(coordinates);

    // Update order tracking history
    const trackingEntry: ITrackingHistory = {
      status: order.status,
      timestamp: new Date(),
      location,
      note: 'Driver location updated',
    };
    
    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }
    order.trackingHistory.push(trackingEntry);

    // Update estimated delivery time if significantly different
    const timeDifference = Math.abs(
      newEstimatedDeliveryTime.getTime() - order.estimatedDeliveryTime.getTime()
    );
    
    if (timeDifference > this.SIGNIFICANT_TIME_CHANGE) {
      order.estimatedDeliveryTime = newEstimatedDeliveryTime;
      await this.notifyDeliveryTimeUpdate(order);
    }

    // Calculate new optimal route
    const newRoute = calculateOptimalRoute(
      coordinates,
      restaurantLocation,
      deliveryLocation
    );

    order.route = newRoute;
    order.lastUpdated = new Date();
    await order.save();

    // Emit real-time location update
    const update: TrackingUpdate = {
      location,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      status: order.status,
    };
    socketService.emitToOrder(orderId, 'locationUpdate', update);
  }

  async assignDriver(
    orderId: string,
    driverId: string
  ): Promise<void> {
    const order = await Order.findById(orderId).populate('user');
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.deliveryLocation?.coordinates) {
      throw new AppError('Delivery location not set', 400);
    }

    const driver = await User.findById(driverId);
    if (!driver) {
      throw new AppError('Driver not found', 404);
    }

    if (!driver.currentLocation) {
      throw new AppError('Driver location not available', 400);
    }

    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    if (!restaurant.address?.location?.coordinates) {
      throw new AppError('Restaurant location not set', 400);
    }

    const deliveryLocation: Coordinates = {
      latitude: order.deliveryLocation.coordinates[1],
      longitude: order.deliveryLocation.coordinates[0],
    };

    const restaurantLocation: Coordinates = {
      latitude: restaurant.address.location.coordinates[1],
      longitude: restaurant.address.location.coordinates[0],
    };

    const driverLocation: Coordinates = geoJSONToCoordinates(driver.currentLocation);

    // Calculate initial route and estimated delivery time
    const route = calculateOptimalRoute(
      driverLocation,
      restaurantLocation,
      deliveryLocation
    );

    // Create location object in GeoJSON format
    const location = driver.currentLocation;

    // Update order
    order.driver = driver._id;
    order.status = OrderStatus.OUT_FOR_DELIVERY;
    order.estimatedDeliveryTime = route.estimatedDeliveryTime || new Date();
    order.route = route;
    order.lastUpdated = new Date();

    if (!order.trackingHistory) {
      order.trackingHistory = [];
    }

    order.trackingHistory.push({
      status: OrderStatus.OUT_FOR_DELIVERY,
      timestamp: new Date(),
      location,
      note: `Driver ${driver.name} assigned to order`,
    });

    await order.save();

    // Notify customer about driver assignment
    await this.notifyDriverAssigned(order, driver);

    // Emit real-time update
    const assignment: DriverAssignment = {
      driverId: driver._id.toString(),
      driverName: driver.name,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      route,
      vehicleDetails: driver.vehicle,
    };
    socketService.emitToOrder(orderId, 'driverAssigned', assignment);
  }

  private async notifyDeliveryTimeUpdate(order: IOrder & { user: IUser }): Promise<void> {
    if (!order.estimatedDeliveryTime) {
      throw new AppError('Estimated delivery time not set', 400);
    }

    const notification: DeliveryNotification = {
      orderId: order._id.toString(),
      newEstimatedTime: order.estimatedDeliveryTime,
      status: order.status,
      reason: 'Updated based on current traffic and driver location',
    };

    // Send email notification
    await emailService.sendDeliveryUpdate(
      order.user.email,
      notification
    );

    // Send real-time notification
    socketService.emitToUser(
      order.user._id.toString(),
      'deliveryTimeUpdate',
      notification
    );
  }

  private async notifyDriverAssigned(order: IOrder & { user: IUser }, driver: IUser): Promise<void> {
    if (!order.estimatedDeliveryTime) {
      throw new AppError('Estimated delivery time not set', 400);
    }

    const notification: DriverAssignmentNotification = {
      driverName: driver.name,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      vehicleDetails: driver.vehicle,
    };

    await emailService.sendDriverAssigned(
      order.user.email,
      notification
    );
  }

  async getOrderTracking(orderId: string): Promise<OrderTracking> {
    const order = await Order.findById(orderId)
      .populate<{ driver: IUser }>('driver', 'name phoneNumber currentLocation vehicle')
      .populate<{ user: IUser }>('user', 'email');
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.estimatedDeliveryTime) {
      throw new AppError('Estimated delivery time not set', 400);
    }

    let currentLocation: GeoJSONPoint | undefined;
    if (order.trackingHistory && order.trackingHistory.length > 0) {
      currentLocation = order.trackingHistory[order.trackingHistory.length - 1].location;
    }

    return {
      status: order.status,
      trackingHistory: order.trackingHistory,
      estimatedDeliveryTime: order.estimatedDeliveryTime,
      actualDeliveryTime: order.actualDeliveryTime,
      driver: order.driver,
      currentLocation,
      route: order.route,
      lastUpdated: order.lastUpdated || new Date(),
    };
  }
}

export const trackingService = new TrackingService();
