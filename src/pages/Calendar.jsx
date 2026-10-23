import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronLeft, ChevronRight, Plus, Filter, Settings, Sun, Moon, UploadCloud } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BillModal from '../components/BillModal';
import BoletoImportModal from '../components/BoletoImportModal';
import CategoryModal from '../components/CategoryModal';
import Sidebar from '../components/Sidebar';
import MiniDashboard from '../components/MiniDashboard';

export default function Calendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // States para dados
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  
  // UI States
  const [currentContext, setCurrentContext] = useState('empresarial');
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    // Verifica tema salvo ou preferência do sistema
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-mode');
    }
  }, []);

  useEffect(() => {
    fetchBills();
    fetchCategories();
  }, [currentDate, currentContext]);

  const fetchCategories = async () => {
    if (!user) return;
    const { data } = await supabase.from('categories').select('*').eq('context', currentContext);
    
    if (data && data.length === 0) {
      const defaults = currentContext === 'empresarial' ? [
        { user_id: user.id, name: 'Fornecedores', context: currentContext },
        { user_id: user.id, name: 'Ponto Comercial', context: currentContext },
        { user_id: user.id, name: 'Pessoal', context: currentContext },
        { user_id: user.id, name: 'Impostos', context: currentContext },
        { user_id: user.id, name: 'Vendas e Logística', context: currentContext },
        { user_id: user.id, name: 'Marketing', context: currentContext },
        { user_id: user.id, name: 'Administrativo', context: currentContext }
      ] : [
        { user_id: user.id, name: 'Moradia', context: currentContext },
        { user_id: user.id, name: 'Educação', context: currentContext },
        { user_id: user.id, name: 'Saúde', context: currentContext },
        { user_id: user.id, name: 'Cartão de Crédito', context: currentContext },
        { user_id: user.id, name: 'Veículos', context: currentContext },
        { user_id: user.id, name: 'Alimentação', context: currentContext },
        { user_id: user.id, name: 'Finanças', context: currentContext },
        { user_id: user.id, name: 'Lazer', context: currentContext }
      ];
      await supabase.from('categories').insert(defaults);
      const { data: newData } = await supabase.from('categories').select('*').eq('context', currentContext);
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
      .eq('context', currentContext)
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



    daysInterval.forEach(currentDay => {
      const formattedDate = format(currentDay, "d");
      const dayString = format(currentDay, 'yyyy-MM-dd');
      
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isToday = isSameDay(currentDay, new Date());
      const isSelected = isSameDay(currentDay, selectedDate);

      // Soma das contas do dia
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
          
          {/* Somatório de Contas */}
          <div style={{ flex: 1, marginTop: '8px', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
            {receitas > 0 && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#86efac',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                textAlign: 'right',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                fontSize: '0.8rem'
              }}>
                + R$ {receitas.toFixed(2).replace('.', ',')}
              </div>
            )}
            {despesas > 0 && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                textAlign: 'right',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                fontSize: '0.8rem'
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
      <div style={{ 
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '8px',
        padding: '4px',
      }}>
        {days}
      </div>
    );
  };


  return (
    <div className="app-layout">
      <Sidebar currentContext={currentContext} setContext={setCurrentContext} onOpenImport={() => setIsBoletoModalOpen(true)} />
      <div className="main-area">
      
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



          <button 
            onClick={() => setIsBoletoModalOpen(true)} 
            className="btn btn-primary" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
              fontWeight: 600
            }}
          >
            <UploadCloud size={17} />
            Importar Boleto
          </button>

          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Alternar Tema">
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderDaysOfWeek()}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {renderCells()}
        </div>
      </main>
      </div>

      <MiniDashboard bills={bills} currentDate={currentDate} categories={categories} currentContext={currentContext} />

      <BoletoImportModal
        isOpen={isBoletoModalOpen}
        onClose={() => setIsBoletoModalOpen(false)}
        user={user}
        categories={categories}
        onImportSuccess={fetchBills}
      />

      <BillModal 
        isOpen={isBillModalOpen} 
        onClose={() => setIsBillModalOpen(false)} 
        selectedDate={selectedDate}
        user={user}
        categories={categories}
        bills={bills}
        onBillSaved={fetchBills}
        currentContext={currentContext}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        user={user}
        categories={categories}
        onCategoriesUpdated={fetchCategories}
        currentContext={currentContext}
      />

    </div>
  );
}
