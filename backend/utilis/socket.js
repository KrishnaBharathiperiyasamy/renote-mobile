let io;

export const setSocketInstance = (ioInstance) => {
  io = ioInstance;
};

export const sendNotification = (userId, notification) => {
  if (!io) return;
  io.to(userId).emit("notification", notification);
};
