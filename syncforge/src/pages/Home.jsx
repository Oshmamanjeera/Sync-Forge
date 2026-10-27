import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Code2, Sparkles, ArrowRight, PlusCircle, LogIn, Terminal } from 'lucide-react';

function generateRandomRoomId() {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomIdInput, setRoomIdInput] = useState('');
  const [nameError, setNameError] = useState('');
  const [roomError, setRoomError] = useState('');

  const handleCreateRoom = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError('Username is required to create a room.');
      return;
    }
    setNameError('');
    const newRoomId = generateRandomRoomId();
    navigate(`/room/${newRoomId}?name=${encodeURIComponent(trimmedName)}`);
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedRoomId = roomIdInput.trim();

    let hasError = false;
    if (!trimmedName) {
      setNameError('Username is required to join a room.');
      hasError = true;
    } else {
      setNameError('');
    }

    if (!trimmedRoomId) {
      setRoomError('Please enter a Room ID.');
      hasError = true;
    } else {
      setRoomError('');
    }

    if (hasError) return;

    navigate(`/room/${trimmedRoomId}?name=${encodeURIComponent(trimmedName)}`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px'
    }}>
      {/* Central Card */}
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '36px 32px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(51, 214, 166, 0.05)',
        position: 'relative'
      }}>
        {/* Terminal Header Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-color)'
        }}>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e' }} />
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f' }} />
          <div style={{
            marginLeft: 'auto',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            fontFamily: 'JetBrains Mono',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <Terminal size={14} color="var(--accent-teal)" />
            <span>v2.0-live</span>
          </div>
        </div>

        {/* Brand Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <h1 style={{
            fontSize: '2.1rem',
            fontWeight: '700',
            letterSpacing: '-0.5px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span>Sync-Forge</span>

          </h1>
          <p style={{
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
            marginTop: '8px'
          }}>
            Next-generation real-time collaborative IDE
          </p>
        </div>

        {/* Name Input */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: 'var(--text-secondary)',
            marginBottom: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Your Name / Handle <span style={{ color: 'var(--accent-amber)' }}>*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Alex, Satoshi, Cipher"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError('');
            }}
            style={{
              width: '100%',
              backgroundColor: 'var(--bg-input)',
              border: `1px solid ${nameError ? 'var(--danger)' : 'var(--border-color)'}`,
              borderRadius: '8px',
              padding: '12px 14px',
              color: 'var(--text-primary)',
              fontSize: '0.95rem',
              fontFamily: 'Inter',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--accent-teal)'}
            onBlur={(e) => e.target.style.borderColor = nameError ? 'var(--danger)' : 'var(--border-color)'}
          />
          {nameError && (
            <div style={{
              color: 'var(--danger)',
              fontSize: '0.78rem',
              marginTop: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <span>•</span> {nameError}
            </div>
          )}
        </div>

        {/* Action Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Create Room Button */}
          <button
            onClick={handleCreateRoom}
            style={{
              width: '100%',
              backgroundColor: 'var(--accent-teal)',
              color: '#091512',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.15s, background-color 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 14px rgba(51, 214, 166, 0.25)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.filter = 'brightness(1.08)'}
            onMouseLeave={(e) => e.currentTarget.style.filter = 'none'}
          >
            <PlusCircle size={18} />
            <span>Create New Room</span>
          </button>

          {/* Divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '4px 0'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
              OR JOIN EXISTING
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }} />
          </div>

          {/* Join Room Form */}
          <div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="6-character room ID"
                value={roomIdInput}
                onChange={(e) => {
                  setRoomIdInput(e.target.value.toLowerCase());
                  if (roomError) setRoomError('');
                }}
                style={{
                  flex: 1,
                  backgroundColor: 'var(--bg-input)',
                  border: `1px solid ${roomError ? 'var(--danger)' : 'var(--border-color)'}`,
                  borderRadius: '8px',
                  padding: '11px 14px',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  fontFamily: 'JetBrains Mono',
                  outline: 'none',
                  textTransform: 'lowercase'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-amber)'}
                onBlur={(e) => e.target.style.borderColor = roomError ? 'var(--danger)' : 'var(--border-color)'}
              />
              <button
                onClick={handleJoinRoom}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--accent-amber)',
                  border: '1px solid var(--accent-amber)',
                  borderRadius: '8px',
                  padding: '0 18px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background-color 0.2s, color 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-amber)';
                  e.currentTarget.style.color = '#161822';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--accent-amber)';
                }}
              >
                <span>Join</span>
                <LogIn size={16} />
              </button>
            </div>
            {roomError && (
              <div style={{
                color: 'var(--danger)',
                fontSize: '0.78rem',
                marginTop: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span>•</span> {roomError}
              </div>
            )}
          </div>
        </div>

        {/* Feature Highlights Footer */}
        <div style={{
          marginTop: '32px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          textAlign: 'center',
          fontSize: '0.72rem',
          color: 'var(--text-muted)'
        }}>
          <div>
            <span style={{ color: 'var(--accent-teal)' }}>⚡ Real-time</span>
            <div>Zero latency</div>
          </div>
          <div>
            <span style={{ color: 'var(--accent-amber)' }}>▶ Judge0</span>
            <div>4 Languages</div>
          </div>
          <div>
            <span style={{ color: '#60a5fa' }}>🤖 AI Copilot</span>
            <div>Gemini Flash</div>
          </div>
        </div>
      </div>
    </div>
  );
}

