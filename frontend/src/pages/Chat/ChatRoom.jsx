import { useEffect, useState } from "react";
import useChat from "../../hooks/useChat";

const ChatRoom = ({ chatId }) => {
  const { messages, sendMessage } = useChat();
  const [text, setText] = useState("");

  return (
    <div className="chat-room">
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.senderId === "me" ? "sent" : "received"}`}>
            {msg.text}
          </div>
        ))}
      </div>
      <input type="text" value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={() => sendMessage(chatId, "me", "otherUser", text)}>Send</button>
    </div>
  );
};

export default ChatRoom;
