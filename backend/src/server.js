import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";
import { Server } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

import Message from "./models/Message.js";
import Chat from "./models/Chat.js";
import Group from "./models/Group.js";
import TypingStatus from "./models/TypingStatus.js";
import { uploadToStorage } from "./utils/fileStorage.js"; // Storage function

dotenv.config();
const app = express();


const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/groups", groupRoutes);


app.use((req, res) => {
  console.log("404 - Route not found:", req.method, req.url);
  res.status(404).json({ error: "Route not found" });
});


app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});


mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });


const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log("🔌 A user connected:", socket.id);

 
  socket.on("userOnline", (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`🟢 User ${userId} is online`);
  });


  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log(`📌 User joined chat room: ${chatId}`);
  });

 
  socket.on("typing", async ({ userId, chatId }) => {
    try {
      await TypingStatus.findOneAndUpdate(
        { userId, chatId },
        { isTyping: true, lastTypingAt: new Date() },
        { upsert: true }
      );
      socket.to(chatId).emit("userTyping", { userId, chatId });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  });

  socket.on("stopTyping", async ({ userId, chatId }) => {
    try {
      await TypingStatus.findOneAndDelete({ userId, chatId });
      socket.to(chatId).emit("userStoppedTyping", { userId, chatId });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  });

  
  socket.on("sendMessage", async ({ senderId, receiverId, content, chatId }) => {
    try {
      const newMessage = await Message.create({ chatId, sender: senderId, text: content, status: "sent" });

      await Chat.findByIdAndUpdate(chatId, { $push: { messages: newMessage._id } });

      io.to(chatId).emit("receiveMessage", {
        _id: newMessage._id,
        sender: senderId,
        text: content,
        status: "sent",
        createdAt: newMessage.createdAt,
      });

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        await Message.findByIdAndUpdate(newMessage._id, { status: "delivered" });

        io.to(chatId).emit("messageStatusUpdated", {
          messageId: newMessage._id,
          status: "delivered",
          userId: receiverId,
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });

 
  socket.on("sendGroupFile", async ({ groupId, senderId, file }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const member = group.members.find(m => m.user.toString() === senderId);
      if (!member) return;

      const fileUrl = await uploadToStorage(file);
      const newMessage = await Message.create({
        chatId: groupId,
        sender: senderId,
        messageType: "file",
        fileUrl,
        fileData: {
          originalName: file.name,
          size: file.size,
          mimeType: file.type
        }
      });

      await Group.findByIdAndUpdate(groupId, {
        $push: { messages: newMessage._id }
      });

      io.to(`group:${groupId}`).emit("receiveGroupFile", {
        _id: newMessage._id,
        sender: senderId,
        fileUrl,
        fileData: newMessage.fileData,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error("Error sending group file:", error);
    }
  });

 
  socket.on("sendGroupVoiceMessage", async ({ groupId, senderId, audioBlob, duration }) => {
    try {
      const group = await Group.findById(groupId);
      if (!group) return;

      const member = group.members.find(m => m.user.toString() === senderId);
      if (!member) return;

      const audioUrl = await uploadToStorage(audioBlob);
      const newMessage = await Message.create({
        chatId: groupId,
        sender: senderId,
        messageType: "voice",
        fileUrl: audioUrl,
        voiceData: {
          duration,
          waveform: []
        }
      });

      await Group.findByIdAndUpdate(groupId, {
        $push: { messages: newMessage._id }
      });

      io.to(`group:${groupId}`).emit("receiveGroupVoiceMessage", {
        _id: newMessage._id,
        sender: senderId,
        audioUrl,
        voiceData: newMessage.voiceData,
        createdAt: newMessage.createdAt
      });
    } catch (error) {
      console.error("Error sending voice message:", error);
    }
  });

  // ✅ Poll Updates in Groups
  socket.on("pollVote", async ({ messageId, userId, optionIndex }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message || message.messageType !== "poll") return;

      const option = message.pollData.options[optionIndex];
      if (!option) return;

      if (!message.pollData.allowMultipleVotes) {
        message.pollData.options.forEach(opt => {
          opt.votes = opt.votes.filter(vote => vote.user.toString() !== userId);
        });
      }

      option.votes.push({ user: userId });
      await message.save();

      io.to(`group:${message.chatId}`).emit("pollUpdated", {
        messageId,
        pollData: message.pollData
      });
    } catch (error) {
      console.error("Error updating poll:", error);
    }
  });

  // ✅ Handle User Disconnect
  socket.on("disconnect", () => {
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`🔴 User ${userId} went offline`);
        break;
      }
    }
    console.log("🔌 A user disconnected:", socket.id);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
