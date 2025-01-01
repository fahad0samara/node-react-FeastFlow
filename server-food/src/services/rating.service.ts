import { Rating, IRating } from '../models/Rating';
import { Order } from '../models/Order';
import { AppError } from '../middleware/errorHandler';
import { socketService } from './socket.service';
import { cloudinaryService } from '../services/cloudinary.service';

class RatingService {
  async createRating(
    userId: string,
    data: {
      orderId: string;
      foodRating: number;
      deliveryRating?: number;
      serviceRating: number;
      comment?: string;
      images?: Express.Multer.File[];
      isAnonymous?: boolean;
    }
  ): Promise<IRating> {
    const order = await Order.findById(data.orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.user.toString() !== userId) {
      throw new AppError('Not authorized to rate this order', 403);
    }

    const existingRating = await Rating.findOne({ order: data.orderId });
    if (existingRating) {
      throw new AppError('Order has already been rated', 400);
    }

    // Upload images if provided
    let imageUrls: string[] = [];
    if (data.images && data.images.length > 0) {
      imageUrls = await Promise.all(
        data.images.map(image => cloudinaryService.uploadImage(image, 'ratings'))
      );
    }

    const rating = new Rating({
      order: data.orderId,
      user: userId,
      restaurant: order.restaurant,
      foodRating: data.foodRating,
      deliveryRating: data.deliveryRating,
      serviceRating: data.serviceRating,
      comment: data.comment,
      images: imageUrls,
      isAnonymous: data.isAnonymous || false,
      isVerifiedPurchase: true,
    });

    await rating.save();

    // Send notifications
    await this.sendRatingNotifications(rating);

    return rating;
  }

  async respondToRating(
    ratingId: string,
    respondentId: string,
    response: string
  ): Promise<IRating> {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    // Verify respondent is authorized (restaurant owner or admin)
    // This should be handled by your authorization middleware

    rating.response = {
      text: response,
      timestamp: new Date(),
      respondent: respondentId,
    };

    await rating.save();

    // Notify the customer
    socketService.emitToUser(rating.user.toString(), 'ratingResponse', {
      ratingId: rating._id,
      response: rating.response,
    });

    return rating;
  }

  async updateRating(
    ratingId: string,
    userId: string,
    data: {
      foodRating?: number;
      deliveryRating?: number;
      serviceRating?: number;
      comment?: string;
      images?: Express.Multer.File[];
    }
  ): Promise<IRating> {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    if (rating.user.toString() !== userId) {
      throw new AppError('Not authorized to update this rating', 403);
    }

    // Handle new images
    let imageUrls = [...(rating.images || [])];
    if (data.images && data.images.length > 0) {
      const newImageUrls = await Promise.all(
        data.images.map(image => cloudinaryService.uploadImage(image, 'ratings'))
      );
      imageUrls = [...imageUrls, ...newImageUrls];
    }

    Object.assign(rating, {
      ...data,
      images: imageUrls,
    });

    await rating.save();

    return rating;
  }

  async voteHelpful(ratingId: string, userId: string): Promise<IRating> {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    rating.helpfulVotes += 1;
    await rating.save();

    return rating;
  }

  async flagRating(
    ratingId: string,
    userId: string,
    reason: string
  ): Promise<IRating> {
    const rating = await Rating.findById(ratingId);
    if (!rating) {
      throw new AppError('Rating not found', 404);
    }

    rating.flags = rating.flags || [];
    rating.flags.push({
      reason,
      reportedBy: userId,
      timestamp: new Date(),
    });

    await rating.save();

    // Notify moderators if flags exceed threshold
    if (rating.flags.length >= 3) {
      socketService.emitToAdmin('ratingFlagged', {
        ratingId: rating._id,
        flags: rating.flags,
      });
    }

    return rating;
  }

  async getRestaurantRatings(
    restaurantId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: string;
      filterBy?: {
        minRating?: number;
        maxRating?: number;
        hasImages?: boolean;
        hasResponse?: boolean;
      };
    } = {}
  ): Promise<{
    ratings: IRating[];
    total: number;
    averages: {
      food: number;
      delivery: number;
      service: number;
    };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = '-createdAt',
      filterBy = {},
    } = options;

    const query: any = { restaurant: restaurantId };

    if (filterBy.minRating) {
      query.foodRating = { $gte: filterBy.minRating };
    }
    if (filterBy.maxRating) {
      query.foodRating = { ...query.foodRating, $lte: filterBy.maxRating };
    }
    if (filterBy.hasImages) {
      query.images = { $exists: true, $ne: [] };
    }
    if (filterBy.hasResponse) {
      query.response = { $exists: true };
    }

    const [ratings, total] = await Promise.all([
      Rating.find(query)
        .sort(sortBy)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('user', 'name')
        .populate('response.respondent', 'name'),
      Rating.countDocuments(query),
    ]);

    // Calculate averages
    const averages = await Rating.aggregate([
      { $match: { restaurant: restaurantId } },
      {
        $group: {
          _id: null,
          food: { $avg: '$foodRating' },
          delivery: { $avg: '$deliveryRating' },
          service: { $avg: '$serviceRating' },
        },
      },
    ]);

    return {
      ratings,
      total,
      averages: averages[0] || { food: 0, delivery: 0, service: 0 },
    };
  }

  private async sendRatingNotifications(rating: IRating): Promise<void> {
    // Notify restaurant
    socketService.emitToRestaurant(rating.restaurant.toString(), 'newRating', {
      ratingId: rating._id,
      orderId: rating.order,
      ratings: {
        food: rating.foodRating,
        delivery: rating.deliveryRating,
        service: rating.serviceRating,
      },
    });

    // If rating is low, notify restaurant immediately
    if (
      rating.foodRating <= 2 ||
      (rating.deliveryRating && rating.deliveryRating <= 2) ||
      rating.serviceRating <= 2
    ) {
      socketService.emitToRestaurant(
        rating.restaurant.toString(),
        'lowRatingAlert',
        {
          ratingId: rating._id,
          orderId: rating.order,
          ratings: {
            food: rating.foodRating,
            delivery: rating.deliveryRating,
            service: rating.serviceRating,
          },
          comment: rating.comment,
        }
      );
    }
  }
}

export const ratingService = new RatingService();
