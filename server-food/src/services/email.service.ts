import nodemailer from 'nodemailer';
import { AppError } from '../middleware/errorHandler';
import { OrderStatus } from '../models/Order';
import { IVehicle } from '../models/User';

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

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(options: {
    to: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<void> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Email sending failed:', error);
      throw new AppError('Failed to send email', 500);
    }
  }

  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    const subject = 'Welcome to Food Delivery App!';
    const html = `
      <h1>Welcome ${name}!</h1>
      <p>Thank you for joining our food delivery platform.</p>
      <p>We're excited to have you on board!</p>
      <p>Start exploring our delicious menu and place your first order.</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendEmailVerification(email: string, token: string): Promise<void> {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const subject = 'Verify Your Email';
    const html = `
      <h1>Email Verification</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>If you didn't create an account with us, please ignore this email.</p>
      <p>This link will expire in 24 hours.</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendOrderConfirmation(email: string, orderDetails: any): Promise<void> {
    const subject = 'Order Confirmation';
    const html = `
      <h1>Order Confirmed!</h1>
      <p>Your order #${orderDetails.orderId} has been confirmed.</p>
      <h2>Order Details:</h2>
      <ul>
        ${orderDetails.items.map((item: any) => `
          <li>${item.quantity}x ${item.name} - $${item.price}</li>
        `).join('')}
      </ul>
      <p>Total: $${orderDetails.total}</p>
      <p>Estimated delivery time: ${orderDetails.estimatedDeliveryTime}</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendOrderStatusUpdate(email: string, orderDetails: any): Promise<void> {
    const subject = `Order Status Update: ${orderDetails.status}`;
    const html = `
      <h1>Order Status Update</h1>
      <p>Your order #${orderDetails.orderId} status has been updated to: ${orderDetails.status}</p>
      <p>Current location: ${orderDetails.currentLocation || 'N/A'}</p>
      <p>Updated delivery time: ${orderDetails.estimatedDeliveryTime}</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendPasswordReset(email: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const subject = 'Password Reset Request';
    const html = `
      <h1>Password Reset Request</h1>
      <p>You requested to reset your password.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetUrl}">Reset Password</a>
      <p>If you didn't request this, please ignore this email.</p>
      <p>This link will expire in 1 hour.</p>
    `;

    await this.sendEmail({ to: email, subject, html });
  }

  async sendDeliveryUpdate(
    to: string,
    notification: DeliveryNotification
  ): Promise<void> {
    try {
      const { orderId, newEstimatedTime, status, reason } = notification;
      
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Delivery Update for Order #${orderId}`,
        html: `
          <h2>Delivery Update</h2>
          <p>Your order #${orderId} has been updated:</p>
          <ul>
            <li>New Estimated Delivery Time: ${newEstimatedTime.toLocaleString()}</li>
            <li>Current Status: ${status}</li>
            ${reason ? `<li>Reason: ${reason}</li>` : ''}
          </ul>
          <p>You can track your order in real-time on our website or mobile app.</p>
        `,
      });
    } catch (error) {
      throw new AppError('Failed to send delivery update email', 500);
    }
  }

  async sendDriverAssigned(
    to: string,
    notification: DriverAssignmentNotification
  ): Promise<void> {
    try {
      const { driverName, estimatedDeliveryTime, vehicleDetails } = notification;

      let vehicleInfo = '';
      if (vehicleDetails) {
        vehicleInfo = `
          <h3>Driver's Vehicle Information:</h3>
          <ul>
            <li>Vehicle Type: ${vehicleDetails.type}</li>
            <li>Model: ${vehicleDetails.model}</li>
            <li>Color: ${vehicleDetails.color}</li>
            <li>License Plate: ${vehicleDetails.licensePlate}</li>
          </ul>
        `;
      }

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: 'Driver Assigned to Your Order',
        html: `
          <h2>Driver Assigned</h2>
          <p>Good news! A driver has been assigned to your order:</p>
          <ul>
            <li>Driver Name: ${driverName}</li>
            <li>Estimated Delivery Time: ${estimatedDeliveryTime.toLocaleString()}</li>
          </ul>
          ${vehicleInfo}
          <p>You can track your delivery in real-time on our website or mobile app.</p>
        `,
      });
    } catch (error) {
      throw new AppError('Failed to send driver assignment email', 500);
    }
  }

  async sendOrderDelivered(
    to: string,
    notification: OrderDeliveredNotification
  ): Promise<void> {
    try {
      const { orderId, deliveryTime } = notification;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject: `Order #${orderId} Delivered`,
        html: `
          <h2>Order Delivered</h2>
          <p>Your order #${orderId} has been delivered!</p>
          <p>Delivery Time: ${deliveryTime.toLocaleString()}</p>
          <p>Thank you for using our service. We hope you enjoy your meal!</p>
          <p>Please rate your experience and provide feedback to help us improve.</p>
        `,
      });
    } catch (error) {
      throw new AppError('Failed to send order delivered email', 500);
    }
  }
}

export const emailService = new EmailService();
