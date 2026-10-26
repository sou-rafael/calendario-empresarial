import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, ArrowLeft, Calendar, PieChart, TrendingUp, Copy, Check, ExternalLink, ShieldAlert, RotateCcw } from 'lucide-react';
import { executeConsultorQuery } from '../utils/consultorEngine';

export default function MobileChatView({ bills, categories }) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: 'Olá! Sou o seu **Consultor FiscalZap**.\nEstou configurado exclusivamente para analisar as finanças da sua **Empresa**.\n\nEscolha um dos temas abaixo para eu consultar seus dados em tempo real:',
      time: 'Agora'
    }
  ]);

  const [activeGroup, setActiveGroup] = useState(null); // null (grupos macro) ou chave do grupo selecionado
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  // 3 Grupos Macro com as perguntas detalhadas (Escopo Empresarial)
  const macroGroups = [
    {
      id: 'vencimentos',
      label: '📅 Vencimentos & Prazos',
      questions: [
        { key: 'vence_hoje', label: 'O que vence hoje?' },
        { key: 'vence_semana', label: 'O que vence esta semana?' },
        { key: 'proximos_tres', label: 'Próximos 3 vencimentos' }
      ]
    },
    {
      id: 'distribuicao',
      label: '📊 Distribuição de Despesas',
      questions: [
        { key: 'maior_despesa', label: 'Qual a maior despesa do mês?' },
        { key: 'gastos_por_categoria', label: 'Gastos por categoria (Ranking)' },
        { key: 'impostos_previstos', label: 'Total de impostos previstos' }
      ]
    },
    {
      id: 'saude',
      label: '💰 Saúde & Fluxo do Mês',
      questions: [
        { key: 'resumo_geral', label: 'Resumo geral do mês' },
        { key: 'media_diaria', label: 'Média diária de saída' },
        { key: 'contas_pendentes', label: 'Contas restantes a pagar' }
      ]
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeGroup]);

  const copyBarcode = (code, id) => {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectMacro = (group) => {
    setActiveGroup(group);
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: group.label,
      time: 'Agora'
    };
    const botMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      text: `Excelente! O que você gostaria de saber sobre **${group.label}**?`,
      time: 'Agora'
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const handleSelectQuestion = (q) => {
    // 1. Mensagem do Usuário
    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text: q.label,
      time: 'Agora'
    };

    // 2. Executa a query determinística no banco
    const result = executeConsultorQuery(q.key, bills, categories);

    const botMsg = {
      id: (Date.now() + 1).toString(),
      sender: 'bot',
      title: result.title,
      text: result.text,
      items: result.items || [],
      time: 'Agora'
    };

    setMessages(prev => [...prev, userMsg, botMsg]);
  };

  const handleResetTopics = () => {
    setActiveGroup(null);
    const botMsg = {
      id: Date.now().toString(),
      sender: 'bot',
      text: 'Selecione outro tema empresarial para analisar:',
      time: 'Agora'
    };
    setMessages(prev => [...prev, botMsg]);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      height: 'calc(100vh - 145px)',
      position: 'relative'
    }}>
      
      {/* Aviso de Escopo Exclusivo Empresarial */}
      <div style={{
        background: 'rgba(99, 102, 241, 0.1)',
        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
        padding: '0.45rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontSize: '0.72rem',
        color: 'var(--accent-primary)',
        fontWeight: 600
      }}>
        <ShieldAlert size={14} />
        <span>Consultor habilitado exclusivamente para o escopo <strong>Empresarial</strong></span>
      </div>

      {/* Feed de Mensagens */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              width: '100%'
            }}
          >
            <div style={{
              maxWidth: '85%',
              padding: '0.85rem 1rem',
              borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
              background: msg.sender === 'user'
                ? 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                : 'var(--bg-secondary)',
              border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)',
              color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)',
              fontSize: '0.86rem',
              lineHeight: 1.45,
              boxShadow: 'var(--shadow-sm)'
            }}>
              {/* Cabeçalho do bot */}
              {msg.sender === 'bot' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '4px', color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.72rem' }}>
                  <Sparkles size={12} /> Consultor FiscalZap
                </div>
              )}

              {/* Texto com formatação simples de negrito e quebras */}
              <div style={{ whiteSpace: 'pre-line' }}>
                {msg.text.split('**').map((chunk, i) => (
                  i % 2 === 1 ? <strong key={i} style={{ color: msg.sender === 'user' ? '#fff' : 'var(--text-primary)' }}>{chunk}</strong> : chunk
                ))}
              </div>

              {/* Lista de itens (ex: contas retornadas) */}
              {msg.items && msg.items.length > 0 && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {msg.items.map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '10px',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.82rem' }}>{it.description}</span>
                        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '0.85rem' }}>{it.amount}</span>
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {it.date && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📅 {it.date}</span>
                        )}

                        {it.barcode && (
                          <button
                            onClick={() => copyBarcode(it.barcode, `${msg.id}-${idx}`)}
                            style={{
                              marginLeft: 'auto',
                              background: copiedId === `${msg.id}-${idx}` ? 'rgba(52, 211, 153, 0.2)' : 'rgba(99, 102, 241, 0.15)',
                              border: 'none',
                              color: copiedId === `${msg.id}-${idx}` ? '#10b981' : 'var(--accent-primary)',
                              borderRadius: '6px',
                              padding: '3px 7px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}
                          >
                            {copiedId === `${msg.id}-${idx}` ? <Check size={11} /> : <Copy size={11} />}
                            {copiedId === `${msg.id}-${idx}` ? 'Copiado!' : 'Copiar Código'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Área Fixa de Seleção Guiada (Chips) */}
      <div style={{
        padding: '0.75rem 1rem 1rem 1rem',
        background: 'var(--bg-primary)',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Nível 1: Grupos Macro */}
        {!activeGroup ? (
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Selecione um tema:
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {macroGroups.map(group => (
                <button
                  key={group.id}
                  onClick={() => handleSelectMacro(group)}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.2s'
                  }}
                >
                  <span>{group.label}</span>
                  <span style={{ color: 'var(--accent-primary)', fontSize: '0.9rem' }}>→</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Nível 2: Perguntas Detalhadas do Grupo */
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                {activeGroup.label}
              </span>
              <button
                onClick={handleResetTopics}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <RotateCcw size={12} /> Outros Temas
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {activeGroup.questions.map(q => (
                <button
                  key={q.key}
                  onClick={() => handleSelectQuestion(q)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, var(--bg-secondary) 100%)',
                    border: '1px solid var(--border-focus)',
                    color: 'var(--text-primary)',
                    borderRadius: '12px',
                    padding: '0.65rem 0.9rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all 0.15s'
                  }}
                >
                  💬 {q.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
