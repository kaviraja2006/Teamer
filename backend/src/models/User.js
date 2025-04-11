import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  profilePic: {
    type: String,
    default: "https://icon-library.com/images/anonymous-avatar-icon/anonymous-avatar-icon-25.jpg"
  },
  groups: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Group" 
  }],
  status: {
    type: String,
    enum: ["online", "offline", "away"],
    default: "offline"
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Map,
    of: Number,
    default: {}
  },
  notifications: [{
    type: {
      type: String,
      enum: ["message", "group", "system"],
      required: true
    },
    message: String,
    reference: mongoose.Schema.Types.ObjectId,
    read: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { 
  timestamps: true 
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ "notifications.read": 1 });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

// Update last seen
userSchema.methods.updateLastSeen = function() {
  this.lastSeen = new Date();
  return this.save();
};

// Add notification
userSchema.methods.addNotification = function(type, message, reference) {
  this.notifications.push({
    type,
    message,
    reference,
    read: false,
    createdAt: new Date()
  });
  return this.save();
};

// Mark notifications as read
userSchema.methods.markNotificationsAsRead = function() {
  this.notifications.forEach(notification => {
    notification.read = true;
  });
  return this.save();
};

// Update user progress
userSchema.methods.updateProgress = function(groupId, progress) {
  this.progress.set(groupId.toString(), progress);
  return this.save();
};

// Get user progress
userSchema.methods.getProgress = function(groupId) {
  return this.progress.get(groupId.toString()) || 0;
};

// Static method to find by email
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

// Check if model exists before creating
const User = mongoose.models.User || mongoose.model("User", userSchema);
export default User;
