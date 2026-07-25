import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 4000);
    return () => clearTimeout(timer);
  }, [onDone]);

  const baseStyle = {
    position: 'fixed',
    top: '24px',
    right: '24px',
    color: '#ffffff',
    padding: '16px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    animation: 'slideIn 0.3s ease-out',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const bgStyle = type === 'error' 
    ? { backgroundColor: '#991b1b', border: '1px solid #7f1d1d' } 
    : { backgroundColor: '#0f766e', border: '1px solid #115e59' };

  return (
    <div style={{ ...baseStyle, ...bgStyle }}>
      <span>{type === 'error' ? '⚠️' : '✅'}</span>
      <span>{message}</span>
    </div>
  );
}
