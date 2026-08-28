'use client';

import React, { useState, useRef, useEffect } from 'react';

interface Option {
  id: string;
  name: string;
}

interface CustomDropdownProps {
  options: Option[];
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

export default function CustomDropdown({ options, value, onChange, label }: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 6,
          }}
        >
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1.5px solid var(--color-border)',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 600,
          color: 'var(--color-text)',
          background: 'white',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease',
        }}
      >
        <span>{selectedOption ? selectedOption.name : 'Select option'}</span>
        <span style={{ fontSize: 10, color: 'var(--color-text-light)', transition: 'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          ▼
        </span>
      </button>

      {isOpen && (
        <>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #cbd5e1;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background-color: #94a3b8;
            }
          `}</style>
          <div
            className="custom-scrollbar"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: 6,
              background: 'white',
              border: '1.5px solid var(--color-border)',
              borderRadius: 14,
              boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
              zIndex: 1000,
              maxHeight: 200,
              overflowY: 'auto',
              animation: 'fadeIn 0.15s ease',
            }}
          >
          {options.map((opt) => {
            const isSelected = opt.id === value;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleSelect(opt.id)}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  border: 'none',
                  background: isSelected ? 'var(--color-primary-light)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : 'var(--color-text)',
                  fontSize: 13,
                  fontWeight: isSelected ? 700 : 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'block',
                  transition: 'background 0.1s ease',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--color-bg)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                {opt.name}
              </button>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
