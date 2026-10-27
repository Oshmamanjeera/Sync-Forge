import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { html } from '@codemirror/lang-html';
import { oneDark } from '@codemirror/theme-one-dark';
import { socket } from '../socket.js';
import ParticipantsDropdown from '../components/ParticipantsDropdown.jsx';
import Toasts from '../components/Toasts.jsx';
import ChatSidebar from '../components/ChatSidebar.jsx';
import AICopilotSidebar from '../components/AICopilotSidebar.jsx';
import OutputPanel from '../components/OutputPanel.jsx';
import VideoCallArea from '../components/VideoCallArea.jsx';
import {
  Play,
  Users,
  MessageSquare,
  Bot,
  Video,
  Copy,
  Check,
  Code2,
  FileCode,
  Terminal,
  Share2,
  LogOut
} from 'lucide-react';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://syncforge-2jqjg64v.livekit.cloud';

const LANGUAGE_CONFIG = {
  javascript: { name: 'JavaScript', extension: javascript({ jsx: true }), fileTab: 'App.jsx' },
  python: { name: 'Python', extension: python(), fileTab: 'main.py' },
  cpp: { name: 'C++', extension: cpp(), fileTab: 'main.cpp' },
  java: { name: 'Java', extension: java(), fileTab: 'Main.java' },
  html: { name: 'HTML', extension: html(), fileTab: 'index.html' }
};

export default function RoomPage() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const username = searchParams.get('name') || `User_${Math.floor(Math.random() * 1000)}`;

  // Editor state
  const [code, setCode] = useState('// Connecting to SyncForge room...');
  const [language, setLanguage] = useState('javascript');
  const isRemoteChange = useRef(false);

  // Users & Host state
  const [users, setUsers] = useState([]);
  const [hostUsername, setHostUsername] = useState(null);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  // Toasts state
  const [toasts, setToasts] = useState([]);

  // Chat state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Copilot state
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotHistory, setCopilotHistory] = useState([]);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  // Code Execution state
  const [executionOutput, setExecutionOutput] = useState('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [execMeta, setExecMeta] = useState(null);

  // Video call state
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [liveKitToken, setLiveKitToken] = useState(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);

  // Copy Room ID state
  const [copiedRoom, setCopiedRoom] = useState(false);

  // Add toast helper
  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // 1. Socket Setup & Room Listeners
  useEffect(() => {
    if (!roomId || !username) return;

    // Join room
    socket.emit('join-room', { roomId, username });

    // Named handlers for clean unmounting under React StrictMode
    function handleCurrentCode({ code: initialCode, language: initialLang }) {
      isRemoteChange.current = true;
      if (initialCode !== undefined) setCode(initialCode);
      if (initialLang && LANGUAGE_CONFIG[initialLang]) setLanguage(initialLang);
      setTimeout(() => {
        isRemoteChange.current = false;
      }, 50);
    }

    function handleCodeUpdate(newCode) {
      isRemoteChange.current = true;
      setCode(newCode);
      setTimeout(() => {
        isRemoteChange.current = false;
      }, 50);
    }

    function handleLanguageUpdate(newLang) {
      if (LANGUAGE_CONFIG[newLang]) {
        setLanguage(newLang);
      }
    }

    function handleUserList({ users: currentUsers, hostUsername: currentHost }) {
      setUsers(currentUsers || []);
      setHostUsername(currentHost);
    }

    function handleUserJoined({ username: joinedUser }) {
      addToast(`${joinedUser} joined the forge`, 'join');
    }

    function handleUserLeft({ username: leftUser }) {
      addToast(`${leftUser} left the forge`, 'leave');
    }

    function handleChatHistory(history) {
      setChatMessages(history || []);
    }

    function handleNewMessage(message) {
      setChatMessages(prev => {
        if (prev.some(m => m.id === message.id)) return prev;
        return [...prev, message];
      });
      if (!isChatOpen) {
        setUnreadChatCount(prev => prev + 1);
      }
    }

    function handleVideoCallStarted() {
      setVideoCallActive(true);
      addToast('A video call has started in this room', 'info');
    }

    // Attach named listeners
    socket.on('current-code', handleCurrentCode);
    socket.on('code-update', handleCodeUpdate);
    socket.on('language-update', handleLanguageUpdate);
    socket.on('user-list', handleUserList);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('chat-history', handleChatHistory);
    socket.on('new-message', handleNewMessage);
    socket.on('video-call-started', handleVideoCallStarted);

    return () => {
      socket.off('current-code', handleCurrentCode);
      socket.off('code-update', handleCodeUpdate);
      socket.off('language-update', handleLanguageUpdate);
      socket.off('user-list', handleUserList);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('chat-history', handleChatHistory);
      socket.off('new-message', handleNewMessage);
      socket.off('video-call-started', handleVideoCallStarted);
    };
  }, [roomId, username, addToast, isChatOpen]);

  // Code editor change handler
  const handleEditorChange = useCallback((value) => {
    setCode(value);
    if (!isRemoteChange.current) {
      socket.emit('code-change', { roomId, code: value });
    }
  }, [roomId]);

  // Language change handler
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socket.emit('language-change', { roomId, language: newLang });
  };

  // Chat send handler
  const handleSendMessage = (messageObj) => {
    socket.emit('send-message', { roomId, message: messageObj });
  };

  // Code execution handler (STAGE 4)
  const runCode = async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setExecutionOutput('');
    setExecMeta(null);

    try {
      const response = await fetch(`${SERVER_URL}/run-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      const data = await response.json();
      if (response.ok && data.run) {
        setExecutionOutput(data.run.output || 'No output produced.');
        setExecMeta({ time: data.run.time, memory: data.run.memory });
      } else {
        setExecutionOutput(data.error || 'Execution encountered an error.');
      }
    } catch (err) {
      setExecutionOutput(`Connection error: ${err.message}. Ensure backend is running.`);
    } finally {
      setIsExecuting(false);
    }
  };

  // AI Copilot handler (STAGE 6)
  const askCopilot = async (questionText) => {
    if (isCopilotLoading) return;
    setIsCopilotLoading(true);

    // Append user question with empty answer placeholder
    const newPair = { question: questionText, answer: '' };
    setCopilotHistory(prev => [...prev, newPair]);

    try {
      const response = await fetch(`${SERVER_URL}/ai-copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, question: questionText })
      });

      const data = await response.json();
      const answer = response.ok ? data.answer : `Error: ${data.error || 'Failed to get AI response'}`;

      setCopilotHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { question: questionText, answer };
        return updated;
      });
    } catch (err) {
      setCopilotHistory(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          question: questionText,
          answer: `Network Error: ${err.message}. Please check GEMINI_API_KEY and backend connection.`
        };
        return updated;
      });
    } finally {
      setIsCopilotLoading(false);
    }
  };

  // Video call handlers (STAGE 5)
  const handleStartVideoCall = () => {
    socket.emit('start-video-call', { roomId });
    handleJoinVideoCall();
  };

  const handleJoinVideoCall = async () => {
    if (liveKitToken || isVideoLoading) return;
    setIsVideoLoading(true);

    try {
      const res = await fetch(`${SERVER_URL}/get-livekit-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username })
      });

      const data = await res.json();
      if (res.ok && data.token) {
        setLiveKitToken(data.token);
      } else {
        addToast(data.error || 'Failed to acquire LiveKit token', 'leave');
      }
    } catch (err) {
      addToast(`LiveKit error: ${err.message}`, 'leave');
    } finally {
      setIsVideoLoading(false);
    }
  };

  const handleLeaveVideoCall = () => {
    setLiveKitToken(null);
  };

  // Copy Room Link
  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopiedRoom(true);
    setTimeout(() => setCopiedRoom(false), 2000);
  };

  const isHost = username === hostUsername;
  const currentLangConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.javascript;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)' }}>
      {/* Toast Notifications */}
      <Toasts toasts={toasts} />

      {/* Top Navigation Bar */}
      <header style={{
        height: '60px',
        backgroundColor: 'var(--bg-panel)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Left: Brand Logo */}
        {/* Left: Brand Logo + Room badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => navigate('/')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{
              fontFamily: 'JetBrains Mono',
              fontSize: '1.2rem',
              fontWeight: '700',
              color: '#ffffff'
            }}>
              Sync-Forge
            </span>
          </div>

          {/* Room ID Badge & Copy */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#11131c',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.78rem',
            fontFamily: 'JetBrains Mono'
          }}>
            <span style={{ color: 'var(--text-muted)' }}>ROOM:</span>
            <span style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>{roomId}</span>
            <button
              onClick={handleCopyRoomId}
              style={{
                background: 'none',
                border: 'none',
                color: copiedRoom ? 'var(--accent-teal)' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px',
                marginLeft: '2px'
              }}
              title="Copy Room ID"
            >
              {copiedRoom ? <Check size={13} /> : <Copy size={13} />}
            </button>
          </div>
        </div>
        {/* Right Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Video Call Trigger (STAGE 5) */}
          {videoCallActive ? (
            !liveKitToken && (
              <button
                onClick={handleJoinVideoCall}
                disabled={isVideoLoading}
                style={{
                  backgroundColor: 'rgba(51, 214, 166, 0.15)',
                  border: '1px solid var(--accent-teal)',
                  color: 'var(--accent-teal)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: isVideoLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'pulse 2s infinite'
                }}
              >
                <Video size={15} />
                <span>Join Video Call</span>
              </button>
            )
          ) : (
            isHost && (
              <button
                onClick={handleStartVideoCall}
                disabled={isVideoLoading}
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--accent-amber)',
                  color: 'var(--accent-amber)',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: '600',
                  cursor: isVideoLoading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(242, 169, 59, 0.12)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Video size={15} />
                <span>Start Video Call</span>
              </button>
            )
          )}

          {/* AI Copilot Toggle Button (STAGE 6) */}
          <button
            onClick={() => setIsCopilotOpen(!isCopilotOpen)}
            style={{
              backgroundColor: isCopilotOpen ? 'rgba(51, 214, 166, 0.2)' : 'var(--bg-panel-secondary)',
              border: `1px solid ${isCopilotOpen ? 'var(--accent-teal)' : 'var(--border-color)'}`,
              color: isCopilotOpen ? 'var(--accent-teal)' : 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            title="Open AI Copilot"
          >
            <Bot size={16} color={isCopilotOpen ? 'var(--accent-teal)' : '#a1a1aa'} />
            <span>Copilot</span>
          </button>

          {/* Chat Toggle Button (STAGE 3) */}
          <button
            onClick={() => {
              setIsChatOpen(!isChatOpen);
              setUnreadChatCount(0);
            }}
            style={{
              position: 'relative',
              backgroundColor: isChatOpen ? 'rgba(51, 214, 166, 0.2)' : 'var(--bg-panel-secondary)',
              border: `1px solid ${isChatOpen ? 'var(--accent-teal)' : 'var(--border-color)'}`,
              color: isChatOpen ? 'var(--accent-teal)' : 'var(--text-primary)',
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '0.82rem',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
            title="Open Chat"
          >
            <MessageSquare size={16} />
            <span>Chat</span>
            {unreadChatCount > 0 && !isChatOpen && (
              <span style={{
                position: 'absolute',
                top: '-5px',
                right: '-5px',
                backgroundColor: 'var(--accent-teal)',
                color: '#000',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.68rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadChatCount}
              </span>
            )}
          </button>

          {/* Participants Dropdown Trigger (STAGE 2) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setIsParticipantsOpen(!isParticipantsOpen)}
              style={{
                backgroundColor: isParticipantsOpen ? 'rgba(51, 214, 166, 0.15)' : 'var(--bg-panel-secondary)',
                border: `1px solid ${isParticipantsOpen ? 'var(--accent-teal)' : 'var(--border-color)'}`,
                color: 'var(--text-primary)',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '0.82rem',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Users size={16} color="var(--accent-teal)" />
              <span style={{ fontFamily: 'JetBrains Mono' }}>{users.length}</span>
            </button>

            {/* Google Meet style participants dropdown */}
            <ParticipantsDropdown
              isOpen={isParticipantsOpen}
              onClose={() => setIsParticipantsOpen(false)}
              users={users}
              hostUsername={hostUsername}
              currentUsername={username}
            />
          </div>

          {/* Leave Room Button */}
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Leave Room"
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--danger)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Studio Area */}
      <main style={{
        flex: 1,
        maxWidth: '1000px',
        width: '100%',
        margin: '0 auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column'
      }}>


        {/* IDE Window Frame */}
        <div style={{
          backgroundColor: 'var(--bg-panel)',
          border: '1px solid var(--border-color)',
          borderRadius: '10px',
          boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden'
        }}>
          {/* Window Header with Colored Dots, File Tab & Controls */}
          <div style={{
            height: '44px',
            backgroundColor: '#12141f',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 14px'
          }}>
            {/* Left: Window Dots & Active File Tab */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Three colored window dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
              </div>

              {/* Active File Tab */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: 'var(--bg-panel)',
                padding: '6px 14px',
                borderRadius: '6px 6px 0 0',
                borderTop: '2px solid var(--accent-teal)',
                borderLeft: '1px solid var(--border-color)',
                borderRight: '1px solid var(--border-color)',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono',
                color: 'var(--text-primary)'
              }}>
                <FileCode size={14} color="var(--accent-teal)" />
                <span>{currentLangConfig.fileTab}</span>
              </div>
            </div>

            {/* Right: Language Dropdown and Run Button (STAGE 4) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Language Dropdown (A select may contain ONLY option elements) */}
              <select
                value={language}
                onChange={handleLanguageChange}
                style={{
                  backgroundColor: '#181b29',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '6px',
                  padding: '5px 10px',
                  fontSize: '0.8rem',
                  fontFamily: 'JetBrains Mono',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="html">HTML</option>
              </select>

              {/* Run Code Button */}
              <button
                onClick={runCode}
                disabled={isExecuting}
                style={{
                  backgroundColor: 'var(--accent-teal)',
                  color: '#0d1514',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: '700',
                  cursor: isExecuting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'opacity 0.15s, transform 0.15s'
                }}
                onMouseEnter={(e) => { if (!isExecuting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
                onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
              >
                <Play size={13} fill="#0d1514" />
                <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* 400px tall CodeMirror Editor */}
          <div style={{
            height: '400px',

            backgroundColor: '#12141e'
          }}>
            <CodeMirror
              value={code}
              height="400px"
              theme={oneDark}
              extensions={[currentLangConfig.extension]}
              onChange={handleEditorChange}
              basicSetup={{
                lineNumbers: true,
                highlightActiveLineGutter: true,
                highlightSpecialChars: true,
                history: true,
                foldGutter: true,
                drawSelection: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                syntaxHighlighting: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                rectangularSelection: true,
                crosshairCursor: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
                closeBracketsKeymap: true,
                defaultKeymap: true,
                searchKeymap: true,
                historyKeymap: true,
                foldKeymap: true,
                completionKeymap: true,
                lintKeymap: true
              }}
            />
          </div>
        </div>

        {/* Output Panel (STAGE 4) */}
        <OutputPanel
          output={executionOutput}
          isRunning={isExecuting}
          onClear={() => setExecutionOutput('')}
          meta={execMeta}
        />


        {/* Optional LiveKit Video Stage (STAGE 5) */}
        {liveKitToken && (
          <VideoCallArea
            liveKitUrl={LIVEKIT_URL}
            token={liveKitToken}
            onLeaveCall={handleLeaveVideoCall}
          />
        )}

      </main>

      {/* Right Slide-in Chat Sidebar (STAGE 3) */}
      <ChatSidebar
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        currentUsername={username}
      />

      {/* Left Slide-in AI Copilot Sidebar (STAGE 6) */}
      <AICopilotSidebar
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        history={copilotHistory}
        isLoading={isCopilotLoading}
        onAskCopilot={askCopilot}
      />
    </div>
  );
}


