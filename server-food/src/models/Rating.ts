import mongoose, { Schema, Document } from 'mongoose';
import { IOrder } from './Order';
import { IUser } from './User';

export interface IRating extends Document {
  order: IOrder;
  user: IUser;
  restaurant: any; // Replace with IRestaurant when available
  foodRating: number;
  deliveryRating?: number;
  serviceRating: number;
  comment?: string;
  images?: string[];
  isAnonymous: boolean;
  response?: {
    text: string;
    timestamp: Date;
    respondent: IUser;
  };
  flags?: {
    reason: string;
    reportedBy: IUser;
    timestamp: Date;
  }[];
  isVerifiedPurchase: boolean;
  helpfulVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema = new Schema({
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurant: {
    type: Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true,
  },
  foodRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  deliveryRating: {
    type: Number,
    min: 1,
    max: 5,
  },
  serviceRating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    maxlength: 1000,
  },
  images: [{
    type: String,
    validate: {
      validator: (v: string) => /^https?:\/\/.+/.test(v),
      message: 'Images must be valid URLs',
    },
  }],
  isAnonymous: {
    type: Boolean,
    default: false,
  },
  response: {
    text: {
      type: String,
      maxlength: 1000,
    },
    timestamp: Date,
    respondent: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  flags: [{
    reason: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  isVerifiedPurchase: {
    type: Boolean,
    default: true,
  },
  helpfulVotes: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes
RatingSchema.index({ order: 1 }, { unique: true });
RatingSchema.index({ user: 1 });
RatingSchema.index({ restaurant: 1 });
RatingSchema.index({ foodRating: 1 });
RatingSchema.index({ createdAt: 1 });

// Middleware to update restaurant rating
RatingSchema.post('save', async function(doc) {
  const Restaurant = mongoose.model('Restaurant');
  const ratings = await this.model('Rating')
    .find({ restaurant: doc.restaurant })
    .select('foodRating deliveryRating serviceRating');

  const avgRatings = ratings.reduce((acc, curr) => {
    acc.food += curr.foodRating;
    acc.delivery += curr.deliveryRating || 0;
    acc.service += curr.serviceRating;
    return acc;
  }, { food: 0, delivery: 0, service: 0 });

  const totalRatings = ratings.length;
  const deliveryRatingsCount = ratings.filter(r => r.deliveryRating).length;

  await Restaurant.findByIdAndUpdate(doc.restaurant, {
    ratings: {
      food: avgRatings.food / totalRatings,
      delivery: deliveryRatingsCount ? avgRatings.delivery / deliveryRatingsCount : null,
      service: avgRatings.service / totalRatings,
      count: totalRatings,
    },
  });
});

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
