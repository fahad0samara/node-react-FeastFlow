import { Order, OrderStatus } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';
import { orderService } from './order.service';
import { scheduleJob, cancelJob } from 'node-schedule';

interface ScheduleConfig {
  frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  scheduledTime: Date;
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  daysOfMonth?: number[]; // 1-31
}

class ScheduledOrderService {
  private scheduledJobs: Map<string, any> = new Map();

  async scheduleOrder(
    userId: string,
    data: {
      restaurantId: string;
      items: Array<{
        menuItemId: string;
        quantity: number;
        customizations?: any[];
      }>;
      deliveryAddress: {
        coordinates: [number, number];
        address: string;
      };
      scheduleConfig: ScheduleConfig;
      paymentMethodId: string;
      specialInstructions?: string;
    }
  ): Promise<Order> {
    // Validate restaurant operating hours
    const restaurant = await Restaurant.findById(data.restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Validate schedule time against restaurant hours
    this.validateScheduleTime(data.scheduleConfig, restaurant.operatingHours);

    // Create initial scheduled order
    const order = await orderService.createOrder(userId, {
      ...data,
      isScheduled: true,
      scheduledTime: data.scheduleConfig.scheduledTime,
    });

    // Schedule the order
    await this.createScheduledJob(order._id, data.scheduleConfig);

    // Store schedule configuration
    order.scheduleConfig = data.scheduleConfig;
    await order.save();

    // Send confirmation
    await this.sendScheduleConfirmation(order);

    return order;
  }

  async updateSchedule(
    orderId: string,
    userId: string,
    newConfig: ScheduleConfig
  ): Promise<Order> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized to modify this order', 403);
    }

    // Validate new schedule
    const restaurant = await Restaurant.findById(order.restaurant);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    this.validateScheduleTime(newConfig, restaurant.operatingHours);

    // Cancel existing schedule
    if (this.scheduledJobs.has(orderId)) {
      cancelJob(this.scheduledJobs.get(orderId));
      this.scheduledJobs.delete(orderId);
    }

    // Create new schedule
    await this.createScheduledJob(orderId, newConfig);

    // Update order
    order.scheduleConfig = newConfig;
    order.scheduledTime = newConfig.scheduledTime;
    await order.save();

    // Send confirmation
    await this.sendScheduleUpdateConfirmation(order);

    return order;
  }

  async cancelSchedule(orderId: string, userId: string): Promise<void> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized to cancel this schedule', 403);
    }

    // Cancel scheduled job
    if (this.scheduledJobs.has(orderId)) {
      cancelJob(this.scheduledJobs.get(orderId));
      this.scheduledJobs.delete(orderId);
    }

    // Update order
    order.isScheduled = false;
    order.scheduleConfig = undefined;
    order.status = OrderStatus.CANCELLED;
    await order.save();

    // Send cancellation confirmation
    await this.sendScheduleCancellationConfirmation(order);
  }

  async getScheduledOrders(
    userId: string,
    options: {
      status?: OrderStatus;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<Order[]> {
    const query: any = {
      user: userId,
      isScheduled: true,
    };

    if (options.status) {
      query.status = options.status;
    }

    if (options.startDate || options.endDate) {
      query.scheduledTime = {};
      if (options.startDate) {
        query.scheduledTime.$gte = options.startDate;
      }
      if (options.endDate) {
        query.scheduledTime.$lte = options.endDate;
      }
    }

    return Order.find(query)
      .sort({ scheduledTime: 1 })
      .populate('restaurant')
      .populate('items.menuItem');
  }

  private async createScheduledJob(
    orderId: string,
    config: ScheduleConfig
  ): Promise<void> {
    let rule;

    switch (config.frequency) {
      case 'daily':
        rule = '0 * * * *'; // Every day at specified time
        break;
      case 'weekly':
        if (!config.daysOfWeek?.length) {
          throw new AppError('Days of week must be specified for weekly orders', 400);
        }
        rule = `0 * * * ${config.daysOfWeek.join(',')}`; // Specified days at specified time
        break;
      case 'monthly':
        if (!config.daysOfMonth?.length) {
          throw new AppError('Days of month must be specified for monthly orders', 400);
        }
        rule = `0 * ${config.daysOfMonth.join(',')} * *`; // Specified dates at specified time
        break;
      default: // 'once'
        rule = new Date(config.scheduledTime);
    }

    const job = scheduleJob(rule, async () => {
      try {
        const order = await Order.findById(orderId);
        if (!order) return;

        // Create new order instance for recurring orders
        if (config.frequency !== 'once') {
          await orderService.createOrder(order.user.toString(), {
            restaurantId: order.restaurant.toString(),
            items: order.items.map(item => ({
              menuItemId: item.menuItem.toString(),
              quantity: item.quantity,
              customizations: item.customizations,
            })),
            deliveryAddress: order.deliveryLocation,
            paymentMethodId: order.paymentMethod,
            specialInstructions: order.specialInstructions,
            scheduledTime: this.getNextScheduledTime(config),
          });
        }

        // Process the current order
        await orderService.processScheduledOrder(orderId);

        // Check if schedule should end
        if (config.endDate && new Date() >= new Date(config.endDate)) {
          cancelJob(job);
          this.scheduledJobs.delete(orderId);
          
          order.isScheduled = false;
          order.scheduleConfig = undefined;
          await order.save();
        }
      } catch (error) {
        console.error('Failed to process scheduled order:', error);
        // Notify admin and customer about the failure
        socketService.emitToAdmin('scheduledOrderError', {
          orderId,
          error: error.message,
        });
      }
    });

    this.scheduledJobs.set(orderId, job);
  }

  private validateScheduleTime(
    config: ScheduleConfig,
    operatingHours: any[]
  ): void {
    const scheduleTime = new Date(config.scheduledTime);
    const dayOfWeek = scheduleTime.getDay();
    const hours = scheduleTime.getHours();
    const minutes = scheduleTime.getMinutes();

    // Check if restaurant is open at scheduled time
    const dayHours = operatingHours[dayOfWeek];
    if (!dayHours.isOpen) {
      throw new AppError('Restaurant is closed on the scheduled day', 400);
    }

    const scheduleTimeMinutes = hours * 60 + minutes;
    const openTimeMinutes = dayHours.open.hours * 60 + dayHours.open.minutes;
    const closeTimeMinutes = dayHours.close.hours * 60 + dayHours.close.minutes;

    if (scheduleTimeMinutes < openTimeMinutes || scheduleTimeMinutes > closeTimeMinutes) {
      throw new AppError('Restaurant is closed at the scheduled time', 400);
    }

    // Validate schedule is in the future
    if (scheduleTime <= new Date()) {
      throw new AppError('Schedule time must be in the future', 400);
    }

    // Validate end date if provided
    if (config.endDate && new Date(config.endDate) <= scheduleTime) {
      throw new AppError('End date must be after schedule time', 400);
    }
  }

  private getNextScheduledTime(config: ScheduleConfig): Date {
    const now = new Date();
    const nextTime = new Date(config.scheduledTime);

    switch (config.frequency) {
      case 'daily':
        nextTime.setDate(now.getDate() + 1);
        break;
      case 'weekly':
        nextTime.setDate(now.getDate() + 7);
        break;
      case 'monthly':
        nextTime.setMonth(now.getMonth() + 1);
        break;
    }

    return nextTime;
  }

  private async sendScheduleConfirmation(order: Order): Promise<void> {
    // Send email confirmation
    await emailService.sendScheduledOrderConfirmation(order.user.toString(), {
      orderId: order._id,
      scheduledTime: order.scheduledTime,
      frequency: order.scheduleConfig?.frequency,
      restaurant: order.restaurant,
    });

    // Send real-time notification
    socketService.emitToUser(order.user.toString(), 'orderScheduled', {
      orderId: order._id,
      scheduledTime: order.scheduledTime,
      frequency: order.scheduleConfig?.frequency,
    });
  }

  private async sendScheduleUpdateConfirmation(order: Order): Promise<void> {
    await emailService.sendScheduleUpdateConfirmation(order.user.toString(), {
      orderId: order._id,
      newScheduledTime: order.scheduledTime,
      frequency: order.scheduleConfig?.frequency,
    });

    socketService.emitToUser(order.user.toString(), 'scheduleUpdated', {
      orderId: order._id,
      newScheduledTime: order.scheduledTime,
      frequency: order.scheduleConfig?.frequency,
    });
  }

  private async sendScheduleCancellationConfirmation(order: Order): Promise<void> {
    await emailService.sendScheduleCancellationConfirmation(order.user.toString(), {
      orderId: order._id,
    });

    socketService.emitToUser(order.user.toString(), 'scheduleCancelled', {
      orderId: order._id,
    });
  }
}

export const scheduledOrderService = new ScheduledOrderService();
