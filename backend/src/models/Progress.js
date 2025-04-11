const mongoose = require("mongoose");

const progressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
  completedTasks: { type: Number, default: 0 },
  totalTasks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Progress", progressSchema);
