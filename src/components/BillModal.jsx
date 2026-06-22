import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import { format } from 'date-fns';

export default function BillModal({ isOpen, onClose, selectedDate, user, categories, onBillSaved }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('bills').insert([
        {
          user_id: user.id,
          date: format(selectedDate, 'yyyy-MM-dd'),
          description,
          amount: parseFloat(amount),
          category_id: categoryId || null,
          status: 'Pendente'
        }
      ]);

      if (error) throw error;
      
      setDescription('');
      setAmount('');
      setCategoryId('');
      onBillSaved();
      onClose();
    } catch (error) {
      alert('Erro ao salvar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem', position: 'relative' }}>
        <button 
          onClick={onClose} 
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
        
        <h3 style={{ marginBottom: '1.5rem' }}>Adicionar Conta</h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Data: {format(selectedDate, 'dd/MM/yyyy')}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Descrição</label>
            <input 
              type="text" required className="input-field" 
              placeholder="Ex: Conta de Luz"
              value={description} onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Valor (R$)</label>
            <input 
              type="number" step="0.01" required className="input-field" 
              placeholder="0.00"
              value={amount} onChange={e => setAmount(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Categoria</label>
            <select 
              className="input-field" 
              value={categoryId} onChange={e => setCategoryId(e.target.value)}
              required
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
