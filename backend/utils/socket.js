import { Server } from 'socket.io';

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedPatterns = [
          /\.devtunnels\.ms$/,
          /\.trycloudflare\.com$/,
          /\.loca\.lt$/,
          /\.app\.github\.dev$/,
          /\.ngrok(-free)?\.app$/,
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/,
          /^https?:\/\/([a-zA-Z0-9-]+\.)?krishub\.in$/,
          /^https?:\/\/([a-zA-Z0-9-]+\.)?renote\.co\.in$/,
        ];
        const isMatch = allowedPatterns.some((pattern) => pattern.test(origin));
        if (isMatch) return callback(null, true);
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      credentials: true,
    },
  });

  const saNamespace = io.of('/superadmin');
  saNamespace.on('connection', (socket) => {
    socket.join('sa-room');
    socket.on('disconnect', () => {});
  });

  return io;
}

export function getIO() {
  return io;
}
