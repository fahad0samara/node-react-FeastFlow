import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      throw new Error('MONGODB_URI environment variable is not set.');
    }

    await mongoose.connect(mongodbUri, {
      // These are no longer needed in newer versions of Mongoose
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // useCreateIndex: true,
      // useFindAndModify: false,
    });

    console.log('MongoDB connected successfully');

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

export default connectDB;
