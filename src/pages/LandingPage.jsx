import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Mic, Camera, Calendar, CheckCircle2, ShieldCheck, Zap, ArrowRight, 
  Smartphone, ChevronDown, ChevronUp, Copy, Clock, DollarSign, 
  Sparkles, Star, TrendingUp, Check, Play
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleGoToApp = () => {
    navigate('/login');
  };

  const faqs = [
    {
      q: 'O que torna o KdConta diferente de uma planilha ou do meu banco?',
      a: 'Planilhas exigem digitação manual, fórmulas e você precisa lembrar de abrir todo dia. No app do banco, você só vê o dinheiro que já saiu ou lançamentos imediatos. O KdConta oferece uma visão panorâmica antecipada de todo o mês em calendário, com entrada por voz e leitura de boleto por câmera em 3 segundos.'
    },
    {
      q: 'Como funciona o lançamento por comando de voz?',
      a: 'Basta tocar no botão de microfone no celular ou computador e falar naturalmente, por exemplo: "Água 120 reais na sexta" ou "Aluguel 2500 dia 10". Nossa IA identifica o valor, a data e a categoria, gerando o agendamento no calendário com 1 toque de confirmação.'
    },
    {
      q: 'Preciso instalar algum aplicativo pesado da Google Play ou App Store?',
      a: 'Não! O KdConta foi construído com tecnologia PWA (Progressive Web App). Você acessa direto pelo navegador e pode adicionar o ícone à tela inicial do seu celular com 1 clique, ocupando menos de 2MB e abrindo instantaneamente.'
    },
    {
      q: 'Meus dados financeiros e boletos estão seguros?',
      a: 'Sim, totalmente. Utilizamos criptografia de ponta a ponta e infraestrutura em nuvem segura (PostgreSQL/Supabase). Seus comprovantes e documentos ficam salvos em armazenamento isolado com políticas de acesso exclusivo do seu usuário.'
    },
    {
      q: 'Posso usar no computador da empresa e no celular ao mesmo tempo?',
      a: 'Sim! Seus dados são sincronizados em tempo real. Você pode fotografar um boleto no celular na rua e, no mesmo segundo, ele já aparece no calendário do seu computador no escritório.'
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
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
              <a href="#diferenciais" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Diferenciais</a>
              <a href="#como-funciona" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Como Funciona</a>
              <a href="#faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 500 }}>Dúvidas</a>
            </nav>

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
              Acessar App <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section style={{
        position: 'relative',
        padding: '4.5rem 1.5rem 3.5rem',
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
          maxWidth: '720px',
          margin: '0 auto 2.25rem',
          lineHeight: 1.6,
          position: 'relative',
          zIndex: 1
        }}>
          A gestão de contas a pagar mais ágil para pequenas empresas e autônomos. 
          Lance despesas <strong>falando no microfone</strong> ou <strong>tirando foto do boleto</strong>. 
          Veja todo o seu fluxo em um calendário visual simples.
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
            Experimente Grátis Agora <ArrowRight size={18} />
          </button>

          <a 
            href="#diferenciais"
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
            Ver Demonstração
          </a>
        </div>

        {/* Selos de Confiança */}
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
            <CheckCircle2 size={16} color="#10b981" /> Sem cartão para testar
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> Celular + Computador
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={16} color="#10b981" /> IA de Voz & OCR nativos
          </span>
        </div>
      </section>

      {/* 3. MOCKUP VISUAL INTERATIVO DO PRODUTO */}
      <section style={{
        maxWidth: '1050px',
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
                app.kdconta.com.br • Visão Geral do Calendário
              </span>
            </div>

            <span style={{
              fontSize: '0.75rem',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 700
            }}>
              ● Tudo em Dia
            </span>
          </div>

          {/* Cards Rápidos de Simulação */}
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
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Total Pago</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>R$ 22.410,00</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginTop: '4px' }}>12 contas quitadas</span>
            </div>
            <div style={{ backgroundColor: 'var(--cell-bg)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>Contas em Atraso</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>R$ 0,00</span>
              <span style={{ fontSize: '0.72rem', color: '#10b981', display: 'block', marginTop: '4px' }}>Nenhum juros acumulado</span>
            </div>
          </div>

          {/* Banner de Demonstração de Lançamento por Voz */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(168, 85, 247, 0.1) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '14px',
            padding: '1.25rem',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                backgroundColor: '#6366f1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 16px rgba(99, 102, 241, 0.5)',
                flexShrink: 0
              }}>
                <Mic size={22} color="#ffffff" />
              </div>
              <div style={{ textAlign: 'left' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Comando de Voz em Ação
                </span>
                <p style={{ margin: '2px 0 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                  "Paguei 340 reais da conta de luz hoje"
                </p>
              </div>
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              padding: '6px 12px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <Check size={16} /> Lançado no Calendário em 2s
            </div>
          </div>
        </div>
      </section>

      {/* 4. OS 3 PILARES DO KDCONTA (ZERO FRICÇÃO) */}
      <section id="diferenciais" style={{
        maxWidth: '1150px',
        margin: '0 auto 6rem',
        padding: '0 1.5rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Menos Burocracia, Mais Tempo
          </span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 800, marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
            Projetado para quem não tem tempo a perder
          </h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0.75rem auto 0' }}>
            Esqueça sistemas contábeis complexos ou planilhas que ninguém atualiza. O KdConta resolve tudo em segundos.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          {/* Card 1: Voz */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--accent-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Mic size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              Lançamento por Voz com IA
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Abra o celular no carro ou na loja e apenas fale a conta. O motor inteligente entende valores, datas futuras e categorias sozinho.
            </p>
          </div>

          {/* Card 2: Leitor de Boleto */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Camera size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              Scanner de Boletos (Foto ou PDF)
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Tire uma foto ou suba o PDF. O KdConta extrai o código de barras de 47 dígitos, valor, vencimento e o fornecedor automaticamente.
            </p>
          </div>

          {/* Card 3: Baixa Rápida & Calendário */}
          <div style={{
            backgroundColor: 'var(--item-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '2rem 1.5rem',
            position: 'relative'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.25rem'
            }}>
              <Calendar size={26} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '0.65rem' }}>
              Calendário Visual & 1-Click Baixa
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
              Saiba exatamente quanto sai da conta em cada dia do mês. Copie a linha digitável para o app do banco e marque como pago com 1 toque.
            </p>
          </div>
        </div>
      </section>

      {/* 5. SEÇÃO DE ROI / ECONOMIA DE MULTAS */}
      <section style={{
        backgroundColor: 'var(--cell-bg)',
        borderTop: '1px solid var(--border-color)',
        borderBottom: '1px solid var(--border-color)',
        padding: '5rem 1.5rem'
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '3rem',
          alignItems: 'center'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              O Custo Oculto da Desorganização
            </span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.5vw, 2.3rem)', fontWeight: 800, marginTop: '0.5rem', lineHeight: 1.25 }}>
              Quanto a sua empresa gasta por mês em multas e juros bobos?
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', lineHeight: 1.6 }}>
              Um boleto de R$ 2.000,00 pago com apenas 2 dias de atraso pode custar <strong>R$ 40 de multa (2%) + juros diários</strong>. 
              Multiplique isso por 3 ou 4 boletos ao longo do mês e você perde centenas de reais simplesmente por esquecimento.
            </p>

            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontWeight: 600 }}>Alerta visual imediato de contas vencendo no dia</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontWeight: 600 }}>Notificações no celular para você não ser pego de surpresa</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#10b981" />
                <span style={{ fontWeight: 600 }}>O KdConta se paga na primeira multa evitada</span>
              </div>
            </div>
          </div>

          {/* Card com Destaque Numérico */}
          <div style={{
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Economia Estimada por Empresa
            </span>
            <div style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#10b981',
              margin: '0.5rem 0 0.25rem',
              letterSpacing: '-0.02em'
            }}>
              R$ 250+
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '1.75rem' }}>
              poupados mensalmente evitando multas de fornecedores e concessionárias.
            </span>

            <button 
              onClick={handleGoToApp}
              style={{
                width: '100%',
                padding: '0.9rem',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              Começar a Poupar Agora
            </button>
          </div>
        </div>
      </section>

      {/* 6. FAQ (PERGUNTAS FREQUENTES) */}
      <section id="faq" style={{
        maxWidth: '850px',
        margin: '6rem auto',
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

      {/* 7. CTA FINAL (RODAPÉ DE CAPTAÇÃO) */}
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
            Criar Conta Gratuita <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* 8. FOOTER */}
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
