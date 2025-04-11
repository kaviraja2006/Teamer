// backend/src/models/TypingStatus.js
import mongoose from "mongoose";

const TypingStatusSchema = new mongoose.Schema({
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Chat", 
    required: true,
    index: true // Add index for better query performance
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true // Add index for better query performance
  },
  isTyping: { 
    type: Boolean, 
    default: true, // Changed from false to true since we create records only when typing starts
    index: true 
  },
  lastTypingAt: { 
    type: Date, 
    default: Date.now,
    expires: 5 // Document will be automatically deleted after 5 seconds of inactivity
  }
}, {
  timestamps: true // Add timestamps for better tracking
});

// Add compound index for efficient queries and ensure uniqueness
TypingStatusSchema.index({ chatId: 1, userId: 1 }, { 
  unique: true,
  background: true 
});

// Add methods for better encapsulation
TypingStatusSchema.statics.startTyping = async function(chatId, userId) {
  return this.findOneAndUpdate(
    { chatId, userId },
    { 
      isTyping: true,
      lastTypingAt: new Date()
    },
    { 
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
};

TypingStatusSchema.statics.stopTyping = async function(chatId, userId) {
  return this.findOneAndDelete({ chatId, userId });
};

TypingStatusSchema.statics.getTypingUsers = async function(chatId) {
  return this.find({ 
    chatId,
    isTyping: true 
  })
  .populate('userId', 'name username avatar')
  .lean();
};

// Add middleware to clean up stale typing statuses
TypingStatusSchema.pre('save', async function(next) {
  // Remove typing status older than 5 seconds
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  if (this.lastTypingAt < fiveSecondsAgo) {
    return this.deleteOne();
  }
  next();
});

// Add validation
TypingStatusSchema.path('chatId').validate(async function(value) {
  const Chat = mongoose.model('Chat');
  const chat = await Chat.findById(value);
  return chat !== null;
}, 'Chat does not exist');

TypingStatusSchema.path('userId').validate(async function(value) {
  const User = mongoose.model('User');
  const user = await User.findById(value);
  return user !== null;
}, 'User does not exist');

const TypingStatus = mongoose.model("TypingStatus", TypingStatusSchema);

export default TypingStatus;
