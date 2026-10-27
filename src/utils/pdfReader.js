import { parseBoleto } from './boletoParser';

/**
 * Carrega a biblioteca PDF.js empacotada localmente sob demanda (Code Splitting seguro)
 */
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist');
  const workerModule = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerModule.default;
  return pdfjsLib;
}

/**
 * Procura padrões de linha digitável bancária (47 dígitos) ou concessionária (48 dígitos)
 * no texto bruto extraído de um PDF.
 */
export function findBarcodeInText(text) {
  if (!text) return null;

  // 1. Tentar encontrar padrão com pontos e espaços (ex: 34191.09008 61254.891234 ...)
  const formattedBancarioRegex = /\b\d{5}[.\s]?\d{5}\s+\d{5}[.\s]?\d{6}\s+\d{5}[.\s]?\d{6}\s+\d\s+\d{14}\b/g;
  const matchFormatted = text.match(formattedBancarioRegex);
  if (matchFormatted && matchFormatted.length > 0) {
    const clean = matchFormatted[0].replace(/[^0-9]/g, '');
    if (clean.length === 47) return clean;
  }

  // 2. Concessionária formatada: 11-1 11-1 11-1 11-1 (48 digitos)
  const formattedConcRegex = /\b\d{11,12}[-\s]?\d?\s+\d{11,12}[-\s]?\d?\s+\d{11,12}[-\s]?\d?\s+\d{11,12}[-\s]?\d?\b/g;
  const matchConc = text.match(formattedConcRegex);
  if (matchConc && matchConc.length > 0) {
    for (const m of matchConc) {
      const clean = m.replace(/[^0-9]/g, '');
      if (clean.length === 48) return clean;
    }
  }

  // 3. Procura linhas inteiras que tenham 47 ou 48 dígitos
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const cleanLine = line.replace(/[^0-9]/g, '');
    if (cleanLine.length === 47 || cleanLine.length === 48) {
      return cleanLine;
    }
  }

  // 4. Procura em todo o texto concatenado
  const allNumbers = text.replace(/[^0-9]/g, ' ');
  const numberBlocks = allNumbers.split(/\s+/).filter(b => b.length >= 47 && b.length <= 48);
  if (numberBlocks.length > 0) {
    return numberBlocks[0];
  }

  // 5. Bloco de números próximos com possíveis espaços e separadores
  const matches = text.match(/\d[\d\s.\-]{40,65}\d/g);
  if (matches) {
    for (const m of matches) {
      const clean = m.replace(/[^0-9]/g, '');
      if (clean.length === 47 || clean.length === 48) {
        return clean;
      }
    }
  }

  return null;
}

/**
 * Lê um arquivo PDF e extrai todo o texto de todas as páginas com segurança reforçada.
 * Retorna o texto e, se encontrada, a linha digitável já decodificada.
 */
export async function extractBoletoFromPdf(file) {
  try {
    const pdfjsLib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    // isEvalSupported: false mitiga vetores de execução de script (CVE-2024-4367)
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      isEvalSupported: false
    });
    const pdf = await loadingTask.promise;

    let fullText = '';
    const maxPages = Math.min(pdf.numPages, 15); // Evita DoS com PDFs gigantes
    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const strings = content.items.map(item => item.str);
      fullText += strings.join(' ') + '\n';
    }

    const detectedBarcode = findBarcodeInText(fullText);

    if (detectedBarcode) {
      const parsed = parseBoleto(detectedBarcode);
      return {
        success: true,
        rawBarcode: detectedBarcode,
        parsed,
        fullText
      };
    }

    return {
      success: false,
      error: 'Não foi possível identificar a linha digitável automaticamente no texto do PDF.',
      fullText
    };
  } catch (err) {
    console.error('Erro ao ler PDF:', err);
    return {
      success: false,
      error: 'Erro ao processar o arquivo PDF: ' + err.message
    };
  }
}
