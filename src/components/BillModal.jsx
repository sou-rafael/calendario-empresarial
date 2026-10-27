import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadBoletoFile, openBoletoAttachment, deleteBoletoAttachment } from '../lib/storage';
import { X, Check, Copy, FileText, ExternalLink, Paperclip } from 'lucide-react';
import CustomSelect from './CustomSelect';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function BillModal({ isOpen, onClose, selectedDate, user, categories, bills = [], onBillSaved }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [barcode, setBarcode] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const dayBills = bills.filter(b => b.date === dateString);
  const totalAmount = dayBills.reduce((acc, bill) => acc + Number(bill.amount), 0);
  const paidAmount = dayBills.filter(b => b.status === 'Pago').reduce((acc, bill) => acc + Number(bill.amount), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !categoryId) return;
    setLoading(true);

    try {
      let uploadedFileUrl = null;
      let originalFileName = null;

      if (file) {
        const uploaded = await uploadBoletoFile(file, user.id);
        uploadedFileUrl = uploaded.filePath;
        originalFileName = uploaded.fileName;
      }

      const { error } = await supabase.from('bills').insert([
        {
          user_id: user.id,
          date: dateString,
          description,
          amount: parseFloat(amount),
          category_id: categoryId,
          status: 'Pendente',
          barcode: barcode.trim() || null,
          file_url: uploadedFileUrl,
          file_name: originalFileName
        }
      ]);

      if (error) throw error;
      
      setDescription('');
      setAmount('');
      setCategoryId('');
      setBarcode('');
      setFile(null);
      onBillSaved();
    } catch (error) {
      alert('Erro ao salvar conta: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (bill) => {
    if (!window.confirm(`Deseja realmente excluir o lançamento "${bill.description}"?`)) {
      return;
    }
    try {
      const { error } = await supabase.from('bills').delete().eq('id', bill.id).eq('user_id', user.id);
      if (error) throw error;
      if (bill.file_url) {
        await deleteBoletoAttachment(bill.file_url);
      }
      onBillSaved();
    } catch (error) {
      alert('Erro ao excluir conta: ' + error.message);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Pago' ? 'Pendente' : 'Pago';
    try {
      const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      onBillSaved();
    } catch (error) {
      alert('Erro ao alterar status da conta: ' + error.message);
    }
  };

  const copyBarcode = (code, id) => {
    if (!code) return;
    navigator.clipboard.writeText(code.replace(/[^0-9]/g, ''));
    setCopiedId(id);
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
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh'
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
            fontSize: '1.75rem', 
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
                        gap: '6px'
                      }}>
                        <span style={{ textDecoration: isPaid ? 'line-through' : 'none', opacity: isPaid ? 0.75 : 1 }}>
                          {bill.description}
                        </span>
                        {isPaid && (
                          <span style={{ fontSize: '0.7rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                            Pago
                          </span>
                        )}
                      </div>
                      <div style={{ 
                        color: isPaid ? '#10b981' : '#fb7185', 
                        fontWeight: 800, 
                        marginTop: '2px', 
                        fontSize: '1.15rem' 
                      }}>
                        R$ {bill.amount.toFixed(2).replace('.', ',')}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {/* Botão de Baixa Rápida em 1 Clique */}
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
              placeholder="Nome (ex: Aluguel, Energia...)"
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
                {file ? 'Anexado' : 'Anexar PDF'}
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  style={{ display: 'none' }} 
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>
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
              <Check size={18} strokeWidth={3} /> {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
