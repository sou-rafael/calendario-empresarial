import { format, addDays, nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday } from 'date-fns';

/**
 * Analisa e extrai dados de compromissos financeiros a partir de texto transcrito em português.
 */
export function parseVoiceExpense(text, availableCategories = []) {
  if (!text || typeof text !== 'string') return null;

  const originalText = text.trim();
  const lower = originalText.toLowerCase();
  const now = new Date();

  // 1. Extração do Valor Numérico (Suporta: "r$150", "r$ 150", "150 reais", "150,50")
  let amount = 0;
  
  const rDollarMatch = lower.match(/r\$\s*(\d+(?:[.,]\d{1,2})?)/i);
  const realWordMatch = lower.match(/(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)/i);
  const rawNumberMatch = lower.match(/\b\d+(?:[.,]\d{2})?\b/);

  if (rDollarMatch) {
    amount = parseFloat(rDollarMatch[1].replace(',', '.'));
  } else if (realWordMatch) {
    amount = parseFloat(realWordMatch[1].replace(',', '.'));
  } else if (rawNumberMatch) {
    amount = parseFloat(rawNumberMatch[0].replace(',', '.'));
  }

  // 2. Extração da Data de Vencimento
  let dueDate = format(now, 'yyyy-MM-dd'); // Default hoje

  if (lower.includes('amanhã') || lower.includes('amanha')) {
    dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
  } else if (lower.includes('depois de amanhã') || lower.includes('depois de amanha')) {
    dueDate = format(addDays(now, 2), 'yyyy-MM-dd');
  } else if (lower.includes('segunda')) {
    dueDate = format(nextMonday(now), 'yyyy-MM-dd');
  } else if (lower.includes('terça') || lower.includes('terca')) {
    dueDate = format(nextTuesday(now), 'yyyy-MM-dd');
  } else if (lower.includes('quarta')) {
    dueDate = format(nextWednesday(now), 'yyyy-MM-dd');
  } else if (lower.includes('quinta')) {
    dueDate = format(nextThursday(now), 'yyyy-MM-dd');
  } else if (lower.includes('sexta')) {
    dueDate = format(nextFriday(now), 'yyyy-MM-dd');
  } else if (lower.includes('sábado') || lower.includes('sabado')) {
    dueDate = format(nextSaturday(now), 'yyyy-MM-dd');
  } else if (lower.includes('domingo')) {
    dueDate = format(nextSunday(now), 'yyyy-MM-dd');
  } else {
    const dayMatch = lower.match(/(?:dia|no\s*dia|pra\s*o\s*dia|para\s*o\s*dia)\s*(\d{1,2})/i);
    if (dayMatch && dayMatch[1]) {
      const dayNum = parseInt(dayMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        let targetMonth = now.getMonth();
        let targetYear = now.getFullYear();
        if (dayNum < now.getDate()) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
          }
        }
        dueDate = format(new Date(targetYear, targetMonth, dayNum), 'yyyy-MM-dd');
      }
    }
  }

  // 3. Mapeamento de Categoria
  let matchedCategoryId = '';
  const lowerCats = availableCategories.map(c => ({ id: c.id, name: c.name.toLowerCase() }));
  const keywordMap = {
    'imposto': ['das', 'simples', 'darf', 'tributo', 'icms', 'iss', 'gps', 'inss', 'fgts', 'irpj'],
    'energia': ['copel', 'enel', 'cemig', 'cpfl', 'luz', 'eletricidade', 'força'],
    'água': ['sanepar', 'sabesp', 'embasa', 'saae', 'agua', 'água', 'saneamento'],
    'aluguel': ['aluguel', 'condomínio', 'condominio', 'imobiliária', 'imovel', 'ponto comercial'],
    'folha': ['salário', 'salario', 'folha', 'adiantamento', 'vale', 'funcionário', 'funcionario', 'pro labore'],
    'fornecedor': ['mercadoria', 'estoque', 'produto', 'fornecedor', 'materia prima']
  };

  for (const cat of lowerCats) {
    if (lower.includes(cat.name)) {
      matchedCategoryId = cat.id;
      break;
    }
  }
  if (!matchedCategoryId) {
    for (const [group, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(k => lower.includes(k))) {
        const found = lowerCats.find(c => c.name.includes(group) || keywords.some(k => c.name.includes(k)));
        if (found) {
          matchedCategoryId = found.id;
          break;
        }
      }
    }
  }
  if (!matchedCategoryId && availableCategories.length > 0) {
    matchedCategoryId = availableCategories[0].id;
  }

  // 4. Limpeza Inteligente da Descrição por Palavras
  const stopWords = new Set([
    'acrescente', 'acrescentar', 'adicione', 'adicionar', 'coloque', 'colocar',
    'lançar', 'lance', 'cadastre', 'cadastrar', 'anote', 'anotar', 'salve', 'salvar',
    'lembre', 'lembrar', 'agende', 'agendar', 'inclua', 'incluir', 'pagar', 'paguei',
    'conta', 'boleto', 'fatura', 'pagamento', 'compromisso',
    'de', 'da', 'do', 'das', 'dos', 'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
    'no', 'na', 'nos', 'nas', 'pra', 'para', 'pro', 'por', 'com',
    'hoje', 'amanhã', 'amanha', 'depois', 'ontem',
    // Dias da semana (simples e compostos com ou sem hífen)
    'segunda', 'segundafeira', 'terça', 'terca', 'tercafeira', 'terçafeira',
    'quarta', 'quartafeira', 'quinta', 'quintafeira', 'sexta', 'sextafeira',
    'sábado', 'sabado', 'domingo', 'feira',
    'dia', 'valor', 'reais', 'real', 'r$', 'custou', 'r'
  ]);

  // Primeiro remove explicitamente padrões de dias compostos (ex: "segunda-feira", "terça feira")
  let normalizedText = originalText
    .replace(/\b(?:segunda|terça|terca|quarta|quinta|sexta)[\s-]+feira\b/gi, '')
    .replace(/\br\$\s*/gi, '')
    .trim();

  const rawWords = normalizedText.split(/\s+/);
  const filteredWords = [];

  for (let i = 0; i < rawWords.length; i++) {
    const rawWord = rawWords[i];
    const cleanWord = rawWord.toLowerCase().replace(/[^a-z0-9áàâãéèêíïóôõöúçñ]/gi, '');

    // Se for número puro ou número com centavos, pula
    if (/^\d+([.,]\d+)?$/.test(cleanWord)) {
      continue;
    }

    // Se for uma stopword de comando/data/valor, pula
    if (stopWords.has(cleanWord)) {
      continue;
    }

    if (cleanWord.length > 0) {
      filteredWords.push(rawWord);
    }
  }

  let finalDesc = filteredWords.join(' ').replace(/^[-–—:,\s]+|[-–—:,\s]+$/g, '').trim();

  // Fallbacks inteligentes se restar pouca coisa
  if (finalDesc.length < 2) {
    if (lower.includes('água') || lower.includes('agua')) finalDesc = 'Água';
    else if (lower.includes('luz') || lower.includes('energia')) finalDesc = 'Energia';
    else if (lower.includes('aluguel')) finalDesc = 'Aluguel';
    else if (lower.includes('internet')) finalDesc = 'Internet';
    else finalDesc = originalText;
  }

  // Capitaliza a primeira letra
  finalDesc = finalDesc.charAt(0).toUpperCase() + finalDesc.slice(1);

  return {
    rawText: originalText,
    description: finalDesc,
    amount,
    dueDate,
    categoryId: matchedCategoryId
  };
}
