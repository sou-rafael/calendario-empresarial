import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadBoletoFile, openBoletoAttachment, deleteBoletoAttachment } from '../lib/storage';
import { X, Check, Copy, ExternalLink, Paperclip, Repeat, Calendar } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { format, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from './Toast';

export default function BillModal({ isOpen, onClose, selectedDate, user, categories, bills = [], onBillSaved }) {
  const toast = useToast();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  // Estados de Recorrência / Parcelamento
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState('monthly'); // 'monthly' | 'installment'
  const [recurrenceCount, setRecurrenceCount] = useState(12);

  if (!isOpen) return null;

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayBills = bills.filter(b => b.date === dateString);
  const totalAmount = dayBills.reduce((acc, bill) => acc + Number(bill.amount), 0);
  const paidAmount = dayBills.filter(b => b.status === 'Pago').reduce((acc, bill) => acc + Number(bill.amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) {
      toast.warning('Preencha os campos obrigatórios: Nome, Categoria e Valor.');
      return;
    }
    setLoading(true);

    try {
      let uploadedFileUrl = null;
      let originalFileName = null;

      if (file) {
        const uploaded = await uploadBoletoFile(file, user.id);
        uploadedFileUrl = uploaded.filePath;
        originalFileName = uploaded.fileName;
      }

      const parsedAmount = parseFloat(amount);
      const totalInstances = isRecurring ? Math.max(2, Math.min(60, parseInt(recurrenceCount, 10) || 12)) : 1;
      const recurrenceId = isRecurring ? (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}_rec`) : null;

      const billsToInsert = [];

      for (let i = 0; i < totalInstances; i++) {
        const instanceDate = format(addMonths(selectedDate, i), 'yyyy-MM-dd');
        let instanceDesc = description.trim();

        if (isRecurring) {
          if (recurrenceType === 'installment') {
            instanceDesc = `${instanceDesc} (${i + 1}/${totalInstances})`;
          }
        }

        billsToInsert.push({
          user_id: user.id,
          date: instanceDate,
          description: instanceDesc,
          amount: parsedAmount,
          category_id: categoryId,
          status: 'Pendente',
          barcode: barcode.trim() || null,
          file_url: i === 0 ? uploadedFileUrl : null, // anexo fica na 1ª parcela
          file_name: i === 0 ? originalFileName : null,
          recurrence_id: recurrenceId,
          is_recurring: isRecurring,
          installment_current: isRecurring && recurrenceType === 'installment' ? i + 1 : null,
          installment_total: isRecurring && recurrenceType === 'installment' ? totalInstances : null
        });
      }

      // Tenta inserir com campos de recorrência
      let { error } = await supabase.from('bills').insert(billsToInsert);

      // Fallback defensivo: se a migration 003 ainda não tiver sido rodada no banco
      if (error && (error.message?.includes('recurrence_id') || error.message?.includes('installment'))) {
        const sanitizedBills = billsToInsert.map(b => {
          const { recurrence_id, is_recurring, installment_current, installment_total, ...rest } = b;
          return rest;
        });
        const retryResult = await supabase.from('bills').insert(sanitizedBills);
        if (retryResult.error) throw retryResult.error;
      } else if (error) {
        throw error;
      }

      toast.success(
        isRecurring
          ? `${totalInstances} lançamentos ${recurrenceType === 'installment' ? 'parcelados' : 'recorrentes'} criados!`
          : 'Lançamento salvo com sucesso!'
      );

      setDescription('');
      setAmount('');
      setCategoryId('');
      setBarcode('');
      setFile(null);
      setIsRecurring(false);
      setRecurrenceCount(12);
      onBillSaved();
    } catch (error) {
      toast.error('Erro ao salvar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async (bill, deleteAllFuture = false) => {
    try {
      let query = supabase.from('bills').delete().eq('user_id', user.id);

      if (deleteAllFuture && bill.recurrence_id) {
        query = query.eq('recurrence_id', bill.recurrence_id).gte('date', bill.date);
      } else {
        query = query.eq('id', bill.id);
      }

      const { error } = await query;
      if (error) throw error;

      if (bill.file_url) {
        await deleteBoletoAttachment(bill.file_url);
      }

      toast.success(deleteAllFuture ? 'Lançamento e parcelas futuras removidos!' : 'Lançamento removido!');
      onBillSaved();
    } catch (error) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleDelete = (bill) => {
    if (bill.recurrence_id || bill.is_recurring) {
      toast.confirm({
        title: 'Excluir Conta Recorrente / Parcelada',
        message: `O lançamento "${bill.description}" faz parte de uma série recorrente. Como deseja proceder?`,
        extraOptions: [
          {
            label: 'Excluir APENAS este mês',
            className: 'btn btn-outline',
            action: () => executeDelete(bill, false)
          },
          {
            label: 'Excluir ESTE e todos os meses futuros',
            className: 'btn',
            action: () => executeDelete(bill, true)
          }
        ]
      });
      return;
    }

    toast.confirm({
      title: 'Excluir Lançamento',
      message: `Deseja realmente excluir "${bill.description}"? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir Conta',
      isDanger: true,
      onConfirm: () => executeDelete(bill, false)
    });
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
    try {
      const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      toast.success(newStatus === 'Pago' ? 'Conta baixada como paga!' : 'Conta reaberta como pendente.');
      onBillSaved();
    } catch (error) {
      toast.error('Erro ao alterar status: ' + error.message);
    }
  };

  const copyBarcode = (code, id) => {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/[^0-9]/g, ''));
    setCopiedId(id);
    toast.info('Código de barras copiado!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formattedDateHeader = format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--modal-overlay)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{ 
        width: '100%', maxWidth: '520px', 
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '1.75rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        <button 
          onClick={onClose} 
          style={{ 
            position: 'absolute', top: '16px', right: '16px', 
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', 
            color: 'var(--text-secondary)', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
        >
          <X size={16} />
        </button>
        
        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            Contas do Dia
          </span>
          <h2 style={{ 
            fontSize: '1.65rem', 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            color: 'var(--text-primary)',
            margin: '0.25rem 0 0 0',
            textTransform: 'lowercase'
          }}>
            {formattedDateHeader}
          </h2>
        </div>

        {/* Lista de Contas do Dia */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.25rem', display: 'flex', flexDirection: 'column', gap: '10px', paddingRight: '4px' }}>
          {dayBills.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
              Nenhuma conta lançada neste dia.
            </p>
          ) : (
            dayBills.map(bill => {
              const isPaid = bill.status === 'Pago';
              const hasRecurrence = Boolean(bill.recurrence_id || bill.is_recurring);

              return (
                <div key={bill.id} style={{ 
                  background: isPaid ? 'rgba(16, 185, 129, 0.05)' : 'var(--item-bg)',
                  border: isPaid ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid var(--item-border)',
                  borderRadius: '14px',
                  padding: '0.9rem 1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ 
                        fontWeight: 600, 
                        color: 'var(--text-primary)', 
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{ textDecoration: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.75 : 1 }}>
                          {bill.description}
                        </span>
                        {isPaid && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Pago
                          </span>
                        )}
                        {hasRecurrence && (
                          <span style={{ fontSize: '0.68rem', color: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Repeat size={10} /> Série
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        color: isPaid ? '#10b981' : '#fb7185', 
                        fontWeight: 800, 
                        marginTop: '2px', 
                        fontSize: '1.15rem' 
                      }}>
                        R$ {Number(bill.amount).toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(bill.id, bill.status)}
                        style={{
                          background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                          color: isPaid ? '#10b981' : '#059669',
                          border: isPaid ? '1px solid #10b981' : '1px solid rgba(16, 185, 129, 0.35)',
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'all 0.2s'
                        }}
                        title={isPaid ? 'Clique para reabrir (tornar Pendente)' : 'Clique para dar baixa (marcar como Pago)'}
                      >
                        <Check size={14} strokeWidth={2.5} />
                        {isPaid ? 'Pago ✓' : 'Dar Baixa'}
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleDelete(bill)}
                        style={{ 
                          background: 'rgba(244, 63, 94, 0.08)', 
                          color: '#fb7185', 
                          border: '1px solid rgba(244, 63, 94, 0.2)',
                          padding: '5px 8px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        title="Excluir lançamento"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  {/* Ações Rápidas: Copiar Linha Digitável e Ver Boleto */}
                  {(bill.barcode || bill.file_url) && (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                      {bill.barcode && (
                        <button
                          type="button"
                          onClick={() => copyBarcode(bill.barcode, bill.id)}
                          style={{
                            background: 'rgba(99, 102, 241, 0.15)',
                            border: '1px solid rgba(99, 102, 241, 0.3)',
                            color: 'var(--accent-primary)',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          {copiedId === bill.id ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
                          {copiedId === bill.id ? 'Código Copiado!' : 'Copiar Código de Barras'}
                        </button>
                      )}

                      {bill.file_url && (
                        <button
                          type="button"
                          onClick={() => openBoletoAttachment(bill.file_url)}
                          style={{
                            background: 'rgba(16, 185, 129, 0.12)',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            color: '#059669',
                            borderRadius: '8px',
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}
                        >
                          <ExternalLink size={13} />
                          Ver Boleto Anexo
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {dayBills.length > 0 && (
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '12px',
              padding: '0.8rem 1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.85rem' }}>Total do dia</span>
                {paidAmount > 0 && (
                  <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'block', fontWeight: 600 }}>
                    (R$ {paidAmount.toFixed(2).replace('.', ',')} já pago)
                  </span>
                )}
              </div>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 800, fontSize: '1.35rem', letterSpacing: '-0.02em' }}>
                R$ {totalAmount.toFixed(2).replace('.', ',')}
              </span>
            </div>
          )}
        </div>

        {/* Adicionar Conta Manual */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
          <span style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Adicionar Conta Neste Dia
          </span>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            
            <input 
              type="text" required
              placeholder="Nome (ex: Aluguel, Energia, Internet...)"
              value={description} onChange={e => setDescription(e.target.value)}
              style={{
                background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                padding: '0.75rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
                outline: 'none', width: '100%'
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <CustomSelect
                value={categoryId} 
                onChange={setCategoryId}
                options={categories}
                placeholder="Categoria *"
                required
                style={{ flex: 1 }}
              />

              <input 
                type="number" step="0.01" required
                placeholder="Valor (R$)"
                value={amount} onChange={e => setAmount(e.target.value)}
                style={{
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  padding: '0.75rem 1rem', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '0.9rem',
                  outline: 'none', width: '120px'
                }}
              />
            </div>

            {/* Opcional: Linha digitável e anexo de boleto */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input 
                type="text"
                placeholder="Código de barras (opcional)"
                value={barcode} onChange={e => setBarcode(e.target.value)}
                style={{
                  background: 'var(--input-bg)', border: '1px solid var(--input-border)',
                  padding: '0.6rem 0.8rem', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '0.8rem',
                  outline: 'none', flex: 1, fontFamily: 'monospace'
                }}
              />

              <label style={{
                background: file ? 'rgba(99, 102, 241, 0.15)' : 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                color: file ? 'var(--accent-primary)' : 'var(--text-secondary)',
                padding: '0.6rem 0.8rem',
                borderRadius: '10px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}>
                <Paperclip size={14} />
                {file ? 'Anexado' : 'Anexar Boleto'}
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>
            </div>

            {/* Painel de Recorrência / Parcelamento */}
            <div style={{
              background: isRecurring ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary)',
              border: isRecurring ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '0.75rem 0.9rem',
              transition: 'all 0.2s'
            }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  style={{ accentColor: '#6366f1' }}
                />
                <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Repeat size={14} color="var(--accent-primary)" />
                  Repetir lançamento (Fixa todo mês ou Parcelamento)
                </span>
              </label>

              {isRecurring && (
                <div style={{ marginTop: '0.65rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                  <select
                    className="input-field"
                    value={recurrenceType}
                    onChange={(e) => setRecurrenceType(e.target.value)}
                    style={{ flex: '1 1 140px', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}
                  >
                    <option value="monthly">Fixa Todo Mês</option>
                    <option value="installment">Compra Parcelada (ex: 12x)</option>
                  </select>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Repetir por:</span>
                    <input
                      type="number"
                      min="2"
                      max="60"
                      value={recurrenceCount}
                      onChange={(e) => setRecurrenceCount(e.target.value)}
                      style={{
                        width: '65px',
                        background: 'var(--input-bg)',
                        border: '1px solid var(--input-border)',
                        color: 'var(--text-primary)',
                        padding: '0.45rem',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        textAlign: 'center'
                      }}
                    />
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>meses</span>
                  </div>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'var(--accent-primary)',
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '0.85rem',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginTop: '4px',
                opacity: loading ? 0.7 : 1
              }}
            >
              <Check size={18} strokeWidth={3} /> {loading ? 'Salvando...' : isRecurring ? `Salvar ${recurrenceCount} Lançamentos` : 'Salvar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
