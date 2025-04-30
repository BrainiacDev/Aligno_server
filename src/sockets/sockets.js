import { Server as SocketIo } from "socket.io";

let io;

export const initializeSocket = (server) => {
  io = new SocketIo(server, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    // ✅ Join a room based on user ID
    socket.on("joinRoom", (userId) => {
      if (!userId) {
        console.error("❌ Invalid user ID for room joining.");
        return;
      }
      socket.join(userId);
      console.log(`✅ User ${socket.id} joined room ${userId}`);
    });

    // ✅ Handle disconnect event
    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  return io;
};

export const sendEmailStatusUpdate = (userId, emailStatus) => {
  if (!io) {
    console.error("❌ WebSocket not initialized.");
    return;
  }
  io.to(userId).emit("emailStatusUpdate", emailStatus);
};
