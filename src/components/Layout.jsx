import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { LogOut, ChevronLeft, ChevronRight, Plus, Filter, Settings, Sun, Moon, UploadCloud, ChevronDown } from 'lucide-react';
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
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)',
        flexWrap: 'nowrap', gap: '8px'
      }}>
        {/* Esquerda: Menu Retrátil do Usuário */}
        <div ref={userMenuRef} style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setIsUserMenuOpen(prev => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--bg-secondary)',
              padding: '4px 10px 4px 6px',
              borderRadius: '14px',
              border: isUserMenuOpen ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
              cursor: 'pointer',
              boxShadow: 'var(--shadow-sm)',
              height: '38px',
              transition: 'all 0.2s'
            }}
            title="Menu do usuário"
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: '0 2px 6px rgba(99, 102, 241, 0.35)',
              flexShrink: 0
            }}>
              {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
            </div>
            <span style={{
              fontSize: '0.82rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              maxWidth: '95px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user?.email?.split('@')[0]}
            </span>
            <ChevronDown size={14} color="var(--text-secondary)" style={{ transform: isUserMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Painel Suspenso (Dropdown Retrátil) */}
          {isUserMenuOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              zIndex: 200,
              minWidth: '220px',
              background: 'var(--modal-bg)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-lg)',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              backdropFilter: 'blur(16px)'
            }}>
              {/* Identificação do Usuário */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border-color)', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                  {user?.email?.split('@')[0]}
                </span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', wordBreak: 'break-all' }}>
                  {user?.email}
                </span>
              </div>

              {/* Opção Alternar Tema */}
              <button
                onClick={() => { toggleTheme(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: 'var(--text-primary)',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'var(--item-hover-bg)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {isLightMode ? <Moon size={16} color="var(--accent-primary)" /> : <Sun size={16} color="var(--accent-primary)" />}
                <span>{isLightMode ? 'Modo Escuro' : 'Modo Claro'}</span>
              </button>

              {/* Opção Sair */}
              <button
                onClick={() => { setIsUserMenuOpen(false); handleLogout(); }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  color: '#fb7185',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(244, 63, 94, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} />
                <span>Sair da Conta</span>
              </button>
            </div>
          )}
        </div>

        {/* Centro: Navegação de Mês */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'var(--bg-secondary)',
          padding: '4px 10px',
          borderRadius: '14px',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          height: '38px',
          flexShrink: 0
        }}>
          <button
            className="btn"
            onClick={prevMonth}
            style={{
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            title="Mês anterior"
          >
            <ChevronLeft size={18} />
          </button>
          
          <h2 style={{
            fontSize: '0.95rem',
            fontWeight: 800,
            letterSpacing: '-0.01em',
            minWidth: '135px',
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
              padding: '4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}
            title="Próximo mês"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Direita: Filtro por Categoria e Importar Boleto */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
          
          {/* Seletor de Categoria */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            padding: '0 10px',
            height: '38px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <Filter size={15} color="var(--text-secondary)" style={{ marginRight: '6px', flexShrink: 0 }} />
            <select 
              value={filterCategoryId} 
              onChange={(e) => setFilterCategoryId(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                padding: '0.4rem 0',
                outline: 'none',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: 500,
                maxWidth: '130px'
              }}
            >
              <option value="">Todas Categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                marginLeft: '6px',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="Gerenciar Categorias"
            >
              <Settings size={15} />
            </button>
          </div>

          {/* Botão Importar Boleto */}
          <button 
            onClick={() => setIsBoletoModalOpen(true)} 
            className="btn btn-primary" 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              height: '38px',
              padding: '0 14px',
              borderRadius: '14px',
              fontSize: '0.82rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)',
              border: 'none',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              color: '#fff'
            }}
          >
            <UploadCloud size={16} strokeWidth={2.4} />
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
