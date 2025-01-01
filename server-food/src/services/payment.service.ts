import { Order, OrderStatus, PaymentStatus } from '../models/Order';
import { User } from '../models/User';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';
import Stripe from 'stripe';
import { config } from '../config';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2023-10-16',
});

interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  details: any;
  isDefault: boolean;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

class PaymentService {
  async processOrderPayment(
    orderId: string,
    userId: string,
    paymentMethodId: string
  ): Promise<PaymentResult> {
    const order = await Order.findById(orderId)
      .populate('user')
      .populate('restaurant');
    
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user._id.toString() !== userId) {
      throw new AppError('Not authorized to process payment for this order', 403);
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new AppError('Order has already been paid', 400);
    }

    try {
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(order.total * 100), // Convert to cents
        currency: 'usd',
        payment_method: paymentMethodId,
        customer: order.user.stripeCustomerId,
        metadata: {
          orderId: order._id.toString(),
          restaurantId: order.restaurant._id.toString(),
        },
        application_fee_amount: Math.round(order.total * 0.1 * 100), // 10% platform fee
        transfer_data: {
          destination: order.restaurant.stripeAccountId,
        },
      });

      // Confirm payment
      await stripe.paymentIntents.confirm(paymentIntent.id);

      // Update order status
      order.paymentStatus = PaymentStatus.PAID;
      order.paymentIntentId = paymentIntent.id;
      order.status = OrderStatus.CONFIRMED;
      await order.save();

      // Send notifications
      await this.sendPaymentNotifications(order, 'success');

      return {
        success: true,
        transactionId: paymentIntent.id,
      };
    } catch (error) {
      console.error('Payment processing failed:', error);
      
      // Update order status
      order.paymentStatus = PaymentStatus.FAILED;
      await order.save();

      // Send notifications
      await this.sendPaymentNotifications(order, 'failed');

      return {
        success: false,
        error: error.message,
      };
    }
  }

  async addPaymentMethod(
    userId: string,
    paymentToken: string
  ): Promise<PaymentMethod> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    try {
      // Create or get Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: {
            userId: user._id.toString(),
          },
        });
        stripeCustomerId = customer.id;
        user.stripeCustomerId = stripeCustomerId;
        await user.save();
      }

      // Add payment method to Stripe
      const paymentMethod = await stripe.paymentMethods.attach(paymentToken, {
        customer: stripeCustomerId,
      });

      // Set as default if no other payment methods
      const isDefault = !user.paymentMethods?.length;
      if (isDefault) {
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethod.id,
          },
        });
      }

      // Add to user's payment methods
      const newPaymentMethod: PaymentMethod = {
        id: paymentMethod.id,
        type: paymentMethod.type as 'card' | 'wallet',
        details: paymentMethod[paymentMethod.type],
        isDefault,
      };

      user.paymentMethods = user.paymentMethods || [];
      user.paymentMethods.push(newPaymentMethod);
      await user.save();

      return newPaymentMethod;
    } catch (error) {
      console.error('Failed to add payment method:', error);
      throw new AppError('Failed to add payment method', 500);
    }
  }

  async removePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const paymentMethod = user.paymentMethods?.find(
      pm => pm.id === paymentMethodId
    );
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404);
    }

    try {
      // Detach from Stripe
      await stripe.paymentMethods.detach(paymentMethodId);

      // Remove from user's payment methods
      user.paymentMethods = user.paymentMethods?.filter(
        pm => pm.id !== paymentMethodId
      );

      // If removed method was default, set new default
      if (paymentMethod.isDefault && user.paymentMethods?.length) {
        user.paymentMethods[0].isDefault = true;
        await stripe.customers.update(user.stripeCustomerId!, {
          invoice_settings: {
            default_payment_method: user.paymentMethods[0].id,
          },
        });
      }

      await user.save();
    } catch (error) {
      console.error('Failed to remove payment method:', error);
      throw new AppError('Failed to remove payment method', 500);
    }
  }

  async setDefaultPaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const paymentMethod = user.paymentMethods?.find(
      pm => pm.id === paymentMethodId
    );
    if (!paymentMethod) {
      throw new AppError('Payment method not found', 404);
    }

    try {
      // Update in Stripe
      await stripe.customers.update(user.stripeCustomerId!, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Update in database
      user.paymentMethods = user.paymentMethods?.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId,
      }));

      await user.save();
    } catch (error) {
      console.error('Failed to set default payment method:', error);
      throw new AppError('Failed to set default payment method', 500);
    }
  }

  async processRefund(
    orderId: string,
    amount?: number,
    reason?: string
  ): Promise<PaymentResult> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!order.paymentIntentId) {
      throw new AppError('No payment found for this order', 400);
    }

    try {
      const refund = await stripe.refunds.create({
        payment_intent: order.paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
        reason: reason as Stripe.RefundCreateParams.Reason,
      });

      // Update order
      order.refundStatus = 'processed';
      order.refundAmount = amount || order.total;
      order.refundReason = reason;
      await order.save();

      // Send notifications
      await this.sendPaymentNotifications(order, 'refunded');

      return {
        success: true,
        transactionId: refund.id,
      };
    } catch (error) {
      console.error('Refund processing failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user.paymentMethods || [];
  }

  async handleStripeWebhook(
    event: Stripe.Event
  ): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await this.handleRefundProcessed(event.data.object as Stripe.Charge);
        break;

      // Add more webhook handlers as needed
    }
  }

  private async handlePaymentSuccess(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    if (!order) return;

    order.paymentStatus = PaymentStatus.PAID;
    order.status = OrderStatus.CONFIRMED;
    await order.save();

    await this.sendPaymentNotifications(order, 'success');
  }

  private async handlePaymentFailure(
    paymentIntent: Stripe.PaymentIntent
  ): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);
    if (!order) return;

    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    await this.sendPaymentNotifications(order, 'failed');
  }

  private async handleRefundProcessed(
    charge: Stripe.Charge
  ): Promise<void> {
    const paymentIntentId = charge.payment_intent as string;
    const order = await Order.findOne({ paymentIntentId });
    if (!order) return;

    order.refundStatus = 'processed';
    order.refundAmount = charge.amount_refunded / 100;
    await order.save();

    await this.sendPaymentNotifications(order, 'refunded');
  }

  private async sendPaymentNotifications(
    order: any,
    type: 'success' | 'failed' | 'refunded'
  ): Promise<void> {
    const notifications = {
      success: {
        email: {
          template: 'paymentSuccess',
          data: {
            orderNumber: order.orderNumber,
            amount: order.total,
            items: order.items,
          },
        },
        push: {
          title: 'Payment Successful',
          body: `Your payment for order #${order.orderNumber} was successful`,
        },
      },
      failed: {
        email: {
          template: 'paymentFailed',
          data: {
            orderNumber: order.orderNumber,
            amount: order.total,
          },
        },
        push: {
          title: 'Payment Failed',
          body: `Your payment for order #${order.orderNumber} failed`,
        },
      },
      refunded: {
        email: {
          template: 'paymentRefunded',
          data: {
            orderNumber: order.orderNumber,
            amount: order.refundAmount,
            reason: order.refundReason,
          },
        },
        push: {
          title: 'Payment Refunded',
          body: `Your payment for order #${order.orderNumber} has been refunded`,
        },
      },
    };

    const notification = notifications[type];

    // Send email notification
    await emailService.sendPaymentEmail(
      order.user.toString(),
      notification.email.template,
      notification.email.data
    );

    // Send push notification
    socketService.emitToUser(order.user.toString(), 'paymentUpdate', {
      type,
      orderId: order._id,
      orderNumber: order.orderNumber,
      ...notification.push,
    });
  }
}

export const paymentService = new PaymentService();
