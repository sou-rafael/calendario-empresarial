import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Camera, Calendar, CheckCircle2, ShieldCheck, Zap, ArrowRight, 
  Smartphone, ChevronDown, ChevronUp, Copy, Clock, DollarSign, 
  Sparkles, Star, TrendingUp, Check, Play, FileText, LayoutDashboard, 
  ListFilter, Bell, BarChart3, Tag, Moon, Sun, Monitor
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
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

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleGoToApp = () => {
    navigate('/login');
  };

  const faqs = [
    {
      q: 'O que torna o KdConta diferente de uma planilha ou do meu banco?',
      a: 'Planilhas exigem digitação manual constante de fórmulas e datas, além de serem péssimas no celular. No app do banco, você só vê o dinheiro que já saiu ou lançamentos imediatos. O KdConta entrega um Calendário Financeiro com semáforo de status (Pendente, Pago, Atrasado), leitor de boletos, entrada por voz e DRE simplificado.'
    },
    {
      q: 'Como funciona o leitor de boletos por câmera ou PDF?',
      a: 'Você faz o upload do PDF ou tira uma foto do boleto pelo celular. O sistema lê o código de barras ou linha digitável (47/48 dígitos), preenche automaticamente a data de vencimento, o valor e a razão social do fornecedor, anexando o documento original na nuvem.'
    },
    {
      q: 'Como funciona a entrada rápida por voz?',
      a: 'Basta tocar no botão de microfone e falar a despesa: "Internet 150 reais dia 20" ou "Aluguel 2500 amanhã". O sistema interpreta o valor, o vencimento e a categoria, exibindo um card imediato para você confirmar com 1 toque.'
    },
    {
      q: 'Preciso baixar algum aplicativo pesado da Google Play ou App Store?',
      a: 'Não! O KdConta é um PWA (Progressive Web App). Você pode abrir pelo navegador e adicionar direto à tela inicial do seu celular (Android ou iOS) com 1 toque, funcionando com a mesma velocidade e ícone de um app nativo.'
    },
    {
      q: 'O sistema tem DRE e relatórios gerenciais?',
      a: 'Sim! Além do Calendário diário, o KdConta conta com visualização em Lista com filtros, DRE Gerencial Mensal (Receitas vs. Despesas Operacionais e Resultado Líquido) e Dashboard analítico com gráficos de distribuição.'
    },
    {
      q: 'Meus dados e documentos estão seguros?',
      a: 'Totalmente. O sistema roda em banco de dados isolado por usuário com políticas de segurança RLS (Row Level Security) e criptografia de ponta a ponta no armazenamento dos seus boletos.'
    }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-color)',
      color: 'var(--text-primary)',
      fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      overflowX: 'hidden'
    }}>
      
      {/* 1. NAVBAR DE ALTO IMPACTO */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        backgroundColor: isLightMode ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.85)',
        borderBottom: '1px solid var(--border-color)',
        padding: '0.9rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo e Nome */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img 
              src="/favicon.svg" 
              alt="KdConta Logo" 
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            />
            <div>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                KdConta
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 700, display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Cadê a conta?
              </span>
            </div>
          </div>

          {/* Links e Botão de Acesso */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <nav style={{ display: 'none', gap: '1.5rem', alignItems: 'center' }} className="landing-desktop-nav">
              <a href="#funcionalidades" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Funcionalidades</a>
              <a href="#mobile" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>App Mobile</a>
              <a href="#visao-gerencial" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>DRE & Relatórios</a>
              <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Dúvidas</a>
            </nav>

            <button 
              onClick={toggleTheme}
              title={isLightMode ? 'Mudar para Modo Escuro' : 'Mudar para Modo Claro'}
              aria-label="Alternar tema de cores"
              style={{
                background: 'var(--item-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
                padding: '0.55rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isLightMode ? '#f59e0b' : '#818cf8',
                transition: 'all 0.2s',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {isLightMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              onClick={handleGoToApp}
              style={{
                padding: '0.55rem 1.25rem',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
              }}
            >
              Acessar Sistema <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '4.5rem 1.5rem 3rem',
        maxWidth: '1100px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        {/* Glow de Fundo */}
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0
        }} />

        {/* Badge Flutuante */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          borderRadius: '50px',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: 'var(--accent-primary)',
          fontSize: '0.82rem',
          fontWeight: 700,
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <Sparkles size={15} />
          Chega de perder tempo digitando contas e pagando juros
        </div>

        {/* Título Principal */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 5.5vw, 3.8rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: 1.15,
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 1
        }}>
          Cadê a conta? <br />
          <span style={{
            background: 'linear-gradient(135deg, #818cf8 0%, #c084fc 50%, #38bdf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Nunca mais pague multas ou atrase um boleto.
          </span>
        </h1>

        {/* Subtítulo */}
        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          maxWidth: '740px',
          margin: '0 auto 2.25rem',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1
        }}>
          A gestão de contas a pagar mais ágil para pequenas empresas e autônomos. 
          Lance despesas <strong>falando no microfone</strong>, <strong>lendo boletos por foto/PDF</strong> ou 
          acompanhe tudo em um <strong>calendário visual com baixa em 1 clique</strong>.
        </p>

        {/* Botões de Ação */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '2.5rem',
          position: 'relative',
          zIndex: 1
        }}>
          <button 
            onClick={handleGoToApp}
            style={{
              padding: '1rem 2rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1.05rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)',
              transition: 'transform 0.15s'
            }}
          >
            Começar Gratuitamente <ArrowRight size={18} />
          </button>

          <a 
            href="#funcionalidades"
            style={{
              padding: '1rem 1.75rem',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            Conhecer Recursos
          </a>
        </div>

        {/* Selos de Confiança Reais */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1.5rem',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          fontWeight: 600
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Sem necessidade de cartão
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Web Desktop + Mobile PWA
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Baixa rápida em 1 clique
          </span>
        </div>
      </section>

      {/* 3. SIMULAÇÃO VISUAL DO CALENDÁRIO & SISTEMA REAL */}
      <section style={{
        maxWidth: '1080px',
        margin: '0 auto 5rem',
        padding: '0 1.5rem'
      }}>
        <div style={{
          backgroundColor: 'var(--item-bg)',
          borderRadius: '20px',
          border: '1px solid var(--border-color)',
          padding: '1.25rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          position: 'relative'
        }}>
          {/* Header simulado do App */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border-color)',
            marginBottom: '1.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ marginLeft: '10px', fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                app.kdconta.com.br • Painel do Calendário Mensal
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '0.75rem',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                padding: '4px 10px',
                borderRadius: '20px',
                fontWeight: 700
              }}>
                ● Mês em Dia
              </span>
            </div>
          </div>

          {/* Cards de Resumo Financeiro */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            marginBottom: '1.25rem'
          }}>
            <div style={{ backgroundColor: 'var(--cell-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>A Pagar Este Mês</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc' }}>R$ 14.850,00</span>
              <span style={{ fontSize: '0.72rem', color: '#f59e0b', display: 'block', marginTop: '4px' }}>4 contas pendentes</span>
            </div>
            <div style={{ backgroundColor: 'var(--cell-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Já Pago</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>R$ 22.410,00</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginTop: '4px' }}>12 contas quitadas</span>
            </div>
            <div style={{ backgroundColor: 'var(--cell-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Contas Atrasadas</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>R$ 0,00</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginTop: '4px' }}>Zero multas e juros</span>
            </div>
          </div>

          {/* Demonstração das Ações Rápidas Implementadas */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '12px'
          }}>
            {/* Box 1: Leitura de Boletos */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#10b981',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Camera size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.74rem', color: '#10b981', fontWeight: 700, textTransform: 'uppercase' }}>Importar Boleto</span>
                <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Extrai valor, vencimento e código de 47 dígitos via PDF ou foto
                </p>
              </div>
            </div>

            {/* Box 2: Baixa em 1 Toque */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: '12px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Check size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.74rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>Baixa em 1 Clique</span>
                <p style={{ margin: '2px 0 0', fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  Botão direto para marcar como pago e copiar o código de barras
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. TODAS AS FUNCIONALIDADES JÁ IMPLEMENTADAS */}
      <section id="funcionalidades" style={{
        maxWidth: '1150px',
        margin: '0 auto 6rem',
        padding: '0 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Recursos Disponíveis Agora
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
            Tudo o que você precisa para gerenciar suas contas
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '640px', margin: '0.75rem auto 0' }}>
            Construído para dar velocidade, clareza e alívio mental na rotina financeira da sua empresa.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Card 1: Calendário Financeiro */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Calendar size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Calendário Mensal Dinâmico
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Visualização dia a dia de todos os vencimentos com semáforo intuitivo: <strong>Pendente (amarelo)</strong>, <strong>Pago (verde)</strong> e <strong>Atrasado (vermelho)</strong>.
            </p>
          </div>

          {/* Card 2: Leitor de Boletos */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Camera size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Leitor de Boletos (PDF e Foto)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Arraste o arquivo PDF do boleto ou fotografe pelo celular. O sistema faz a leitura automática do código de barras de 47 dígitos, vencimento e valor.
            </p>
          </div>

          {/* Card 3: Baixa Rápida em 1 Toque */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <CheckCircle2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Baixa em 1 Clique & Cópia Rápida
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Sem telas lentas: marque uma conta como "Paga" direto no calendário ou na lista. Copie o código de barras com 1 toque para colar no app do banco.
            </p>
          </div>

          {/* Card 4: Entrada por Voz */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              color: '#c084fc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Mic size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Lançamento por Voz Ágil
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Fale pelo microfone do celular o valor e a data de vencimento. O sistema interpreta e agenda a despesa na hora com 1 confirmação.
            </p>
          </div>

          {/* Card 5: Categorias Coloridas */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Tag size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Categorização Personalizada
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Crie e edite suas próprias categorias com cores personalizadas (ex: Fornecedores, Impostos, Pessoal, Infraestrutura) e filtre o calendário por categoria.
            </p>
          </div>

          {/* Card 6: Temas Dark & Light */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem'
          }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              backgroundColor: 'rgba(236, 72, 153, 0.15)',
              color: '#ec4899',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Moon size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Modo Escuro & Modo Claro
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
              Alterne entre o tema escuro ardósia para descanso visual à noite e o tema claro ultra-clean para o expediente no escritório com 1 clique.
            </p>
          </div>
        </div>
      </section>

      {/* 5. GESTÃO GERENCIAL: LISTA, DRE & DASHBOARD */}
      <section id="visao-gerencial" style={{
        backgroundColor: 'var(--cell-bg)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '5rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Visão Completa da Empresa
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, marginTop: '0.5rem', lineHeight: 1.25 }}>
              Mais que um calendário: DRE simplificado e Dashboard Analítico
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6 }}>
              Acompanhe a real saúde financeira da sua operação através de ferramentas gerenciais integradas:
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', marginTop: '2px' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>DRE Mensal Gerencial</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Receitas brutas, deduções, despesas operacionais detalhadas e Resultado Líquido do mês.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', marginTop: '2px' }}>
                  <LayoutDashboard size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Dashboard com Gráficos</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Gráficos de barras e pizza para identificar para onde vai a maior fatia do dinheiro.</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', marginTop: '2px' }}>
                  <ListFilter size={18} />
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Tabela em Lista com Busca</strong>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Filtre por período, categoria, status ou digite para encontrar qualquer fornecedor na hora.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Destaque Visual */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2rem',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>Resumo DRE do Exercício</span>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, backgroundColor: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                Lucro Operacional
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--cell-bg)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>(+) Receitas do Mês</span>
                <strong style={{ color: '#10b981', fontSize: '0.95rem' }}>R$ 45.200,00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: 'var(--cell-bg)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>(-) Despesas Totais</span>
                <strong style={{ color: '#ef4444', fontSize: '0.95rem' }}>R$ 31.800,00</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '10px', marginTop: '4px' }}>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>(=) Resultado Líquido</span>
                <strong style={{ color: '#10b981', fontSize: '1.15rem' }}>+ R$ 13.400,00</strong>
              </div>
            </div>

            <button 
              onClick={handleGoToApp}
              style={{
                width: '100%',
                marginTop: '1.5rem',
                padding: '0.85rem',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              Acessar Meus Relatórios
            </button>
          </div>
        </div>
      </section>

      {/* 6. EXPERIÊNCIA MOBILE FIRST (POCKET) */}
      <section id="mobile" style={{
        maxWidth: '1100px',
        margin: '6rem auto',
        padding: '0 1.5rem'
      }}>
        <div style={{
          backgroundColor: 'var(--item-bg)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          padding: '3rem 2rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Na Palma da Sua Mão
            </span>
            <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.3rem)', fontWeight: 800, marginTop: '0.5rem', lineHeight: 1.25 }}>
              O App Mobile que funciona com 1 polegar
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6 }}>
              Não perca tempo quando estiver na rua ou fora do computador. A versão mobile do KdConta foi feita especificamente para o ritmo dinâmico do empreendedor:
            </p>

            <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span><strong>Notificações Web Push:</strong> receba avisos na data de vencimento.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span><strong>Cópia Inteligente:</strong> copia o código de barras e pergunta se já pagou.</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span><strong>Modo Bolso:</strong> ocupa menos de 2MB e não consome memória do aparelho.</span>
              </li>
            </ul>
          </div>

          {/* Card Representando o Mobile */}
          <div style={{
            maxWidth: '340px',
            margin: '0 auto',
            backgroundColor: '#0f172a',
            border: '2px solid var(--border-color)',
            borderRadius: '32px',
            padding: '1.25rem 1rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src="/favicon.svg" alt="KdConta" style={{ width: '24px', height: '24px' }} />
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>KdConta Mobile</span>
              </div>
              <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 700 }}>● Conectado</span>
            </div>

            <div style={{ marginTop: '1rem', backgroundColor: '#1e293b', padding: '0.85rem', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 700 }}>⚠️ Vence Hoje</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <strong style={{ fontSize: '0.9rem' }}>Conta de Energia</strong>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '0.95rem' }}>R$ 480,00</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                <button style={{ flex: 1, padding: '6px', backgroundColor: '#6366f1', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  Copiar Código
                </button>
                <button style={{ padding: '6px 10px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                  ✓ Dar Baixa
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. ROADMAP / EM BREVE: CONSULTOR INTELIGENTE */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto 6rem',
        padding: '0 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
          border: '1px dashed rgba(99, 102, 241, 0.35)',
          borderRadius: '20px',
          padding: '2.5rem 2rem'
        }}>
          <span style={{
            fontSize: '0.75rem',
            backgroundColor: 'rgba(99, 102, 241, 0.2)',
            color: 'var(--accent-primary)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em'
          }}>
            Em Breve • Próxima Entrega
          </span>

          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, marginTop: '1rem', letterSpacing: '-0.01em' }}>
            Consultor Financeiro com Inteligência Artificial
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', maxWidth: '600px', margin: '0.75rem auto 1.5rem', lineHeight: 1.6 }}>
            Estamos preparando um assistente de IA conversacional para responder perguntas estratégicas como: 
            <em> "Qual a minha maior despesa este mês?", "Quanto terei que pagar na próxima semana?"</em> e projeções automáticas de fluxo.
          </p>

          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            ✨ Todos os usuários ativos receberão o recurso automaticamente no lançamento.
          </span>
        </div>
      </section>

      {/* 8. FAQ (PERGUNTAS FREQUENTES REVISADAS) */}
      <section id="faq" style={{
        maxWidth: '850px',
        margin: '0 auto 6rem',
        padding: '0 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Tire suas Dúvidas
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 800, marginTop: '0.4rem' }}>
            Perguntas Frequentes
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, idx) => (
            <div 
              key={idx}
              style={{
                backgroundColor: 'var(--item-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'all 0.2s'
              }}
            >
              <button 
                onClick={() => toggleFaq(idx)}
                style={{
                  width: '100%',
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-primary)',
                  fontWeight: 700,
                  fontSize: '1rem',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={20} color="var(--accent-primary)" /> : <ChevronDown size={20} color="var(--text-muted)" />}
              </button>

              {openFaq === idx && (
                <div style={{
                  padding: '0 1.5rem 1.25rem',
                  color: 'var(--text-secondary)',
                  fontSize: '0.92rem',
                  lineHeight: 1.6,
                  borderTop: '1px solid var(--border-color)',
                  paddingTop: '1rem'
                }}>
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 9. CTA FINAL (RODAPÉ DE CAPTAÇÃO) */}
      <section style={{
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        borderTop: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '5rem 1.5rem',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.7rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '1rem' }}>
            Organize suas contas em menos de 5 minutos hoje
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '2rem' }}>
            Junte-se aos empreendedores que trocaram a angústia de "cadê a conta?" pela tranquilidade de ter tudo agendado e visível.
          </p>

          <button 
            onClick={handleGoToApp}
            style={{
              padding: '1.1rem 2.5rem',
              backgroundColor: '#6366f1',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 800,
              fontSize: '1.1rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 25px rgba(99, 102, 241, 0.45)'
            }}
          >
            Acessar o KdConta Gratuitamente <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer style={{
        padding: '2.5rem 1.5rem',
        borderTop: '1px solid var(--border-color)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontSize: '0.85rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '0.75rem' }}>
          <img src="/favicon.svg" alt="KdConta" style={{ width: '22px', height: '22px' }} />
          <strong style={{ color: 'var(--text-primary)' }}>KdConta</strong> — "Cadê a conta?"
        </div>
        <p>© {new Date().getFullYear()} KdConta Tecnologia Ltda. Todos os direitos reservados.</p>
      </footer>

    </div>
  );
}
