import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const toastIdRef = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++toastIdRef.current;
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration = 3500) => addToast(msg, 'success', duration),
    error: (msg, duration = 4500) => addToast(msg, 'error', duration),
    warning: (msg, duration = 4000) => addToast(msg, 'warning', duration),
    info: (msg, duration = 3500) => addToast(msg, 'info', duration),
    confirm: ({
      title = 'Confirmar Ação',
      message = 'Tem certeza que deseja prosseguir?',
      confirmText = 'Confirmar',
      cancelText = 'Cancelar',
      isDanger = false,
      extraOptions = null, // ex: botões adicionais
      onConfirm,
      onCancel
    }) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        isDanger,
        extraOptions,
        onConfirm: () => {
          setConfirmDialog(null);
          if (onConfirm) onConfirm();
        },
        onCancel: () => {
          setConfirmDialog(null);
          if (onCancel) onCancel();
        }
      });
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Container de Toasts Flutuantes */}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '380px',
          width: 'calc(100% - 40px)',
          pointerEvents: 'none'
        }}
      >
        {toasts.map((t) => {
          const isSuccess = t.type === 'success';
          const isError = t.type === 'error';
          const isWarning = t.type === 'warning';

          const accentColor = isSuccess
            ? '#10b981'
            : isError
            ? '#ef4444'
            : isWarning
            ? '#f59e0b'
            : 'var(--accent-primary)';

          const bgColor = isSuccess
            ? 'rgba(16, 185, 129, 0.12)'
            : isError
            ? 'rgba(239, 68, 68, 0.12)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.12)'
            : 'rgba(99, 102, 241, 0.12)';

          const borderColor = isSuccess
            ? 'rgba(16, 185, 129, 0.35)'
            : isError
            ? 'rgba(239, 68, 68, 0.35)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.35)'
            : 'rgba(99, 102, 241, 0.35)';

          return (
            <div
              key={t.id}
              style={{
                pointerEvents: 'auto',
                background: 'var(--modal-bg)',
                border: `1px solid ${borderColor}`,
                borderRadius: '16px',
                padding: '0.85rem 1rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                backdropFilter: 'blur(16px)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                color: 'var(--text-primary)',
                animation: 'slideInToast 0.25s ease-out',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Barra lateral colorida */}
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '4px',
                  background: accentColor
                }}
              />

              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '8px',
                  background: bgColor,
                  color: accentColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '1px'
                }}
              >
                {isSuccess && <CheckCircle2 size={16} />}
                {isError && <AlertCircle size={16} />}
                {isWarning && <AlertTriangle size={16} />}
                {!isSuccess && !isError && !isWarning && <Info size={16} />}
              </div>

              <div style={{ flex: 1, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.45, wordBreak: 'break-word' }}>
                {t.message}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px'
                }}
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Moderno de Confirmação (Substituição de window.confirm) */}
      {confirmDialog && (
        <div
          className="modal-overlay"
          onClick={confirmDialog.onCancel}
          style={{ zIndex: 100000, backdropFilter: 'blur(8px)' }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '420px',
              width: '92%',
              padding: '1.75rem',
              borderRadius: '22px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: confirmDialog.isDanger ? 'rgba(239, 68, 68, 0.12)' : 'rgba(99, 102, 241, 0.12)',
                color: confirmDialog.isDanger ? '#ef4444' : 'var(--accent-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem'
              }}
            >
              {confirmDialog.isDanger ? <AlertTriangle size={26} /> : <AlertCircle size={26} />}
            </div>

            <h3 style={{ fontSize: '1.18rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
              {confirmDialog.title}
            </h3>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 1.5rem 0' }}>
              {confirmDialog.message}
            </p>

            {/* Opções extras (se houver, ex: excluir só esta ou todas) */}
            {confirmDialog.extraOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1.25rem' }}>
                {confirmDialog.extraOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setConfirmDialog(null);
                      opt.action();
                    }}
                    className={opt.className || 'btn btn-outline'}
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', borderRadius: '12px', fontSize: '0.84rem', fontWeight: 700 }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            {!confirmDialog.extraOptions && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={confirmDialog.onCancel}
                  className="btn btn-outline"
                  style={{ flex: 1, justifyContent: 'center', padding: '0.75rem', borderRadius: '12px' }}
                >
                  {confirmDialog.cancelText}
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className={confirmDialog.isDanger ? 'btn' : 'btn btn-primary'}
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    padding: '0.75rem',
                    borderRadius: '12px',
                    background: confirmDialog.isDanger ? '#ef4444' : undefined,
                    color: confirmDialog.isDanger ? '#fff' : undefined,
                    border: 'none',
                    fontWeight: 700
                  }}
                >
                  {confirmDialog.confirmText}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Fallback defensivo caso usado fora do provider
    return {
      success: (msg) => console.log('Toast success:', msg),
      error: (msg) => console.error('Toast error:', msg),
      warning: (msg) => console.warn('Toast warning:', msg),
      info: (msg) => console.info('Toast info:', msg),
      confirm: ({ message, onConfirm }) => {
        if (window.confirm(message)) onConfirm?.();
      }
    };
  }
  return context;
}
