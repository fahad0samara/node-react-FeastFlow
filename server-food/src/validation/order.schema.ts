import { z } from 'zod';
import { OrderStatus, PaymentStatus } from '../types/order';

const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

const addressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  country: z.string().min(1),
  postalCode: z.string().min(1),
  location: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()]),
  }),
});

const orderItemSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().positive(),
  customizations: z
    .array(
      z.object({
        option: z.string().min(1),
        choice: z.string().min(1),
      })
    )
    .optional(),
  specialInstructions: z.string().optional(),
});

export const createOrderSchema = z.object({
  body: z.object({
    restaurantId: z.string().min(1),
    items: z.array(orderItemSchema).min(1),
    deliveryAddress: addressSchema,
    deliveryInstructions: z.string().optional(),
    paymentMethodId: z.string().min(1),
    tip: z.number().min(0).optional(),
    promoCode: z.string().optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
    note: z.string().optional(),
    location: coordinatesSchema.optional(),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.string().transform(Number).optional(),
    limit: z.string().transform(Number).optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(1),
  }),
});

export const rateOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    foodRating: z.number().min(1).max(5),
    deliveryRating: z.number().min(1).max(5),
    comment: z.string().optional(),
  }),
});

export const refundOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1),
  }),
  body: z.object({
    amount: z.number().positive(),
    reason: z.string().min(1),
  }),
});
