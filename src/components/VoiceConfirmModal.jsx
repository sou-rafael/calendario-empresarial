import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Check, Calendar, Tag, DollarSign, Sparkles } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function VoiceConfirmModal({ isOpen, onClose, parsedData, categories, user, onSuccess }) {
  if (!isOpen || !parsedData) return null;

  const [description, setDescription] = useState(parsedData.description || '');
  const [amount, setAmount] = useState(parsedData.amount ? parsedData.amount.toString() : '');
  const [dueDate, setDueDate] = useState(parsedData.dueDate || format(new Date(), 'yyyy-MM-dd'));
  const [categoryId, setCategoryId] = useState(parsedData.categoryId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !dueDate || !categoryId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('bills').insert([
        {
          user_id: user.id,
          date: dueDate,
          description,
          amount: parseFloat(amount),
          category_id: categoryId,
          status: 'Pendente'
        }
      ]);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao salvar compromisso: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--modal-overlay)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
      padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '440px',
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '1.75rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            <Sparkles size={14} /> Voz Reconhecida
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: 'var(--text-primary)' }}>
            Confirmar Compromisso
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontStyle: 'italic' }}>
            "{parsedData.rawText}"
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Descrição */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Descrição / Fornecedor *
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Vencimento e Valor lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Vencimento *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.75rem 0.8rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.88rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                Valor (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '0.75rem 0.8rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.92rem',
                  outline: 'none',
                  fontWeight: 700
                }}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Categoria *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              style={{
                width: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '0.75rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="" style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>Selecione uma categoria...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id} style={{ background: 'var(--modal-bg)', color: 'var(--text-primary)' }}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-secondary)',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                border: 'none',
                color: '#fff',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Check size={18} strokeWidth={2.5} />
              {loading ? 'Lançando...' : 'Confirmar no Calendário'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
