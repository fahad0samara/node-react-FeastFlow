import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';

interface InventoryItem {
  id: string;
  restaurantId: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  reorderPoint: number;
  cost: number;
  supplier: string;
  expiryDate?: Date;
  location?: string;
}

interface StockMovement {
  id: string;
  inventoryItemId: string;
  type: 'received' | 'used' | 'waste' | 'return';
  quantity: number;
  date: Date;
  reference?: string;
  notes?: string;
}

interface Supplier {
  id: string;
  name: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  items: {
    itemId: string;
    price: number;
    minimumOrder: number;
    leadTime: number;
  }[];
  performance: {
    deliveryTime: number;
    qualityRating: number;
    responseTime: number;
  };
}

class InventoryService {
  async addInventoryItem(
    restaurantId: string,
    itemData: Partial<InventoryItem>
  ): Promise<InventoryItem> {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new AppError('Restaurant not found', 404);
    }

    // Create inventory item
    const item = await InventoryItem.create({
      ...itemData,
      restaurantId,
    });

    // Check if item needs to be reordered
    await this.checkReorderPoint(item);

    return item;
  }

  async updateStock(
    itemId: string,
    quantity: number,
    type: StockMovement['type'],
    reference?: string
  ): Promise<void> {
    const item = await InventoryItem.findById(itemId);
    if (!item) {
      throw new AppError('Inventory item not found', 404);
    }

    // Create stock movement record
    await StockMovement.create({
      inventoryItemId: itemId,
      type,
      quantity,
      date: new Date(),
      reference,
    });

    // Update item quantity
    const multiplier = type === 'received' ? 1 : -1;
    item.quantity += quantity * multiplier;
    await item.save();

    // Check if item needs to be reordered
    await this.checkReorderPoint(item);

    // Notify restaurant about stock update
    await this.notifyStockUpdate(item);
  }

  async checkReorderPoint(item: InventoryItem): Promise<void> {
    if (item.quantity <= item.reorderPoint) {
      // Get supplier information
      const supplier = await Supplier.findById(item.supplier);
      if (!supplier) return;

      // Create reorder notification
      await this.createReorderNotification(item, supplier);
    }
  }

  async trackItemUsage(menuItemId: string, quantity: number): Promise<void> {
    const menuItem = await MenuItem.findById(menuItemId)
      .populate('ingredients.item');
    if (!menuItem) {
      throw new AppError('Menu item not found', 404);
    }

    // Update stock for each ingredient
    for (const ingredient of menuItem.ingredients) {
      await this.updateStock(
        ingredient.item.id,
        ingredient.quantity * quantity,
        'used',
        `MenuItem:${menuItemId}`
      );
    }
  }

  async generateInventoryReport(
    restaurantId: string,
    startDate: Date,
    endDate: Date
  ) {
    const items = await InventoryItem.find({ restaurantId });
    const movements = await StockMovement.find({
      inventoryItemId: { $in: items.map(item => item.id) },
      date: { $gte: startDate, $lte: endDate },
    });

    const report = {
      totalItems: items.length,
      totalValue: items.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
      lowStock: items.filter(item => item.quantity <= item.reorderPoint),
      movements: this.aggregateMovements(movements),
      wastage: this.calculateWastage(movements),
      costAnalysis: this.analyzeCosts(items, movements),
    };

    return report;
  }

  async addSupplier(supplierData: Partial<Supplier>): Promise<Supplier> {
    // Validate supplier data
    if (!supplierData.name || !supplierData.contact) {
      throw new AppError('Missing required supplier fields', 400);
    }

    // Create supplier
    const supplier = await Supplier.create({
      ...supplierData,
      performance: {
        deliveryTime: 0,
        qualityRating: 0,
        responseTime: 0,
      },
    });

    return supplier;
  }

  async updateSupplierPerformance(
    supplierId: string,
    metrics: Partial<Supplier['performance']>
  ): Promise<void> {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new AppError('Supplier not found', 404);
    }

    // Update performance metrics
    Object.assign(supplier.performance, metrics);
    await supplier.save();
  }

  private async createReorderNotification(
    item: InventoryItem,
    supplier: Supplier
  ): Promise<void> {
    const restaurant = await Restaurant.findById(item.restaurantId);
    if (!restaurant) return;

    // Send email notification
    await emailService.sendInventoryAlert(
      restaurant.email,
      'Low Stock Alert',
      {
        itemName: item.name,
        currentStock: item.quantity,
        reorderPoint: item.reorderPoint,
        supplier: supplier.name,
        supplierContact: supplier.contact,
      }
    );

    // Send real-time notification
    await socketService.emitToRestaurant(item.restaurantId, 'inventoryAlert', {
      type: 'lowStock',
      item: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        reorderPoint: item.reorderPoint,
      },
    });
  }

  private async notifyStockUpdate(item: InventoryItem): Promise<void> {
    await socketService.emitToRestaurant(item.restaurantId, 'inventoryUpdate', {
      type: 'stockUpdate',
      item: {
        id: item.id,
        name: item.name,
        quantity: item.quantity,
      },
    });
  }

  private aggregateMovements(movements: StockMovement[]) {
    return movements.reduce((acc, movement) => {
      const key = movement.type;
      acc[key] = acc[key] || { count: 0, quantity: 0 };
      acc[key].count++;
      acc[key].quantity += movement.quantity;
      return acc;
    }, {} as Record<StockMovement['type'], { count: number; quantity: number }>);
  }

  private calculateWastage(movements: StockMovement[]) {
    const wasteMovements = movements.filter(m => m.type === 'waste');
    return {
      quantity: wasteMovements.reduce((sum, m) => sum + m.quantity, 0),
      cost: wasteMovements.reduce((sum, m) => {
        const item = InventoryItem.findById(m.inventoryItemId);
        return sum + (m.quantity * (item?.cost || 0));
      }, 0),
    };
  }

  private analyzeCosts(items: InventoryItem[], movements: StockMovement[]) {
    return {
      totalInventoryCost: items.reduce((sum, item) => sum + (item.quantity * item.cost), 0),
      averageItemCost: items.reduce((sum, item) => sum + item.cost, 0) / items.length,
      mostExpensiveItems: items
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5),
      costTrend: this.calculateCostTrend(movements),
    };
  }

  private calculateCostTrend(movements: StockMovement[]) {
    // Group movements by month and calculate total cost
    const monthlyCosts = movements.reduce((acc, movement) => {
      const month = new Date(movement.date).toISOString().slice(0, 7);
      acc[month] = acc[month] || 0;
      
      if (movement.type === 'received') {
        const item = InventoryItem.findById(movement.inventoryItemId);
        acc[month] += movement.quantity * (item?.cost || 0);
      }
      
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(monthlyCosts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, cost]) => ({ month, cost }));
  }
}

export const inventoryService = new InventoryService();
