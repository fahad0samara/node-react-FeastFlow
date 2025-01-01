export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  specialInstructions?: string;
  customizations?: Record<string, any>;
  price: number;
}

export interface SplitBillParticipant {
  id: string;
  name: string;
  email: string;
  items: OrderItem[];
  amount: number;
  status: 'pending' | 'paid';
  paymentMethod?: string;
}

export interface GroupOrder {
  id: string;
  organizerId: string;
  participants: {
    id: string;
    name: string;
    email: string;
    status: 'pending' | 'ordered' | 'paid';
    items: OrderItem[];
  }[];
  expiresAt: Date;
  status: 'open' | 'closed' | 'cancelled';
  totalAmount: number;
}

export interface ScheduledOrder {
  id: string;
  userId: string;
  scheduledFor: Date;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  items: OrderItem[];
  deliveryLocation: Location;
  specialInstructions?: string;
  status: 'scheduled' | 'processing' | 'cancelled';
}

export interface OrderStatus {
  id: string;
  status: 'placed' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';
  timestamp: Date;
  location?: Location;
  estimatedDeliveryTime?: Date;
  actualDeliveryTime?: Date;
  driverDetails?: {
    id: string;
    name: string;
    phone: string;
    vehicleInfo?: string;
    currentLocation?: Location;
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
  deliveryLocation: Location;
  billingDetails: {
    subtotal: number;
    tax: number;
    deliveryFee: number;
    discount?: number;
    total: number;
  };
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: string;
  specialInstructions?: string;
  isGroupOrder?: boolean;
  groupOrderId?: string;
  isScheduled?: boolean;
  scheduledOrderId?: string;
  splitBill?: {
    participants: SplitBillParticipant[];
    status: 'pending' | 'completed';
  };
}
