const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  status: { type: String, enum: ["pending", "completed", "approved"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Task", taskSchema);
