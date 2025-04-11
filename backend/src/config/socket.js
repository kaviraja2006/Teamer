const socketIo = require("socket.io");

module.exports = (server) => {
  const io = socketIo(server, {
    cors: {
      origin: "*"
    }
  });

  io.on("connection", (socket) => {
    console.log("New user connected:", socket.id);

    socket.on("joinChat", (chatId) => {
      socket.join(chatId);
    });

    socket.on("sendMessage", (data) => {
      io.to(data.chatId).emit("newMessage", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
};
