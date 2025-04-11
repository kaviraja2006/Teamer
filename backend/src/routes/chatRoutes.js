import express from "express";
import { 
  getOrCreateChat, 
  sendMessage, 
  getMessages, 
  editMessage, 
  deleteMessage,
  reactToMessage,
  updateMessageStatus,
  getTypingUsers,     
  updateTypingStatus 
} from "../controllers/chatController.js";

const router = express.Router();
// In chatRoutes.js, add this at the top of your routes
// In chatRoutes.js
router.get("/test", (req, res) => {
    console.log("Test route hit");
    res.json({ 
      message: "Chat routes are working",
      timestamp: new Date().toISOString()
    });
  });
  
  

// Chat routes
router.post("/create", getOrCreateChat);  // Changed from /chat to /create
router.post("/send", sendMessage);        // Changed from /message to /send
router.get("/:chatId/messages", getMessages);
router.put("/message/:messageId", editMessage);
router.delete("/message/:messageId", deleteMessage);
router.post("/message/:messageId/react", reactToMessage);
router.put("/message/:messageId/status", updateMessageStatus);
router.get("/:chatId/typing", getTypingUsers);
router.post("/:chatId/typing", updateTypingStatus);



export default router;
