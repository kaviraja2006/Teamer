import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  chatId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Chat", 
    required: true 
  },
  sender: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  messageType: {
    type: String,
    enum: ["text", "image", "video", "file", "sticker", "poll", "voice", "group"],
    default: "text",
  },
  text: { 
    type: String, 
    trim: true 
  },
  fileUrl: { 
    type: String 
  },
  reactions: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    emoji: String,
  }],
  replyTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Message" 
  },
  mentions: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User" 
  }],
  isEdited: { 
    type: Boolean, 
    default: false 
  },
  disappearingMessage: { 
    type: Date 
  },
  status: { 
    type: String, 
    enum: ["sent", "delivered", "seen"], 
    default: "sent" 
  },
  seenBy: [{
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    }
  }],
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],

  // ✅ Poll Data Structure
  pollData: {
    question: String,
    options: [{
      text: String,
      votes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: { type: Date, default: Date.now }
      }]
    }],
    expiresAt: Date,
    allowMultipleVotes: { type: Boolean, default: false }
  },

  // ✅ Voice Message Metadata
  voiceData: {
    duration: Number, // in seconds
    waveform: [Number], // array of amplitude values
    transcription: String // optional voice-to-text
  },

  // ✅ File Metadata
  fileData: {
    originalName: String,
    size: Number, // file size in bytes
    mimeType: String,
    thumbnail: String // for images/videos
  }

}, { timestamps: true });

// ✅ Indexes for better query performance
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });

// ✅ Method to update message status
MessageSchema.methods.updateStatus = async function(userId, newStatus) {
  if (newStatus === "seen") {
    const existingSeen = this.seenBy.find(seen => seen.user.toString() === userId);
    if (!existingSeen) {
      this.seenBy.push({ user: userId });
    }
  } else if (newStatus === "delivered") {
    if (!this.deliveredTo.includes(userId)) {
      this.deliveredTo.push(userId);
    }
  }
  this.status = newStatus;
  return this.save();
};

// ✅ Check if model exists before creating
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
