import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { Order } from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import { emailService } from './email.service';
import { socketService } from './socket.service';

interface Promotion {
  id: string;
  type: 'discount' | 'bogo' | 'freeDelivery' | 'reward';
  code: string;
  description: string;
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  startDate: Date;
  endDate: Date;
  usageLimit?: number;
  usedCount: number;
  restaurantId?: string;
  conditions?: {
    newCustomersOnly?: boolean;
    specificItems?: string[];
    specificCategories?: string[];
    specificDays?: string[];
    specificHours?: {
      start: string;
      end: string;
    };
  };
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'inApp';
  content: {
    subject?: string;
    body: string;
    image?: string;
    cta?: {
      text: string;
      link: string;
    };
  };
  targetAudience: {
    segments: string[];
    filters: {
      lastOrderDate?: Date;
      orderCount?: number;
      totalSpent?: number;
      location?: {
        coordinates: [number, number];
        radius: number;
      };
    };
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'cancelled';
  metrics: {
    sent: number;
    opened: number;
    clicked: number;
    converted: number;
  };
}

interface ReferralProgram {
  id: string;
  type: 'standard' | 'tiered' | 'custom';
  rewards: {
    referrer: {
      type: 'discount' | 'credit' | 'points';
      value: number;
    };
    referee: {
      type: 'discount' | 'credit' | 'points';
      value: number;
    };
  };
  conditions: {
    minimumOrderValue?: number;
    validityDays: number;
    maxReferrals?: number;
  };
  metrics: {
    totalReferrals: number;
    successfulReferrals: number;
    totalRewardsGiven: number;
  };
}

class MarketingService {
  async createPromotion(promotionData: Partial<Promotion>): Promise<Promotion> {
    // Validate promotion data
    if (!promotionData.code || !promotionData.type || !promotionData.value) {
      throw new AppError('Missing required promotion fields', 400);
    }

    // Check for duplicate promotion code
    const existingPromotion = await Promotion.findOne({ code: promotionData.code });
    if (existingPromotion) {
      throw new AppError('Promotion code already exists', 400);
    }

    // Create promotion
    const promotion = await Promotion.create({
      ...promotionData,
      usedCount: 0,
    });

    return promotion;
  }

  async validatePromotion(
    code: string,
    userId: string,
    orderId: string
  ): Promise<boolean> {
    const promotion = await Promotion.findOne({ code });
    if (!promotion) {
      throw new AppError('Invalid promotion code', 400);
    }

    // Check if promotion is active
    const now = new Date();
    if (now < promotion.startDate || now > promotion.endDate) {
      throw new AppError('Promotion is not active', 400);
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.usedCount >= promotion.usageLimit) {
      throw new AppError('Promotion usage limit reached', 400);
    }

    // Check user-specific conditions
    if (promotion.conditions?.newCustomersOnly) {
      const previousOrders = await Order.countDocuments({ user: userId });
      if (previousOrders > 0) {
        throw new AppError('Promotion is for new customers only', 400);
      }
    }

    // Check order-specific conditions
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (promotion.minOrderValue && order.subtotal < promotion.minOrderValue) {
      throw new AppError(
        `Order minimum of $${promotion.minOrderValue} not met`,
        400
      );
    }

    return true;
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    // Validate campaign data
    if (!campaignData.name || !campaignData.type || !campaignData.content) {
      throw new AppError('Missing required campaign fields', 400);
    }

    // Create campaign
    const campaign = await Campaign.create({
      ...campaignData,
      status: 'draft',
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        converted: 0,
      },
    });

    return campaign;
  }

  async executeCampaign(campaignId: string): Promise<void> {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    // Get target users based on segments and filters
    const users = await this.getTargetUsers(campaign.targetAudience);

    // Execute campaign based on type
    switch (campaign.type) {
      case 'email':
        await this.sendEmailCampaign(campaign, users);
        break;
      case 'push':
        await this.sendPushCampaign(campaign, users);
        break;
      case 'sms':
        await this.sendSmsCampaign(campaign, users);
        break;
      case 'inApp':
        await this.sendInAppCampaign(campaign, users);
        break;
    }

    // Update campaign status
    campaign.status = 'active';
    await campaign.save();
  }

  async createReferralProgram(
    programData: Partial<ReferralProgram>
  ): Promise<ReferralProgram> {
    // Validate program data
    if (!programData.type || !programData.rewards) {
      throw new AppError('Missing required referral program fields', 400);
    }

    // Create referral program
    const program = await ReferralProgram.create({
      ...programData,
      metrics: {
        totalReferrals: 0,
        successfulReferrals: 0,
        totalRewardsGiven: 0,
      },
    });

    return program;
  }

  async processReferral(
    referrerId: string,
    refereeId: string,
    programId: string
  ): Promise<void> {
    const program = await ReferralProgram.findById(programId);
    if (!program) {
      throw new AppError('Referral program not found', 404);
    }

    const referee = await User.findById(refereeId);
    if (!referee) {
      throw new AppError('Referee not found', 404);
    }

    // Check if referee is a new user
    const refereeOrders = await Order.countDocuments({ user: refereeId });
    if (refereeOrders > 0) {
      throw new AppError('Referee is not a new user', 400);
    }

    // Process rewards
    await this.giveReferralReward(referrerId, program.rewards.referrer);
    await this.giveReferralReward(refereeId, program.rewards.referee);

    // Update program metrics
    program.metrics.totalReferrals++;
    program.metrics.successfulReferrals++;
    program.metrics.totalRewardsGiven +=
      program.rewards.referrer.value + program.rewards.referee.value;
    await program.save();
  }

  private async getTargetUsers(targetAudience: Campaign['targetAudience']) {
    const { segments, filters } = targetAudience;
    let query: any = {};

    // Apply segment filters
    if (segments?.length) {
      query.segment = { $in: segments };
    }

    // Apply additional filters
    if (filters) {
      if (filters.lastOrderDate) {
        query['lastOrderDate'] = { $gte: filters.lastOrderDate };
      }
      if (filters.orderCount) {
        query['orderCount'] = { $gte: filters.orderCount };
      }
      if (filters.totalSpent) {
        query['totalSpent'] = { $gte: filters.totalSpent };
      }
      if (filters.location) {
        query['address.coordinates'] = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: filters.location.coordinates,
            },
            $maxDistance: filters.location.radius,
          },
        };
      }
    }

    return User.find(query);
  }

  private async sendEmailCampaign(campaign: Campaign, users: User[]) {
    for (const user of users) {
      await emailService.sendMarketingEmail(
        user.email,
        campaign.content.subject!,
        campaign.content.body,
        {
          campaignId: campaign.id,
          userId: user.id,
        }
      );
    }
  }

  private async sendPushCampaign(campaign: Campaign, users: User[]) {
    for (const user of users) {
      await socketService.emitToUser(user.id, 'marketingNotification', {
        title: campaign.content.subject,
        body: campaign.content.body,
        image: campaign.content.image,
        cta: campaign.content.cta,
        campaignId: campaign.id,
      });
    }
  }

  private async sendSmsCampaign(campaign: Campaign, users: User[]) {
    // Implement SMS sending logic
  }

  private async sendInAppCampaign(campaign: Campaign, users: User[]) {
    for (const user of users) {
      await socketService.emitToUser(user.id, 'inAppMarketing', {
        content: campaign.content,
        campaignId: campaign.id,
      });
    }
  }

  private async giveReferralReward(
    userId: string,
    reward: ReferralProgram['rewards']['referrer' | 'referee']
  ) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    switch (reward.type) {
      case 'discount':
        // Create a promotion code for the user
        await this.createPromotion({
          type: 'discount',
          code: `REF-${Math.random().toString(36).substring(7)}`,
          value: reward.value,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          usageLimit: 1,
        });
        break;
      case 'credit':
        // Add credit to user's wallet
        user.walletBalance = (user.walletBalance || 0) + reward.value;
        await user.save();
        break;
      case 'points':
        // Add points to user's loyalty account
        user.loyaltyPoints = (user.loyaltyPoints || 0) + reward.value;
        await user.save();
        break;
    }
  }
}

export const marketingService = new MarketingService();
