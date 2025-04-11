const Task = require("../models/Task");
const Progress = require("../models/Progress");
import User from "../models/User.js";  // Note the .js extension


exports.createTask = async (req, res) => {
  try {
    const { groupId, assignedTo, description } = req.body;
    const task = new Task({ group: groupId, assignedTo, description });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.markTaskCompleted = async (req, res) => {
  try {
    const { taskId } = req.body;
    const task = await Task.findById(taskId);
    task.status = "completed";
    await task.save();

    const progress = await Progress.findOne({ user: task.assignedTo, group: task.group });
    if (progress) {
      progress.completedTasks += 1;
      await progress.save();
    }
    
    res.json({ message: "Task marked as completed." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
