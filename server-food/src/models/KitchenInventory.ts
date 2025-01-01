import { Schema, model, Document } from 'mongoose';

interface InventoryItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  purchaseDate: Date;
  expiryDate: Date;
  storageLocation: string;
  minQuantity: number;
  cost: number;
  nutritionPer100g?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  supplier?: string;
  barcode?: string;
  notes?: string;
}

interface Equipment {
  name: string;
  category: string;
  condition: 'new' | 'good' | 'fair' | 'poor';
  purchaseDate: Date;
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  specifications?: {
    [key: string]: string | number;
  };
  manualUrl?: string;
  notes?: string;
}

interface StorageSpace {
  name: string;
  type: 'pantry' | 'refrigerator' | 'freezer' | 'cabinet';
  temperature?: number;
  humidity?: number;
  capacity: number;
  currentUsage: number;
  items: {
    itemId: Schema.Types.ObjectId;
    quantity: number;
    addedDate: Date;
  }[];
}

interface IKitchenInventory extends Document {
  user: Schema.Types.ObjectId;
  items: {
    item: InventoryItem;
    history: {
      date: Date;
      action: 'added' | 'removed' | 'expired' | 'updated';
      quantity: number;
      notes?: string;
    }[];
  }[];
  equipment: {
    item: Equipment;
    history: {
      date: Date;
      action: 'maintenance' | 'repair' | 'replaced';
      cost?: number;
      notes?: string;
    }[];
  }[];
  storage: StorageSpace[];
  shoppingList: {
    item: string;
    quantity: number;
    unit: string;
    priority: 'low' | 'medium' | 'high';
    addedDate: Date;
    estimatedCost?: number;
  }[];
  analytics: {
    totalValue: number;
    expiringItems: number;
    lowStockItems: number;
    maintenanceNeeded: number;
    spaceUtilization: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const kitchenInventorySchema = new Schema<IKitchenInventory>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [{
      item: {
        name: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        unit: {
          type: String,
          required: true,
        },
        purchaseDate: {
          type: Date,
          required: true,
        },
        expiryDate: {
          type: Date,
          required: true,
        },
        storageLocation: {
          type: String,
          required: true,
        },
        minQuantity: {
          type: Number,
          required: true,
          min: 0,
        },
        cost: {
          type: Number,
          required: true,
          min: 0,
        },
        nutritionPer100g: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
        },
        supplier: String,
        barcode: String,
        notes: String,
      },
      history: [{
        date: {
          type: Date,
          required: true,
        },
        action: {
          type: String,
          enum: ['added', 'removed', 'expired', 'updated'],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        notes: String,
      }],
    }],
    equipment: [{
      item: {
        name: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        condition: {
          type: String,
          enum: ['new', 'good', 'fair', 'poor'],
          required: true,
        },
        purchaseDate: {
          type: Date,
          required: true,
        },
        lastMaintenance: Date,
        nextMaintenance: Date,
        specifications: {
          type: Map,
          of: Schema.Types.Mixed,
        },
        manualUrl: String,
        notes: String,
      },
      history: [{
        date: {
          type: Date,
          required: true,
        },
        action: {
          type: String,
          enum: ['maintenance', 'repair', 'replaced'],
          required: true,
        },
        cost: Number,
        notes: String,
      }],
    }],
    storage: [{
      name: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ['pantry', 'refrigerator', 'freezer', 'cabinet'],
        required: true,
      },
      temperature: Number,
      humidity: Number,
      capacity: {
        type: Number,
        required: true,
        min: 0,
      },
      currentUsage: {
        type: Number,
        required: true,
        min: 0,
      },
      items: [{
        itemId: {
          type: Schema.Types.ObjectId,
          ref: 'InventoryItem',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 0,
        },
        addedDate: {
          type: Date,
          required: true,
        },
      }],
    }],
    shoppingList: [{
      item: {
        type: String,
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
        min: 0,
      },
      unit: {
        type: String,
        required: true,
      },
      priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        required: true,
      },
      addedDate: {
        type: Date,
        required: true,
      },
      estimatedCost: Number,
    }],
    analytics: {
      totalValue: {
        type: Number,
        required: true,
        default: 0,
      },
      expiringItems: {
        type: Number,
        required: true,
        default: 0,
      },
      lowStockItems: {
        type: Number,
        required: true,
        default: 0,
      },
      maintenanceNeeded: {
        type: Number,
        required: true,
        default: 0,
      },
      spaceUtilization: {
        type: Number,
        required: true,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
kitchenInventorySchema.index({ user: 1 });
kitchenInventorySchema.index({ 'items.item.name': 1 });
kitchenInventorySchema.index({ 'items.item.expiryDate': 1 });
kitchenInventorySchema.index({ 'equipment.item.nextMaintenance': 1 });

// Pre-save middleware to update analytics
kitchenInventorySchema.pre('save', function(next) {
  // Calculate total value
  this.analytics.totalValue = this.items.reduce(
    (total, item) => total + item.item.cost * item.item.quantity,
    0
  );

  // Count expiring items (within next 7 days)
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  this.analytics.expiringItems = this.items.filter(
    item => item.item.expiryDate <= sevenDaysFromNow
  ).length;

  // Count low stock items
  this.analytics.lowStockItems = this.items.filter(
    item => item.item.quantity <= item.item.minQuantity
  ).length;

  // Count equipment needing maintenance
  const today = new Date();
  this.analytics.maintenanceNeeded = this.equipment.filter(
    equip => equip.item.nextMaintenance && equip.item.nextMaintenance <= today
  ).length;

  // Calculate space utilization
  const totalCapacity = this.storage.reduce(
    (total, space) => total + space.capacity,
    0
  );
  const totalUsage = this.storage.reduce(
    (total, space) => total + space.currentUsage,
    0
  );
  this.analytics.spaceUtilization = totalCapacity > 0 ? (totalUsage / totalCapacity) * 100 : 0;

  next();
});

export const KitchenInventory = model<IKitchenInventory>('KitchenInventory', kitchenInventorySchema);
export { InventoryItem, Equipment, StorageSpace };
