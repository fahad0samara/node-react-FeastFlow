import { User } from '../models/User';
import { Order } from '../models/Order';
import { Restaurant } from '../models/Restaurant';
import { AppError } from '../middleware/errorHandler';
import { redis } from '../config/redis';

interface Connection {
  userId: string;
  type: 'friend' | 'follower' | 'following';
  createdAt: Date;
}

interface SocialActivity {
  userId: string;
  type: 'order' | 'review' | 'favorite';
  targetId: string;
  createdAt: Date;
  data: any;
}

interface GroupOrder {
  id: string;
  creatorId: string;
  restaurantId: string;
  participants: {
    userId: string;
    status: 'invited' | 'joined' | 'declined';
    items: any[];
    total: number;
    paid: boolean;
  }[];
  status: 'open' | 'closed' | 'cancelled';
  expiresAt: Date;
  createdAt: Date;
}

class SocialService {
  private readonly CACHE_KEY = 'social:';
  private readonly CACHE_TTL = 3600; // 1 hour

  async getUserConnections(userId: string): Promise<Connection[]> {
    try {
      // Check cache first
      const cacheKey = `${this.CACHE_KEY}connections:${userId}`;
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      const user = await User.findById(userId)
        .populate('friends')
        .populate('followers')
        .populate('following');

      if (!user) {
        throw new AppError('User not found', 404);
      }

      const connections: Connection[] = [
        ...user.friends.map(friend => ({
          userId: friend._id.toString(),
          type: 'friend' as const,
          createdAt: friend.createdAt,
        })),
        ...user.followers.map(follower => ({
          userId: follower._id.toString(),
          type: 'follower' as const,
          createdAt: follower.createdAt,
        })),
        ...user.following.map(following => ({
          userId: following._id.toString(),
          type: 'following' as const,
          createdAt: following.createdAt,
        })),
      ];

      // Cache the connections
      await redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(connections));

      return connections;
    } catch (error) {
      console.error('Error getting user connections:', error);
      throw new AppError('Failed to get user connections', 500);
    }
  }

  async getFriendsOrders(userId: string): Promise<Order[]> {
    try {
      const connections = await this.getUserConnections(userId);
      const friendIds = connections
        .filter(conn => conn.type === 'friend')
        .map(conn => conn.userId);

      const orders = await Order.find({
        user: { $in: friendIds },
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // Last 30 days
      })
        .populate(['restaurant', 'items.menuItem'])
        .sort({ createdAt: -1 });

      return orders;
    } catch (error) {
      console.error('Error getting friends orders:', error);
      throw new AppError('Failed to get friends orders', 500);
    }
  }

  async createGroupOrder(
    creatorId: string,
    restaurantId: string,
    participants: string[]
  ): Promise<GroupOrder> {
    try {
      // Validate restaurant
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        throw new AppError('Restaurant not found', 404);
      }

      // Create group order
      const groupOrder = await GroupOrder.create({
        creatorId,
        restaurantId,
        participants: participants.map(userId => ({
          userId,
          status: 'invited',
          items: [],
          total: 0,
          paid: false,
        })),
        status: 'open',
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
      });

      // Notify participants
      await this.notifyGroupOrderParticipants(groupOrder);

      return groupOrder;
    } catch (error) {
      console.error('Error creating group order:', error);
      throw new AppError('Failed to create group order', 500);
    }
  }

  async joinGroupOrder(
    groupOrderId: string,
    userId: string,
    items: any[]
  ): Promise<void> {
    try {
      const groupOrder = await GroupOrder.findById(groupOrderId);
      if (!groupOrder) {
        throw new AppError('Group order not found', 404);
      }

      if (groupOrder.status !== 'open') {
        throw new AppError('Group order is not open', 400);
      }

      const participant = groupOrder.participants.find(
        p => p.userId.toString() === userId
      );

      if (!participant) {
        throw new AppError('User is not invited to this group order', 403);
      }

      // Calculate total for items
      const total = await this.calculateItemsTotal(items);

      // Update participant
      participant.status = 'joined';
      participant.items = items;
      participant.total = total;

      await groupOrder.save();

      // Notify group order creator
      await this.notifyGroupOrderUpdate(groupOrder);
    } catch (error) {
      console.error('Error joining group order:', error);
      throw new AppError('Failed to join group order', 500);
    }
  }

  async getFriendRecommendations(userId: string): Promise<any[]> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Get user's current friends
      const connections = await this.getUserConnections(userId);
      const friendIds = new Set(
        connections
          .filter(conn => conn.type === 'friend')
          .map(conn => conn.userId)
      );

      // Get friends of friends
      const friendsOfFriends = new Map<string, number>();
      for (const friendId of friendIds) {
        const friendConnections = await this.getUserConnections(friendId);
        friendConnections
          .filter(conn => conn.type === 'friend')
          .forEach(conn => {
            if (!friendIds.has(conn.userId) && conn.userId !== userId) {
              friendsOfFriends.set(
                conn.userId,
                (friendsOfFriends.get(conn.userId) || 0) + 1
              );
            }
          });
      }

      // Sort by number of mutual friends
      const recommendations = Array.from(friendsOfFriends.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      // Get user details
      const recommendedUsers = await User.find({
        _id: { $in: recommendations.map(([id]) => id) },
      });

      return recommendedUsers.map(user => ({
        user,
        mutualFriends: friendsOfFriends.get(user._id.toString()),
      }));
    } catch (error) {
      console.error('Error getting friend recommendations:', error);
      throw new AppError('Failed to get friend recommendations', 500);
    }
  }

  async getSocialFeed(userId: string): Promise<SocialActivity[]> {
    try {
      const connections = await this.getUserConnections(userId);
      const connectionIds = connections.map(conn => conn.userId);

      // Get recent activities from connections
      const activities = await SocialActivity.find({
        userId: { $in: connectionIds },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      })
        .populate('userId')
        .sort({ createdAt: -1 })
        .limit(50);

      return activities;
    } catch (error) {
      console.error('Error getting social feed:', error);
      throw new AppError('Failed to get social feed', 500);
    }
  }

  private async notifyGroupOrderParticipants(groupOrder: GroupOrder): Promise<void> {
    // Implementation would depend on your notification system
    // This could send push notifications, emails, or in-app notifications
  }

  private async notifyGroupOrderUpdate(groupOrder: GroupOrder): Promise<void> {
    // Implementation would depend on your notification system
  }

  private async calculateItemsTotal(items: any[]): Promise<number> {
    let total = 0;
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        throw new AppError('Menu item not found', 404);
      }
      total += menuItem.price * item.quantity;
    }
    return total;
  }
}

export { SocialService, Connection, SocialActivity, GroupOrder };
