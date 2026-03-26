import { Product, Sale, Cliente, Lote, Conta, fmt } from '@/store/useStore';
import { DollarSign, Package, AlertTriangle, Users, Percent, TrendingUp, Calendar, CreditCard, ShieldAlert, ArrowUpRight, ArrowDownRight, BarChart3, Clock, Sparkles } from 'lucide-react';

interface Props {
  produtos: Product[];
  vendas: Sale[];
  clientes: Cliente[];
  lotes: Lote[];
  contasPagar: Conta[];
  onNavigate: (page: string) => void;
}

export default function Dashboard({ produtos, vendas, clientes, lotes, contasPagar, onNavigate }: Props) {
  const hoje = new Date().toDateString();
  const now = new Date();
  const vendasHoje = vendas.filter(v => new Date(v.data).toDateString() === hoje);
  const vendasMes = vendas.filter(v => {
    const d = new Date(v.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalHoje = vendasHoje.reduce((a, v) => a + v.total, 0);
  const totalMes = vendasMes.reduce((a, v) => a + v.total, 0);
  const baixo = produtos.filter(p => p.est <= p.min);
  const cats = [...new Set(produtos.map(p => p.cat))].length;

  const clientesHoje = new Set(vendasHoje.filter(v => v.clienteId).map(v => v.clienteId)).size + vendasHoje.filter(v => !v.clienteId).length;
  const descontosHoje = vendasHoje.reduce((a, v) => a + ((v.subtotal || v.total) - v.total), 0);

  // Yesterday comparison
  const ontem = new Date(now);
  ontem.setDate(ontem.getDate() - 1);
  const vendasOntem = vendas.filter(v => new Date(v.data).toDateString() === ontem.toDateString());
  const totalOntem = vendasOntem.reduce((a, v) => a + v.total, 0);
  const diffPercent = totalOntem > 0 ? ((totalHoje - totalOntem) / totalOntem * 100) : 0;

  // Sales by hour for mini chart
  const hourData = Array.from({ length: 24 }, (_, h) => {
    return vendasHoje.filter(v => new Date(v.data).getHours() === h).reduce((a, v) => a + v.total, 0);
  });
  const maxHour = Math.max(...hourData, 1);

  // Payment methods breakdown
  const pgtoBreakdown: Record<string, number> = {};
  vendasHoje.forEach(v => { pgtoBreakdown[v.pgto] = (pgtoBreakdown[v.pgto] || 0) + v.total; });
  const pgtoEntries = Object.entries(pgtoBreakdown).sort((a, b) => b[1] - a[1]);
  const pgtoTotal = Object.values(pgtoBreakdown).reduce((a, b) => a + b, 0) || 1;

  const stats = [
    {
      label: 'Faturamento Hoje',
      value: fmt(totalHoje),
      sub: `${vendasHoje.length} venda(s)`,
      icon: DollarSign,
      gradient: 'from-primary to-accent',
      trend: diffPercent,
      featured: true,
    },
    {
      label: 'Faturamento do Mês',
      value: fmt(totalMes),
      sub: `${vendasMes.length} vendas`,
      icon: BarChart3,
      gradient: 'from-[hsl(var(--blue))] to-[hsl(210,70%,55%)]',
    },
    {
      label: 'Produtos',
      value: String(produtos.length),
      sub: `${cats} categoria(s)`,
      icon: Package,
      gradient: 'from-[hsl(270,50%,45%)] to-[hsl(290,60%,55%)]',
    },
    {
      label: 'Estoque Crítico',
      value: String(baixo.length),
      sub: 'abaixo do mínimo',
      icon: AlertTriangle,
      gradient: 'from-[hsl(var(--destructive))] to-[hsl(20,80%,50%)]',
      alert: baixo.length > 0,
    },
    {
      label: 'Clientes Hoje',
      value: String(clientesHoje),
      sub: 'atendidos',
      icon: Users,
      gradient: 'from-primary to-[hsl(160,50%,40%)]',
    },
    {
      label: 'Descontos',
      value: fmt(descontosHoje),
      sub: 'concedidos hoje',
      icon: Percent,
      gradient: 'from-[hsl(var(--gold))] to-[hsl(35,80%,50%)]',
    },
  ];

  // Top 5 products
  const prodSales: Record<number, { nome: string; qty: number; valor: number }> = {};
  vendasMes.forEach(v => v.itens.forEach(i => {
    if (!prodSales[i.id]) prodSales[i.id] = { nome: i.nome.split('—')[0].trim(), qty: 0, valor: 0 };
    prodSales[i.id].qty += i.qty;
    prodSales[i.id].valor += i.preco * i.qty;
  }));
  const top5 = Object.values(prodSales).sort((a, b) => b.valor - a.valor).slice(0, 5);
  const maxTop = top5[0]?.valor || 1;

  // Alerts
  const lotesVencendo = lotes.filter(l => { const d = Math.ceil((new Date(l.validade).getTime() - Date.now()) / 86400000); return d >= 0 && d <= 30; });
  const produtosSemEstoque = produtos.filter(p => p.est <= 0);
  const contasVencidas = contasPagar.filter(c => c.status === 'pendente' && new Date(c.vencimento) < now);
  const aniversariantes = clientes.filter(c => {
    if (!c.nascimento) return false;
    const d = new Date(c.nascimento);
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  });

  const alerts = [
    ...(lotesVencendo.length > 0 ? [{ icon: Calendar, msg: `${lotesVencendo.length} lote(s) vencendo em 30 dias`, page: 'lotes', color: 'hsl(25,90%,50%)' }] : []),
    ...(produtosSemEstoque.length > 0 ? [{ icon: Package, msg: `${produtosSemEstoque.length} produto(s) sem estoque`, page: 'produtos', color: 'hsl(var(--destructive))' }] : []),
    ...(contasVencidas.length > 0 ? [{ icon: CreditCard, msg: `${contasVencidas.length} conta(s) a pagar vencida(s)`, page: 'financeiro', color: 'hsl(var(--destructive))' }] : []),
    ...(aniversariantes.length > 0 ? [{ icon: Users, msg: `${aniversariantes.length} aniversariante(s) hoje! 🎂`, page: 'clientes', color: 'hsl(var(--primary))' }] : []),
  ];

  const lastSales = [...vendas].reverse().slice(0, 8);
  const greeting = now.getHours() < 12 ? 'Bom dia' : now.getHours() < 18 ? 'Boa tarde' : 'Boa noite';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
            {greeting} <Sparkles className="w-5 h-5 text-[hsl(var(--gold))]" />
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground">{now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* Critical Alert Banner */}
      {baixo.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl p-4 border border-[hsl(var(--gold))/0.3]"
          style={{ background: 'linear-gradient(135deg, hsl(48,88%,95%), hsl(40,80%,92%))' }}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10" style={{ background: 'hsl(var(--gold))' , transform: 'translate(30%, -50%)' }} />
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'hsl(var(--gold) / 0.15)' }}>
              <AlertTriangle className="w-5 h-5" style={{ color: 'hsl(var(--gold))' }} />
            </div>
            <div>
              <p className="text-[13.5px] font-extrabold" style={{ color: 'hsl(38,60%,25%)' }}>⚠️ {baixo.length} produto(s) com estoque crítico</p>
              <p className="text-xs" style={{ color: 'hsl(38,40%,40%)' }}>Verifique e reponha o estoque para evitar rupturas</p>
            </div>
            <button onClick={() => onNavigate('produtos')} className="ml-auto text-xs font-bold px-3 py-1.5 rounded-lg transition-colors" style={{ background: 'hsl(var(--gold) / 0.15)', color: 'hsl(var(--gold))' }}>
              Ver produtos →
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s, idx) => (
          <div
            key={s.label}
            className={`group relative overflow-hidden rounded-2xl p-5 border border-border bg-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ${s.featured ? 'col-span-2 lg:col-span-1' : ''} ${s.alert ? 'border-destructive/30' : ''}`}
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            {/* Gradient orb */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-[0.08] group-hover:opacity-[0.15] transition-opacity duration-300`} />

            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} mb-3 shadow-sm`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.label}</div>
            <div className="font-display text-2xl font-bold text-foreground leading-none flex items-center gap-2">
              {s.value}
              {s.trend !== undefined && s.trend !== 0 && (
                <span className={`inline-flex items-center text-[11px] font-bold rounded-full px-1.5 py-0.5 ${s.trend > 0 ? 'text-primary bg-primary/10' : 'text-destructive bg-destructive/10'}`}>
                  {s.trend > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(s.trend).toFixed(0)}%
                </span>
              )}
            </div>
            <div className="text-[10.5px] text-muted-foreground mt-1 font-semibold">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Middle Row: Chart + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Mini Hour Chart */}
        <div className="lg:col-span-3 bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display text-base text-foreground">Vendas por Hora</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Distribuição de vendas do dia</p>
            </div>
            <div className="text-xs font-bold text-muted-foreground bg-secondary rounded-lg px-2.5 py-1">Hoje</div>
          </div>
          <div className="flex items-end gap-[3px] h-28">
            {hourData.slice(6, 22).map((val, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-accent transition-all duration-500 hover:opacity-80 min-h-[2px]"
                  style={{ height: `${Math.max((val / maxHour) * 100, 2)}%` }}
                  title={`${i + 6}h: ${fmt(val)}`}
                />
                {i % 2 === 0 && <span className="text-[9px] text-muted-foreground font-bold">{i + 6}h</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="lg:col-span-2 bg-card rounded-2xl border border-border p-5">
          <h3 className="font-display text-base text-foreground mb-1">Formas de Pagamento</h3>
          <p className="text-[11px] text-muted-foreground mb-4">Hoje</p>

          {pgtoEntries.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">Nenhuma venda hoje</div>
          ) : (
            <div className="space-y-3">
              {pgtoEntries.map(([method, val]) => {
                const pct = (val / pgtoTotal) * 100;
                return (
                  <div key={method}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[12px] font-bold text-foreground">{method}</span>
                      <span className="text-[11px] text-muted-foreground font-bold">{fmt(val)} · {pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Top 5 + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top 5 Products */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary to-accent">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display text-base text-foreground leading-tight">Top 5 do Mês</h3>
              <p className="text-[10px] text-muted-foreground">Produtos mais vendidos</p>
            </div>
          </div>

          {top5.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">Sem dados no mês</div>
          ) : (
            <div className="space-y-3">
              {top5.map((p, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0 ${
                    i === 0 ? 'bg-gradient-to-br from-[hsl(var(--gold))] to-[hsl(35,80%,50%)] text-white' :
                    i === 1 ? 'bg-gradient-to-br from-[hsl(210,10%,60%)] to-[hsl(210,10%,45%)] text-white' :
                    i === 2 ? 'bg-gradient-to-br from-[hsl(25,60%,50%)] to-[hsl(20,50%,40%)] text-white' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {i + 1}º
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[12.5px] text-foreground truncate pr-2">{p.nome}</span>
                      <span className="text-[11px] text-muted-foreground font-bold shrink-0">{p.qty} un · {fmt(p.valor)}</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                        style={{ width: `${(p.valor / maxTop) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-destructive to-[hsl(20,80%,50%)]">
              <ShieldAlert className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display text-base text-foreground leading-tight">Alertas</h3>
              <p className="text-[10px] text-muted-foreground">Atenção necessária</p>
            </div>
          </div>

          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-sm text-muted-foreground gap-1">
              <span className="text-2xl">✅</span>
              <span>Tudo em ordem</span>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-xl bg-background border border-border hover:border-primary/20 transition-colors cursor-pointer group"
                  onClick={() => onNavigate(a.page)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${a.color}15` }}>
                      <a.icon className="w-4 h-4" style={{ color: a.color }} />
                    </div>
                    <span className="text-[12.5px] font-semibold text-foreground">{a.msg}</span>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales Table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="flex justify-between items-center p-5 pb-0">
          <div>
            <h3 className="font-display text-base text-foreground">Últimas Vendas</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">As 8 vendas mais recentes</p>
          </div>
          <button onClick={() => onNavigate('vendas')} className="text-xs font-bold text-primary hover:text-accent transition-colors flex items-center gap-1">
            Ver todas <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="px-5 pb-5 pt-3">
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50">
                  {['Nº', 'Data / Hora', 'Itens', 'Pagamento', 'Total'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[10.5px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lastSales.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-muted-foreground font-semibold text-sm">Nenhuma venda registrada</td></tr>
                ) : lastSales.map((v, i) => (
                  <tr key={v.id} className="hover:bg-primary/[0.02] border-t border-border transition-colors">
                    <td className="px-4 py-3.5 text-[13px] font-bold text-foreground">#{v.id.toString().slice(-5)}</td>
                    <td className="px-4 py-3.5 text-[13px] text-muted-foreground">{new Date(v.data).toLocaleString('pt-BR')}</td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-secondary text-muted-foreground">
                        {v.itens.length} item(s)
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-primary/10 text-primary">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />{v.pgto}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] font-extrabold text-primary">{fmt(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
