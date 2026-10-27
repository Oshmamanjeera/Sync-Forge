import React from 'react';
import { UserCheck, UserMinus, Info } from 'lucide-react';

export default function Toasts({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const isLeave = toast.type === 'leave';
        return (
          <div
            key={toast.id}
            className={`toast ${isLeave ? 'toast-left' : ''}`}
          >
            {isLeave ? (
              <UserMinus size={16} color="var(--accent-amber)" />
            ) : (
              <UserCheck size={16} color="var(--accent-teal)" />
            )}
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}

