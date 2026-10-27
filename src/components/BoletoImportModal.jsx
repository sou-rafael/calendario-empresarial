import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadBoletoFile } from '../lib/storage';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Copy, Check, Loader2 } from 'lucide-react';
import { parseBoleto } from '../utils/boletoParser';
import { extractBoletoFromPdf } from '../utils/pdfReader';
import CustomSelect from './CustomSelect';

export default function BoletoImportModal({ isOpen, onClose, user, categories, onImportSuccess }) {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [file, setFile] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);
  const [isReadingPdf, setIsReadingPdf] = useState(false);
  const [parsedInfo, setParsedInfo] = useState(null);
  const [parseError, setParseError] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleBarcodeChange = (val) => {
    setBarcodeInput(val);
    setParseError('');

    const clean = val.replace(/[^0-9]/g, '');
    if (clean.length === 47 || clean.length === 48) {
      const result = parseBoleto(clean);
      if (result && result.isValid) {
        setParsedInfo(result);
        if (result.amount) setAmount(result.amount.toFixed(2));
        if (result.dueDate) setDueDate(result.dueDate);
      } else {
        setParsedInfo(null);
        setParseError(result?.error || 'Código inválido');
      }
    } else {
      setParsedInfo(null);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseError('');

    // Sugere descrição pelo nome do arquivo
    const cleanName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    if (!description) {
      setDescription(cleanName);
    }

    // Se for PDF, lê o conteúdo e extrai a linha digitável automaticamente
    if (selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setIsReadingPdf(true);
      try {
        const result = await extractBoletoFromPdf(selectedFile);
        if (result.success && result.parsed) {
          setBarcodeInput(result.parsed.formattedCode || result.rawBarcode);
          setParsedInfo(result.parsed);
          if (result.parsed.amount) setAmount(result.parsed.amount.toFixed(2));
          if (result.parsed.dueDate) setDueDate(result.parsed.dueDate);
        } else {
          setParseError('PDF anexado! Linha digitável não identificada automaticamente no texto (você pode digitá-la ou colar abaixo).');
        }
      } catch (err) {
        console.error('Erro na leitura do PDF:', err);
      } finally {
        setIsReadingPdf(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description || !amount || !dueDate || !categoryId) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setFileUploading(true);
    let uploadedFileUrl = null;
    let originalFileName = null;

    try {
      // 1. Upload seguro do Arquivo (PDF ou Imagem) para o Supabase Storage se houver
      if (file) {
        const uploaded = await uploadBoletoFile(file, user.id);
        uploadedFileUrl = uploaded.filePath;
        originalFileName = uploaded.fileName;
      }

      // 2. Gravação do registro na tabela 'bills'
      const { error: insertError } = await supabase.from('bills').insert([
        {
          user_id: user.id,
          date: dueDate,
          description,
          amount: parseFloat(amount),
          category_id: categoryId,
          status: 'Pendente',
          barcode: barcodeInput.trim() || null,
          file_url: uploadedFileUrl,
          file_name: originalFileName
        }
      ]);

      if (insertError) throw insertError;

      // Limpar formulário e fechar
      setBarcodeInput('');
      setDescription('');
      setDueDate('');
      setAmount('');
      setCategoryId('');
      setFile(null);
      setParsedInfo(null);
      onImportSuccess();
      onClose();
    } catch (err) {
      alert('Erro ao importar boleto: ' + err.message);
    } finally {
      setFileUploading(false);
    }
  };

  const copyBarcode = () => {
    if (!barcodeInput) return;
    navigator.clipboard.writeText(barcodeInput.replace(/[^0-9]/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'var(--modal-overlay)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
      padding: '1rem'
    }}>
      <div style={{
        width: '100%', maxWidth: '540px',
        background: 'var(--modal-bg)',
        border: '1px solid var(--border-color)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        boxShadow: 'var(--shadow-lg)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '92vh',
        overflowY: 'auto'
      }}>
        {/* Fechar */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '18px', right: '18px',
            background: 'var(--bg-secondary)', border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)', cursor: 'pointer',
            width: '32px', height: '32px', borderRadius: '8px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'var(--item-hover-bg)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
        >
          <X size={16} />
        </button>

        {/* Cabeçalho */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
            Automação de Boletos
          </span>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0.2rem 0 0.5rem 0' }}>
            Importação Rápida
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Anexe o arquivo PDF do boleto para extrair automaticamente a linha digitável, valor e vencimento!
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Upload do Arquivo / PDF */}
          <div style={{
            border: isReadingPdf ? '2px dashed var(--accent-primary)' : '2px dashed var(--border-color)',
            borderRadius: '16px',
            padding: '1.25rem',
            textAlign: 'center',
            backgroundColor: file ? 'rgba(99, 102, 241, 0.08)' : 'var(--input-bg)',
            transition: 'all 0.2s'
          }}>
            <input
              type="file"
              id="boleto-file"
              accept=".pdf,image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <label htmlFor="boleto-file" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              {isReadingPdf ? (
                <Loader2 size={32} color="var(--accent-primary)" style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <UploadCloud size={32} color={file ? 'var(--accent-primary)' : 'var(--text-muted)'} />
              )}

              {isReadingPdf ? (
                <div>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Lendo dados do PDF do boleto...</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Extraindo código de barras, vencimento e valor...
                  </div>
                </div>
              ) : file ? (
                <div>
                  <div style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.95rem' }}>{file.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Clique para trocar de arquivo
                  </div>
                </div>
              ) : (
                <div>
                  <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Clique para anexar o PDF do boleto</span>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px' }}>
                    O sistema lê o PDF e preenche tudo sozinho!
                  </div>
                </div>
              )}
            </label>
          </div>

          {/* Linha Digitável */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Linha Digitável / Código de Barras
              </label>
              {parsedInfo && (
                <span style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle2 size={13} /> {parsedInfo.type === 'BANCARIO' ? 'Boleto Bancário Lido' : 'Concessionária Lida'}
                </span>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Ex: 34191.09008 61254.891234 56789.012345 1 99990000015000"
                value={barcodeInput}
                onChange={(e) => handleBarcodeChange(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: parsedInfo ? '1px solid #10b981' : '1px solid var(--input-border)',
                  borderRadius: '12px',
                  padding: '0.8rem 2.8rem 0.8rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={copyBarcode}
                  title="Copiar código limpo"
                  style={{
                    position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                    background: 'transparent', border: 'none', color: copied ? '#10b981' : 'var(--text-muted)',
                    cursor: 'pointer', padding: '6px'
                  }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                </button>
              )}
            </div>
            {parseError && (
              <span style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '4px', display: 'block' }}>
                {parseError}
              </span>
            )}
          </div>

          {/* Descrição */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Descrição / Fornecedor *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Fornecedor Vida em Grãos, Aluguel, Cemig..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                background: 'var(--input-bg)',
                border: '1px solid var(--input-border)',
                borderRadius: '12px',
                padding: '0.8rem 1rem',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Vencimento e Valor lado a lado */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Vencimento * {parsedInfo?.dueDate && <span style={{ color: '#10b981' }}>(extraído)</span>}
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: parsedInfo?.dueDate ? '1px solid #10b981' : '1px solid var(--input-border)',
                  borderRadius: '12px',
                  padding: '0.8rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Valor (R$) * {parsedInfo?.amount && <span style={{ color: '#10b981' }}>(extraído)</span>}
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--input-bg)',
                  border: parsedInfo?.amount ? '1px solid #10b981' : '1px solid var(--input-border)',
                  borderRadius: '12px',
                  padding: '0.8rem 1rem',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
              Categoria *
            </label>
            <CustomSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categories}
              placeholder="Selecione uma categoria..."
              required
            />
          </div>

          {/* Botão Salvar */}
          <button
            type="submit"
            disabled={fileUploading || isReadingPdf}
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '1rem',
              fontSize: '1rem',
              fontWeight: 700,
              cursor: fileUploading || isReadingPdf ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '0.5rem',
              opacity: fileUploading || isReadingPdf ? 0.7 : 1,
              transition: 'all 0.2s'
            }}
          >
            {fileUploading ? 'Salvando e enviando boleto...' : 'Confirmar e Lançar no Calendário'}
          </button>
        </form>
      </div>
    </div>
  );
}
