import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronLeft, ChevronRight, Plus, Filter, Settings, Sun, Moon, UploadCloud } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, eachDayOfInterval
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Outlet } from 'react-router-dom';
import BillModal from './BillModal';
import BoletoImportModal from './BoletoImportModal';
import CategoryModal from './CategoryModal';
import Sidebar from './Sidebar';
import MiniDashboard from './MiniDashboard';

export default function Layout() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // States para dados
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filterCategoryId, setFilterCategoryId] = useState('');
  const [billToEdit, setBillToEdit] = useState(null);
  
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

  return (
    <div className="app-layout">
      <Sidebar currentContext={currentContext} setContext={setCurrentContext} />
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
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              height: '38px',
              padding: '0 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.875rem',
              fontWeight: 600,
              letterSpacing: '0.01em',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(99, 102, 241, 0.25)';
            }}
          >
            <UploadCloud size={16} strokeWidth={2.2} />
            <span>Importar Boleto</span>
          </button>

          <button onClick={toggleTheme} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Alternar Tema">
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }} title="Sair">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
        <Outlet context={{ bills, categories, currentDate, currentContext, setCurrentDate, selectedDate, setSelectedDate, filterCategoryId, setFilterCategoryId, setIsBillModalOpen, setBillToEdit, fetchBills }} />
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
        onClose={() => { setIsBillModalOpen(false); setBillToEdit(null); }} 
        selectedDate={selectedDate}
        user={user}
        categories={categories}
        bills={bills}
        onBillSaved={fetchBills}
        currentContext={currentContext}
        billToEdit={billToEdit}
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
