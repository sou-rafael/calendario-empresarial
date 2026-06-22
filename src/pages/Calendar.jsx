import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronLeft, ChevronRight, Plus, Filter, Settings, Sun, Moon } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BillModal from '../components/BillModal';
import CategoryModal from '../components/CategoryModal';

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // States para dados
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  
  // UI States
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    fetchCategories();
    // Verifica tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-mode');
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [currentDate]);

  const fetchCategories = async () => {
    if (!user) return;
    const { data } = await supabase.from('categories').select('*');
    
    if (data && data.length === 0) {
      // Inserir categorias padrão
      const defaults = [
        { user_id: user.id, name: 'Produtos' },
        { user_id: user.id, name: 'Impostos' },
        { user_id: user.id, name: 'Folha' },
        { user_id: user.id, name: 'Custos Fixos' }
      ];
      await supabase.from('categories').insert(defaults);
      const { data: newData } = await supabase.from('categories').select('*');
      setCategories(newData || []);
    } else {
      setCategories(data || []);
    }
  };

  const fetchBills = async () => {
    // Buscar contas do mês atual (um pouco antes e depois para cobrir a grade inteira)
    const start = format(startOfWeek(startOfMonth(currentDate)), 'yyyy-MM-dd');
    const end = format(endOfWeek(endOfMonth(currentDate)), 'yyyy-MM-dd');
    
    const { data } = await supabase
      .from('bills')
      .select('*')
      .gte('date', start)
      .lte('date', end);
      
    setBills(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const toggleTheme = () => {
    if (isLightMode) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
      setIsLightMode(false);
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
      setIsLightMode(true);
    }
  };

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

    // Filtra as contas se houver filtro selecionado
    const filteredBills = filterCategoryId 
      ? bills.filter(b => b.category_id === filterCategoryId)
      : bills;

    const totalMonthlyAmount = filteredBills.reduce((acc, bill) => acc + Number(bill.amount), 0);

    daysInterval.forEach(currentDay => {
      const formattedDate = format(currentDay, "d");
      const dayString = format(currentDay, 'yyyy-MM-dd');
      
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDay(currentDay, new Date());
      const isSelected = isSameDay(currentDay, selectedDate);

      // Soma das contas do dia
      const dayBills = filteredBills.filter(b => b.date === dayString);
      const totalAmount = dayBills.reduce((acc, bill) => acc + Number(bill.amount), 0);

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
          
          {/* Somatório de Contas */}
          <div style={{ flex: 1, marginTop: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            {totalAmount > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                textAlign: 'right',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}>
                R$ {totalAmount.toFixed(2).replace('.', ',')}
              </div>
            )}
            {dayBills.length > 0 && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '4px' }}>
                {dayBills.length} {dayBills.length === 1 ? 'conta' : 'contas'}
              </div>
            )}
          </div>
        </div>
      );
    });

    return (
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '8px',
        padding: '4px',
      }}>
        {days}
      </div>
    );
  };

  // Cálculo rápido para renderizar o total no cabeçalho sem precisar calcular tudo de novo
  const currentFilteredBills = filterCategoryId ? bills.filter(b => b.category_id === filterCategoryId) : bills;
  const totalMonth = currentFilteredBills.reduce((acc, bill) => acc + Number(bill.amount), 0);

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      <header style={{ 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
        marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)' }}>Fluxo de Caixa</h1>
            <p style={{ fontSize: '0.875rem', margin: 0, color: 'var(--text-muted)' }}>{user?.email}</p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: 'var(--radius-md)' }}>
            <button className="btn" onClick={prevMonth} style={{ padding: '6px', background: 'transparent' }}><ChevronLeft size={20} color="var(--text-secondary)" /></button>
            <h2 style={{ fontSize: '1.1rem', minWidth: '150px', textAlign: 'center', margin: 0, textTransform: 'capitalize' }}>
              {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <button className="btn" onClick={nextMonth} style={{ padding: '6px', background: 'transparent' }}><ChevronRight size={20} color="var(--text-secondary)" /></button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', padding: '0 12px' }}>
            <Filter size={16} color="var(--text-secondary)" style={{ marginRight: '8px' }} />
            <select 
              value={filterCategoryId} 
              onChange={(e) => setFilterCategoryId(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', padding: '0.6rem 0', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', marginLeft: '8px', padding: '4px' }}
              title="Gerenciar Categorias"
            >
              <Settings size={16} />
            </button>
          </div>

          {totalMonth > 0 && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#fca5a5',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontSize: '1.1rem'
            }}>
              Total Mês: R$ {totalMonth.toFixed(2).replace('.', ',')}
            </div>
          )}

          <button onClick={() => setIsBillModalOpen(true)} className="btn btn-primary">
            <Plus size={18} /> Adicionar Conta
          </button>
          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Alternar Tema">
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ 
        flex: 1, 
        padding: '1.5rem', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--calendar-bg)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        boxShadow: 'var(--shadow-md)'
      }}>
        {renderDaysOfWeek()}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderCells()}
        </div>
      </main>

      <BillModal 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
        selectedDate={selectedDate}
        user={user}
        categories={categories}
        onBillSaved={fetchBills}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        user={user}
        categories={categories}
        onCategoriesUpdated={fetchCategories}
      />

    </div>
  );
}
