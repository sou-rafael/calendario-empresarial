import { format, addDays, nextMonday, nextFriday } from 'date-fns';

/**
 * Analisa e extrai dados de compromissos financeiros a partir de texto transcrito em português.
 * Identifica:
 * - Valor (R$, reais, centavos, etc.)
 * - Data de vencimento (hoje, amanhã, dia 10, próxima segunda, datas explícitas)
 * - Descrição (fornecedor, serviço, imposto)
 * - Categoria sugerida
 */
export function parseVoiceExpense(text, availableCategories = []) {
  if (!text || typeof text !== 'string') return null;

  const clean = text.toLowerCase().trim();
  const now = new Date();

  // 1. Extração de Valor em Reais
  // Suporta: "1500 reais", "R$ 350,50", "450 com 20", "cem reais", etc.
  let amount = null;

  // Regex para números explícitos com reais/R$ ou valores soltos
  const valueRegex = /(?:r\$\s*|valor\s*(?:de\s*)?)?(\d+(?:[.,]\d{1,2})?)\s*(?:reais|real)?/i;
  const matchValue = clean.match(valueRegex);

  // Busca número que pareça quantia
  const allNumbers = clean.match(/\b\d+(?:[.,]\d{2})?\b/g);
  if (matchValue && matchValue[1]) {
    amount = parseFloat(matchValue[1].replace(',', '.'));
  } else if (allNumbers && allNumbers.length > 0) {
    amount = parseFloat(allNumbers[0].replace(',', '.'));
  }

  // 2. Extração de Data de Vencimento
  let dueDate = format(now, 'yyyy-MM-dd'); // Default hoje

  if (clean.includes('amanhã') || clean.includes('amanha')) {
    dueDate = format(addDays(now, 1), 'yyyy-MM-dd');
  } else if (clean.includes('depois de amanhã') || clean.includes('depois de amanha')) {
    dueDate = format(addDays(now, 2), 'yyyy-MM-dd');
  } else if (clean.includes('segunda')) {
    dueDate = format(nextMonday(now), 'yyyy-MM-dd');
  } else if (clean.includes('sexta')) {
    dueDate = format(nextFriday(now), 'yyyy-MM-dd');
  } else {
    // Procura por "dia XX" ou "dia XX de mês"
    const dayMatch = clean.match(/(?:dia|no\s*dia|pra\s*o\s*dia|para\s*o\s*dia)\s*(\d{1,2})/i);
    if (dayMatch && dayMatch[1]) {
      const dayNum = parseInt(dayMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        // Se o dia já passou no mês corrente, supõe o próximo mês
        let targetMonth = now.getMonth();
        let targetYear = now.getFullYear();
        if (dayNum < now.getDate()) {
          targetMonth += 1;
          if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
          }
        }
        const targetDate = new Date(targetYear, targetMonth, dayNum);
        dueDate = format(targetDate, 'yyyy-MM-dd');
      }
    }
  }

  // 3. Sugestão de Categoria com base em palavras-chave
  let matchedCategoryId = '';
  const lowerCats = availableCategories.map(c => ({ id: c.id, name: c.name.toLowerCase() }));

  const keywordMap = {
    'imposto': ['das', 'simples', 'darf', 'tributo', 'icms', 'iss', 'gps', 'inss', 'fgts', 'irpj'],
    'energia': ['copel', 'enel', 'cemig', 'cpfl', 'luz', 'eletricidade', 'força'],
    'água': ['sanepar', 'sabesp', 'embasa', 'saae', 'agua', 'saneamento'],
    'aluguel': ['aluguel', 'condomínio', 'imobiliária', 'imovel'],
    'folha': ['salário', 'folha', 'adiantamento', 'vale', 'funcionário', 'pro labore'],
    'fornecedor': ['mercadoria', 'estoque', 'produto', 'fornecedor', 'materia prima']
  };

  // Tenta encontrar correspondência nas categorias do banco
  for (const cat of lowerCats) {
    if (clean.includes(cat.name)) {
      matchedCategoryId = cat.id;
      break;
    }
  }

  if (!matchedCategoryId) {
    // Procura por sinônimos
    for (const [group, keywords] of Object.entries(keywordMap)) {
      if (keywords.some(k => clean.includes(k))) {
        const found = lowerCats.find(c => c.name.includes(group) || keywords.some(k => c.name.includes(k)));
        if (found) {
          matchedCategoryId = found.id;
          break;
        }
      }
    }
  }

  // Se não achou específica, pega a primeira disponível como fallback
  if (!matchedCategoryId && availableCategories.length > 0) {
    matchedCategoryId = availableCategories[0].id;
  }

  // 4. Limpeza da Descrição
  // Remove comandos verbais comuns para deixar a descrição limpa
  let description = text
    .replace(/(?:lembrar de\s*|anotar\s*|cadastrar\s*|lançar\s*|pagar\s*|paguei\s*|conta\s*de\s*)/gi, '')
    .replace(/(?:no\s*valor\s*de|valor\s*de|custou|de|por)\s*r?\$?\s*\d+(?:[.,]\d{1,2})?\s*(?:reais)?/gi, '')
    .replace(/(?:para\s*o\s*dia|pra\s*o\s*dia|no\s*dia|dia)\s*\d{1,2}/gi, '')
    .replace(/(?:hoje|amanhã|amanha|depois de amanhã)/gi, '')
    .trim();

  // Se a descrição ficou vazia ou curta demais, capitaliza o texto original
  if (description.length < 3) {
    description = text.charAt(0).toUpperCase() + text.slice(1);
  } else {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  return {
    rawText: text,
    description,
    amount: amount || 0,
    dueDate,
    categoryId: matchedCategoryId
  };
}
