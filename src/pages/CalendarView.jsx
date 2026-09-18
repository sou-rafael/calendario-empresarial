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
            borderRadius: 'var(--radius-md)',
            border: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
            cursor: 'pointer', transition: 'all var(--transition-fast)',
            display: 'flex', flexDirection: 'column',
            opacity: isCurrentMonth ? 1 : 0.4,
          }}
          className={isCurrentMonth ? 'calendar-cell-active' : 'calendar-cell-inactive'}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ 
              display: 'inline-block', width: '28px', height: '28px', lineHeight: '28px', textAlign: 'center',
              borderRadius: '50%', backgroundColor: isToday ? 'var(--accent-primary)' : 'transparent',
              color: isToday ? 'white' : (isSelected ? 'var(--accent-primary)' : 'inherit'),
              fontWeight: isToday || isSelected ? 'bold' : 'normal',
            }}>
              {formattedDate}
            </span>
          </div>
          
          <div style={{ flex: 1, marginTop: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
            {receitas > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px',
                borderRadius: '4px', fontWeight: 600, textAlign: 'right', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '0.8rem'
              }}>
                + R$ {receitas.toFixed(2).replace('.', ',')}
              </div>
            )}
            {despesas > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px',
                borderRadius: '4px', fontWeight: 600, textAlign: 'right', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.8rem'
              }}>
                - R$ {despesas.toFixed(2).replace('.', ',')}
              </div>
            )}
            {dayBills.length > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '2px' }}>
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
