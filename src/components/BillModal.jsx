import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, Plus, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BillModal({ isOpen, onClose, selectedDate, user, categories, bills = [], onBillSaved, currentContext, billToEdit = null }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [type, setType] = useState('despesa');
  const [person, setPerson] = useState('Rafael');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (billToEdit) {
        setDescription(billToEdit.description);
        setAmount(billToEdit.amount.toString());
        setCategoryId(billToEdit.category_id || '');
        setType(billToEdit.type || 'despesa');
        setPerson(billToEdit.person || 'Rafael');
      } else {
        setDescription('');
        setAmount('');
        setCategoryId('');
        setType('despesa');
        setPerson('Rafael');
      }
    }
  }, [isOpen, billToEdit]);

  if (!isOpen) return null;

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayBills = bills.filter(b => b.date === dateString);
  const totalReceitas = dayBills.filter(b => b.type === 'receita').reduce((acc, b) => acc + Number(b.amount), 0);
  const totalDespesas = dayBills.filter(b => b.type === 'despesa' || !b.type).reduce((acc, b) => acc + Number(b.amount), 0);
  const totalAmount = currentContext === 'pessoal' ? totalReceitas - totalDespesas : totalDespesas;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || (type !== 'receita' && !categoryId)) return;
    setLoading(true);

    try {
      if (billToEdit) {
        const { error } = await supabase.from('bills').update({
          description,
          amount: parseFloat(amount),
          category_id: type === 'receita' ? null : categoryId,
          type: type,
          person: currentContext === 'pessoal' && type === 'receita' ? person : null
        }).eq('id', billToEdit.id);

        if (error) throw error;
        onClose(); // Fechar o modal após editar
      } else {
        const { error } = await supabase.from('bills').insert([
          {
            user_id: user.id,
            date: dateString,
            description,
            amount: parseFloat(amount),
            category_id: type === 'receita' ? null : categoryId,
            status: 'Pendente',
            context: currentContext,
            type: type,
            person: currentContext === 'pessoal' && type === 'receita' ? person : null
          }
        ]);

        if (error) throw error;
        setDescription('');
        setAmount('');
        setCategoryId('');
        setType('despesa');
        setPerson('Rafael');
      }
      
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
        background: 'var(--calendar-bg)',
        border: '1px solid var(--border-focus)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '16px', right: '16px', 
            background: 'var(--input-bg)', border: 'none', 
            color: 'var(--text-secondary)', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--input-border)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--input-bg)'}
        >
          <X size={16} />
        </button>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            {billToEdit ? 'Editar Lançamento' : 'Contas do Dia'}
          </span>
          <h2 style={{ 
            fontSize: '1.75rem', 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            color: 'var(--text-primary)',
            margin: '0.25rem 0 0 0',
            textTransform: 'lowercase'
          }}>
            {formattedDateHeader}
          </h2>
        </div>

        {!billToEdit && (
          <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '4px' }}>
            {dayBills.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>Nenhuma conta lançada neste dia.</p>
            ) : (
              dayBills.map(bill => (
                <div key={bill.id} style={{ 
                  background: 'var(--item-bg)',
                  border: '1px solid var(--item-border)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      {bill.description}
                      {bill.type === 'receita' && bill.person && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', color: '#86efac', padding: '2px 6px', borderRadius: '4px' }}>
                          {bill.person}
                        </span>
                      )}
                      {bill.type !== 'receita' && bill.category_id && (
                        <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: 'var(--input-bg)', color: 'var(--text-secondary)', padding: '2px 6px', borderRadius: '4px' }}>
                          {categories.find(c => c.id === bill.category_id)?.name}
                        </span>
                      )}
                    </div>
                    <div style={{ color: bill.type === 'receita' ? '#86efac' : '#fb7185', fontWeight: 600, marginTop: '4px', fontSize: '1.1rem' }}>
                      {bill.type === 'receita' ? '+ ' : '- '}R$ {Number(bill.amount).toFixed(2).replace('.', ',')}
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
                background: currentContext === 'pessoal' ? (totalAmount >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(99, 102, 241, 0.1)',
                border: `1px solid ${currentContext === 'pessoal' ? (totalAmount >= 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)') : 'rgba(99, 102, 241, 0.3)'}`,
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '0.5rem'
              }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                  {currentContext === 'pessoal' ? 'Saldo do dia' : 'Total do dia'}
                </span>
                <span style={{ 
                  color: currentContext === 'pessoal' ? (totalAmount >= 0 ? '#86efac' : '#fca5a5') : 'var(--accent-primary)', 
                  fontWeight: 800, fontSize: '1.4rem', letterSpacing: '-0.02em' 
                }}>
                  R$ {totalAmount.toFixed(2).replace('.', ',')}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ borderTop: billToEdit ? 'none' : '1px solid var(--item-border)', paddingTop: billToEdit ? '0' : '1.5rem' }}>
          {!billToEdit && (
            <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '1rem' }}>
              Adicionar Conta
            </span>
          )}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
              <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setType('receita')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                    background: type === 'receita' ? 'rgba(16, 185, 129, 0.2)' : 'transparent',
                    color: type === 'receita' ? '#10b981' : 'var(--text-secondary)',
                    border: `1px solid ${type === 'receita' ? 'rgba(16, 185, 129, 0.4)' : 'var(--input-border)'}`
                  }}
                >
                  Entrada (Receita)
                </button>
                <button
                  type="button"
                  onClick={() => setType('despesa')}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s',
                    background: type === 'despesa' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                    color: type === 'despesa' ? '#ef4444' : 'var(--text-secondary)',
                    border: `1px solid ${type === 'despesa' ? 'rgba(239, 68, 68, 0.4)' : 'var(--input-border)'}`
                  }}
                >
                  Saída (Despesa)
                </button>
              </div>

            <input 
              type="text" required
              placeholder="Nome (ex: Aluguel, Energia...)"
              value={description} onChange={e => setDescription(e.target.value)}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                padding: '0.8rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem',
                outline: 'none', transition: 'all 0.2s', width: '100%'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
              onBlur={(e) => e.currentTarget.style.borderColor = 'var(--input-border)'}
            />

            <div style={{ display: 'flex', gap: '12px' }}>
              {type === 'receita' ? (
                currentContext === 'pessoal' ? (
                  <select 
                    value={person} onChange={e => setPerson(e.target.value)} required
                    style={{
                      background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                      padding: '0.8rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem',
                      outline: 'none', flex: 1, cursor: 'pointer', appearance: 'none'
                    }}
                  >
                    <option value="Rafael" style={{ background: 'var(--calendar-bg)' }}>Rafael</option>
                    <option value="Tásia" style={{ background: 'var(--calendar-bg)' }}>Tásia</option>
                  </select>
                ) : null // Empresarial Receita doesn't show category or person dropdown
              ) : (
                <select 
                  value={categoryId} onChange={e => setCategoryId(e.target.value)} required
                  style={{
                    background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                    padding: '0.8rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem',
                    outline: 'none', flex: 1, cursor: 'pointer', appearance: 'none'
                  }}
                >
                  <option value="" style={{ background: 'var(--calendar-bg)' }}>Categoria</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id} style={{ background: 'var(--calendar-bg)' }}>{c.name}</option>
                  ))}
                </select>
              )}

              <input 
                type="number" step="0.01" required
                placeholder="Valor (R$)"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  padding: '0.8rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.95rem',
                  outline: 'none', width: (type === 'receita' && currentContext === 'empresarial') ? '100%' : '120px',
                  flex: (type === 'receita' && currentContext === 'empresarial') ? 1 : 'none'
                }}
                onFocus={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onBlur={(e) => e.currentTarget.style.borderColor = 'var(--input-border)'}
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
