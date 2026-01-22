import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:5000");

function App() {
  const [username, setUsername] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState("");

  const typingTimeout = useRef(null);

  useEffect(() => {
    socket.on("receiveMessage", (data) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("onlineUsers", (users) => {
      setOnlineUsers(users);
    });

    socket.on("typing", (user) => {
      setTypingUser(user);
    });

    socket.on("stopTyping", () => {
      setTypingUser("");
    });

    return () => {
      socket.off();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;

    const msgData = {
      user: username,
      text: message,
      time: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, msgData]);
    socket.emit("sendMessage", msgData);
    socket.emit("stopTyping");

    setMessage("");
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit("typing", username);

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping");
    }, 800);
  };

  if (!loggedIn) {
    return (
      <div className="login-container">
        <h2>Enter your name</h2>
        <input
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          onClick={() => {
            if (username.trim()) {
              setLoggedIn(true);
              socket.emit("join", username);
            }
          }}
        >
          Join Chat
        </button>
      </div>
    );
  }

  return (
    <div className="chat-wrapper">
      <div className="sidebar">
        <h3>Online</h3>
        {onlineUsers.map((u, i) => (
          <div key={i} className="online-user">
             {u}
          </div>
        ))}
      </div>

      <div className="chat-container">
        <div className="chat-header">Chat-App</div>

        <div className="messages">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`bubble ${
                msg.user === username ? "sent" : "received"
              }`}
            >
              <div className="user">{msg.user}</div>
              <div>{msg.text}</div>
              <span className="time">{msg.time}</span>
            </div>
          ))}
        </div>

        {typingUser && (
          <div className="typing"> {typingUser} is typing...</div>
        )}

        <div className="input-box">
          <input
            placeholder="Type a message"
            value={message}
            onChange={handleTyping}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;