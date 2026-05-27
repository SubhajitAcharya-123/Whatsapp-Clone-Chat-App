
import "../styles/Chat.css";
import { useEffect, useState, useLayoutEffect, useRef } from "react";
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
  const [preview, setPreview] = useState(null);
  const prevHeightRef = useRef(0);
  let typingTimeout = useRef(null);
  const activeChatRef = useRef(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const loadingRef = useRef(false);
  const initialLoadRef = useRef(true);
  const previousHeightRef = useRef(0);


  const userData = JSON.parse(localStorage.getItem("user"));

  const showError = (msg) => {
    setErrorMessage(msg);

    setTimeout(() => {
      setErrorMessage("");
    }, 3000);
  };
  useEffect(() => {
    if (!userData) {
      window.location.href = "/";
    }
  }, []);
  useEffect(() => {
    if (page > 0) {
      loadMessages(page);
    }
  }, [page]);
  useEffect(() => {
    if (!roomId || !connected) return;

    initialLoadRef.current = true;
    setMessages([]);
    setPage(0);
    setHasMore(true);

    loadMessages(0).finally(() => {
      setTimeout(() => {
        initialLoadRef.current = false;
      }, 100);
    });
  }, [roomId, connected]);
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
    const chatDiv = chatRef.current;
    if (!chatDiv) return;
    const handleScroll = () => {

      if (!chatDiv || !hasMore || loadingRef.current || initialLoadRef.current) return;

      if (chatRef.current.scrollTop <= 5) {
        console.log("TOP HIT", "page=", page);
        previousHeightRef.current = chatRef.current.scrollHeight;
        setPage(prev => prev + 1);
      }
    };

    chatDiv.addEventListener("scroll", handleScroll);

    return () => {
      chatDiv.removeEventListener("scroll", handleScroll);
    };
  }, [hasMore, page, roomId]);
  useLayoutEffect(() => {
    if (page === 0) return;
    if (!chatRef.current || !previousHeightRef.current) return;

    const chatDiv = chatRef.current;

    // Calculate how much new content was added to the top
    const newHeight = chatDiv.scrollHeight;
    const heightDifference = newHeight - previousHeightRef.current;

    // Seamlessly adjust the scroll pointer so the user stays in the exact same visual spot
    chatDiv.scrollTop = heightDifference;

    // Clear the ref until the next top-hit event
    previousHeightRef.current = null;
  }, [messages]);
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
        console.log("LAST MESSAGES API:", data2);
        const map = {};
        data2.forEach(m => {
          let previewText = m.text?.trim();

          if (!previewText) {
            if (m.fileType === "image") {
              previewText = "📷 Photo";
            } else if (m.fileType === "pdf") {
              previewText = "📄 PDF";
            } else if (m.fileType === "file") {
              previewText = "📎 File";
            } else {
              previewText = "No messages yet";
            }
          }

          map[m.contact] = {
            text: previewText,
            time: m.timestamp
          };
        });

        setLastMessages(map);
        let res3 = await authFetch(`http://localhost:8080/api/chat/unread`);
        let data3 = await res3.json();
        setUnread(data3);
      } catch (e) {
        console.error("Error loading contacts", e);
        showError("Failed to load contacts");
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
      showError("Failed to add contact");
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
    // initialLoadRef.current = true;
    // setMessages([]);
    // setPage(0);          //  reset page
    // setHasMore(true);    //  reset pagination
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

  // useEffect(() => {
  //   if (roomId && connected) {
  //     loadMessages(0);   // ✅ correct timing
  //   }
  // }, [roomId, connected]);

  // useEffect(() => {
  //   if (!chatRef.current) return;

  //   // only for first page (initial load)
  //   if (page === 0) {
  //     console.log(
  //     "INITIAL SCROLL",
  //     "scrollHeight=",
  //     chatRef.current.scrollHeight
  //   );
  //     setTimeout(() => {
  //       chatRef.current.scrollTop = chatRef.current.scrollHeight;
  //       initialLoadRef.current = false;
  //       console.log(
  //       "AFTER INITIAL SCROLL",
  //       "scrollTop=",
  //       chatRef.current.scrollTop
  //     );
  //     }, 50);
  //   }
  // }, [messages, page]);
  useEffect(() => {
    if (!roomId) return;
    console.log("ROOM:", roomId, "PAGE:", page);
  }, [roomId, page]);
  // ✅ Load old messages (KEEP REST)
  const loadMessages = async (pageNum = 0) => {
    console.log("LOAD REQUEST", roomId, pageNum, "loading:", loadingRef.current, "messages:", messages.length);
    if (loadingRef.current) return;

    loadingRef.current = true;
    try {
      console.log("LOADING PAGE:", pageNum);
      console.log("LOAD", roomId, "PAGE", pageNum, "TIME", Date.now());
      if (!roomId) {
        console.log("❌ roomId missing");
        return;
      }
      let res = await authFetch(`http://localhost:8080/api/chat/${roomId}?page=${pageNum}&size=20`);
      if (!res.ok) {
        console.log("API ERROR:", res.status);
        showError("Failed to load messages");
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
      console.log(
        "NEW PAGE IDS:",
        newMessages.map(m => m.id)
      );
      if (pageNum === 0) {
        setMessages(newMessages);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (chatRef.current) {
              console.log(
                "AUTO SCROLL",
                chatRef.current.scrollHeight
              );
              chatRef.current.scrollTop =
                chatRef.current.scrollHeight;
              console.log(
                "AFTER AUTO SCROLL",
                chatRef.current.scrollTop
              );
              initialLoadRef.current = false;
            }
          });
        });
      } else {
        setMessages(prev => {
          const existing = new Set(prev.map(m => m.id));

          const unique = newMessages.filter(
            m => !existing.has(m.id)
          );
          console.log(
            "ADDING",
            unique.length,
            "OLD MESSAGES"
          );
          return [...unique, ...prev];
        });
      }

      setHasMore(!data.last);

      const msgs = Array.isArray(data.content) ? data.content : data;

      if (pageNum == 0 && msgs.length > 0) {
        const lastMsg = [...data.content].sort(
          (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
        )[0];
        console.log("last Message :", lastMsg.content, lastMsg.timestamp)
        const [user1, user2] = roomId.split("_");
        const otherUser =
          lastMsg.sender === user1 ? user2 : user1;
        let previewText = lastMsg.content?.trim();

        if (!previewText) {
          if (lastMsg.fileType === "image") {
            previewText = "📷 Photo";
          } else if (lastMsg.fileType === "pdf") {
            previewText = "📄 PDF";
          } else if (lastMsg.fileType === "file") {
            previewText = "📎 File";
          } else {
            previewText = "No messages yet";
          }
        }

        setLastMessages(prev => ({
          ...prev,
          [otherUser]: {
            text: previewText,
            time: lastMsg.timestamp
          }
        }));
      }
    } finally {
      loadingRef.current = false;
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
        showError("Connection problem");
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

        setMessages(prev => {
          const exists = prev.some(m => m.id === message.id);

          if (exists) {
            return prev;
          }

          return [...prev, message];
        });

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
        let previewText = message.content?.trim();

        if (!previewText) {
          if (message.fileType === "image") {
            previewText = "📷 Photo";
          } else if (message.fileType === "pdf") {
            previewText = "📄 PDF";
          } else if (message.fileType === "file") {
            previewText = "📎 File";
          } else {
            previewText = "No messages yet";
          }
        }
        setLastMessages(prev => ({
          ...prev,

          [otherUser]: {
            text: previewText,
            time: message.timestamp
          }
        }));
      }
    );

    return () => {
      console.log("UNSUBSCRIBE:", roomId);
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
    try {
      if (!text.trim() && !file) return;
      if (file && file.size > 10 * 1024 * 1024) {
        alert("File too large! Max 10MB");
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
        try {
          setUploading(true);
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
          fileType = data.fileType;
        } finally {
          setUploading(false);
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
      let previewText = text.trim();

      if (!previewText) {
        if (fileType === "image") previewText = "📷 Photo";
        else if (fileType === "pdf") previewText = "📄 PDF";
        else if (fileType === "file") previewText = "📎 File";
      }
      setLastMessages(prev => ({
        ...prev,
        [activeChat]: {
          text: previewText,
          time: new Date().toISOString()
        }
      }));

      setText("");
      setFile(null);
    } catch (e) {
      console.error("Send failed", e);
      showError("Failed to send message");
    }
  };

  return (
    <div className="app">
      {errorMessage && (
        <div className="error-toast">
          {errorMessage}
        </div>
      )}
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
                {console.log(
                  "MESSAGE IDS:",
                  messages.map(m => m.id)
                )}
                {loadingRef.current && page > 0 && (
                  <div className="history-loading-spinner">
                    <span className="spinner-circle"></span>
                    Loading older messages...
                  </div>
                )}
                {messages.map((m) => (
                  // console.log("FILE TYPE =", m.fileType),
                  console.log(
                    "RENDER COUNT:",
                    messages.length
                  ),
                  <div
                    key={m.id}
                    className={`message ${m.sender === username ? "sent" : "received"
                      }`}
                  >
                    {m.content && <div>{m.content}</div>}

                    {/* IMAGE MESSAGE */}
                    {m.fileType === "image" && (
                      <>
                        {console.log("IMAGE URL:", m.fileUrl)}
                        <img
                          src={m.fileUrl}
                          alt="img"
                          height={250}
                          width={250}
                          className="chat-image"
                          onLoad={(e) => {
                            console.log(
                              "IMAGE SIZE",
                              e.target.naturalWidth,
                              e.target.naturalHeight
                            );

                          }}
                          onClick={() =>
                            setPreview({
                              type: "image",
                              url: m.fileUrl
                            })}
                        />
                      </>
                    )}

                    {/* FILE */}
                    {(m.fileType === "file" || m.fileType === "pdf") && (
                      <div className="file-card">
                        📄 Document

                        <div className="file-actions">
                          <button onClick={() => {
                            console.log("PREVIEW URL:", m.fileUrl);
                            setPreview({
                              type: m.fileType,
                              url: m.fileUrl
                            });
                            console.log("PREVIEW IS :", preview);
                          }
                          }>
                            Preview
                          </button>

                          <a href={m.fileUrl} target="_blank" rel="noreferrer" download>
                            Download
                          </a>
                        </div>
                      </div>
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
              {preview && (
                <div
                  className="modal"
                  onClick={() => setPreview(null)}
                >
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button className="close-btn" onClick={() => setPreview(null)}>
                      ✕
                    </button>
                    {preview.type === "image" ? (
                      <img src={preview.url} style={{ width: "100%" }} />
                    ) : (preview.type === "pdf" || preview.type === "file") ? (
                      <iframe
                        src={preview.url}
                        width="100%"
                        height="600px"
                      />
                    ) : (
                      <div>
                        <p>File cannot be previewed</p>
                        <a href={preview.url} download>
                          Download
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {file && (
                <div style={{ fontSize: "12px", color: "gray", padding: "5px 10px" }}>
                  Selected: {file.name}
                </div>
              )}
              {uploading && (
                <div className="uploading-msg">
                  ⏳ Uploading file, please wait...
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

                <button onClick={sendMessage} disabled={!connected || uploading}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}

export default Chat;