import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecione...',
  icon = null,
  compact = false,
  required = false,
  style = {},
  dropdownStyle = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fecha com a tecla Escape
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Normaliza opções ({ id, name } ou { value, label } ou strings)
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string' || typeof opt === 'number') {
      return { value: String(opt), label: String(opt) };
    }
    const val = opt.value !== undefined ? opt.value : opt.id;
    const lab = opt.label !== undefined ? opt.label : opt.name;
    return { value: String(val ?? ''), label: String(lab ?? '') };
  });

  const selectedOption = normalizedOptions.find((o) => String(o.value) === String(value));

  const handleSelect = (val) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: compact ? 'auto' : '100%',
        ...style
      }}
    >
      {/* Validação de Form HTML5 nativa invisível */}
      {required && (
        <input
          type="text"
          value={value || ''}
          required={required}
          onChange={() => {}}
          style={{
            position: 'absolute',
            opacity: 0,
            pointerEvents: 'none',
            height: 0,
            width: 0,
            top: '50%',
            left: '50%'
          }}
          tabIndex={-1}
        />
      )}

      {/* Botão Gatilho (Trigger) do Combobox */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          background: compact ? 'transparent' : 'var(--input-bg)',
          border: compact ? 'none' : (isOpen ? '1px solid var(--accent-primary)' : '1px solid var(--input-border)'),
          borderRadius: compact ? '10px' : '12px',
          padding: compact ? '0.4rem 0.5rem' : '0.75rem 1rem',
          color: selectedOption ? 'var(--text-primary)' : 'var(--text-muted)',
          fontSize: compact ? '0.82rem' : '0.92rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: !compact && isOpen ? '0 0 0 3px var(--border-focus)' : 'none',
          transition: 'all 0.2s',
          textAlign: 'left'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
          {icon && <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>}
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: compact ? '125px' : '100%'
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>

        <ChevronDown
          size={compact ? 13 : 16}
          color="var(--text-secondary)"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.2s',
            flexShrink: 0
          }}
        />
      </button>

      {/* Menu Dropdown de Opções */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1050,
            minWidth: compact ? '190px' : '100%',
            width: 'max-content',
            maxWidth: '320px',
            background: 'var(--modal-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-lg)',
            padding: '6px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            maxHeight: '230px',
            overflowY: 'auto',
            backdropFilter: 'blur(20px)',
            ...dropdownStyle
          }}
        >
          {normalizedOptions.length === 0 ? (
            <div style={{ padding: '8px 12px', fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Nenhuma opção disponível
            </div>
          ) : (
            normalizedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    width: '100%',
                    padding: compact ? '6px 10px' : '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                    color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                    fontSize: compact ? '0.82rem' : '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s'
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'var(--item-hover-bg)';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && <Check size={14} color="var(--accent-primary)" style={{ flexShrink: 0 }} />}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
