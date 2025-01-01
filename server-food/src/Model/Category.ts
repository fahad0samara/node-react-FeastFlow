import mongoose, {Schema, Document, Model} from "mongoose";

interface IMenu extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
}

interface ICategory extends Document {
  name: string;
  description: string;
  image: string;
}


interface IReview extends Document {
  user: Schema.Types.ObjectId;
  menu: Schema.Types.ObjectId;
  rating: number;
  text: string;
  created_at: Date;
}

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    isNew: {
      type: Boolean,
      default: false, // set default value to false
    },
    created_at: {
      type: Date,
      default: Date.now,
    },

    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const categorySchema: Schema = new Schema({
  name: {
    type: String,
    unique: true,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const reviewSchema: Schema<IReview> = new Schema<IReview>({
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  menu: {
    type: Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Menu: Model<IMenu> = mongoose.model<IMenu>("Menu", menuSchema);
const Category: Model<ICategory> = mongoose.model<ICategory>(
  "Category",
  categorySchema
);
const Review: Model<IReview> = mongoose.model<IReview>("Review", reviewSchema);

export {Menu, Category, Review};
