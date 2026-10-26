import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { 
  Mic, UploadCloud, Copy, Check, ExternalLink, Calendar as CalendarIcon, 
  MessageSquare, Briefcase, User, ChevronRight, AlertCircle, Sparkles, Monitor, Sun, Moon
} from 'lucide-react';
import { format, isAfter, isToday, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import BoletoImportModal from '../components/BoletoImportModal';

export default function MobilePocket() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados principais
  const [currentTab, setCurrentTab] = useState('home'); // 'home' ou 'chat'
  const [currentContext, setCurrentContext] = useState('empresarial');
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Estado do botão de voz (preparado para Fase 2)
  const [isListening, setIsListening] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState('');

  useEffect(() => {
    // Sincroniza tema salvo no localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsLightMode(true);
      document.body.classList.add('light-mode');
    }
  }, []);

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

  useEffect(() => {
    fetchData();
  }, [currentContext]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      const { data: catData } = await supabase
        .from('categories')
        .select('*')
        .eq('context', currentContext);

      setBills(billsData || []);
      setCategories(catData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar os próximos vencimentos a partir de hoje
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const upcomingBills = bills
    .filter(b => b.date >= todayStr)
    .slice(0, 4);

  const totalUpcoming = upcomingBills.reduce((acc, b) => acc + Number(b.amount), 0);

  const copyBarcode = (code, id) => {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVoiceButtonClick = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setVoiceFeedback('Ouvindo... Dite seu compromisso (ex: "Pagar aluguel 1500 dia 10")');
      setTimeout(() => {
        setVoiceFeedback('Fase 2: Conectando motor Web Speech API...');
      }, 2500);
    } else {
      setVoiceFeedback('');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      maxWidth: '480px',
      margin: '0 auto',
      position: 'relative',
      paddingBottom: '80px',
      boxShadow: 'var(--shadow-lg)'
    }}>
      
      {/* 1. Header do Pocket */}
      <header style={{
        padding: '1rem 0.85rem',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, fontSize: '0.9rem', color: '#fff',
            boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)'
          }}>
            FZ
          </div>
          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>FiscalZap</h1>
            <span style={{ fontSize: '0.62rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Pocket Mobile
            </span>
          </div>
        </div>

        {/* Controles: Contexto, Tema e Atalho Desktop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', background: 'var(--bg-secondary)', borderRadius: '8px', padding: '2px' }}>
            <button
              onClick={() => setCurrentContext('empresarial')}
              style={{
                border: 'none', background: currentContext === 'empresarial' ? 'var(--accent-primary)' : 'transparent',
                color: currentContext === 'empresarial' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px', padding: '4px 7px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Empresa
            </button>
            <button
              onClick={() => setCurrentContext('pessoal')}
              style={{
                border: 'none', background: currentContext === 'pessoal' ? 'var(--accent-primary)' : 'transparent',
                color: currentContext === 'pessoal' ? '#fff' : 'var(--text-muted)',
                borderRadius: '6px', padding: '4px 7px', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer'
              }}
            >
              Pessoal
            </button>
          </div>

          {/* Botão de Tema Sol/Lua */}
          <button
            onClick={toggleTheme}
            title="Alternar Tema Claro / Escuro"
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isLightMode ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {/* Atalho Desktop */}
          <button
            onClick={() => navigate('/')}
            title="Abrir versão Desktop completa"
            style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Monitor size={15} />
          </button>
        </div>
      </header>

      {/* Conteúdo da Aba HOME */}
      {currentTab === 'home' && (
        <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Card Resumo Rápido */}
          <div style={{
            background: isLightMode 
              ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(255, 255, 255, 0.9) 100%)' 
              : 'linear-gradient(135deg, rgba(99, 102, 241, 0.12) 0%, rgba(20, 24, 30, 0.6) 100%)',
            border: '1px solid var(--border-focus)',
            borderRadius: '20px',
            padding: '1.25rem',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Próximos Vencimentos
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 700 }}>
                {upcomingBills.length} contas na fila
              </span>
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              R$ {totalUpcoming.toFixed(2).replace('.', ',')}
            </div>
          </div>

          {/* 2. ZONA DE AÇÃO PRINCIPAL: BOTÃO GIGANTE DE VOZ (MICROFONE) */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem 0 1rem 0'
          }}>
            <div style={{ position: 'relative' }}>
              {/* Efeito de onda pulsante se estiver gravando */}
              {isListening && (
                <div style={{
                  position: 'absolute', top: '-10px', left: '-10px', right: '-10px', bottom: '-10px',
                  borderRadius: '50%', background: 'rgba(239, 68, 68, 0.3)',
                  animation: 'pulse 1.5s infinite ease-in-out'
                }} />
              )}
              
              <button
                onClick={handleVoiceButtonClick}
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  background: isListening 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                    : 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isListening
                    ? '0 0 35px rgba(239, 68, 68, 0.6)'
                    : '0 10px 30px rgba(99, 102, 241, 0.45)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                <Mic size={40} strokeWidth={2.2} />
              </button>
            </div>

            <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '1rem', letterSpacing: '-0.01em' }}>
              {isListening ? 'Gravando sua voz...' : 'Ditar Compromisso'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '4px', maxWidth: '280px' }}>
              {voiceFeedback || 'Toque para falar: data, valor e fornecedor serão lançados sozinhos.'}
            </span>

            {/* Botão Secundário: Anexar Boleto / PDF */}
            <button
              onClick={() => setIsBoletoModalOpen(true)}
              style={{
                marginTop: '1.25rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-primary)',
                padding: '0.65rem 1.25rem',
                borderRadius: '12px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <UploadCloud size={16} color="var(--accent-primary)" />
              <span>Anexar ou Ler PDF do Boleto</span>
            </button>
          </div>

          {/* 3. MINI-LISTA DE PRÓXIMOS VENCIMENTOS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>
                Vencimentos Imediatos
              </h2>
              <button 
                onClick={() => navigate('/list')}
                style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                Ver todas <ChevronRight size={13} />
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Carregando compromissos...
              </div>
            ) : upcomingBills.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '2rem 1rem',
                background: 'var(--bg-secondary)', borderRadius: '16px',
                border: '1px dashed var(--border-color)', color: 'var(--text-muted)', fontSize: '0.85rem'
              }}>
                Nenhuma conta próxima de vencer!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {upcomingBills.map(bill => {
                  const billDate = parseISO(bill.date);
                  const isDueToday = isToday(billDate);
                  
                  return (
                    <div key={bill.id} style={{
                      background: isDueToday 
                        ? (isLightMode ? 'rgba(239, 68, 68, 0.08)' : 'rgba(239, 68, 68, 0.12)') 
                        : 'var(--bg-secondary)',
                      border: isDueToday ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{bill.description}</div>
                          <div style={{ fontSize: '0.75rem', color: isDueToday ? '#ef4444' : 'var(--text-muted)', marginTop: '2px', fontWeight: 600 }}>
                            {isDueToday ? '⚠️ VENCE HOJE' : `Vence ${format(billDate, "dd 'de' MMM", { locale: ptBR })}`}
                          </div>
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.02em' }}>
                          R$ {Number(bill.amount).toFixed(2).replace('.', ',')}
                        </div>
                      </div>

                      {/* Ações com 1 Toque: Copiar Linha Digitável ou Ver PDF */}
                      {(bill.barcode || bill.file_url) && (
                        <div style={{ display: 'flex', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                          {bill.barcode && (
                            <button
                              onClick={() => copyBarcode(bill.barcode, bill.id)}
                              style={{
                                flex: 1,
                                background: copiedId === bill.id ? 'rgba(52, 211, 153, 0.15)' : 'rgba(99, 102, 241, 0.12)',
                                border: copiedId === bill.id ? '1px solid #34d399' : '1px solid rgba(99, 102, 241, 0.3)',
                                color: copiedId === bill.id ? '#10b981' : 'var(--accent-primary)',
                                borderRadius: '8px',
                                padding: '6px 8px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              {copiedId === bill.id ? <Check size={12} /> : <Copy size={12} />}
                              {copiedId === bill.id ? 'Copiado!' : 'Copiar Código'}
                            </button>
                          )}

                          {bill.file_url && (
                            <a
                              href={bill.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                background: 'rgba(52, 211, 153, 0.12)',
                                border: '1px solid rgba(52, 211, 153, 0.3)',
                                color: '#10b981',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                            >
                              <ExternalLink size={12} />
                              PDF
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </main>
      )}

      {/* Conteúdo da Aba CHAT (Assistente IA) */}
      {currentTab === 'chat' && (
        <main style={{ padding: '1rem', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '1rem', boxShadow: '0 8px 25px rgba(168, 85, 247, 0.35)'
          }}>
            <Sparkles size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Consultor FiscalZap</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', maxWidth: '300px', lineHeight: 1.5, margin: 0 }}>
            Tire dúvidas sobre seus prazos fiscais, fluxo de caixa e simulação de impostos.
          </p>
          <div style={{
            marginTop: '1.5rem', padding: '0.75rem 1rem', borderRadius: '12px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            fontSize: '0.8rem', color: 'var(--text-secondary)'
          }}>
            🚀 Em desenvolvimento para a Fase 3
          </div>
        </main>
      )}

      {/* 4. BOTTOM NAVIGATION BAR (Navegação de Bolso Fixa) */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        maxWidth: '480px',
        margin: '0 auto',
        height: '68px',
        background: 'var(--bg-primary)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 100,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)'
      }}>
        <button
          onClick={() => setCurrentTab('home')}
          style={{
            background: 'transparent', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: currentTab === 'home' ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.2s', padding: '8px'
          }}
        >
          <CalendarIcon size={20} strokeWidth={currentTab === 'home' ? 2.5 : 2} />
          <span style={{ fontSize: '0.7rem', fontWeight: currentTab === 'home' ? 700 : 500 }}>Início</span>
        </button>

        <button
          onClick={() => setCurrentTab('chat')}
          style={{
            background: 'transparent', border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            color: currentTab === 'chat' ? 'var(--accent-primary)' : 'var(--text-muted)',
            cursor: 'pointer', transition: 'all 0.2s', padding: '8px'
          }}
        >
          <MessageSquare size={20} strokeWidth={currentTab === 'chat' ? 2.5 : 2} />
          <span style={{ fontSize: '0.7rem', fontWeight: currentTab === 'chat' ? 700 : 500 }}>Consultor IA</span>
        </button>
      </nav>

      {/* Modal de Importação de Boleto reutilizado */}
      <BoletoImportModal
        isOpen={isBoletoModalOpen}
        onClose={() => setIsBoletoModalOpen(false)}
        user={user}
        categories={categories}
        onImportSuccess={fetchData}
      />

    </div>
  );
}
