import mongoose from "mongoose";

const GroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }],
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member"
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  avatar: {
    type: String,
    default: "" // Default group avatar URL
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  messages: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message"
  }],
  settings: {
    onlyAdminsCanPost: { type: Boolean, default: false },
    onlyAdminsCanAddMembers: { type: Boolean, default: false },
    onlyAdminsCanChangeInfo: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
GroupSchema.index({ name: 'text' });
GroupSchema.index({ 'members.user': 1 });

const Group = mongoose.model("Group", GroupSchema);
export default Group;
