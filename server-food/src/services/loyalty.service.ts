import { User } from '../models/User';
import { Order, OrderStatus } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { emailService } from './email.service';

enum RewardType {
  POINTS = 'points',
  CASHBACK = 'cashback',
  DISCOUNT = 'discount',
  FREE_DELIVERY = 'free_delivery',
  FREE_ITEM = 'free_item',
}

interface Reward {
  type: RewardType;
  value: number;
  description: string;
  expiryDate?: Date;
  minimumOrderValue?: number;
  maxDiscount?: number;
  applicableRestaurants?: string[];
  excludedItems?: string[];
}

class LoyaltyService {
  private readonly POINTS_PER_CURRENCY = 10; // 10 points per currency unit
  private readonly POINTS_EXPIRY_DAYS = 365; // Points expire after 1 year
  private readonly TIER_THRESHOLDS = {
    SILVER: 1000,
    GOLD: 5000,
    PLATINUM: 10000,
  };

  async calculateOrderPoints(order: Order): Promise<number> {
    if (order.status !== OrderStatus.DELIVERED) {
      return 0;
    }

    let points = Math.floor(order.total * this.POINTS_PER_CURRENCY);

    // Bonus points for large orders
    if (order.total >= 100) {
      points += 500; // Bonus points for orders over 100
    }

    // Bonus points for ordering during off-peak hours
    const orderHour = new Date(order.createdAt).getHours();
    if (orderHour >= 14 && orderHour <= 17) { // Off-peak hours
      points += 200;
    }

    // Bonus points for group orders
    if (order.groupParticipants && order.groupParticipants.length > 2) {
      points += 300;
    }

    return points;
  }

  async addPointsToUser(
    userId: string,
    points: number,
    orderId: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Initialize loyalty data if not exists
    if (!user.loyalty) {
      user.loyalty = {
        points: 0,
        tier: 'BRONZE',
        pointsHistory: [],
        rewards: [],
      };
    }

    // Add points with expiry date
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + this.POINTS_EXPIRY_DAYS);

    user.loyalty.pointsHistory.push({
      points,
      type: 'EARNED',
      source: 'ORDER',
      reference: orderId,
      timestamp: new Date(),
      expiryDate,
    });

    // Update total points
    user.loyalty.points += points;

    // Check and update tier
    const newTier = this.calculateTier(user.loyalty.points);
    if (newTier !== user.loyalty.tier) {
      user.loyalty.tier = newTier;
      await this.handleTierUpgrade(user, newTier);
    }

    await user.save();

    // Send notifications
    await this.sendPointsEarnedNotification(user, points, orderId);
  }

  async redeemPoints(
    userId: string,
    points: number,
    rewardType: RewardType
  ): Promise<Reward> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.loyalty || user.loyalty.points < points) {
      throw new AppError('Insufficient points', 400);
    }

    const reward = await this.createReward(rewardType, points);

    // Deduct points
    user.loyalty.points -= points;
    user.loyalty.pointsHistory.push({
      points: -points,
      type: 'REDEEMED',
      source: rewardType,
      timestamp: new Date(),
    });

    // Add reward to user
    user.loyalty.rewards.push(reward);
    await user.save();

    // Send notification
    await this.sendRewardRedeemedNotification(user, reward);

    return reward;
  }

  async getAvailableRewards(userId: string): Promise<Reward[]> {
    const user = await User.findById(userId);
    if (!user || !user.loyalty) {
      return [];
    }

    const now = new Date();
    return user.loyalty.rewards.filter(reward => 
      !reward.expiryDate || reward.expiryDate > now
    );
  }

  async applyRewardToOrder(
    orderId: string,
    rewardId: string
  ): Promise<Order> {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const user = await User.findById(order.user);
    if (!user || !user.loyalty) {
      throw new AppError('User loyalty program not found', 404);
    }

    const reward = user.loyalty.rewards.find(r => r._id.toString() === rewardId);
    if (!reward) {
      throw new AppError('Reward not found', 404);
    }

    // Validate reward
    if (reward.expiryDate && reward.expiryDate <= new Date()) {
      throw new AppError('Reward has expired', 400);
    }

    if (reward.minimumOrderValue && order.total < reward.minimumOrderValue) {
      throw new AppError('Order total does not meet minimum value requirement', 400);
    }

    // Apply reward
    switch (reward.type) {
      case RewardType.DISCOUNT:
        const discount = Math.min(
          order.total * (reward.value / 100),
          reward.maxDiscount || Infinity
        );
        order.discount = {
          type: 'loyalty',
          value: discount,
          description: reward.description,
        };
        break;

      case RewardType.CASHBACK:
        order.cashback = {
          amount: reward.value,
          description: reward.description,
        };
        break;

      case RewardType.FREE_DELIVERY:
        order.deliveryFee = 0;
        break;

      case RewardType.FREE_ITEM:
        // Implementation depends on how free items are handled
        break;
    }

    // Remove used reward
    user.loyalty.rewards = user.loyalty.rewards.filter(
      r => r._id.toString() !== rewardId
    );
    await user.save();

    await order.save();
    return order;
  }

  private calculateTier(points: number): string {
    if (points >= this.TIER_THRESHOLDS.PLATINUM) return 'PLATINUM';
    if (points >= this.TIER_THRESHOLDS.GOLD) return 'GOLD';
    if (points >= this.TIER_THRESHOLDS.SILVER) return 'SILVER';
    return 'BRONZE';
  }

  private async createReward(
    type: RewardType,
    points: number
  ): Promise<Reward> {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // Rewards expire in 30 days

    let reward: Reward;
    switch (type) {
      case RewardType.DISCOUNT:
        reward = {
          type,
          value: Math.min(points / 100, 25), // Max 25% discount
          description: `${Math.min(points / 100, 25)}% discount on your next order`,
          expiryDate,
          minimumOrderValue: 20,
          maxDiscount: 50,
        };
        break;

      case RewardType.CASHBACK:
        reward = {
          type,
          value: points / 100,
          description: `${points / 100} cashback on your next order`,
          expiryDate,
          minimumOrderValue: 20,
        };
        break;

      case RewardType.FREE_DELIVERY:
        reward = {
          type,
          value: 0,
          description: 'Free delivery on your next order',
          expiryDate,
          minimumOrderValue: 30,
        };
        break;

      default:
        throw new AppError('Invalid reward type', 400);
    }

    return reward;
  }

  private async handleTierUpgrade(
    user: any,
    newTier: string
  ): Promise<void> {
    // Add tier upgrade rewards
    let reward: Reward;
    switch (newTier) {
      case 'SILVER':
        reward = {
          type: RewardType.FREE_DELIVERY,
          value: 0,
          description: 'Welcome to Silver Tier - Free Delivery',
          minimumOrderValue: 20,
        };
        break;

      case 'GOLD':
        reward = {
          type: RewardType.DISCOUNT,
          value: 15,
          description: 'Welcome to Gold Tier - 15% Discount',
          minimumOrderValue: 30,
          maxDiscount: 30,
        };
        break;

      case 'PLATINUM':
        reward = {
          type: RewardType.CASHBACK,
          value: 25,
          description: 'Welcome to Platinum Tier - $25 Cashback',
          minimumOrderValue: 50,
        };
        break;
    }

    if (reward) {
      user.loyalty.rewards.push(reward);
    }

    // Send tier upgrade notification
    await this.sendTierUpgradeNotification(user, newTier);
  }

  private async sendPointsEarnedNotification(
    user: any,
    points: number,
    orderId: string
  ): Promise<void> {
    // Send email
    await emailService.sendPointsEarned(user._id, {
      points,
      orderId,
      totalPoints: user.loyalty.points,
      tier: user.loyalty.tier,
    });

    // Send real-time notification
    socketService.emitToUser(user._id, 'pointsEarned', {
      points,
      orderId,
      totalPoints: user.loyalty.points,
      tier: user.loyalty.tier,
    });
  }

  private async sendRewardRedeemedNotification(
    user: any,
    reward: Reward
  ): Promise<void> {
    await emailService.sendRewardRedeemed(user._id, {
      reward,
      remainingPoints: user.loyalty.points,
    });

    socketService.emitToUser(user._id, 'rewardRedeemed', {
      reward,
      remainingPoints: user.loyalty.points,
    });
  }

  private async sendTierUpgradeNotification(
    user: any,
    newTier: string
  ): Promise<void> {
    await emailService.sendTierUpgrade(user._id, {
      newTier,
      rewards: user.loyalty.rewards,
    });

    socketService.emitToUser(user._id, 'tierUpgrade', {
      newTier,
      rewards: user.loyalty.rewards,
    });
  }
}

export const loyaltyService = new LoyaltyService();
