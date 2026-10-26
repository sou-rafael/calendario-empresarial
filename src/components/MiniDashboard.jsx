import React from 'react';
import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns';
import { TrendingDown, TrendingUp, AlertCircle, PieChart } from 'lucide-react';

export default function MiniDashboard({ bills, currentDate, categories, currentContext }) {
  const currentMonthPrefix = format(currentDate, 'yyyy-MM');
  const currentMonthBills = bills.filter(b => b.date && b.date.startsWith(currentMonthPrefix));
  
  const despesasMonthBills = currentMonthBills.filter(b => b.type === 'despesa' || !b.type);
  const totalPaid = despesasMonthBills.filter(b => b.status === 'Pago').reduce((acc, bill) => acc + Number(bill.amount), 0);
  const totalPending = despesasMonthBills.filter(b => b.status !== 'Pago').reduce((acc, bill) => acc + Number(bill.amount), 0);
  const total = totalPaid + totalPending;

  const totalReceitas = currentMonthBills.filter(b => b.type === 'receita').reduce((acc, bill) => acc + Number(bill.amount), 0);
  const totalDespesas = currentMonthBills.filter(b => b.type === 'despesa' || !b.type).reduce((acc, bill) => acc + Number(bill.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  const today = startOfDay(new Date());
  const next5Days = addDays(today, 5);
  
  const upcomingBills = bills
    .filter(b => b.type !== 'receita' && b.status !== 'Pago')
    .filter(b => {
      if (!b.date) return false;
      const billDate = new Date(b.date + 'T00:00:00');
      return (isAfter(billDate, today) || billDate.getTime() === today.getTime()) && isBefore(billDate, next5Days);
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  const categorySums = categories.map(cat => {
    const sum = despesasMonthBills
      .filter(b => b.category_id === cat.id)
      .reduce((acc, b) => acc + Number(b.amount), 0);
    return { name: cat.name, sum };
  }).filter(c => c.sum > 0).sort((a, b) => b.sum - a.sum).slice(0, 4);

  return (
    <aside className="mini-dashboard">
      <div className="dashboard-section">
        <h3 className="dashboard-title" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>
          Resumo do Mês
        </h3>
        <div className="dashboard-card glass-panel" style={{ borderRadius: '18px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '1.25rem' }}>
          {currentContext === 'empresarial' ? (
            <>
              <div className="summary-row" style={{ marginBottom: '0.75rem' }}>
                <div className="summary-item">
                  <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} color="#10b981" /> Entradas
                  </span>
                  <span className="summary-value text-green" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                    R$ {totalReceitas.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="summary-item" style={{ alignItems: 'flex-end' }}>
                  <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Saldo Líquido
                  </span>
                  <span className={`summary-value ${saldo >= 0 ? 'text-green' : 'text-red-dark'}`} style={{ fontSize: '1.15rem', fontWeight: 800, color: saldo >= 0 ? '#10b981' : '#ef4444' }}>
                    R$ {saldo.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <div className="summary-row" style={{ marginBottom: '0.6rem' }}>
                  <div className="summary-item">
                    <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingDown size={14} color="#ef4444" /> A Pagar
                    </span>
                    <span className="summary-value text-red" style={{ fontSize: '1rem', fontWeight: 700, color: '#ef4444' }}>
                      R$ {totalPending.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                  <div className="summary-item" style={{ alignItems: 'flex-end' }}>
                    <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                      Pago
                    </span>
                    <span className="summary-value" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      R$ {totalPaid.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <div className="progress-bar-bg" style={{ height: '6px', borderRadius: '4px' }}>
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: total > 0 ? `${(totalPaid / total) * 100}%` : '0%', borderRadius: '4px' }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="summary-row" style={{ marginBottom: '0.75rem' }}>
                <div className="summary-item">
                  <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingDown size={14} color="#ef4444" /> Saídas
                  </span>
                  <span className="summary-value text-red" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ef4444' }}>
                    R$ {totalDespesas.toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <div className="summary-item" style={{ alignItems: 'flex-end' }}>
                  <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} color="#10b981" /> Entradas
                  </span>
                  <span className="summary-value text-green" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981' }}>
                    R$ {totalReceitas.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
              <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', marginTop: '0.5rem' }}>
                <div className="summary-item">
                  <span className="summary-label" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Saldo do Mês
                  </span>
                  <span className={`summary-value ${saldo >= 0 ? 'text-green' : 'text-red-dark'}`} style={{ fontSize: '1.35rem', fontWeight: 800, color: saldo >= 0 ? '#10b981' : '#ef4444' }}>
                    R$ {saldo.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="dashboard-section mt-4">
        <h3 className="dashboard-title" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>
          Próximos Vencimentos
        </h3>
        {upcomingBills.length > 0 ? (
          <div className="upcoming-list" style={{ gap: '8px' }}>
            {upcomingBills.map(bill => {
              const cat = categories.find(c => c.id === bill.category_id);
              return (
                <div key={bill.id} className="upcoming-item glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0.75rem 1rem' }}>
                  <div className="upcoming-icon" style={{ borderRadius: '8px', padding: '6px' }}><AlertCircle size={16} /></div>
                  <div className="upcoming-details">
                    <span className="upcoming-desc" style={{ fontSize: '0.88rem', fontWeight: 600 }}>{bill.description}</span>
                    <span className="upcoming-date" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{format(new Date(bill.date + 'T00:00:00'), 'dd/MM')} • {cat?.name}</span>
                  </div>
                  <div className="upcoming-amount" style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ef4444' }}>R$ {Number(bill.amount).toFixed(2).replace('.', ',')}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>Nenhuma conta próxima.</div>
        )}
      </div>

      <div className="dashboard-section mt-4">
        <h3 className="dashboard-title" style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>
          Por Categoria
        </h3>
        <div className="category-list" style={{ gap: '8px' }}>
          {categorySums.map((cat, idx) => (
            <div key={idx} className="category-item glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', padding: '0.75rem 1rem' }}>
              <span className="category-name" style={{ fontSize: '0.88rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}><PieChart size={14} color="var(--accent-primary)" /> {cat.name}</span>
              <span className="category-amount" style={{ fontSize: '0.9rem', fontWeight: 700 }}>R$ {cat.sum.toFixed(2).replace('.', ',')}</span>
            </div>
          ))}
          {categorySums.length === 0 && <div className="empty-state glass-panel" style={{ borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>Sem despesas este mês.</div>}
        </div>
      </div>
    </aside>
  );
}
