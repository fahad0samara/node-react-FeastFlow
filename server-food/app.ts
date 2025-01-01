import express, {Request, Response} from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
import menuRouter from "./src/router/menu";
import authRouter from "./src/router/Auth";
import cartRouter from "./src/router/Cart";
import orderRouter from "./src/router/Orders";

require("dotenv").config();
const app = express();

// Connect to MongoDB
const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
  throw new Error("MONGODB_URI environment variable is not set.");
}

mongoose
  .connect(mongodbUri)
  .then(() => console.log("MongoDB connected"))
  .catch(error => console.error(error));

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Allow frontend origin
  credentials: true // Allow credentials
}));
app.use(morgan("common"));
app.use(helmet());
app.use(express.json());

// Welcome route
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Welcome to Food App!",
  });
});

// API routes
app.use("/api/menu", menuRouter);
app.use("/api/auth", authRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
