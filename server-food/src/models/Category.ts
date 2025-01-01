import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  description?: string;
  image?: string;
  slug: string;
  parent?: ICategory;
  subCategories?: ICategory[];
  isActive: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
  },
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  order: {
    type: Number,
    default: 0,
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for subcategories
CategorySchema.virtual('subCategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent'
});

// Pre-save middleware to generate slug
CategorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = this.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  }
  next();
});

// Static method to get full category tree
CategorySchema.statics.getTree = async function() {
  return this.find({ parent: null })
    .populate({
      path: 'subCategories',
      populate: { path: 'subCategories' }
    });
};

export const Category = mongoose.model<ICategory>('Category', CategorySchema);
