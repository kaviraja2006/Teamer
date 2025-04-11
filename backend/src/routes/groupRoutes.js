import express from "express";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });
import {
  createGroup,
  getGroupDetails,
  addMembers,
  removeMember,
  updateGroupSettings
} from "../controllers/groupController.js";

const router = express.Router();

// Group routes
router.post("/create", createGroup);
router.get("/:groupId", getGroupDetails);
router.post("/:groupId/members", addMembers);
router.delete("/:groupId/members/:memberId", removeMember);
router.put("/:groupId/settings", updateGroupSettings);
router.post("/:groupId/files", upload.single("file"), uploadGroupFile);
router.post("/:groupId/polls", createGroupPoll);
router.post("/messages/:messageId/vote", votePoll);

export default router;
