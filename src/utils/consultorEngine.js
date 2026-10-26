import { 
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
  format, isToday, parseISO 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Motor determinístico de consultas financeiras do Consultor FiscalZap (Escopo Empresarial).
 */
export function executeConsultorQuery(actionKey, bills = [], categories = []) {
  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');
  const monthStartStr = format(startOfMonth(now), 'yyyy-MM-dd');
  const monthEndStr = format(endOfMonth(now), 'yyyy-MM-dd');

  // Filtra as contas do mês corrente (escopo empresarial)
  const currentMonthBills = bills.filter(b => b.date >= monthStartStr && b.date <= monthEndStr);

  switch (actionKey) {
    // ==========================================
    // GRUPO 1: VENCIMENTOS & PRAZOS
    // ==========================================
    case 'vence_hoje': {
      const todayBills = bills.filter(b => b.date === todayStr);
      if (todayBills.length === 0) {
        return {
          title: 'Vencimentos de Hoje',
          text: 'Tudo tranquilo por aqui! 🎉 Não há nenhum compromisso financeiro empresarial vencendo na data de hoje.',
          data: []
        };
      }
      const total = todayBills.reduce((acc, b) => acc + Number(b.amount), 0);
      return {
        title: 'Vencimentos de Hoje',
        text: `Você possui **${todayBills.length} conta(s)** vencendo hoje, totalizando **R$ ${total.toFixed(2).replace('.', ',')}**:`,
        items: todayBills.map(b => ({
          description: b.description,
          amount: `R$ ${Number(b.amount).toFixed(2).replace('.', ',')}`,
          barcode: b.barcode,
          file_url: b.file_url
        }))
      };
    }

    case 'vence_semana': {
      const weekStartStr = format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // Segunda-feira
      const weekEndStr = format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'); // Domingo

      const weekBills = bills.filter(b => b.date >= weekStartStr && b.date <= weekEndStr);
      if (weekBills.length === 0) {
        return {
          title: 'Vencimentos desta Semana',
          text: 'Nenhuma conta empresarial prevista para vencer até o final desta semana!',
          data: []
        };
      }
      const total = weekBills.reduce((acc, b) => acc + Number(b.amount), 0);
      return {
        title: 'Vencimentos desta Semana',
        text: `Para esta semana estão programadas **${weekBills.length} conta(s)** somando **R$ ${total.toFixed(2).replace('.', ',')}**:`,
        items: weekBills.map(b => ({
          description: b.description,
          amount: `R$ ${Number(b.amount).toFixed(2).replace('.', ',')}`,
          date: format(parseISO(b.date), "dd/MM (EEE)", { locale: ptBR }),
          barcode: b.barcode
        }))
      };
    }

    case 'proximos_tres': {
      const upcoming = bills
        .filter(b => b.date >= todayStr)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3);

      if (upcoming.length === 0) {
        return {
          title: 'Próximos Vencimentos',
          text: 'Não há novos compromissos cadastrados a vencer nos próximos dias.'
        };
      }
      return {
        title: 'Próximos 3 Vencimentos',
        text: 'Aqui estão os próximos compromissos imediatos da sua empresa:',
        items: upcoming.map(b => ({
          description: b.description,
          amount: `R$ ${Number(b.amount).toFixed(2).replace('.', ',')}`,
          date: format(parseISO(b.date), "dd 'de' MMMM", { locale: ptBR }),
          barcode: b.barcode
        }))
      };
    }

    // ==========================================
    // GRUPO 2: DISTRIBUIÇÃO DAS DESPESAS
    // ==========================================
    case 'maior_despesa': {
      if (currentMonthBills.length === 0) {
        return {
          title: 'Maior Despesa do Mês',
          text: 'Ainda não há lançamentos registrados neste mês para calcular a maior despesa.'
        };
      }
      const sorted = [...currentMonthBills].sort((a, b) => Number(b.amount) - Number(a.amount));
      const highest = sorted[0];
      const cat = categories.find(c => c.id === highest.category_id);

      return {
        title: 'Maior Despesa do Mês',
        text: `A sua maior conta do mês de **${format(now, 'MMMM', { locale: ptBR })}** é:\n\n` +
              `📌 **${highest.description}**\n` +
              `💵 **R$ ${Number(highest.amount).toFixed(2).replace('.', ',')}**\n` +
              `📅 Vencimento: **${format(parseISO(highest.date), "dd/MM/yyyy")}**\n` +
              `🏷️ Categoria: **${cat ? cat.name : 'Geral'}**`
      };
    }

    case 'gastos_por_categoria': {
      if (currentMonthBills.length === 0) {
        return {
          title: 'Gastos por Categoria',
          text: 'Nenhuma despesa registrada neste mês para gerar a distribuição de categorias.'
        };
      }
      const totalMonth = currentMonthBills.reduce((acc, b) => acc + Number(b.amount), 0);
      const catTotals = {};

      currentMonthBills.forEach(b => {
        const cat = categories.find(c => c.id === b.category_id);
        const name = cat ? cat.name : 'Outros';
        catTotals[name] = (catTotals[name] || 0) + Number(b.amount);
      });

      const ranking = Object.entries(catTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([name, sum], index) => {
          const pct = totalMonth > 0 ? ((sum / totalMonth) * 100).toFixed(1) : 0;
          return `**${index + 1}º ${name}:** R$ ${sum.toFixed(2).replace('.', ',')} (${pct}%)`;
        });

      return {
        title: 'Distribuição por Categorias',
        text: `Distribuição das despesas em **${format(now, 'MMMM', { locale: ptBR })}** (Total: R$ ${totalMonth.toFixed(2).replace('.', ',')}):\n\n` +
              ranking.join('\n')
      };
    }

    case 'impostos_previstos': {
      // Procura por categoria com nome imposto/tributo ou descrições fiscais
      const taxBills = currentMonthBills.filter(b => {
        const cat = categories.find(c => c.id === b.category_id);
        const catName = cat ? cat.name.toLowerCase() : '';
        const desc = (b.description || '').toLowerCase();
        return catName.includes('impost') || catName.includes('tribut') || 
               desc.includes('das') || desc.includes('simples') || desc.includes('darf') || desc.includes('fgts') || desc.includes('inss');
      });

      if (taxBills.length === 0) {
        return {
          title: 'Impostos e Tributos',
          text: 'Nenhum imposto ou guia tributária identificada para este mês até o momento.'
        };
      }

      const totalTax = taxBills.reduce((acc, b) => acc + Number(b.amount), 0);
      return {
        title: 'Impostos Previstos do Mês',
        text: `A previsão total de impostos para este mês é de **R$ ${totalTax.toFixed(2).replace('.', ',')}** dividida em **${taxBills.length} guia(s)**:`,
        items: taxBills.map(b => ({
          description: b.description,
          amount: `R$ ${Number(b.amount).toFixed(2).replace('.', ',')}`,
          date: format(parseISO(b.date), "dd/MM/yyyy"),
          barcode: b.barcode
        }))
      };
    }

    // ==========================================
    // GRUPO 3: SAÚDE & FLUXO DO MÊS
    // ==========================================
    case 'resumo_geral': {
      const totalMonth = currentMonthBills.reduce((acc, b) => acc + Number(b.amount), 0);
      const paidBills = currentMonthBills.filter(b => b.date < todayStr);
      const remainingBills = currentMonthBills.filter(b => b.date >= todayStr);

      const paidTotal = paidBills.reduce((acc, b) => acc + Number(b.amount), 0);
      const remainingTotal = remainingBills.reduce((acc, b) => acc + Number(b.amount), 0);

      return {
        title: 'Resumo Geral do Mês',
        text: `Visão geral de **${format(now, 'MMMM yyyy', { locale: ptBR })}**:\n\n` +
              `💰 **Total Previsto:** R$ ${totalMonth.toFixed(2).replace('.', ',')} (${currentMonthBills.length} contas)\n` +
              `⏳ **A Vencer / Restante:** R$ ${remainingTotal.toFixed(2).replace('.', ',')} (${remainingBills.length} contas)\n` +
              `✅ **Já Vencidas:** R$ ${paidTotal.toFixed(2).replace('.', ',')} (${paidBills.length} contas)`
      };
    }

    case 'media_diaria': {
      const totalMonth = currentMonthBills.reduce((acc, b) => acc + Number(b.amount), 0);
      // Média baseada em 22 dias úteis comerciais
      const mediaDiasUteis = totalMonth / 22;
      const mediaDiasTotais = totalMonth / 30;

      return {
        title: 'Média Diária de Saída',
        text: `Com base nas despesas cadastradas de **R$ ${totalMonth.toFixed(2).replace('.', ',')}**:\n\n` +
              `📊 **Média por dia útil (22 dias):** R$ ${mediaDiasUteis.toFixed(2).replace('.', ',')}/dia\n` +
              `📅 **Média por dia corrido (30 dias):** R$ ${mediaDiasTotais.toFixed(2).replace('.', ',')}/dia\n\n` +
              `*Essa métrica ajuda a calibrar a meta diária de vendas para cobrir as saídas operacionais.*`
      };
    }

    case 'contas_pendentes': {
      const pendingBills = currentMonthBills.filter(b => b.date >= todayStr);
      if (pendingBills.length === 0) {
        return {
          title: 'Contas Restantes do Mês',
          text: 'Parabéns! Todas as contas previstas deste mês já passaram da data de vencimento.'
        };
      }
      const total = pendingBills.reduce((acc, b) => acc + Number(b.amount), 0);
      return {
        title: 'Contas a Vencer no Mês',
        text: `Restam **${pendingBills.length} conta(s)** a pagar até o fim do mês, totalizando **R$ ${total.toFixed(2).replace('.', ',')}**:`,
        items: pendingBills.map(b => ({
          description: b.description,
          amount: `R$ ${Number(b.amount).toFixed(2).replace('.', ',')}`,
          date: format(parseISO(b.date), "dd/MM")
        }))
      };
    }

    default:
      return {
        title: 'Consulta',
        text: 'Não encontrei dados suficientes para responder a esta solicitação.'
      };
  }
}
