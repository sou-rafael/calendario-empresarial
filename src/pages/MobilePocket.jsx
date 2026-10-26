import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/AuthProvider';
import { supabase } from '../lib/supabase';
import { 
  Mic, UploadCloud, Copy, Check, ExternalLink, Calendar as CalendarIcon, 
  MessageSquare, Briefcase, User, ChevronRight, AlertCircle, Sparkles, Monitor, Sun, Moon, Square, Lightbulb, Bell, BellOff, BellRing
} from 'lucide-react';
import { format, isAfter, isToday, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import BoletoImportModal from '../components/BoletoImportModal';
import VoiceConfirmModal from '../components/VoiceConfirmModal';
import MobileChatView from '../components/MobileChatView';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useWebPush } from '../hooks/useWebPush';
import { parseVoiceExpense } from '../utils/voiceParser';

export default function MobilePocket() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Estados principais
  const [currentTab, setCurrentTab] = useState('home'); // 'home' ou 'chat'
  const [currentContext, setCurrentContext] = useState('empresarial');
  const [bills, setBills] = useState([]);
  const [categories, setCategories] = useState([]);
  const [empresaBills, setEmpresaBills] = useState([]);
  const [empresaCategories, setEmpresaCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);
  const [isBoletoModalOpen, setIsBoletoModalOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  // Estados do fluxo de voz
  const [parsedVoiceData, setParsedVoiceData] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [exampleIndex, setExampleIndex] = useState(0);

  // Exemplos do carrossel rotativo de inspiração
  const examplePhrases = [
    '💡 Exemplo: "Água 150 reais amanhã"',
    '💡 Exemplo: "Aluguel 2500 reais dia 10"',
    '💡 Exemplo: "DAS Simples Nacional 890 sexta-feira"',
    '💡 Exemplo: "Energia Copel 380 reais dia 15"',
    '💡 Exemplo: "Fornecedor Grãos 1200 amanhã"'
  ];

  useEffect(() => {
    // Rotaciona o exemplo suavemente a cada 4 segundos
    const timer = setInterval(() => {
      setExampleIndex((prev) => (prev + 1) % examplePhrases.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Hook de Notificações Web Push (Fase 4)
  const { 
    permission: pushPermission, 
    requestPermission: requestPushPermission, 
    checkAndNotifyTodayBills 
  } = useWebPush(user, bills);

  // Hook nativo da Web Speech API (HTML5)
  const { 
    isListening, 
    transcript, 
    error: speechError, 
    isSupported, 
    startListening, 
    stopListening,
    setTranscript 
  } = useSpeechRecognition();

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

  // Quando o usuário termina de falar e há transcrição, aciona o parser
  useEffect(() => {
    if (!isListening && transcript && transcript.trim().length > 3) {
      const result = parseVoiceExpense(transcript, categories);
      if (result) {
        setParsedVoiceData(result);
        setIsConfirmModalOpen(true);
      }
    }
  }, [isListening, transcript]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Busca todas as categorias do usuário (para isolar os IDs empresariais)
      const { data: allCategories } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id);

      const allCats = allCategories || [];
      const currentCats = allCats.filter(c => c.context === currentContext);
      const onlyEmpresaCats = allCats.filter(c => c.context === 'empresarial');
      const empresaCatIds = new Set(onlyEmpresaCats.map(c => c.id));

      // 2. Busca as contas do usuário
      const { data: billsData } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      const allBills = billsData || [];

      // Filtra as contas do contexto ativo
      const activeBills = allBills.filter(b => {
        // Se a conta tem a coluna context explícita, usa ela
        if (b.context) return b.context === currentContext;
        // Caso contrário, vincula pela categoria
        const cat = allCats.find(c => c.id === b.category_id);
        return cat ? cat.context === currentContext : true;
      });

      // Filtra estritamente as contas EMPRESARIAIS para o Consultor
      const strictlyEmpresaBills = allBills.filter(b => {
        if (b.context) return b.context === 'empresarial';
        if (b.category_id && empresaCatIds.has(b.category_id)) return true;
        // Se a categoria for de contexto pessoal, exclui
        const cat = allCats.find(c => c.id === b.category_id);
        return cat ? cat.context === 'empresarial' : true;
      });

      setBills(activeBills);
      setCategories(currentCats);
      setEmpresaBills(strictlyEmpresaBills);
      setEmpresaCategories(onlyEmpresaCats);
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

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      setTranscript('');
      startListening();
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

          {/* Botão de Notificações Web Push */}
          <button
            onClick={requestPushPermission}
            title={pushPermission === 'granted' ? 'Notificações Ativas (Clique para testar alerta)' : 'Ativar Alertas de Vencimento'}
            style={{
              background: pushPermission === 'granted' ? 'rgba(52, 211, 153, 0.15)' : 'var(--bg-secondary)',
              border: pushPermission === 'granted' ? '1px solid rgba(52, 211, 153, 0.3)' : '1px solid var(--border-color)',
              color: pushPermission === 'granted' ? '#10b981' : 'var(--text-secondary)',
              padding: '6px', borderRadius: '8px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s'
            }}
          >
            {pushPermission === 'granted' ? <BellRing size={15} /> : <Bell size={15} />}
          </button>

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
          
          {/* Banner de Ativação de Notificações (Fase 4) */}
          {pushPermission !== 'granted' && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0.05) 100%)',
              border: '1px solid rgba(129, 140, 248, 0.3)',
              borderRadius: '16px',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px',
              boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '32px', height: '32px', borderRadius: '8px',
                  background: 'var(--accent-primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bell size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Lembrar boletos no dia?
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Receba um alerta matinal nos dias de vencimento.
                  </div>
                </div>
              </div>

              <button
                onClick={requestPushPermission}
                style={{
                  background: 'var(--accent-primary)',
                  border: 'none',
                  color: '#fff',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                Ativar
              </button>
            </div>
          )}

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
            padding: '1rem 0 0.5rem 0'
          }}>
            <div style={{ position: 'relative' }}>
              {/* Efeito de onda pulsante se estiver gravando */}
              {isListening && (
                <div style={{
                  position: 'absolute', top: '-12px', left: '-12px', right: '-12px', bottom: '-12px',
                  borderRadius: '50%', background: 'rgba(239, 68, 68, 0.35)',
                  animation: 'pulse 1.2s infinite ease-in-out'
                }} />
              )}
              
              <button
                onClick={handleVoiceToggle}
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
                {isListening ? <Square size={34} fill="#fff" /> : <Mic size={40} strokeWidth={2.2} />}
              </button>
            </div>

            <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isListening ? '#ef4444' : 'var(--text-primary)', marginTop: '0.85rem', letterSpacing: '-0.01em' }}>
              {isListening ? 'Ouvindo... Toque para finalizar' : 'Ditar Compromisso'}
            </span>

            {/* Carrossel de Frases Inspiradoras (Orientação Suave de UX) */}
            <div style={{
              marginTop: '0.4rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '38px',
              maxWidth: '340px',
              textAlign: 'center'
            }}>
              {transcript ? (
                <span style={{ fontSize: '0.88rem', color: 'var(--accent-primary)', fontWeight: 700, fontStyle: 'italic' }}>
                  "{transcript}"
                </span>
              ) : isListening ? (
                <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>
                  Fale: Nome da conta + Valor + Data
                </span>
              ) : (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  transition: 'all 0.4s ease-in-out',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {examplePhrases[exampleIndex]}
                </div>
              )}
            </div>

            {speechError && (
              <span style={{ fontSize: '0.75rem', color: '#ef4444', textAlign: 'center', marginTop: '4px', maxWidth: '280px' }}>
                {speechError}
              </span>
            )}

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

      {/* Conteúdo da Aba CHAT (Consultor Fiscal Empresarial) */}
      {currentTab === 'chat' && (
        <MobileChatView bills={empresaBills} categories={empresaCategories} />
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

      {/* Modal de Confirmação de Voz (Fase 2) */}
      <VoiceConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        parsedData={parsedVoiceData}
        categories={categories}
        user={user}
        onSuccess={fetchData}
      />

      {/* Modal de Importação de Boleto */}
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
