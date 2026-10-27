import React from 'react';
import { Terminal, Trash2, CheckCircle2, AlertCircle, Clock, Cpu } from 'lucide-react';

export default function OutputPanel({ output, isRunning, onClear, meta }) {
  return (
    <div style={{
      marginTop: '16px',
      backgroundColor: 'var(--bg-panel)',
      border: '1px solid var(--border-color)',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
    }}>
      {/* Terminal Title Bar */}
      <div style={{
        backgroundColor: '#12141e',
        padding: '8px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: '600' }}>
          <Terminal size={15} color="var(--accent-teal)" />
          <span style={{ color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>Execution Output</span>
          {meta?.time && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              marginLeft: '12px',
              fontFamily: 'JetBrains Mono'
            }}>
              <Clock size={12} />
              {meta.time}s
            </span>
          )}
          {meta?.memory && (
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.72rem',
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono'
            }}>
              <Cpu size={12} />
              {meta.memory} KB
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {output && (
            <button
              onClick={onClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                padding: '2px 6px',
                borderRadius: '4px'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Clear terminal"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Output Content */}
      <pre style={{
        padding: '14px 16px',
        margin: 0,
        minHeight: '100px',
        maxHeight: '220px',
        overflowY: 'auto',
        fontSize: '0.84rem',
        fontFamily: 'JetBrains Mono, monospace',
        lineHeight: '1.5',
        backgroundColor: '#0c0e14',
        color: isRunning ? 'var(--accent-amber)' : (output ? '#e2e8f0' : 'var(--text-muted)'),
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word'
      }}>
        {isRunning ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-amber)', animation: 'pulse 1s infinite' }} />
            <span>Compiling and executing code on Judge0...</span>
          </div>
        ) : (
          output || 'Click "Run Code" above to execute and view stdout/stderr output here.'
        )}
      </pre>
    </div>
  );
}

