import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare, AlertCircle, Sparkles } from 'lucide-react';

export default function ChatSidebar({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  currentUsername
}) {
  const [activeTab, setActiveTab] = useState('casual'); // 'casual' | 'important'
  const [inputText, setInputText] = useState('');
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100, visible: false });
  const messagesEndRef = useRef(null);
  const tabsContainerRef = useRef(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab, isOpen]);

  // Green hover highlight that follows cursor on tabs
  const handleTabsMouseMove = (e) => {
    if (!tabsContainerRef.current) return;
    const rect = tabsContainerRef.current.getBoundingClientRect();
    setCursorPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true
    });
  };

  const handleTabsMouseLeave = () => {
    setCursorPos(prev => ({ ...prev, visible: false }));
  };

  const handleSend = (e) => {
    e.preventDefault();
    const trimmed = inputText.trim();
    if (!trimmed) return;

    const messageObj = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      username: currentUsername,
      text: trimmed,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channel: activeTab
    };

    onSendMessage(messageObj);
    setInputText('');
  };

  if (!isOpen) return null;

  const filteredMessages = messages.filter(m => (m.channel || 'casual') === activeTab);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '300px',
      maxWidth: '84vw',
      height: '100vh',
      backgroundColor: 'var(--bg-panel)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: '-8px 0 28px rgba(0, 0, 0, 0.7)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Sidebar Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#13151f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MessageSquare size={18} color="var(--accent-teal)" />
          <span style={{ fontWeight: '600', fontSize: '0.95rem', color: '#ffffff' }}>Room Chat</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <X size={18} />
        </button>
      </div>

      {/* Tabs with Green Hover Highlight Following the Cursor */}
      <div
        ref={tabsContainerRef}
        onMouseMove={handleTabsMouseMove}
        onMouseLeave={handleTabsMouseLeave}
        style={{
          position: 'relative',
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: '#10121a',
          overflow: 'hidden'
        }}
      >
        {/* Dynamic Cursor-following Green Highlight */}
        {cursorPos.visible && (
          <div style={{
            position: 'absolute',
            pointerEvents: 'none',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            left: `${cursorPos.x}px`,
            top: `${cursorPos.y}px`,
            background: 'radial-gradient(circle, rgba(51, 214, 166, 0.3) 0%, rgba(51, 214, 166, 0.08) 50%, transparent 80%)',
            transition: 'opacity 0.2s',
            zIndex: 1
          }} />
        )}

        <button
          onClick={() => setActiveTab('casual')}
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 2,
            background: activeTab === 'casual' ? 'rgba(51, 214, 166, 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'casual' ? '2px solid var(--accent-teal)' : '2px solid transparent',
            color: activeTab === 'casual' ? 'var(--accent-teal)' : 'var(--text-secondary)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'color 0.15s, background-color 0.15s'
          }}
        >
          <span>💬 Casual</span>
        </button>

        <button
          onClick={() => setActiveTab('important')}
          style={{
            flex: 1,
            position: 'relative',
            zIndex: 2,
            background: activeTab === 'important' ? 'rgba(242, 169, 59, 0.08)' : 'transparent',
            border: 'none',
            borderBottom: activeTab === 'important' ? '2px solid var(--accent-amber)' : '2px solid transparent',
            color: activeTab === 'important' ? 'var(--accent-amber)' : 'var(--text-secondary)',
            padding: '12px 16px',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'color 0.15s, background-color 0.15s'
          }}
        >
          <AlertCircle size={14} />
          <span>Important</span>
        </button>
      </div>

      {/* Channel description pill */}
      <div style={{
        padding: '8px 16px',
        fontSize: '0.73rem',
        backgroundColor: activeTab === 'important' ? 'rgba(242, 169, 59, 0.06)' : 'rgba(51, 214, 166, 0.04)',
        color: 'var(--text-muted)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        {activeTab === 'important' ? (
          <span>📌 Channel for rules, goals, milestones & critical decisions</span>
        ) : (
          <span>💬 General team banter and quick discussions</span>
        )}
      </div>

      {/* Message List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {filteredMessages.length === 0 ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem'
          }}>
            <p>No messages in {activeTab} yet.</p>
            <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>Be the first to say something!</p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isMe = msg.username === currentUsername;
            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  marginBottom: '3px',
                  justifyContent: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    color: isMe ? 'var(--accent-teal)' : 'var(--text-secondary)'
                  }}>
                    {isMe ? 'You' : msg.username}
                  </span>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                    {msg.time}
                  </span>
                </div>
                <div style={{
                  backgroundColor: isMe
                    ? (activeTab === 'important' ? 'rgba(242, 169, 59, 0.2)' : 'rgba(51, 214, 166, 0.18)')
                    : 'var(--bg-panel-secondary)',
                  border: `1px solid ${isMe ? (activeTab === 'important' ? 'rgba(242, 169, 59, 0.4)' : 'rgba(51, 214, 166, 0.35)') : 'var(--border-color)'}`,
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  lineHeight: '1.4',
                  wordBreak: 'break-word',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSend}
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: '#12141e',
          display: 'flex',
          gap: '8px'
        }}
      >
        <input
          type="text"
          placeholder={`Message #${activeTab}...`}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            backgroundColor: 'var(--bg-input)',
            border: '1px solid var(--border-color)',
            borderRadius: '6px',
            padding: '8px 12px',
            color: 'var(--text-primary)',
            fontSize: '0.85rem',
            outline: 'none'
          }}
          onFocus={(e) => e.target.style.borderColor = activeTab === 'important' ? 'var(--accent-amber)' : 'var(--accent-teal)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <button
          type="submit"
          style={{
            backgroundColor: activeTab === 'important' ? 'var(--accent-amber)' : 'var(--accent-teal)',
            color: '#12141e',
            border: 'none',
            borderRadius: '6px',
            padding: '0 14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}

