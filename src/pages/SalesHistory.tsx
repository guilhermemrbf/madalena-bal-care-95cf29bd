import { useState } from 'react';
import { Search, ShoppingBag, Calendar, CreditCard, TrendingUp, ArrowUpRight, Receipt } from 'lucide-react';
import { Sale, fmt } from '@/store/useStore';

interface Props { vendas: Sale[]; }

export default function SalesHistory({ vendas }: Props) {
  const [search, setSearch] = useState('');
  const [filterPgto, setFilterPgto] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');

  const now = new Date();

  const periodFiltered = vendas.filter(v => {
    if (filterPeriod === 'today') return new Date(v.data).toDateString() === now.toDateString();
    if (filterPeriod === 'week') {
      const d = new Date(v.data);
      const diff = (now.getTime() - d.getTime()) / 86400000;
      return diff <= 7;
    }
    if (filterPeriod === 'month') {
      const d = new Date(v.data);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  });

  const list = [...periodFiltered].reverse().filter(v =>
    (v.pgto.toLowerCase().includes(search.toLowerCase()) || v.id.toString().includes(search)) &&
    (!filterPgto || v.pgto === filterPgto)
  );

  const totalFiltered = list.reduce((a, v) => a + v.total, 0);
  const pgtoMethods = [...new Set(vendas.map(v => v.pgto))];

  const summaryStats = [
    { label: 'Total de Vendas', value: String(list.length), icon: ShoppingBag, gradient: 'from-primary to-accent' },
    { label: 'Receita Total', value: fmt(totalFiltered), icon: TrendingUp, gradient: 'from-[hsl(var(--blue))] to-[hsl(210,70%,55%)]' },
    { label: 'Ticket Médio', value: fmt(list.length > 0 ? totalFiltered / list.length : 0), icon: Receipt, gradient: 'from-[hsl(270,50%,45%)] to-[hsl(290,60%,55%)]' },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 animate-stagger">
        {summaryStats.map((s) => (
          <div key={s.label} className="card-premium p-5 group">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300`} />
            <div className="flex items-center gap-3 relative">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shadow-md group-hover:shadow-lg group-hover:scale-105 transition-all duration-300`}>
                <s.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-muted-foreground">{s.label}</div>
                <div className="font-display text-xl font-bold text-foreground leading-none mt-1">{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Bar */}
      <div className="flex justify-between items-center gap-3 animate-fade-in">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'Tudo' },
            { key: 'today', label: 'Hoje' },
            { key: 'week', label: '7 dias' },
            { key: 'month', label: 'Este mês' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setFilterPeriod(p.key)}
              className={`px-3.5 py-2 rounded-xl text-[11.5px] font-bold transition-all border ${
                filterPeriod === p.key
                  ? 'bg-primary text-primary-foreground border-primary shadow-md'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2.5 items-center">
          <select
            value={filterPgto}
            onChange={e => setFilterPgto(e.target.value)}
            className="py-2.5 px-3 border border-border rounded-xl font-body text-[12.5px] bg-card outline-none focus:border-primary transition-all"
          >
            <option value="">Todos pagamentos</option>
            {pgtoMethods.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-border rounded-xl font-body text-[12.5px] bg-card w-[220px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all placeholder:text-muted-foreground/40"
              placeholder="Buscar venda..."
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              {['Nº', 'Data / Hora', 'Produtos', 'Pagamento', 'Total'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[1.2px] text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20 text-muted-foreground">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-3 opacity-15" />
                  <p className="font-bold text-sm">Nenhuma venda encontrada</p>
                  <p className="text-[11px] mt-1 opacity-60">Ajuste os filtros ou faça uma nova venda</p>
                </td>
              </tr>
            ) : list.map(v => (
              <tr key={v.id} className="table-row-hover group/row">
                <td className="px-5 py-4 text-[13px] font-bold text-foreground">
                  <span className="font-mono bg-secondary px-2 py-0.5 rounded-lg text-[12px]">#{v.id.toString().slice(-5)}</span>
                </td>
                <td className="px-5 py-4 text-[13px] text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 opacity-40" />
                    {new Date(v.data).toLocaleString('pt-BR')}
                  </div>
                </td>
                <td className="px-5 py-4 text-[11.5px] text-muted-foreground max-w-[280px]">
                  <div className="truncate">{v.itens.map(i => `${i.nome.split('—')[0].trim()} ×${i.qty}`).join(', ')}</div>
                  <div className="text-[10px] text-muted-foreground/50 font-bold mt-0.5">{v.itens.length} item(s)</div>
                </td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/8 text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />{v.pgto}
                  </span>
                </td>
                <td className="px-5 py-4 text-[14px] font-extrabold text-primary">{fmt(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length > 0 && (
          <div className="px-5 py-3.5 border-t border-border bg-secondary/30 flex justify-between items-center">
            <span className="text-[11px] font-bold text-muted-foreground">{list.length} venda(s) encontrada(s)</span>
            <span className="text-[13px] font-extrabold text-primary">Total: {fmt(totalFiltered)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
