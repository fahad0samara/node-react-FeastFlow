import { Order, OrderStatus, IOrder } from '../models/Order';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Menu } from '../models/Menu';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';
import { trackingService } from './tracking.service';
import { notificationService } from './notification.service';
import { 
  calculateDistance,
  estimateDeliveryTime,
  getTrafficMultiplier,
  findNearbyDrivers
} from '../utils/delivery';
import { generateOrderNumber } from '../utils/generators';
import { validateDeliveryRadius } from '../utils/validation';

interface CreateOrderInput {
  restaurantId: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: any[];
    specialInstructions?: string;
  }>;
  deliveryAddress: {
    coordinates: [number, number];
    address: string;
    instructions?: string;
  };
  paymentMethodId: string;
  isScheduled?: boolean;
  scheduledTime?: Date;
  groupOrder?: boolean;
  specialRequests?: string;
}

interface GroupOrderParticipant {
  user: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    customizations?: any[];
  }>;
  status: 'pending' | 'confirmed' | 'paid';
  totalAmount: number;
}

class OrderService {
  async createOrder(userId: string, data: CreateOrderInput): Promise<IOrder> {
    // Validate restaurant
    const restaurant = await Restaurant.findById(data.restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate restaurant is open
    if (!this.isRestaurantOpen(restaurant)) {
      throw new AppError('Restaurant is currently closed', 400);
    }

    // Validate delivery radius
    const isWithinRadius = validateDeliveryRadius(
      restaurant.location.coordinates,
      data.deliveryAddress.coordinates,
      restaurant.deliveryRadius
    );
    if (!isWithinRadius) {
      throw new AppError('Delivery address is outside restaurant\'s delivery radius', 400);
    }

    // Calculate distances and times
    const distance = calculateDistance(
      restaurant.location.coordinates,
      data.deliveryAddress.coordinates
    );

    const currentHour = new Date().getHours();
    const trafficMultiplier = getTrafficMultiplier(currentHour);
    const estimatedTime = estimateDeliveryTime(distance, trafficMultiplier);

    // Validate and process items
    const processedItems = await this.processOrderItems(data.items);
    
    // Calculate totals
    const { subtotal, tax, deliveryFee, total } = await this.calculateOrderTotals(
      processedItems,
      distance
    );

    // Create order
    const order = new Order({
      orderNumber: generateOrderNumber(),
      user: userId,
      restaurant: data.restaurantId,
      items: processedItems,
      subtotal,
      tax,
      deliveryFee,
      total,
      status: OrderStatus.PENDING,
      paymentMethod: data.paymentMethodId,
      deliveryLocation: {
        type: 'Point',
        coordinates: data.deliveryAddress.coordinates,
        address: data.deliveryAddress.address,
        instructions: data.deliveryAddress.instructions,
      },
      distance,
      estimatedDeliveryTime: estimatedTime,
      isGroupOrder: data.groupOrder || false,
      specialRequests: data.specialRequests,
      isScheduled: data.isScheduled || false,
      scheduledTime: data.scheduledTime,
    });

    if (data.groupOrder) {
      order.groupParticipants = [{
        user: userId,
        items: data.items,
        status: 'confirmed',
        totalAmount: total,
      }];
      order.groupOrderDeadline = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours deadline
    }

    await order.save();

    // Send notifications
    await this.sendOrderNotifications(order, 'created');

    // Emit real-time updates
    socketService.emitToRestaurant(data.restaurantId, 'newOrder', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      items: order.items,
      total: order.total,
    });

    return order;
  }

  async joinGroupOrder(
    orderId: string,
    userId: string,
    items: Array<{
      menuItemId: string;
      quantity: number;
      customizations?: any[];
    }>
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.isGroupOrder) {
      throw new AppError('This is not a group order', 400);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new AppError('This group order is no longer accepting participants', 400);
    }

    if (new Date() > order.groupOrderDeadline!) {
      throw new AppError('Group order deadline has passed', 400);
    }

    // Check if user already joined
    if (order.groupParticipants?.some(p => p.user.toString() === userId)) {
      throw new AppError('You have already joined this group order', 400);
    }

    // Process items and calculate total
    const processedItems = await this.processOrderItems(items);
    const { total } = await this.calculateOrderTotals(
      processedItems,
      order.distance
    );

    // Add participant
    const participant: GroupOrderParticipant = {
      user: userId,
      items,
      status: 'pending',
      totalAmount: total,
    };

    order.groupParticipants?.push(participant);
    await order.save();

    // Notify group order creator and other participants
    await this.sendGroupOrderNotifications(order, 'participant_joined', userId);

    return order;
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    location?: [number, number],
    note?: string
  ): Promise<IOrder> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    // Update status
    order.status = status;
    order.trackingHistory.push({
      status,
      timestamp: new Date(),
      location,
      note,
    });

    // Handle status-specific actions
    switch (status) {
      case OrderStatus.CONFIRMED:
        await this.handleOrderConfirmation(order);
        break;

      case OrderStatus.PREPARING:
        await this.findAndAssignDriver(order);
        break;

      case OrderStatus.OUT_FOR_DELIVERY:
        await this.startDeliveryTracking(order);
        break;

      case OrderStatus.DELIVERED:
        order.actualDeliveryTime = new Date();
        await this.handleOrderCompletion(order);
        break;

      case OrderStatus.CANCELLED:
        await this.handleOrderCancellation(order);
        break;
    }

    await order.save();

    // Send notifications
    await this.sendOrderNotifications(order, 'status_updated');

    // Emit real-time updates
    socketService.emitToOrder(orderId, 'statusUpdated', {
      status,
      timestamp: new Date(),
      note,
    });

    return order;
  }

  async getOrderDetails(orderId: string, userId: string): Promise<IOrder> {
    const order = await Order.findById(orderId)
      .populate('user', 'name phoneNumber')
      .populate('restaurant')
      .populate('items.menuItem')
      .populate('driver', 'name phoneNumber vehicle')
      .populate('groupParticipants.user', 'name');

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Check authorization
    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized to view this order', 403);
    }

    return order;
  }

  async getOrderHistory(
    userId: string,
    filters: {
      status?: OrderStatus;
      startDate?: string;
      endDate?: string;
      restaurant?: string;
    } = {}
  ): Promise<IOrder[]> {
    const query: any = { user: userId };

    if (filters.status) {
      query.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      query.createdAt = {};
      if (filters.startDate) {
        query.createdAt.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.createdAt.$lte = new Date(filters.endDate);
      }
    }

    if (filters.restaurant) {
      query.restaurant = filters.restaurant;
    }

    return Order.find(query)
      .sort({ createdAt: -1 })
      .populate('restaurant', 'name cuisine rating')
      .populate('items.menuItem', 'name price');
  }

  async reorder(orderId: string, userId: string): Promise<IOrder> {
    const originalOrder = await Order.findById(orderId)
      .populate('items.menuItem');
    
    if (!originalOrder) {
      throw new AppError('Order not found', 404);
    }

    if (originalOrder.user.toString() !== userId) {
      throw new AppError('Not authorized to reorder this order', 403);
    }

    // Create new order with same items
    return this.createOrder(userId, {
      restaurantId: originalOrder.restaurant.toString(),
      items: originalOrder.items.map(item => ({
        menuItemId: item.menuItem._id.toString(),
        quantity: item.quantity,
        customizations: item.customizations,
        specialInstructions: item.specialInstructions,
      })),
      deliveryAddress: {
        coordinates: originalOrder.deliveryLocation.coordinates,
        address: originalOrder.deliveryLocation.address,
        instructions: originalOrder.deliveryLocation.instructions,
      },
      paymentMethodId: originalOrder.paymentMethod,
      specialRequests: originalOrder.specialRequests,
    });
  }

  private async processOrderItems(items: any[]): Promise<any[]> {
    const processedItems = await Promise.all(
      items.map(async item => {
        const menuItem = await Menu.findById(item.menuItemId);
        if (!menuItem) {
          throw new AppError(`Menu item ${item.menuItemId} not found`, 404);
        }

        let itemPrice = menuItem.price;
        
        // Add customization prices
        if (item.customizations?.length) {
          itemPrice += item.customizations.reduce(
            (total: number, custom: any) => total + (custom.price || 0),
            0
          );
        }

        return {
          menuItem: item.menuItemId,
          quantity: item.quantity,
          basePrice: menuItem.price,
          customizations: item.customizations || [],
          specialInstructions: item.specialInstructions,
          totalPrice: itemPrice * item.quantity,
        };
      })
    );

    return processedItems;
  }

  private async calculateOrderTotals(
    items: any[],
    distance: number
  ): Promise<{
    subtotal: number;
    tax: number;
    deliveryFee: number;
    total: number;
  }> {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.1; // 10% tax
    const deliveryFee = this.calculateDeliveryFee(distance, subtotal);
    const total = subtotal + tax + deliveryFee;

    return { subtotal, tax, deliveryFee, total };
  }

  private calculateDeliveryFee(distance: number, subtotal: number): number {
    let fee = 5; // Base fee

    // Add distance-based fee
    if (distance > 5) {
      fee += (distance - 5) * 0.5; // $0.50 per km after first 5km
    }

    // Reduce fee for large orders
    if (subtotal > 100) {
      fee *= 0.8; // 20% discount on delivery fee
    }

    return Math.round(fee * 100) / 100; // Round to 2 decimal places
  }

  private async findAndAssignDriver(order: IOrder): Promise<void> {
    const nearbyDrivers = await findNearbyDrivers(
      order.restaurant.location.coordinates,
      5 // 5km radius
    );

    if (nearbyDrivers.length === 0) {
      throw new AppError('No drivers available at the moment', 500);
    }

    // Assign the closest driver
    const driver = nearbyDrivers[0];
    order.driver = driver._id;

    // Notify driver
    socketService.emitToDriver(driver._id, 'newDelivery', {
      orderId: order._id,
      pickup: order.restaurant.location,
      dropoff: order.deliveryLocation,
    });
  }

  private async startDeliveryTracking(order: IOrder): Promise<void> {
    if (!order.driver) {
      throw new AppError('No driver assigned to this order', 400);
    }

    // Start tracking driver location
    await trackingService.initializeTracking(
      order._id,
      order.driver,
      order.restaurant.location.coordinates,
      order.deliveryLocation.coordinates
    );
  }

  private async handleOrderCompletion(order: IOrder): Promise<void> {
    // Update user's order history
    await User.findByIdAndUpdate(order.user, {
      $push: {
        recentOrders: {
          order: order._id,
          restaurant: order.restaurant,
          items: order.items.map(item => ({
            menuItem: item.menuItem,
            quantity: item.quantity,
          })),
          timestamp: new Date(),
        },
      },
    });

    // Request rating after delay
    setTimeout(() => {
      socketService.emitToUser(order.user.toString(), 'requestRating', {
        orderId: order._id,
        restaurantId: order.restaurant,
      });
    }, 30 * 60 * 1000); // 30 minutes delay
  }

  private async handleOrderCancellation(order: IOrder): Promise<void> {
    // Release assigned driver if any
    if (order.driver) {
      socketService.emitToDriver(order.driver, 'orderCancelled', {
        orderId: order._id,
      });
    }

    // Process refund if payment was made
    if (order.paymentStatus === 'paid') {
      await this.processRefund(order);
    }
  }

  private async processRefund(order: IOrder): Promise<void> {
    try {
      // Implement refund logic here
      // This should integrate with your payment service
      
      order.refundStatus = 'processed';
      await order.save();

      // Notify user about refund
      await this.sendOrderNotifications(order, 'refund_processed');
    } catch (error) {
      console.error('Refund processing failed:', error);
      throw new AppError('Failed to process refund', 500);
    }
  }

  private async sendOrderNotifications(
    order: IOrder,
    type: 'created' | 'status_updated' | 'refund_processed'
  ): Promise<void> {
    const notifications = {
      created: {
        email: {
          template: 'orderConfirmation',
          data: {
            orderNumber: order.orderNumber,
            items: order.items,
            total: order.total,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
          },
        },
        push: {
          title: 'Order Confirmed',
          body: `Your order #${order.orderNumber} has been confirmed`,
        },
      },
      status_updated: {
        email: {
          template: 'orderStatusUpdate',
          data: {
            orderNumber: order.orderNumber,
            status: order.status,
            estimatedDeliveryTime: order.estimatedDeliveryTime,
          },
        },
        push: {
          title: 'Order Status Updated',
          body: `Your order #${order.orderNumber} is ${order.status}`,
        },
      },
      refund_processed: {
        email: {
          template: 'refundProcessed',
          data: {
            orderNumber: order.orderNumber,
            amount: order.total,
          },
        },
        push: {
          title: 'Refund Processed',
          body: `Refund for order #${order.orderNumber} has been processed`,
        },
      },
    };

    const notification = notifications[type];

    // Send email notification
    await emailService.sendOrderEmail(
      order.user.toString(),
      notification.email.template,
      notification.email.data
    );

    // Send push notification
    await notificationService.sendPushNotification(
      order.user.toString(),
      notification.push.title,
      notification.push.body
    );
  }

  private async sendGroupOrderNotifications(
    order: IOrder,
    type: 'participant_joined' | 'deadline_approaching' | 'order_finalized',
    userId?: string
  ): Promise<void> {
    const creator = await User.findById(order.user);
    const participant = userId ? await User.findById(userId) : null;

    switch (type) {
      case 'participant_joined':
        if (participant && creator) {
          socketService.emitToUser(creator._id, 'groupOrderUpdate', {
            type: 'participant_joined',
            orderId: order._id,
            participant: participant.name,
          });
        }
        break;

      case 'deadline_approaching':
        order.groupParticipants?.forEach(p => {
          socketService.emitToUser(p.user.toString(), 'groupOrderUpdate', {
            type: 'deadline_approaching',
            orderId: order._id,
            deadline: order.groupOrderDeadline,
          });
        });
        break;

      case 'order_finalized':
        order.groupParticipants?.forEach(p => {
          socketService.emitToUser(p.user.toString(), 'groupOrderUpdate', {
            type: 'order_finalized',
            orderId: order._id,
            total: p.totalAmount,
          });
        });
        break;
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus
  ): void {
    const validTransitions: { [key in OrderStatus]?: OrderStatus[] } = {
      [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.PREPARING]: [
        OrderStatus.READY_FOR_PICKUP,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.READY_FOR_PICKUP]: [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.CANCELLED,
      ],
      [OrderStatus.OUT_FOR_DELIVERY]: [
        OrderStatus.DELIVERED,
        OrderStatus.CANCELLED,
      ],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new AppError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }
  }

  private isRestaurantOpen(restaurant: any): boolean {
    const now = new Date();
    const day = now.getDay();
    const hours = now.getHours();
    const minutes = now.getMinutes();

    const todayHours = restaurant.operatingHours[day];
    if (!todayHours.isOpen) return false;

    const currentMinutes = hours * 60 + minutes;
    const openMinutes = todayHours.open.hours * 60 + todayHours.open.minutes;
    const closeMinutes = todayHours.close.hours * 60 + todayHours.close.minutes;

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }
}

export const orderService = new OrderService();
