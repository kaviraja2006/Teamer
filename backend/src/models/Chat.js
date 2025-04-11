import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  messageType: {
    type: String,
    enum: ["direct", "group"],
    default: "direct"
  },
  text: { type: String, trim: true },
  fileUrl: { type: String }, // Stores file/media URLs
  reactions: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      emoji: String,
    },
  ],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" }, // Quoted message
  mentions: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Mentioned users
  isEdited: { type: Boolean, default: false },
  disappearingMessage: { type: Date }, // Auto-delete message after a time

  // ✅ Message status tracking (sent, delivered, seen)
  status: { 
    type: String, 
    enum: ["sent", "delivered", "seen"], 
    default: "sent" 
  },

  // ✅ Track which users have seen the message
  seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  
  // ✅ Track which users have received the message
  deliveredTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
}, {
  timestamps: true
});

// ✅ Method to update message status
MessageSchema.methods.updateStatus = async function(userId, newStatus) {
  if (newStatus === "seen") {
    if (!this.seenBy.includes(userId)) {
      this.seenBy.push(userId);
    }
  }
  this.status = newStatus;
  return this.save();
};

// Check if model already exists before creating
const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);
export default Message;
