import { supabase } from './supabase';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp'
];

const MIME_TO_EXT = {
  'application/pdf': 'pdf',
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Valida e faz o upload seguro de um boleto/comprovante para o bucket 'boletos'.
 * Retorna o caminho relativo no storage (filePath) para uso com URLs assinadas.
 */
export async function uploadBoletoFile(file, userId) {
  if (!file || !userId) return { filePath: null, fileName: null };

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error('Tipo de arquivo não permitido. Envie apenas PDF, JPG, PNG ou WEBP.');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('O arquivo excede o tamanho máximo permitido de 10 MB.');
  }

  const safeExt = MIME_TO_EXT[file.type] || 'pdf';
  const randomToken = crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const filePath = `${userId}/${randomToken}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from('boletos')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type
    });

  if (uploadError) throw uploadError;

  return {
    filePath,
    fileName: file.name.slice(0, 150)
  };
}

/**
 * Extrai o caminho relativo do objeto caso tenha sido salvo como URL pública no passado.
 */
export function normalizeStoragePath(fileUrlOrPath) {
  if (!fileUrlOrPath) return null;
  const marker = '/boletos/';
  const idx = fileUrlOrPath.indexOf(marker);
  if (idx !== -1) {
    return decodeURIComponent(fileUrlOrPath.substring(idx + marker.length));
  }
  return fileUrlOrPath;
}

/**
 * Abre o documento do boleto em uma nova aba gerando uma URL assinada temporária (60s).
 * Caso o bucket ainda esteja em modo público durante transição, faz fallback seguro.
 */
export async function openBoletoAttachment(fileUrlOrPath) {
  if (!fileUrlOrPath) return;

  const path = normalizeStoragePath(fileUrlOrPath);

  try {
    const { data, error } = await supabase.storage
      .from('boletos')
      .createSignedUrl(path, 60);

    if (!error && data?.signedUrl) {
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
      return;
    }
  } catch (err) {
    console.warn('Erro ao gerar URL assinada, tentando fallback:', err);
  }

  // Fallback se já for uma URL completa legada
  if (/^https?:\/\//i.test(fileUrlOrPath)) {
    window.open(fileUrlOrPath, '_blank', 'noopener,noreferrer');
  } else {
    const { data: pub } = supabase.storage.from('boletos').getPublicUrl(path);
    if (pub?.publicUrl) {
      window.open(pub.publicUrl, '_blank', 'noopener,noreferrer');
    }
  }
}

/**
 * Remove o arquivo do storage ao excluir uma conta para não deixar arquivos órfãos.
 */
export async function deleteBoletoAttachment(fileUrlOrPath) {
  if (!fileUrlOrPath) return;
  const path = normalizeStoragePath(fileUrlOrPath);
  if (!path) return;

  try {
    await supabase.storage.from('boletos').remove([path]);
  } catch (err) {
    console.warn('Não foi possível remover anexo do storage:', err);
  }
}
