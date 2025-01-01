import express from 'express';
import { orderController } from '../controllers/OrderController';
import { protect, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { orderValidation } from '../validation/order.validation';
import { UserRole } from '../models/User';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Customer routes
router.post(
  '/',
  validate(orderValidation.createOrder),
  orderController.createOrder
);

router.post(
  '/group/:orderId/join',
  validate(orderValidation.joinGroupOrder),
  orderController.joinGroupOrder
);

router.get('/history', orderController.getOrderHistory);

router.get(
  '/:orderId',
  orderController.getOrderDetails
);

router.post(
  '/:orderId/reorder',
  orderController.reorder
);

router.post(
  '/:orderId/rate',
  validate(orderValidation.rateOrder),
  orderController.rateOrder
);

router.post(
  '/:orderId/cancel',
  validate(orderValidation.cancelOrder),
  orderController.cancelOrder
);

// Driver routes
router.patch(
  '/:orderId/location',
  authorize(UserRole.ADMIN),
  validate(orderValidation.updateDriverLocation),
  orderController.updateDriverLocation
);

// Admin/Restaurant routes
router.patch(
  '/:orderId/status',
  authorize(UserRole.ADMIN, UserRole.RESTAURANT_OWNER),
  validate(orderValidation.updateOrderStatus),
  orderController.updateOrderStatus
);

export default router;
