import React from 'react';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  isSameMonth, isSameDay, addDays, eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';

export default function CalendarView() {
  const { 
    bills, currentDate, currentContext, selectedDate, setSelectedDate, 
    filterCategoryId, setIsBillModalOpen 
  } = useOutletContext();

  const renderDaysOfWeek = () => {
    const days = [];
    const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); 
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} style={{ textAlign: 'center', fontWeight: 600, padding: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem', textTransform: 'uppercase' }}>
          {format(addDays(startDate, i), 'EEE', { locale: ptBR })}
        </div>
      );
    }
    return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '0.5rem' }}>{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    const daysInterval = eachDayOfInterval({ start: startDate, end: endDate });
    const days = [];

    const filteredBills = filterCategoryId 
      ? bills.filter(b => b.category_id === filterCategoryId)
      : bills;

    daysInterval.forEach(currentDay => {
      const formattedDate = format(currentDay, "d");
      const dayString = format(currentDay, 'yyyy-MM-dd');
      
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDay(currentDay, new Date());
      const isSelected = isSameDay(currentDay, selectedDate);

      const dayBills = filteredBills.filter(b => b.date === dayString);
      const receitas = dayBills.filter(b => b.type === 'receita').reduce((acc, bill) => acc + Number(bill.amount), 0);
      const despesas = dayBills.filter(b => b.type === 'despesa' || !b.type).reduce((acc, bill) => acc + Number(bill.amount), 0);

      days.push(
        <div
          key={currentDay.toString()}
          onClick={() => { setSelectedDate(currentDay); setIsBillModalOpen(true); }}
          style={{
            minHeight: '120px', padding: '10px',
            backgroundColor: isCurrentMonth ? 'var(--cell-bg)' : 'transparent',
            borderRadius: '14px',
            border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
            cursor: 'pointer', transition: 'all var(--transition-fast)',
            display: 'flex', flexDirection: 'column',
            opacity: isCurrentMonth ? 1 : 0.35,
            boxShadow: isSelected ? '0 0 12px rgba(99, 102, 241, 0.25)' : 'none'
          }}
          className={isCurrentMonth ? 'calendar-cell-active' : 'calendar-cell-inactive'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px',
              borderRadius: '8px',
              background: isToday ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)' : 'transparent',
              color: isToday ? '#fff' : (isSelected ? 'var(--accent-primary)' : 'inherit'),
              fontWeight: isToday || isSelected ? 800 : 500,
              fontSize: '0.85rem',
              boxShadow: isToday ? '0 2px 8px rgba(99, 102, 241, 0.35)' : 'none'
            }}>
              {formattedDate}
            </span>
          </div>
          
          <div style={{ flex: 1, marginTop: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
            {receitas > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', padding: '3px 6px',
                borderRadius: '6px', fontWeight: 700, textAlign: 'right', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78rem'
              }}>
                + R$ {receitas.toFixed(2).replace('.', ',')}
              </div>
            )}
            {despesas > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', padding: '3px 6px',
                borderRadius: '6px', fontWeight: 700, textAlign: 'right', border: '1px solid rgba(239, 68, 68, 0.25)', fontSize: '0.78rem'
              }}>
                - R$ {despesas.toFixed(2).replace('.', ',')}
              </div>
            )}
            {dayBills.length > 0 && (
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px', fontWeight: 600 }}>
                {dayBills.length} {dayBills.length === 1 ? 'lançamento' : 'lançamentos'}
              </div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', padding: '4px' }}>
        {days}
      </div>
    );
  };

  return (
    <>
      {renderDaysOfWeek()}
      {renderCells()}
    </>
  );
}
