import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import app from './app.js';
import { config } from './config/index.js';
import prisma from './infrastructure/database/prisma.client.js';

const httpServer = createServer(app);

export const io = new SocketServer(httpServer, {
  cors: { origin: config.frontendUrl, credentials: true },
});

io.on('connection', (socket) => {
  socket.on('join', (userId: string) => {
    socket.join(`user:${userId}`);
  });
});

export function emitNotification(userId: string, notification: unknown) {
  io.to(`user:${userId}`).emit('notification', notification);
}

const startServer = async () => {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    httpServer.listen(config.port, () => {
      console.log(`Server running on port ${config.port} in ${config.env} mode`);
      console.log(`API: http://localhost:${config.port}/api/${config.apiVersion}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();
