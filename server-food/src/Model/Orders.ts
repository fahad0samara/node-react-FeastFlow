import mongoose, {Document, Model, Schema} from "mongoose";

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  items: mongoose.Types.ObjectId[];
  totalAmount: number;
  createdAt: Date;
}

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
      required: true,
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

const Order: Model<IOrder> = mongoose.model<IOrder>("Order", orderSchema);

export {Order};
