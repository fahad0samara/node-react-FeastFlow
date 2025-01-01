import mongoose, {Document, Model, Schema} from "mongoose";

export interface ICartItem extends Document {
  item: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
}

const cartItemSchema: Schema<ICartItem> = new Schema<ICartItem>({
  item: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Menu",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
  },
});

const cartSchema: Schema<ICart> = new Schema<ICart>({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: {
    type: [cartItemSchema],
    default: [],
  },
});

const CartItem: Model<ICartItem> = mongoose.model<ICartItem>(
  "CartItem",
  cartItemSchema
);
const Cart: Model<ICart> = mongoose.model<ICart>("Cart", cartSchema);

export {CartItem, Cart};
