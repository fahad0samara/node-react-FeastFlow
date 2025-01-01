import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle Google OAuth errors
  if (err.message.includes('Invalid token') || err.message.includes('Token verification failed')) {
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed',
    });
  }

  // Handle other errors
  return res.status(500).json({
    status: 'error',
    message: 'Internal server error',
  });
};

// Handle unhandled rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
