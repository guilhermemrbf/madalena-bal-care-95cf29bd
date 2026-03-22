import { useState } from 'react';
import { Product, Sale, Cliente, fmt } from '@/store/useStore';

interface Props { produtos: Product[]; vendas: Sale[]; clientes: Cliente[]; }

export default function DailyReport({ produtos, vendas, clientes }: Props) {
  const [tab, setTab] = useState<'dia' | 'abc' | 'mensal'>('dia');
  const hoje = new Date().toDateString();
  const now = new Date();

  const tabs = [
    { key: 'dia' as const, label: 'Relatório do Dia' },
    { key: 'abc' as const, label: 'Curva ABC' },
    { key: 'mensal' as const, label: 'Relatório Mensal' },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <button onClick={() => window.print()} className="bg-background text-text-2 border border-border rounded-lg px-3.5 py-[7px] text-xs font-bold hover:bg-border transition-colors">🖨️ Imprimir</button>
      </div>

      {tab === 'dia' && <DailyTab produtos={produtos} vendas={vendas} clientes={clientes} />}
      {tab === 'abc' && <ABCTab vendas={vendas} now={now} />}
      {tab === 'mensal' && <MonthlyTab vendas={vendas} clientes={clientes} now={now} />}
    </div>
  );
}

function DailyTab({ produtos, vendas, clientes }: { produtos: Product[]; vendas: Sale[]; clientes: Cliente[] }) {
  const hoje = new Date().toDateString();
  const vendasHoje = vendas.filter(v => new Date(v.data).toDateString() === hoje);
  const totalHoje = vendasHoje.reduce((a, v) => a + v.total, 0);
  const ticket = vendasHoje.length ? totalHoje / vendasHoje.length : 0;
  const clientesAtendidos = new Set(vendasHoje.filter(v => v.clienteId).map(v => v.clienteId)).size + vendasHoje.filter(v => !v.clienteId).length;
  const descontos = vendasHoje.reduce((a, v) => a + ((v.subtotal || v.total) - v.total), 0);

  // Most sold product today
  const prodQty: Record<string, number> = {};
  vendasHoje.forEach(v => v.itens.forEach(i => { prodQty[i.nome.split('—')[0].trim()] = (prodQty[i.nome.split('—')[0].trim()] || 0) + i.qty; }));
  const maisVendido = Object.entries(prodQty).sort((a, b) => b[1] - a[1])[0];

  const pgtoMap: Record<string, number> = {};
  vendasHoje.forEach(v => { pgtoMap[v.pgto] = (pgtoMap[v.pgto] || 0) + v.total; });
  const baixo = produtos.filter(p => p.est <= p.min);
  const now = new Date();

  return (
    <div>
      <div className="text-xs text-muted-foreground mb-4">{now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</div>
      <div className="grid grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Faturamento', value: fmt(totalHoje) },
          { label: 'Vendas', value: String(vendasHoje.length) },
          { label: 'Ticket Médio', value: fmt(ticket) },
          { label: 'Clientes', value: String(clientesAtendidos) },
          { label: 'Descontos', value: fmt(descontos) },
          { label: 'Mais Vendido', value: maisVendido ? `${maisVendido[0]} (${maisVendido[1]})` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg p-[18px] border border-border shadow-sm">
            <div className="font-display text-[22px] font-bold leading-none truncate">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="font-display text-lg text-primary mb-3">Por Forma de Pagamento</div>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden mb-6">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Pagamento', 'Qtd. Vendas', 'Total'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(pgtoMap).length === 0 ? (
              <tr><td colSpan={3} className="text-center py-12 text-muted-foreground font-semibold">Sem vendas hoje</td></tr>
            ) : Object.entries(pgtoMap).map(([k, v]) => (
              <tr key={k} className="border-t border-border">
                <td className="px-4 py-[13px]"><span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">{k}</span></td>
                <td className="px-4 py-[13px] text-[13.5px]">{vendasHoje.filter(vv => vv.pgto === k).length}</td>
                <td className="px-4 py-[13px] text-[13.5px] font-bold">{fmt(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {baixo.length > 0 && (
        <>
          <div className="font-display text-lg text-destructive mb-3">⚠️ Produtos em Estoque Crítico</div>
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f8fbf9]">
                <tr>{['Código', 'Produto', 'Estoque', 'Mínimo'].map(h => <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>)}</tr>
              </thead>
              <tbody>
                {baixo.map(p => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-[13px]"><span className="font-mono bg-background px-2 py-0.5 rounded-md text-xs text-text-2">{p.cod}</span></td>
                    <td className="px-4 py-[13px] text-[13.5px]">{p.nome}</td>
                    <td className="px-4 py-[13px] text-destructive font-bold">{p.est}</td>
                    <td className="px-4 py-[13px] text-[13.5px]">{p.min}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function ABCTab({ vendas, now }: { vendas: Sale[]; now: Date }) {
  const vendasMes = vendas.filter(v => {
    const d = new Date(v.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const prodMap: Record<string, { nome: string; qty: number; valor: number }> = {};
  vendasMes.forEach(v => v.itens.forEach(i => {
    const key = i.nome.split('—')[0].trim();
    if (!prodMap[key]) prodMap[key] = { nome: key, qty: 0, valor: 0 };
    prodMap[key].qty += i.qty;
    prodMap[key].valor += i.preco * i.qty;
  }));

  const sorted = Object.values(prodMap).sort((a, b) => b.valor - a.valor);
  const totalFat = sorted.reduce((a, p) => a + p.valor, 0) || 1;

  let cumulative = 0;
  const classified = sorted.map((p, i) => {
    cumulative += p.valor;
    const pct = (p.valor / totalFat) * 100;
    const cumPct = (cumulative / totalFat) * 100;
    const cat = cumPct <= 80 ? 'A' : cumPct <= 95 ? 'B' : 'C';
    return { ...p, pos: i + 1, pct, cat };
  });

  const catColors = { A: 'bg-primary text-primary-foreground', B: 'bg-[#fff8e6] text-[#8a6400]', C: 'bg-muted text-muted-foreground' };

  return (
    <div>
      <div className="font-display text-lg text-primary mb-3">Curva ABC — Ranking por Faturamento</div>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Pos.', 'Produto', 'Qtd. Vendida', 'Faturamento', '% do Total', 'Categoria'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classified.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-muted-foreground font-semibold">Sem dados no mês</td></tr>
            ) : classified.map(p => (
              <tr key={p.pos} className="border-t border-border hover:bg-[#fafcfb]">
                <td className="px-4 py-[13px] font-bold text-[13.5px]">{p.pos}º</td>
                <td className="px-4 py-[13px] font-bold text-[13.5px]">{p.nome}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{p.qty}</td>
                <td className="px-4 py-[13px] font-bold text-primary text-[13.5px]">{fmt(p.valor)}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{p.pct.toFixed(1)}%</td>
                <td className="px-4 py-[13px]">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-bold ${catColors[p.cat]}`}>{p.cat}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonthlyTab({ vendas, clientes, now }: { vendas: Sale[]; clientes: Cliente[]; now: Date }) {
  const months: { label: string; vendas: Sale[] }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
    const mv = vendas.filter(v => {
      const vd = new Date(v.data);
      return vd.getMonth() === d.getMonth() && vd.getFullYear() === d.getFullYear();
    });
    months.push({ label, vendas: mv });
  }

  const maxFat = Math.max(...months.map(m => m.vendas.reduce((a, v) => a + v.total, 0)), 1);

  return (
    <div>
      <div className="font-display text-lg text-primary mb-4">Faturamento dos Últimos 6 Meses</div>
      <div className="bg-card rounded-lg border border-border shadow-sm p-6 mb-6">
        <div className="flex items-end gap-4 h-[200px]">
          {months.map((m, i) => {
            const fat = m.vendas.reduce((a, v) => a + v.total, 0);
            const h = (fat / maxFat) * 100;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end">
                <span className="text-[11px] font-bold text-primary mb-1">{fmt(fat)}</span>
                <div className="w-full rounded-t-lg transition-all" style={{ height: `${Math.max(h, 2)}%`, background: 'linear-gradient(180deg, hsl(148,61%,26%), hsl(90,60%,41%))' }} />
                <span className="text-[10px] font-bold text-muted-foreground mt-2 capitalize">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Mês', 'Nº Vendas', 'Faturamento', 'Ticket Médio', 'Clientes Atendidos'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => {
              const fat = m.vendas.reduce((a, v) => a + v.total, 0);
              const ticket = m.vendas.length ? fat / m.vendas.length : 0;
              const cli = new Set(m.vendas.filter(v => v.clienteId).map(v => v.clienteId)).size + m.vendas.filter(v => !v.clienteId).length;
              return (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-[13px] font-bold text-[13.5px] capitalize">{m.label}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{m.vendas.length}</td>
                  <td className="px-4 py-[13px] font-bold text-primary text-[13.5px]">{fmt(fat)}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{fmt(ticket)}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{cli}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
