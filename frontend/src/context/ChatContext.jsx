import { createContext, useEffect, useState } from "react";
import { socket } from "../utils/socket";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    socket.on("receiveMessage", (message) => {
      setMessages((prev) => [...prev, message]);
    });
    return () => socket.off("receiveMessage");
  }, []);

  return (
    <ChatContext.Provider value={{ chats, setChats, messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
};