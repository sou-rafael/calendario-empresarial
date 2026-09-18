import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { format, isBefore, startOfDay } from 'date-fns';
import { Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ListView() {
  const { bills, currentContext, filterCategoryId, categories, setSelectedDate, setIsBillModalOpen, setBillToEdit, fetchBills } = useOutletContext();

  const filteredBills = filterCategoryId 
    ? bills.filter(b => b.category_id === filterCategoryId)
    : bills;
    
  // Sort by date descending
  const sortedBills = [...filteredBills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleStatusChange = async (id, newStatus) => {
    try {
      const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      fetchBills();
    } catch (err) {
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
      <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Lançamentos do Mês</h3>
      
      {sortedBills.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Nenhum lançamento encontrado neste mês.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Data</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Descrição</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)' }}>Categoria/Pessoa</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'right' }}>Valor</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedBills.map(bill => {
                const isReceita = bill.type === 'receita';
                const categoryName = categories.find(c => c.id === bill.category_id)?.name;
                const entityName = isReceita ? (bill.person || 'Receita') : (categoryName || '-');
                
                return (
                  <tr 
                    key={bill.id} 
                    style={{ borderBottom: '1px solid var(--item-border)', transition: 'background 0.2s' }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--item-hover-bg)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>
                      {format(new Date(bill.date + 'T00:00:00'), 'dd/MM/yyyy')}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {bill.description}
                    </td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>
                      <span style={{ 
                        background: isReceita ? 'rgba(16, 185, 129, 0.1)' : 'var(--input-bg)', 
                        color: isReceita ? '#10b981' : 'var(--text-secondary)', 
                        padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem' 
                      }}>
                        {entityName}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '1rem', 
                      textAlign: 'right', 
                      color: isReceita ? '#10b981' : '#ef4444',
                      fontWeight: 600
                    }}>
                      {isReceita ? '+' : '-'} R$ {Number(bill.amount).toFixed(2).replace('.', ',')}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <select 
                        value={bill.status}
                        onChange={(e) => handleStatusChange(bill.id, e.target.value)}
                        className={`status-badge ${bill.status === 'Pago' ? 'status-pago' : (isBefore(new Date(bill.date + 'T00:00:00'), startOfDay(new Date())) ? 'status-atrasado' : 'status-pendente')}`}
                      >
                        <option value="Pendente" style={{ background: 'var(--calendar-bg)' }}>Pendente</option>
                        <option value="Pago" style={{ background: 'var(--calendar-bg)' }}>Pago</option>
                      </select>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => {
                          const parts = bill.date.split('-');
                          setSelectedDate(new Date(parts[0], parts[1] - 1, parts[2]));
                          setBillToEdit(bill);
                          setIsBillModalOpen(true);
                        }}
                        style={{
                          background: 'transparent', border: 'none', color: 'var(--text-secondary)', 
                          cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
                        onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                        title="Editar lançamento"
                      >
                        <Edit2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
