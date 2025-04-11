import { useContext } from "react";
import { ChatContext } from "../context/ChatContext";
import { socket } from "../utils/socket";

const useChat = () => {
  const { messages, setMessages } = useContext(ChatContext);

  const sendMessage = (chatId, senderId, receiverId, text) => {
    const message = { chatId, senderId, receiverId, text };
    socket.emit("sendMessage", message);
    setMessages((prev) => [...prev, message]);
  };

  return { messages, sendMessage };
};

export default useChat;