import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Sparkles, Copy, Check, Terminal, Loader2 } from 'lucide-react';

// Helper to render markdown text with styled code blocks for ```code```
function FormattedMessage({ text }) {
  if (!text) return null;

  // Split by triple-backtick code fences
  const parts = text.split(/(```[\s\S]*?```)/g);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const firstLineBreak = part.indexOf('\n');
          let lang = '';
          let codeContent = '';
          if (firstLineBreak !== -1) {
            lang = part.slice(3, firstLineBreak).trim();
            codeContent = part.slice(firstLineBreak + 1, -3).trim();
          } else {
            codeContent = part.slice(3, -3).trim();
          }

          return <CodeSnippetBlock key={index} code={codeContent} lang={lang} />;
        }

        // Regular prose text (handle line breaks)
        return (
          <p key={index} style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.85rem' }}>
            {part}
          </p>
        );
      })}
    </div>
  );
}

function CodeSnippetBlock({ code, lang }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      backgroundColor: '#0d0f17',
      border: '1px solid var(--border-color)',
      borderRadius: '6px',
      overflow: 'hidden',
      margin: '4px 0'
    }}>
      <div style={{
        backgroundColor: '#161926',
        padding: '4px 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #202436',
        fontSize: '0.72rem',
        color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono'
      }}>
        <span>{lang || 'code'}</span>
        <button
          onClick={handleCopy}
          style={{
            background: 'none',
            border: 'none',
            color: copied ? 'var(--accent-teal)' : 'var(--text-muted)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.7rem'
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre style={{
        padding: '10px 12px',
        margin: 0,
        overflowX: 'auto',
        fontSize: '0.8rem',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#e2e8f0',
        lineHeight: '1.4'
      }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function AICopilotSidebar({
  isOpen,
  onClose,
  history = [],
  isLoading,
  onAskCopilot
}) {
  const [question, setQuestion] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, isLoading, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isLoading) return;

    onAskCopilot(trimmed);
    setQuestion('');
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '300px',
      maxWidth: '82vw',
      height: '100vh',
      backgroundColor: 'var(--bg-panel)',
      borderRight: '1px solid var(--border-color)',
      boxShadow: '8px 0 28px rgba(0, 0, 0, 0.7)',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      animation: 'slideInLeft 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#13151f'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '6px',
            backgroundColor: 'rgba(51, 214, 166, 0.15)',
            border: '1px solid var(--accent-teal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-teal)'
          }}>
            <Bot size={16} />
          </div>
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.92rem', color: '#ffffff' }}>
              AI Copilot
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontFamily: 'JetBrains Mono' }}>
              gemini-flash-latest
            </div>
          </div>
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

      {/* Suggested Quick Prompts */}
      <div style={{
        padding: '10px 16px',
        backgroundColor: '#10121a',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        gap: '6px',
        overflowX: 'auto'
      }}>
        {['Explain code', 'Find bugs', 'Optimize performance', 'Add comments'].map((prompt) => (
          <button
            key={prompt}
            onClick={() => onAskCopilot(prompt)}
            disabled={isLoading}
            style={{
              backgroundColor: 'var(--bg-panel-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '12px',
              padding: '4px 10px',
              fontSize: '0.72rem',
              whiteSpace: 'nowrap',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.borderColor = 'var(--accent-teal)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Q&A Messages List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        {history.length === 0 && !isLoading ? (
          <div style={{
            margin: 'auto',
            textAlign: 'center',
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
            padding: '0 20px'
          }}>
            <Bot size={36} color="var(--border-color)" style={{ marginBottom: '12px' }} />
            <p style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>How can I help you code today?</p>
            <p style={{ fontSize: '0.75rem', marginTop: '6px', lineHeight: '1.4' }}>
              Ask anything about your code, request refactoring, or ask for code explanations.
            </p>
          </div>
        ) : (
          history.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Question Bubble */}
              <div style={{
                alignSelf: 'flex-end',
                backgroundColor: 'rgba(51, 214, 166, 0.12)',
                border: '1px solid rgba(51, 214, 166, 0.3)',
                color: 'var(--text-primary)',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                maxWidth: '90%',
                wordBreak: 'break-word'
              }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--accent-teal)', fontWeight: '600', marginBottom: '2px' }}>
                  You
                </div>
                {item.question}
              </div>

              {/* Answer Bubble or Thinking */}
              <div style={{
                alignSelf: 'flex-start',
                backgroundColor: 'var(--bg-panel-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                maxWidth: '96%',
                width: '100%'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.72rem',
                  color: 'var(--accent-teal)',
                  fontWeight: '600',
                  marginBottom: '8px'
                }}>
                  <Sparkles size={13} />
                  <span>SyncForge Copilot</span>
                </div>
                {item.answer ? (
                  <FormattedMessage text={item.answer} />
                ) : (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'var(--accent-amber)',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '0.8rem'
                  }}>
                    <Loader2 size={15} className="animate-spin" />
                    <span>Thinking...</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Floating Thinking Placeholder if loading new question not in history yet */}
        {isLoading && (history.length === 0 || history[history.length - 1].answer) && (
          <div style={{
            backgroundColor: 'var(--bg-panel-secondary)',
            border: '1px solid var(--border-color)',
            padding: '12px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-amber)',
            fontFamily: 'JetBrains Mono',
            fontSize: '0.8rem'
          }}>
            <Loader2 size={15} className="animate-spin" />
            <span>Thinking...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
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
          placeholder="Ask AI Copilot about the current code..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={isLoading}
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
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-teal)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
        />
        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          style={{
            backgroundColor: 'var(--accent-teal)',
            color: '#12141e',
            border: 'none',
            borderRadius: '6px',
            padding: '0 14px',
            cursor: (isLoading || !question.trim()) ? 'not-allowed' : 'pointer',
            opacity: (isLoading || !question.trim()) ? 0.6 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600'
          }}
        >
          {isLoading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </button>
      </form>
    </div>
  );
}

