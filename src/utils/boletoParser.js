import { addDays, parse } from 'date-fns';

/**
 * Limpa a linha digitável mantendo apenas números.
 */
export function cleanBarcode(code) {
  if (!code) return '';
  return code.toString().replace(/[^0-9]/g, '');
}

/**
 * Calcula a data de vencimento a partir do fator de vencimento FEBRABAN.
 * Base 0: 07/10/1997 (fator 1000 = 03/07/2000).
 * Em 22/02/2025 o fator atingiu 9999 e reiniciou (1000 = 22/02/2025).
 */
export function getDueDateFromFactor(factor) {
  const factorNum = parseInt(factor, 10);
  if (isNaN(factorNum) || factorNum <= 0) return null;

  // Se o fator for menor que 1000, não tem data de vencimento definida (contra apresentação)
  if (factorNum < 1000) return null;

  // Data base padrão FEBRABAN
  const baseDate1 = new Date(1997, 9, 7); // 07/10/1997
  // Novo ciclo (a partir de 22/02/2025 o fator 1000 começou novo ciclo)
  const baseDate2 = new Date(2025, 1, 22); // 22/02/2025

  // Se a data calculada com base1 for anterior a 2024, usamos o novo ciclo
  const dateCycle1 = addDays(baseDate1, factorNum);
  
  if (dateCycle1.getFullYear() < 2024) {
    const dateCycle2 = addDays(baseDate2, factorNum - 1000);
    return dateCycle2;
  }

  return dateCycle1;
}

/**
 * Parseia boleto bancário comum (47 dígitos).
 * Ex: AAABC.CCCCX DDDDD.DDDDDY EEEEE.EEEEEZ K UUUUVVVVVVVVVV
 * UUUU = Fator de vencimento (posições 34 a 37 - 0-indexed: 33 a 37)
 * VVVVVVVVVV = Valor em centavos (posições 38 a 47 - 0-indexed: 37 a 47)
 */
function parseBoletoBancario(digits) {
  if (digits.length !== 47) return null;

  const factor = digits.substring(33, 37);
  const rawValue = digits.substring(37, 47);
  const value = parseInt(rawValue, 10) / 100;

  const dueDate = getDueDateFromFactor(factor);

  return {
    type: 'BANCARIO',
    isValid: true,
    amount: value > 0 ? value : null,
    dueDate: dueDate ? dueDate.toISOString().split('T')[0] : null,
    formattedCode: formatBoletoDigits(digits),
    rawDigits: digits
  };
}

/**
 * Parseia boleto de arrecadação/concessionárias (48 dígitos, água, luz, tributos).
 * Valor: posições 4 a 15 (11 dígitos inteiros/centavos)
 */
function parseBoletoConcessionaria(digits) {
  if (digits.length !== 48) return null;

  const rawValue = digits.substring(4, 15);
  const value = parseInt(rawValue, 10) / 100;

  return {
    type: 'CONCESSIONARIA',
    isValid: true,
    amount: value > 0 ? value : null,
    dueDate: null,
    formattedCode: formatConcessionariaDigits(digits),
    rawDigits: digits
  };
}

/**
 * Formata linha digitável bancária com pontos e espaços padrão FEBRABAN.
 */
export function formatBoletoDigits(digits) {
  const d = cleanBarcode(digits);
  if (d.length === 47) {
    return `${d.slice(0, 5)}.${d.slice(5, 10)} ${d.slice(10, 15)}.${d.slice(15, 21)} ${d.slice(21, 26)}.${d.slice(26, 32)} ${d.slice(32, 33)} ${d.slice(33, 47)}`;
  }
  if (d.length === 48) {
    return `${d.slice(0, 12)} ${d.slice(12, 24)} ${d.slice(24, 36)} ${d.slice(36, 48)}`;
  }
  return digits;
}

function formatConcessionariaDigits(digits) {
  const d = cleanBarcode(digits);
  return `${d.slice(0, 12)} ${d.slice(12, 24)} ${d.slice(24, 36)} ${d.slice(36, 48)}`;
}

/**
 * Analisa e decodifica a linha digitável do boleto.
 * @param {string} inputCode 
 * @returns {{ isValid: boolean, type?: string, amount?: number, dueDate?: string, formattedCode?: string, rawDigits?: string, error?: string }}
 */
export function parseBoleto(inputCode) {
  const digits = cleanBarcode(inputCode);

  if (digits.length === 47) {
    return parseBoletoBancario(digits);
  }

  if (digits.length === 48) {
    return parseBoletoConcessionaria(digits);
  }

  return {
    isValid: false,
    error: `Linha digitável deve ter 47 ou 48 dígitos numéricos (foram informados ${digits.length}).`
  };
}
