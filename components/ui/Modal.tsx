'use client';

import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

export default function Modal({ open, onClose, children, maxWidth = 360 }: ModalProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
        backdropFilter: 'blur(2px)',
        animation: 'fadeIn 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 24,
          padding: 28,
          width: '100%',
          maxWidth,
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'slideUp 0.25s ease',
          boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
