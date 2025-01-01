import { Refund, RefundStatus, RefundReason, IRefund } from '../models/Refund';
import { Order } from '../models/Order';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import { stripeService } from './stripe.service';
import { socketService } from './socket.service';

class RefundService {
  async createRefundRequest(
    userId: string,
    data: {
      orderId: string;
      reason: RefundReason;
      description: string;
      items?: Array<{
        orderItemId: string;
        quantity: number;
      }>;
      evidence?: string[];
    }
  ): Promise<IRefund> {
    const order = await Order.findById(data.orderId)
      .populate('items.orderItem');
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized to request refund for this order', 403);
    }

    // Calculate refund amount
    let refundAmount = 0;
    let isPartialRefund = false;

    if (data.items && data.items.length > 0) {
      isPartialRefund = true;
      data.items.forEach(item => {
        const orderItem = order.items.find(
          oi => oi._id.toString() === item.orderItemId
        );
        if (orderItem) {
          refundAmount += (orderItem.totalPrice / orderItem.quantity) * item.quantity;
        }
      });
    } else {
      refundAmount = order.total;
    }

    const refund = new Refund({
      order: order._id,
      user: userId,
      amount: refundAmount,
      reason: data.reason,
      description: data.description,
      evidence: data.evidence,
      paymentMethod: order.paymentMethod,
      isPartialRefund,
      items: data.items?.map(item => ({
        orderItem: item.orderItemId,
        quantity: item.quantity,
        amount: (order.items.find(oi => oi._id.toString() === item.orderItemId)?.totalPrice || 0) / 
                (order.items.find(oi => oi._id.toString() === item.orderItemId)?.quantity || 1) * 
                item.quantity,
      })),
    });

    await refund.save();

    // Send notifications
    await this.sendRefundRequestNotifications(refund);

    return refund;
  }

  async processRefund(
    refundId: string,
    adminId: string,
    data: {
      status: RefundStatus;
      adminNotes?: string;
    }
  ): Promise<IRefund> {
    const refund = await Refund.findById(refundId)
      .populate('order')
      .populate('user');
    
    if (!refund) {
      throw new AppError('Refund request not found', 404);
    }

    const admin = await User.findById(adminId);
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    if (data.status === RefundStatus.APPROVED) {
      try {
        // Process refund through payment gateway
        const refundTransaction = await stripeService.processRefund(
          refund.order.paymentIntentId,
          refund.amount,
          refund.reason
        );

        refund.refundTransactionId = refundTransaction.id;
        refund.status = RefundStatus.PROCESSED;
        refund.processedAt = new Date();
      } catch (error) {
        console.error('Refund processing failed:', error);
        throw new AppError('Failed to process refund', 500);
      }
    } else {
      refund.status = data.status;
    }

    refund.approvedBy = adminId;
    refund.adminNotes = data.adminNotes;
    await refund.save();

    // Send notifications
    await this.sendRefundStatusNotifications(refund);

    return refund;
  }

  async getRefundDetails(refundId: string, userId: string): Promise<IRefund> {
    const refund = await Refund.findById(refundId)
      .populate('order')
      .populate('user')
      .populate('approvedBy')
      .populate('items.orderItem');
    
    if (!refund) {
      throw new AppError('Refund request not found', 404);
    }

    if (refund.user.toString() !== userId) {
      throw new AppError('Not authorized to view this refund', 403);
    }

    return refund;
  }

  async getUserRefunds(userId: string): Promise<IRefund[]> {
    return Refund.find({ user: userId })
      .sort({ createdAt: -1 })
      .populate('order')
      .populate('items.orderItem');
  }

  private async sendRefundRequestNotifications(refund: IRefund): Promise<void> {
    // Send email to customer
    await emailService.sendRefundRequestConfirmation(
      refund.user.toString(),
      {
        refundId: refund._id,
        amount: refund.amount,
        reason: refund.reason,
      }
    );

    // Send notification to admin
    socketService.emitToAdmin('newRefundRequest', {
      refundId: refund._id,
      orderId: refund.order,
      amount: refund.amount,
      reason: refund.reason,
    });
  }

  private async sendRefundStatusNotifications(refund: IRefund): Promise<void> {
    // Send email to customer
    await emailService.sendRefundStatusUpdate(
      refund.user.toString(),
      {
        refundId: refund._id,
        status: refund.status,
        amount: refund.amount,
        processedAt: refund.processedAt,
      }
    );

    // Send real-time notification
    socketService.emitToUser(refund.user.toString(), 'refundStatusUpdated', {
      refundId: refund._id,
      status: refund.status,
    });
  }
}

export const refundService = new RefundService();
