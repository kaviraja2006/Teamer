import Group from "../models/Group.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import { uploadToStorage } from "../utils/fileStorage.js"; // Implement this
import mongoose from "mongoose";

// ✅ Create a new group
export const createGroup = async (req, res) => {
  const { name, description, creatorId, members, isPublic } = req.body;

  try {
    // Validate creator exists
    const creator = await User.findById(creatorId);
    if (!creator) {
      return res.status(404).json({ error: "Creator not found" });
    }

    // Create group with initial members
    const group = await Group.create({
      name,
      description,
      creator: creatorId,
      admins: [creatorId],
      members: [
        { user: creatorId, role: "admin" },
        ...(members || []).map(memberId => ({
          user: memberId,
          role: "member"
        }))
      ],
      isPublic
    });

    // Add group to all members' groups array
    await User.updateMany(
      { _id: { $in: [creatorId, ...(members || [])] } },
      { $push: { groups: group._id } }
    );

    await group.populate('members.user', 'name email avatar');
    res.status(201).json(group);
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get group details
export const getGroupDetails = async (req, res) => {
  const { groupId } = req.params;

  try {
    const group = await Group.findById(groupId)
      .populate('members.user', 'name email avatar')
      .populate('creator', 'name email avatar')
      .populate('admins', 'name email avatar');

    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    res.status(200).json(group);
  } catch (error) {
    console.error("Error fetching group details:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Add members to group
export const addMembers = async (req, res) => {
  const { groupId } = req.params;
  const { memberIds, adminId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if admin has permission
    const adminMember = group.members.find(m => m.user.toString() === adminId);
    if (!adminMember || adminMember.role !== "admin") {
      return res.status(403).json({ error: "Only admins can add members" });
    }

    // Filter out existing members
    const existingMemberIds = group.members.map(m => m.user.toString());
    const newMemberIds = memberIds.filter(id => !existingMemberIds.includes(id));

    if (newMemberIds.length === 0) {
      return res.status(400).json({ error: "All users are already members" });
    }

    // Add new members
    const newMembers = newMemberIds.map(userId => ({
      user: userId,
      role: "member"
    }));

    group.members.push(...newMembers);
    await group.save();

    // Add group to new members' groups array
    await User.updateMany(
      { _id: { $in: newMemberIds } },
      { $addToSet: { groups: groupId } }
    );

    await group.populate('members.user', 'name email avatar');
    res.status(200).json(group);
  } catch (error) {
    console.error("Error adding members:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Remove member from group
export const removeMember = async (req, res) => {
  const { groupId, memberId } = req.params;
  const { adminId } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if admin has permission
    const adminMember = group.members.find(m => m.user.toString() === adminId);
    if (!adminMember || adminMember.role !== "admin") {
      return res.status(403).json({ error: "Only admins can remove members" });
    }

    // Cannot remove the creator
    if (memberId === group.creator.toString()) {
      return res.status(403).json({ error: "Cannot remove the group creator" });
    }

    // Remove member
    group.members = group.members.filter(
      member => member.user.toString() !== memberId
    );
    await group.save();

    // Remove group from member's groups array
    await User.findByIdAndUpdate(memberId, {
      $pull: { groups: groupId }
    });

    res.status(200).json({ message: "Member removed successfully" });
  } catch (error) {
    console.error("Error removing member:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Upload File in Group Chat
export const uploadGroupFile = async (req, res) => {
  const { groupId } = req.params;
  const { senderId } = req.body;
  const file = req.file;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    // Check if sender is a member
    const member = group.members.find(m => m.user.toString() === senderId);
    if (!member) {
      return res.status(403).json({ error: "Not a group member" });
    }

    // Upload file to storage
    const fileUrl = await uploadToStorage(file);

    // Create message with file
    const message = await Message.create({
      chatId: groupId,
      sender: senderId,
      messageType: "file",
      fileUrl,
      fileData: {
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
        thumbnail: file.mimetype.startsWith('image/') ? fileUrl : null
      }
    });

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: message._id }
    });

    res.status(200).json(message);
  } catch (error) {
    console.error("Error uploading file:", error);
    res.status(500).json({ error: error.message });
  }
};

// ✅ Create a poll in group chat
export const createGroupPoll = async (req, res) => {
  const { groupId } = req.params;
  const { senderId, question, options, expiresAt, allowMultipleVotes } = req.body;

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ error: "Group not found" });
    }

    const message = await Message.create({
      chatId: groupId,
      sender: senderId,
      messageType: "poll",
      text: question,
      pollData: {
        question,
        options: options.map(opt => ({ text: opt, votes: [] })),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        allowMultipleVotes
      }
    });

    await Group.findByIdAndUpdate(groupId, {
      $push: { messages: message._id }
    });

    res.status(200).json(message);
  } catch (error) {
    console.error("Error creating poll:", error);
    res.status(500).json({ error: error.message });
  }
};
