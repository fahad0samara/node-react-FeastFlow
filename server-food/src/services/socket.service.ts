import { Server as SocketServer } from 'socket.io';
import { Server } from 'http';
import jwt from 'jsonwebtoken';

class SocketService {
  private io: SocketServer;
  private userSockets: Map<string, string[]> = new Map();
  private restaurantSockets: Map<string, string[]> = new Map();

  initialize(server: Server) {
    this.io = new SocketServer(server, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
          role: string;
        };

        socket.data.userId = decoded.userId;
        socket.data.role = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Store socket mapping
      if (socket.data.userId) {
        const userSockets = this.userSockets.get(socket.data.userId) || [];
        userSockets.push(socket.id);
        this.userSockets.set(socket.data.userId, userSockets);
      }

      // Handle restaurant connections
      socket.on('joinRestaurant', (restaurantId: string) => {
        if (socket.data.role === 'restaurant_owner') {
          const restaurantSockets = this.restaurantSockets.get(restaurantId) || [];
          restaurantSockets.push(socket.id);
          this.restaurantSockets.set(restaurantId, restaurantSockets);
          socket.join(`restaurant:${restaurantId}`);
        }
      });

      // Handle order tracking
      socket.on('trackOrder', (orderId: string) => {
        socket.join(`order:${orderId}`);
      });

      // Handle driver location updates
      socket.on('updateDriverLocation', (data: {
        orderId: string;
        location: { latitude: number; longitude: number };
      }) => {
        this.io.to(`order:${data.orderId}`).emit('driverLocationUpdated', {
          orderId: data.orderId,
          location: data.location,
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.removeSocket(socket.id);
      });
    });
  }

  private removeSocket(socketId: string) {
    // Remove from user sockets
    for (const [userId, sockets] of this.userSockets.entries()) {
      const index = sockets.indexOf(socketId);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.userSockets.delete(userId);
        } else {
          this.userSockets.set(userId, sockets);
        }
      }
    }

    // Remove from restaurant sockets
    for (const [restaurantId, sockets] of this.restaurantSockets.entries()) {
      const index = sockets.indexOf(socketId);
      if (index !== -1) {
        sockets.splice(index, 1);
        if (sockets.length === 0) {
          this.restaurantSockets.delete(restaurantId);
        } else {
          this.restaurantSockets.set(restaurantId, sockets);
        }
      }
    }
  }

  emitToUser(userId: string, event: string, data: any) {
    const userSockets = this.userSockets.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io.to(socketId).emit(event, data);
      });
    }
  }

  emitToRestaurant(restaurantId: string, event: string, data: any) {
    this.io.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  emitToOrder(orderId: string, event: string, data: any) {
    this.io.to(`order:${orderId}`).emit(event, data);
  }

  broadcastToAll(event: string, data: any) {
    this.io.emit(event, data);
  }
}

export const socketService = new SocketService();
