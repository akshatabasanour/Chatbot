"use client";
import { useState, useRef, useEffect } from 'react';
import './page.css';

export default function Dashboard() {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = { role: 'user', content: query };
    const newMessages = [...messages, userMessage];
    
    setQuery('');
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      } else {
        throw new Error('No message returned');
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your API key and network connection and try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container">
      <div className={`glass-panel ${messages.length > 0 ? 'chat-active' : ''}`}>
        
        {messages.length === 0 ? (
          <h1 className="gradient-text">What can I help you find?</h1>
        ) : (
          <div className="chat-container">
            {messages.map((msg, index) => (
              <div key={index} className={`message-wrapper ${msg.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="message-bubble">{msg.content}</div>
              </div>
            ))}
            {isLoading && (
              <div className="message-wrapper assistant">
                <div className="message-bubble typing">
                  <div className="dot"></div><div className="dot"></div><div className="dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="query-form">
          <input 
            type="text" 
            className="query-input" 
            placeholder="Type your query here..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" className={`query-button ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
}
