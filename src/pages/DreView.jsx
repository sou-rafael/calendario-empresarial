import React from 'react';
import { useOutletContext } from 'react-router-dom';

export default function DreView() {
  const { bills, currentContext, categories } = useOutletContext();

  const isEmpresarial = currentContext === 'empresarial';
  
  const receitasBills = bills.filter(b => b.type === 'receita');
  const despesasBills = bills.filter(b => b.type === 'despesa' || !b.type);

  const totalReceitas = receitasBills.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalDespesas = despesasBills.reduce((acc, b) => acc + Number(b.amount), 0);
  
  const resultadoLiquido = totalReceitas - totalDespesas;

  // Agrupar despesas por categoria
  const despesasPorCategoria = {};
  categories.forEach(c => {
    despesasPorCategoria[c.id] = { name: c.name, total: 0 };
  });

  despesasBills.forEach(b => {
    if (b.category_id && despesasPorCategoria[b.category_id]) {
      despesasPorCategoria[b.category_id].total += Number(b.amount);
    } else {
      if (!despesasPorCategoria['sem_categoria']) {
        despesasPorCategoria['sem_categoria'] = { name: 'Sem Categoria', total: 0 };
      }
      despesasPorCategoria['sem_categoria'].total += Number(b.amount);
    }
  });

  const despesasOrdenadas = Object.values(despesasPorCategoria)
    .filter(c => c.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div className="glass-panel" style={{ padding: '2rem', borderRadius: 'var(--radius-lg)', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '2rem', color: 'var(--text-primary)', textAlign: 'center', fontWeight: 800 }}>
        {isEmpresarial ? 'Demonstração do Resultado do Exercício (DRE)' : 'Resumo Financeiro Mensal'}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Receitas Brutas */}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '1.1rem' }}>Receitas Brutas (Entradas)</span>
          <span style={{ fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>
            R$ {totalReceitas.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {/* Linhas de Despesas */}
        <div style={{ padding: '1rem', background: 'var(--item-bg)', borderRadius: '8px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
            Deduções e Despesas
          </h4>
          
          {despesasOrdenadas.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhuma despesa registrada.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {despesasOrdenadas.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--item-border)', paddingBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>(-) {cat.name}</span>
                  <span style={{ color: '#ef4444' }}>
                    R$ {cat.total.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--item-border)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total de Saídas</span>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>
              R$ {totalDespesas.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        {/* Resultado Líquido */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', padding: '1.5rem', 
          background: resultadoLiquido >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', 
          borderRadius: '8px', 
          borderLeft: `4px solid ${resultadoLiquido >= 0 ? '#10b981' : '#ef4444'}`,
          marginTop: '1rem'
        }}>
          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.2rem', textTransform: 'uppercase' }}>
            {isEmpresarial ? 'Resultado Líquido' : 'Saldo Mensal Líquido'}
          </span>
          <span style={{ fontWeight: 800, color: resultadoLiquido >= 0 ? '#10b981' : '#be123c', fontSize: '1.4rem' }}>
            R$ {resultadoLiquido.toFixed(2).replace('.', ',')}
          </span>
        </div>
      </div>
    </div>
  );
}
