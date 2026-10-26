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
        marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)',
        flexWrap: 'wrap', gap: '16px'
      }}>
        {/* Esquerda: Menu do Usuário (Tema e Sair no lugar do antigo "Fluxo de Caixa") */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
          padding: '6px 12px 6px 8px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {/* Avatar com inicial */}
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 800,
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.35)',
            flexShrink: 0
          }}>
            {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}>
              {user?.email?.split('@')[0]}
            </span>
            <span style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              maxWidth: '180px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.1
            }}>
              {user?.email}
            </span>
          </div>

          <div style={{ width: '1px', height: '22px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* Botão Alternar Tema */}
          <button
            onClick={toggleTheme}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'var(--item-hover-bg)';
              e.currentTarget.style.color = 'var(--accent-primary)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title={isLightMode ? 'Ativar modo escuro' : 'Ativar modo claro'}
          >
            {isLightMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Botão Sair */}
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fb7185',
              cursor: 'pointer',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'rgba(244, 63, 94, 0.12)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
            title="Sair da conta"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Centro: Navegação de Mês */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'var(--bg-secondary)',
          padding: '6px 12px',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <button
            className="btn"
            onClick={prevMonth}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--item-hover-bg)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title="Mês anterior"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            minWidth: '160px',
            textAlign: 'center',
            margin: 0,
            textTransform: 'capitalize',
            color: 'var(--text-primary)'
          }}>
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>

          <button
            className="btn"
            onClick={nextMonth}
            style={{
              padding: '6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.background = 'var(--item-hover-bg)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            title="Próximo mês"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Direita: Filtro por Categoria e Importar Boleto */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* Seletor de Categoria */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '0 12px',
            height: '42px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Filter size={16} color="var(--text-secondary)" style={{ marginRight: '8px', flexShrink: 0 }} />
            <select 
              value={filterCategoryId} 
              onChange={(e) => setFilterCategoryId(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.5rem 0',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500
              }}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginLeft: '8px',
                padding: '6px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              title="Gerenciar Categorias"
            >
              <Settings size={16} />
            </button>
          </div>

          {/* Botão Importar Boleto */}
          <button 
            onClick={() => setIsBoletoModalOpen(true)} 
            className="btn btn-primary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              height: '42px',
              padding: '0 16px',
              borderRadius: '14px',
              fontSize: '0.875rem',
              fontWeight: 700,
              letterSpacing: '0.01em',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              whiteSpace: 'nowrap',
              color: '#fff'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 18px rgba(99, 102, 241, 0.5)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px rgba(99, 102, 241, 0.35)';
            }}
          >
            <UploadCloud size={18} strokeWidth={2.4} />
            <span>Importar Boleto</span>
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
