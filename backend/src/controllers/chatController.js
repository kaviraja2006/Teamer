import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import TypingStatus from "../models/TypingStatus.js";
import mongoose from "mongoose";


export const getOrCreateChat = async (req, res) => {
  const { user1, user2 } = req.body;
  try {
    if (!user1 || !user2) {
      return res.status(400).json({ error: "Both user IDs are required" });
    }

    let chat = await Chat.findOne({ members: { $all: [user1, user2] } });
    if (!chat) {
      chat = await Chat.create({ members: [user1, user2], messages: [] });
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error creating/getting chat:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const sendMessage = async (req, res) => {
  const { chatId, sender, text } = req.body;
  
  try {
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = Array.from(text.matchAll(mentionRegex)).map(match => match[1]);
    
    let mentionUserIds = [];
    if (mentionUsernames.length > 0) {
      const User = mongoose.model('User');
      const mentionedUsers = await User.find({ username: { $in: mentionUsernames } });
      mentionUserIds = mentionedUsers.map(user => user._id);
    }

    const newMessage = new Message({
      chatId,
      sender,
      text,
      mentions: mentionUserIds,
      messageType: 'text'
    });

    await newMessage.save();
    chat.messages.push(newMessage._id);
    await chat.save();

    await newMessage.populate('mentions', 'username name avatar');
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const getMessages = async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const chat = await Chat.findById(chatId)
      .populate({
        path: 'messages',
        populate: [
          { path: 'sender', select: 'username name avatar' },
          { path: 'mentions', select: 'username name avatar' }
        ]
      });

    if (!chat) return res.status(404).json({ error: "Chat not found" });

    res.status(200).json(chat.messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const editMessage = async (req, res) => {
  const { messageId } = req.params;
  const { text, isEdited } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    const mentionRegex = /@(\w+)/g;
    const mentionUsernames = Array.from(text.matchAll(mentionRegex)).map(match => match[1]);
    
    if (mentionUsernames.length > 0) {
      const User = mongoose.model('User');
      const mentionedUsers = await User.find({ username: { $in: mentionUsernames } });
      message.mentions = mentionedUsers.map(user => user._id);
    } else {
      message.mentions = [];
    }

    message.text = text;
    message.isEdited = isEdited;
    await message.save();
    await message.populate('mentions', 'username name avatar');

    res.status(200).json(message);
  } catch (error) {
    console.error("Error editing message:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const result = await Message.deleteOne({ _id: messageId });

    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Message not found" });

    await Chat.updateOne(
      { messages: messageId },
      { $pull: { messages: messageId } }
    );

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { user, emoji } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    if (!message.reactions) message.reactions = [];

    const existingReaction = message.reactions.find(
      (reaction) => reaction.user.toString() === user
    );

    if (existingReaction) {
      existingReaction.emoji = emoji;
    } else {
      message.reactions.push({ user, emoji });
    }

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.error("Error reacting to message:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const updateMessageStatus = async (req, res) => {
  const { messageId } = req.params;
  const { userId, status } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    await message.updateStatus(userId, status);
    res.status(200).json(message);
  } catch (error) {
    console.error("Error updating message status:", error);
    res.status(500).json({ error: error.message || "Server error" });
  }
};


export const getTypingUsers = async (req, res) => {
  const { chatId } = req.params;
  
  try {
    const typingUsers = await TypingStatus.find({ 
      chatId,
      isTyping: true 
    }).populate('userId', 'name username');

    res.status(200).json(typingUsers);
  } catch (error) {
    console.error("Error getting typing users:", error);
    res.status(500).json({ error: error.message });
  }
};


export const updateTypingStatus = async (req, res) => {
  const { chatId } = req.params;
  const { userId, isTyping } = req.body;
  
  try {
    if (isTyping) {
      await TypingStatus.findOneAndUpdate(
        { userId, chatId },
        { 
          isTyping: true,
          lastTypingAt: new Date()
        },
        { upsert: true }
      );
    } else {
      await TypingStatus.findOneAndDelete({ userId, chatId });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating typing status:", error);
    res.status(500).json({ error: error.message });
  }
};
