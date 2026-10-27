import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { subMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import CustomSelect from '../components/CustomSelect';

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];

export default function DashboardView() {
  const { user, currentContext, categories } = useOutletContext();
  const [timeframe, setTimeframe] = useState('1m');
  const [dashboardBills, setDashboardBills] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        let monthsToSubtract = 0;
        if (timeframe === '3m') monthsToSubtract = 2;
        if (timeframe === '6m') monthsToSubtract = 5;
        if (timeframe === '1y') monthsToSubtract = 11;

        const endDate = endOfMonth(new Date());
        const startDate = startOfMonth(subMonths(new Date(), monthsToSubtract));

        const { data, error } = await supabase
          .from('bills')
          .select('*')
          .eq('user_id', user?.id)
          .eq('context', currentContext)
          .gte('date', format(startDate, 'yyyy-MM-dd'))
          .lte('date', format(endDate, 'yyyy-MM-dd'));

        if (error) throw error;
        setDashboardBills(data || []);
      } catch (error) {
        console.error('Erro ao buscar dados do dashboard:', error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [timeframe, currentContext]);

  // Processamento dos grandes números
  const receitasBills = dashboardBills.filter(b => b.type === 'receita');
  const despesasBills = dashboardBills.filter(b => b.type === 'despesa' || !b.type);

  const totalReceitas = receitasBills.reduce((acc, b) => acc + Number(b.amount), 0);
  const totalDespesas = despesasBills.reduce((acc, b) => acc + Number(b.amount), 0);
  const saldo = totalReceitas - totalDespesas;

  // Processamento para Gráfico de Pizza (Despesas por Categoria)
  const despesasPorCategoria = {};
  despesasBills.forEach(b => {
    const catName = categories.find(c => c.id === b.category_id)?.name || 'Sem Categoria';
    if (!despesasPorCategoria[catName]) despesasPorCategoria[catName] = 0;
    despesasPorCategoria[catName] += Number(b.amount);
  });
  
  const pieData = Object.keys(despesasPorCategoria)
    .map(key => ({ name: key, value: despesasPorCategoria[key] }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Processamento para Gráfico de Barras (Evolução Mensal)
  const evoluçãoMensal = {};
  dashboardBills.forEach(b => {
    const monthKey = format(new Date(b.date + 'T00:00:00'), 'MMM/yy', { locale: ptBR });
    if (!evoluçãoMensal[monthKey]) {
      evoluçãoMensal[monthKey] = { name: monthKey, receitas: 0, despesas: 0 };
    }
    if (b.type === 'receita') {
      evoluçãoMensal[monthKey].receitas += Number(b.amount);
    } else {
      evoluçãoMensal[monthKey].despesas += Number(b.amount);
    }
  });

  // Ordenar as chaves de evolução mensal cronologicamente é um pouco chato com MMM/yy,
  // Então vamos recriar a lista de meses do intervalo e preencher com dados.
  const barData = [];
  let monthsToSubtract = timeframe === '1m' ? 0 : timeframe === '3m' ? 2 : timeframe === '6m' ? 5 : 11;
  for (let i = monthsToSubtract; i >= 0; i--) {
    const d = subMonths(new Date(), i);
    const monthKey = format(d, 'MMM/yy', { locale: ptBR });
    barData.push(evoluçãoMensal[monthKey] || { name: monthKey, receitas: 0, despesas: 0 });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
      {/* Header do Dashboard */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Visão Geral</h2>
        <CustomSelect
          value={timeframe}
          onChange={setTimeframe}
          options={[
            { value: '1m', label: 'Último Mês' },
            { value: '3m', label: 'Últimos 3 Meses' },
            { value: '6m', label: 'Últimos 6 Meses' },
            { value: '1y', label: 'Este Ano' }
          ]}
          style={{ width: '180px' }}
        />
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando dados...</div>
      ) : (
        <>
          {/* Big Numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Entradas</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.5rem' }}>
                R$ {totalReceitas.toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: '4px solid #ef4444' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Saídas</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#ef4444', marginTop: '0.5rem' }}>
                R$ {totalDespesas.toFixed(2).replace('.', ',')}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', borderTop: `4px solid ${saldo >= 0 ? '#10b981' : '#ef4444'}` }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Resultado</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: saldo >= 0 ? '#10b981' : '#ef4444', marginTop: '0.5rem' }}>
                R$ {saldo.toFixed(2).replace('.', ',')}
              </div>
            </div>
          </div>

          {/* Charts */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', height: '400px' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Despesas por Categoria</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      formatter={(value) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                      contentStyle={{ backgroundColor: 'var(--calendar-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '16px', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>Evolução Mensal</h3>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--item-border)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                    <RechartsTooltip 
                      formatter={(value) => `R$ ${value.toFixed(2).replace('.', ',')}`}
                      contentStyle={{ backgroundColor: 'var(--calendar-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                      cursor={{ fill: 'var(--item-bg)' }}
                    />
                    <Legend />
                    <Bar dataKey="receitas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="despesas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
