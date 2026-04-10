"use client";

import { useState, useRef, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from "firebase/auth";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, deleteDoc, doc } from "firebase/firestore";

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  createdAt: any;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [authError, setAuthError] = useState("");

  const [sessionId, setSessionId] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentSessionId") || Date.now().toString();
    }
    return Date.now().toString();
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("currentSessionId", sessionId);
    }
  }, [sessionId]);

  const [queryInput, setQueryInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTyping, setCurrentTyping] = useState("");
  const [statusText, setStatusText] = useState("Welcome. Type your query below to begin.");
  const [isTyping, setIsTyping] = useState(false);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let unsubscribeSnapshot = () => {};
    if (user) {
      const q = query(
        collection(db, "users", user.uid, "sessions", sessionId, "messages"),
        orderBy("createdAt", "asc")
      );
      unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
        const loadedMsgs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Message[];
        setMessages(loadedMsgs);
      }, (error) => {
        console.error("Firestore error:", error);
      });
    } else {
      setMessages([]);
    }
    return () => unsubscribeSnapshot();
  }, [user, sessionId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setMessages([]);
      setCurrentTyping("");
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  const handleNewChat = async () => {
    if (!user) return;
    setSessionId(Date.now().toString());
    setStatusText("Started a new chat session.");
  };

  const handleQuery = async () => {
    if (!queryInput.trim() || isTyping || !user) return;

    const currentQuery = queryInput.trim();
    setQueryInput("");
    setStatusText(`Processing: "${currentQuery}"...`);

    try {
      await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), {
        text: currentQuery,
        sender: "user",
        createdAt: serverTimestamp()
      });
    } catch (e) {
      console.error("Error saving message", e);
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: currentQuery }),
      });
      const data = await res.json();
      
      let aiMessage = "No response received.";
      if (data.error) {
        aiMessage = `Error: ${data.error}`;
      } else {
        aiMessage = data.choices?.[0]?.message?.content || aiMessage;
      }

      setIsTyping(true);
      setCurrentTyping("");
      let i = 0;
      const interval = setInterval(async () => {
        setCurrentTyping((prev) => prev + aiMessage.charAt(i));
        i++;
        if (i >= aiMessage.length) {
          clearInterval(interval);
          setIsTyping(false);
          setCurrentTyping(""); 
          
          try {
            await addDoc(collection(db, "users", user.uid, "sessions", sessionId, "messages"), {
              text: aiMessage,
              sender: "bot",
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error("Error saving bot message:", e);
          }
          setStatusText("Ask anything else...");
        }
      }, 30);
    } catch (error) {
      setStatusText("Failed to connect to the server.");
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages, currentTyping]);

  if (!user) {
    return (
      <div className="container-wrapper">
        <div className="glass-bg"></div>
        <div className="container" style={{ maxWidth: '400px' }}>
          <header>
            <h1 id="main-title" style={{ fontSize: '2.5rem' }}>{isLogin ? "Log In" : "Sign Up"}</h1>
            <p>Premium Silver Chat</p>
          </header>
          <main>
            <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="input-container" style={{ marginBottom: '0' }}>
                <input
                  type="email"
                  id="email-input"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '1rem' }}
                  required
                />
              </div>
              <div className="input-container" style={{ marginBottom: '0' }}>
                <input
                  type="password"
                  id="password-input"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', background: 'transparent', border: 'none', outline: 'none', color: 'white', padding: '1rem' }}
                  required
                />
              </div>
              {authError && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', margin: 0 }}>{authError}</p>}
              <button 
                type="submit" 
                style={{ 
                  padding: '1rem', 
                  borderRadius: '12px', 
                  background: 'var(--silver-gradient)', 
                  border: 'none', 
                  color: 'black', 
                  fontWeight: 'bold', 
                  cursor: 'pointer',
                  marginTop: '1rem'
                }}
              >
                {isLogin ? "Enter Chat" : "Create Account"}
              </button>
            </form>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <button 
                onClick={(e) => { e.preventDefault(); setIsLogin(!isLogin); setAuthError(""); }} 
                style={{ background: 'none', border: 'none', color: '#8e8e8e', cursor: 'pointer', textDecoration: 'underline' }}
              >
                {isLogin ? "Need an account? Sign Up" : "Already have an account? Log In"}
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="container-wrapper">
      <div className="glass-bg"></div>
      <div className="container">
        <header style={{ position: 'relative' }}>
          <h1 id="main-title">Premium Silver Chat</h1>
          <p>{statusText}</p>
          <div style={{ position: 'absolute', top: '0', right: '0', display: 'flex', gap: '0.5rem' }}>
            <button 
              onClick={handleNewChat}
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: '#8e8e8e', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              New Chat
            </button>
            <button 
              onClick={handleLogout}
              style={{ 
                background: 'transparent', 
                border: '1px solid rgba(255,255,255,0.2)', 
                color: '#8e8e8e', 
                padding: '0.5rem 1rem', 
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Log Out
            </button>
          </div>
        </header>

        <main>
          <div className="input-container">
            <input
              type="text"
              id="query-input"
              placeholder="Ask anything..."
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuery()}
              autoFocus
            />
            <button id="submit-btn" onClick={handleQuery}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          <div id="output-area" ref={outputRef} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.map((msg) => (
              <div key={msg.id} style={{ 
                padding: '1rem', 
                borderRadius: '12px', 
                background: msg.sender === 'user' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.3)',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                color: msg.sender === 'user' ? 'white' : '#c0c0c0',
                border: msg.sender === 'user' ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgb(142 142 142 / 30%)'
              }}>
                {msg.text}
              </div>
            ))}
            {isTyping && (
              <div style={{ 
                padding: '1rem', 
                borderRadius: '12px', 
                background: 'rgba(0,0,0,0.3)',
                alignSelf: 'flex-start',
                maxWidth: '80%',
                border: '1px solid rgb(142 142 142 / 30%)'
              }}>
                <span className="typing">{currentTyping}</span>
              </div>
            )}
          </div>
        </main>

        <footer>
          <p>&copy; 2026 Developed with Next.js & OpenRouter</p>
        </footer>
      </div>
    </div>
  );
}
