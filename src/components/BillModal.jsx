import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BillModal({ isOpen, onClose, selectedDate, user, categories, bills = [], onBillSaved }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayBills = bills.filter(b => b.date === dateString);
  const totalAmount = dayBills.reduce((acc, bill) => acc + Number(bill.amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('bills').insert([
        {
          user_id: user.id,
          date: dateString,
          description,
          amount: parseFloat(amount),
          category_id: categoryId,
          status: 'Pendente'
        }
      ]);

      if (error) throw error;
      
      setDescription('');
      setAmount('');
      setCategoryId('');
      onBillSaved(); // Fetch again
    } catch (error) {
      alert('Erro ao salvar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from('bills').delete().eq('id', id);
      if (error) throw error;
      onBillSaved();
    } catch (error) {
      alert('Erro ao excluir conta: ' + error.message);
    }
  };

  const formattedDateHeader = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '480px', 
        background: '#111116',
        border: '1px solid rgba(129, 140, 248, 0.2)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(99, 102, 241, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '16px', right: '16px', 
            background: 'rgba(255,255,255,0.05)', border: 'none', 
            color: 'var(--text-secondary)', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
        >
          <X size={16} />
        </button>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            Contas do Dia
          </span>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            color: '#ffffff',
            margin: '0.25rem 0 0 0',
            textTransform: 'lowercase'
          }}>
            {formattedDateHeader}
          </h2>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
          {dayBills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Nenhuma conta lançada neste dia.</p>
          ) : (
            dayBills.map(bill => (
              <div key={bill.id} style={{ 
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>{bill.description}</div>
                  <div style={{ color: '#fb7185', fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>
                    R$ {bill.amount.toFixed(2).replace('.', ',')}
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(bill.id)}
                  style={{ 
                    background: 'rgba(244, 63, 94, 0.1)', 
                    color: '#fb7185', 
                    border: '1px solid rgba(244, 63, 94, 0.3)',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                >
                  Remover
                </button>
              </div>
            ))
          )}

          {dayBills.length > 0 && (
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.1)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.5rem'
            }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Total do dia</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' }}>
                R$ {totalAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.5rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
            Adicionar Conta
          </span>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <input 
              type="text" required
              placeholder="Nome (ex: Aluguel, Energia...)"
              value={description} onChange={e => setDescription(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem',
                outline: 'none', transition: 'all 0.2s', width: '100%'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              <select 
                value={categoryId} onChange={e => setCategoryId(e.target.value)} required
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem',
                  outline: 'none', flex: 1, cursor: 'pointer', appearance: 'none'
                }}
              >
                <option value="" style={{ background: '#111116' }}>Categoria</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id} style={{ background: '#111116' }}>{c.name}</option>
                ))}
              </select>

              <input 
                type="number" step="0.01" required
                placeholder="Valor (R$)"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  padding: '0.8rem 1rem', borderRadius: '12px', color: '#fff', fontSize: '0.95rem',
                  outline: 'none', width: '120px'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '4px', transition: 'all 0.2s',
                opacity: loading ? 0.7 : 1
              }}
              onMouseOver={(e) => { if(!loading) e.currentTarget.style.background = 'var(--accent-hover)' }}
              onMouseOut={(e) => { if(!loading) e.currentTarget.style.background = 'var(--accent-primary)' }}
            >
              <Check size={18} strokeWidth={3} /> Salvar
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
