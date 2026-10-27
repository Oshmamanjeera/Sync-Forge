import React, { useEffect, useRef } from 'react';
import { Crown, User, Shield } from 'lucide-react';

// Deterministic pastel color generator from string
function getAvatarColor(name = '') {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#f97316'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length > 1) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function ParticipantsDropdown({ isOpen, onClose, users = [], hostUsername, currentUsername }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      style={{
        position: 'absolute',
        top: '100%',
        right: '0',
        marginTop: '8px',
        width: '280px',
        backgroundColor: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        boxShadow: '0 12px 32px rgba(0, 0, 0, 0.6), 0 0 15px rgba(51, 214, 166, 0.08)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'fadeIn 0.15s ease-out'
      }}
    >
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          People in room
        </div>
        <div style={{
          fontSize: '0.72rem',
          backgroundColor: 'var(--border-color)',
          color: 'var(--accent-teal)',
          padding: '2px 8px',
          borderRadius: '12px',
          fontFamily: 'JetBrains Mono'
        }}>
          {users.length}
        </div>
      </div>

      <div style={{
        maxHeight: '260px',
        overflowY: 'auto',
        padding: '8px 0'
      }}>
        {users.map((user) => {
          const isHost = user.username === hostUsername;
          const isMe = user.username === currentUsername;
          const bgColor = getAvatarColor(user.username);

          return (
            <div
              key={user.username}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '8px 16px',
                transition: 'background-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-panel-secondary)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              {/* Avatar circle */}
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: bgColor,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: '700',
                fontFamily: 'JetBrains Mono',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)'
              }}>
                {getInitials(user.username)}
              </div>

              {/* Name & tags */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.85rem',
                  fontWeight: '500',
                  color: isMe ? 'var(--accent-teal)' : 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  <span>{user.username}</span>
                  {isMe && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(You)</span>
                  )}
                </div>
              </div>

              {/* Host Badge */}
              {isHost && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(242, 169, 59, 0.15)',
                  border: '1px solid rgba(242, 169, 59, 0.4)',
                  color: 'var(--accent-amber)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.68rem',
                  fontWeight: '600',
                  letterSpacing: '0.04em'
                }}>
                  <Crown size={12} />
                  <span>Host</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

