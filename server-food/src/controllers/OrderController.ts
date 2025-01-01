import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus } from '../models/Order';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.userId!, req.body);
      
      res.status(201).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async joinGroupOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { items } = req.body;
      
      const order = await orderService.joinGroupOrder(orderId, req.userId!, items);
      
      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const order = await Order.findById(orderId)
        .populate('user')
        .populate('restaurant')
        .populate('items.menuItem')
        .populate('driver')
        .populate('groupParticipants.user');

      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.user.toString() !== req.userId && req.userRole !== 'admin') {
        throw new AppError('Not authorized to view this order', 403);
      }

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { status, location, note } = req.body;

      if (!Object.values(OrderStatus).includes(status)) {
        throw new AppError('Invalid order status', 400);
      }

      const order = await orderService.updateOrderStatus(
        orderId,
        status,
        location,
        note
      );

      res.status(200).json({
        status: 'success',
        data: order,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateDriverLocation(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { location } = req.body;

      await orderService.updateDriverLocation(orderId, location);

      res.status(200).json({
        status: 'success',
        message: 'Driver location updated',
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: req.query.status as OrderStatus,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      const orders = await orderService.getOrderHistory(req.userId!, filters);

      res.status(200).json({
        status: 'success',
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  }

  async reorder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      
      const newOrder = await orderService.reorder(orderId, req.userId!);

      res.status(201).json({
        status: 'success',
        data: newOrder,
      });
    } catch (error) {
      next(error);
    }
  }

  async rateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { foodRating, deliveryRating, comment } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.user.toString() !== req.userId) {
        throw new AppError('Not authorized to rate this order', 403);
      }

      order.ratings = {
        food: foodRating,
        delivery: deliveryRating,
        comment,
      };

      await order.save();

      res.status(200).json({
        status: 'success',
        message: 'Order rated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CONFIRMED) {
        throw new AppError('Order cannot be cancelled at this stage', 400);
      }

      order.status = OrderStatus.CANCELLED;
      order.trackingHistory.push({
        status: OrderStatus.CANCELLED,
        timestamp: new Date(),
        note: reason,
      });

      await order.save();

      // Send notifications
      await orderService.sendStatusUpdateNotifications(order);

      res.status(200).json({
        status: 'success',
        message: 'Order cancelled successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
