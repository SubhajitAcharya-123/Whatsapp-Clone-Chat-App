
import "../styles/Chat.css";
import { useEffect, useState, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";
import authFetch from "../utils/authFetch";

function Chat() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const stompClient = useRef(null);
  const [connected, setConnected] = useState(false);
  // const [username, setUsername] = useState("");
  // const [isJoined, setIsJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [newContact, setNewContact] = useState("");
  const [lastMessages, setLastMessages] = useState({});
  const [unread, setUnread] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showSidebar, setShowSidebar] = useState(true);
  const [file, setFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const prevHeightRef = useRef(0);
  let typingTimeout = useRef(null);
  const activeChatRef = useRef(null);

  const userData = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!userData) {
      window.location.href = "/";
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);

      if (!mobile) {
        setShowSidebar(true);
      } else {
        setShowSidebar(true); // reset to sidebar view on mobile
      }
    };

    handleResize(); // run once
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const username = userData.username;

  const chatRef = useRef();

  const fetchUnread = async () => {
    if (!username) return;
    let res = await authFetch(`http://localhost:8080/api/chat/unread`);
    let data = await res.json();
    setUnread(data);
  };
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    if (!connected || !roomId) return;

    const sub = stompClient.current.subscribe(
      `/topic/typing/${roomId}`,
      (msg) => {
        const user = msg.body;

        if (user && user !== username) {
          setTypingUser(user);

          // auto remove after 1 sec
          setTimeout(() => setTypingUser(null), 1000);
        } else {
          setTypingUser(null);
        }
      }
    );

    return () => sub.unsubscribe();
  }, [connected, roomId]);

  useEffect(() => {
    const handleScroll = () => {
      if (!chatRef.current || !hasMore) return;

      if (chatRef.current.scrollTop === 0) {
        setPage(prev => {
          const next = prev + 1;
          loadMessages(next);
          return next;
        });
      }
    };

    const chatDiv = chatRef.current;

    if (chatDiv) {
      chatDiv.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (chatDiv) {
        chatDiv.removeEventListener("scroll", handleScroll);
      }
    };
  }, [hasMore]);

  useEffect(() => {
    if (!username) return;

    const loadContacts = async () => {
      try {
        let res = await authFetch(`http://localhost:8080/api/chat/contacts`);


        if (!res.ok) {
          console.log("API failed:", res.status);
          setContacts([]);
          return;
        }

        let data = await res.json();

        if (!Array.isArray(data)) {
          console.log("Invalid data:", data);
          return;
        }

        // extract names
        const names = data.map(c => c.contactName);

        setContacts(names);

        // 2. Load last messages (NEW)
        let res2 = await authFetch(`http://localhost:8080/api/chat/lastMessages`);
        let data2 = await res2.json();

        const map = {};
        data2.forEach(m => {
          map[m.contact] = {
            text: m.text,
            time: m.timestamp
          };
        });

        setLastMessages(map);
        let res3 = await authFetch(`http://localhost:8080/api/chat/unread`);
        let data3 = await res3.json();
        setUnread(data3);
      } catch (e) {
        console.log("Error loading contacts", e);
      }
    };

    loadContacts();
  }, [username]);

  const formatTime = (time) => {
    if (!time) return "";

    const date = new Date(time);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getRoomId = (user1, user2) => {
    return [user1, user2].sort().join("_");
  };

  const addContact = async () => {
    if (!newContact.trim()) return;
    if (contacts.includes(newContact)) {
      alert("Contact already exists");
      return;
    }

    try {
      const res = await authFetch("http://localhost:8080/api/chat/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          // owner: username,
          contactName: newContact
        })
      });

      if (!res.ok) {
        const errorText = await res.text();   //  get backend message
        alert(errorText);                    //  show in UI
        return;
      }

      setContacts(prev => [...prev, newContact]);
      setNewContact("");

    } catch (e) {
      console.log("Error adding contact", e);
    }
  };

  const openChat = async (contact) => {
    if (activeChat === contact) return;
    const room = getRoomId(username, contact);

    console.log("SETTING ACTIVE:", username, room);

    await authFetch(`http://localhost:8080/api/chat/active`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: username,
        roomId: room
      })
    });

    setMessages([]);
    setPage(0);          //  reset page
    setHasMore(true);    //  reset pagination
    setActiveChat(contact);
    setRoomId(room); // set at last

    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
    await fetchUnread();
  };
  const joinRoom = (room) => {
    setMessages([]);
    setRoomId(room);
  };

  useEffect(() => {
    if (roomId && connected) {
      loadMessages(0);   // ✅ correct timing
    }
  }, [roomId, connected]);

  useEffect(() => {
    if (!chatRef.current) return;

    // only for first page (initial load)
    if (page === 0) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 50);
    }
  }, [messages, page]);

  // ✅ Load old messages (KEEP REST)
  const loadMessages = async (pageNum = 0) => {
    if (!roomId) {
      console.log("❌ roomId missing");
      return;
    }
    let res = await authFetch(`http://localhost:8080/api/chat/${roomId}?page=${pageNum}&size=20`);
    if (!res.ok) {
      console.log("API ERROR:", res.status);
      return;
    }
    let data = await res.json();

    console.log("API RESPONSE:", data); // 🔥 DEBUG

    if (!Array.isArray(data.content)) {
      setMessages([]);
      return;
    }

    // IMPORTANT: reverse because backend is DESC
    const newMessages = [...data.content].reverse();

    if (pageNum === 0) {
      setMessages(newMessages);
    } else {
      setMessages(prev => [...newMessages, ...prev]);
    }

    setHasMore(!data.last);

    const msgs = Array.isArray(data.content) ? data.content : data;

    if (msgs.length > 0) {
      const lastMsg = msgs[msgs.length - 1];

      const [user1, user2] = roomId.split("_");
      const otherUser =
        lastMsg.sender === user1 ? user2 : user1;

      setLastMessages(prev => ({
        ...prev,
        [otherUser]: {
          text: lastMsg.content,
          time: lastMsg.timestamp
        }
      }));
    }
  };
  useEffect(() => {
    if (!username) return;
    const socket = new SockJS(`http://localhost:8080/chat`);
    const token = localStorage.getItem("token");
    const client = new Client({
      webSocketFactory: () => socket,

      connectHeaders: {
        Authorization: `Bearer ${token}`  // 🔥 ADD THIS
      },

      onConnect: () => {
        console.log("Connected");
        setConnected(true);

        fetchUnread();

        stompClient.current.subscribe("/topic/online", (msg) => {
          const users = JSON.parse(msg.body);
          console.log("ONLINE USERS:", users);
          setOnlineUsers(users);
        });

        // initial fetch
        authFetch("http://localhost:8080/api/chat/online")
          .then(res => res.json())
          .then(data => setOnlineUsers(data));


      },

      onStompError: (frame) => {
        console.error("Broker error:", frame);
      }
    });

    client.activate();
    stompClient.current = client;

    return () => {
      client.deactivate();
    };
  }, [username]);

  useEffect(() => {
    if (!roomId || !connected) return;

    console.log("Subscribing to:", roomId);


    const subscription = stompClient.current.subscribe(
      `/topic/messages/${roomId}`,
      (msg) => {
        const message = JSON.parse(msg.body);

        setMessages(prev => [...prev, message]);

        if (
          message.sender !== username
        ) {
          authFetch("http://localhost:8080/api/chat/active", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              // username: username,
              roomId: roomId
            })
          });
        }
        const [user1, user2] = roomId.split("_");

        const otherUser = message.sender === user1 ? user2 : user1;
        if (!otherUser) return;
        setLastMessages(prev => ({
          ...prev,

          [otherUser]: {
            text: message.content,
            time: message.timestamp
          }
        }));
      }
    );

    return () => {
      subscription.unsubscribe(); 
    };

  }, [roomId, connected]);

  useEffect(() => {
    if (!connected || !roomId) return;

    const sub = stompClient.current.subscribe(
      `/topic/status/${roomId}`,
      (msg) => {
        const updates = JSON.parse(msg.body);

        const arr = Array.isArray(updates) ? updates : [updates];

        setMessages(prev =>
          prev.map(m => {
            const updated = arr.find(u => u.id === m.id);
            return updated ? { ...m, status: updated.status } : m;
          })
        );
      }
    );

    return () => sub.unsubscribe();
  }, [connected, roomId]);

  useEffect(() => {
    if (!connected) return;

    const subscription = stompClient.current.subscribe(
      "/user/queue/messages",
      (msg) => {
        console.log("📩 PERSONAL MESSAGE RECEIVED", msg.body);
        const message = JSON.parse(msg.body);

        const room = message.roomId;
        const [u1, u2] = room.split("_");

        const otherUser = message.sender === username ?
          (u1 === username ? u2 : u1)
          : message.sender;

        // ONLY receiver triggers delivered
        const isChatOpen = activeChatRef.current === otherUser;

        if (message.sender !== username && !isChatOpen) {
          authFetch("http://localhost:8080/api/chat/delivered", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              messageId: message.id
            })
          });
        }

        fetchUnread();


        // last message
        setLastMessages(prev => ({
          ...prev,
          [otherUser]: {
            text: message.content,
            time: message.timestamp
          }
        }));
      }
    );

    return () => subscription.unsubscribe();
  }, [connected]);


  // Send via WebSocket
  const sendMessage = async () => {
    if (!text.trim() && !file) return;
    if (file && file.size > 20 * 1024 * 1024) {
      alert("File too large! Max 20MB");
      return;
    }
    if (!username.trim()) {
      alert("Enter a valid name");
      return;
    }

    if (!connected) {
      console.log("Not connected yet!");
      return;
    }

    let fileUrl = null;
    let fileType = null;
    if (file) {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8080/api/file/upload", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        console.log("Upload failed:", res.status);
        return;
      }

      const data = await res.json();
      console.log("UPLOAD SUCCESS:", data);
      fileUrl = data.url;

      if (file.type.startsWith("image")) {
        fileType = "image";
      } else {
        fileType = "file";
      }
    }
    stompClient.current.publish({
      destination: `/app/send/${roomId}`,
      body: JSON.stringify({
        content: text,
        fileUrl: fileUrl,
        fileType: fileType
      })
    });

    if (!activeChat) return;
    setLastMessages(prev => ({
      ...prev,
      [activeChat]: {
        text: text,
        time: new Date().toISOString()
      }
    }));

    setText("");
    setFile(null);
  };
  
  return (
    <div className="app">

      {/* SIDEBAR */}
      {(!isMobile || showSidebar) && (
        <div className="sidebar">
          <div>
            <h3>Welcome, {username}</h3>
          </div>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("user");
              window.location.href = "/";
            }}
          >
            Logout
          </button>

          <h4>Contacts</h4>

          {contacts.map((c, i) => (
            <div
              key={i}
              onClick={() => openChat(c)}
              className={`contact ${activeChat === c ? "active" : ""}`}
            >
              <div className="contact-top">
                <div className="contact-name">
                  <b>{c}</b>
                  <span className="status-dot">
                    {onlineUsers.includes(c) ? "🟢" : "⚫"}
                  </span>
                </div>

                {unread[c] > 0 && (
                  <span className="unread-badge">{unread[c]}</span>
                )}
              </div>

              <div className="last-message">
                {lastMessages[c]?.text || "No messages yet"}
              </div>

              <div className="time">
                {formatTime(lastMessages[c]?.time)}
              </div>
            </div>
          ))}

          <div className="add-contact">
            <input
              value={newContact}
              onChange={(e) => setNewContact(e.target.value)}
              placeholder="Add contact"
            />
            <button onClick={addContact}>Add</button>
          </div>
        </div>
      )}

      {/* CHAT AREA */}
      {(!isMobile || !showSidebar) && (
        <div className="chat-area">

          {(!isMobile && !activeChat) ? (
            <div className="empty-chat">
              <h2>Select a contact to start chatting</h2>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="chat-header">
                {isMobile && (
                  <button onClick={() => {
                    setShowSidebar(true);
                    setActiveChat(null);
                    setRoomId(null);        
                    setMessages([]);
                  }}>
                    ← Back
                  </button>
                )}
                <h3>{activeChat}</h3>
                <p>
                  {onlineUsers.includes(activeChat)
                    ? "🟢 Online"
                    : "⚫ Offline"}
                </p>

                <div className="typing-box">
                  {typingUser && <span>{typingUser} is typing...</span>}
                </div>
              </div>

              {/* MESSAGES */}
              <div ref={chatRef} className="messages">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`message ${m.sender === username ? "sent" : "received"
                      }`}
                  >
                    {m.content && <div>{m.content}</div>}

                    {/* IMAGE MESSAGE */}
                    {m.fileType === "image" && (
                      <img
                        src={m.fileUrl}
                        alt="img"
                        className="chat-image"
                        onClick={() => setPreviewImage(m.fileUrl)}
                      />
                    )}

                    {/* FILE */}
                    {m.fileType === "file" && (
                      <a href={m.fileUrl} target="_blank" rel="noreferrer">
                        📎 Download File
                      </a>
                    )}

                    <div className="meta">
                      {formatTime(m.timestamp)}{" "}
                      {m.sender === username && (
                        m.status === "SENT" ? "✔" :
                          m.status === "DELIVERED" ? "✔✔" :
                            m.status === "SEEN" ? <span className="seen">✔✔</span> :
                              "✔"
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {file && (
                <div style={{ fontSize: "12px", color: "gray", padding: "5px 10px" }}>
                  Selected: {file.name}
                </div>
              )}
              {/* INPUT */}
              <div className="input-box">
                <div className="file-upload">
                  <button onClick={() => document.getElementById("fileInput").click()}>
                    ➕
                  </button>

                  <input
                    id="fileInput"
                    type="file"
                    style={{ display: "none" }}
                    onChange={(e) => setFile(e.target.files[0])}
                  />
                </div>
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);

                    stompClient.current.publish({
                      destination: `/app/typing/${roomId}`
                    });

                    if (typingTimeout.current) {
                      clearTimeout(typingTimeout.current);
                    }

                    typingTimeout.current = setTimeout(() => {
                      stompClient.current.publish({
                        destination: `/app/stopTyping/${roomId}`
                      });
                    }, 1000);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage();
                  }}
                  placeholder="Type a message..."
                />

                <button onClick={sendMessage} disabled={!connected}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}
      {previewImage && (
        <div
          className="image-modal"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="preview" />
        </div>
      )}
    </div>
  );
}

export default Chat;