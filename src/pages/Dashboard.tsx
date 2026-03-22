import { Product, Sale, Cliente, Lote, Conta, fmt } from '@/store/useStore';
import { DollarSign, Lock, Package, AlertTriangle, Users, Percent, TrendingUp, Calendar, CreditCard, ShieldAlert } from 'lucide-react';

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

  const stats = [
    { label: 'Faturamento Hoje', value: fmt(totalHoje), sub: `${vendasHoje.length} venda(s) realizadas`, icon: DollarSign, iconBg: 'bg-[hsl(148,40%,93%)] text-primary' },
    { label: 'Faturamento do Mês', value: fmt(totalMes), sub: `${vendasMes.length} vendas no mês`, icon: Lock, iconBg: 'bg-accent-light text-accent' },
    { label: 'Produtos Cadastrados', value: String(produtos.length), sub: `${cats} categoria(s)`, icon: Package, iconBg: 'bg-info-light text-info' },
    { label: 'Estoque Crítico', value: String(baixo.length), sub: 'abaixo do mínimo', icon: AlertTriangle, iconBg: 'bg-destructive-light text-destructive' },
    { label: 'Clientes Hoje', value: String(clientesHoje), sub: 'atendidos', icon: Users, iconBg: 'bg-[hsl(148,40%,93%)] text-primary' },
    { label: 'Descontos Hoje', value: fmt(descontosHoje), sub: 'concedidos', icon: Percent, iconBg: 'bg-[#fff8e6] text-[#8a6400]' },
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
    ...(lotesVencendo.length > 0 ? [{ icon: Calendar, msg: `${lotesVencendo.length} lote(s) vencendo em 30 dias`, page: 'lotes', cls: 'text-[#e65100]' }] : []),
    ...(produtosSemEstoque.length > 0 ? [{ icon: Package, msg: `${produtosSemEstoque.length} produto(s) sem estoque`, page: 'produtos', cls: 'text-destructive' }] : []),
    ...(contasVencidas.length > 0 ? [{ icon: CreditCard, msg: `${contasVencidas.length} conta(s) a pagar vencida(s)`, page: 'financeiro', cls: 'text-destructive' }] : []),
    ...(aniversariantes.length > 0 ? [{ icon: Users, msg: `${aniversariantes.length} aniversariante(s) hoje!`, page: 'clientes', cls: 'text-primary' }] : []),
  ];

  const lastSales = [...vendas].reverse().slice(0, 8);

  return (
    <div>
      {baixo.length > 0 && (
        <div className="bg-gradient-to-r from-[#fff8e6] to-[#fff3d6] border border-[#f0c040] rounded-xl px-[18px] py-3.5 flex items-center gap-3 mb-5">
          <AlertTriangle className="w-[22px] h-[22px] text-[#8a6400] shrink-0" />
          <div>
            <p className="text-[13.5px] font-bold text-[#5a4000]">⚠️ {baixo.length} produto(s) com estoque crítico!</p>
            <span className="text-xs text-[#8a6400]">Acesse Produtos/Estoque para verificar</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 xl:grid-cols-6 gap-[18px] mb-7">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-[18px] border border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.iconBg}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div className="font-display text-[22px] font-bold leading-none">{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-1 font-semibold">{s.label}</div>
            <div className="text-[10px] mt-1 font-bold text-accent">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Top 5 Products */}
      {top5.length > 0 && (
        <div className="mb-7">
          <div className="font-display text-lg text-primary mb-3 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" /> TOP 5 Produtos Mais Vendidos do Mês
          </div>
          <div className="bg-card rounded-lg border border-border shadow-sm p-5 space-y-3">
            {top5.map((p, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-extrabold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[13px]">{p.nome}</span>
                    <span className="text-[12px] text-muted-foreground">{p.qty} un. · {fmt(p.valor)}</span>
                  </div>
                  <div className="h-2 bg-border rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.valor / maxTop) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="mb-7">
          <div className="font-display text-lg text-primary mb-3 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> Alertas do Sistema
          </div>
          <div className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className="bg-card rounded-lg border border-border px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <a.icon className={`w-5 h-5 ${a.cls}`} />
                  <span className="text-[13px] font-semibold">{a.msg}</span>
                </div>
                <button onClick={() => onNavigate(a.page)} className="text-xs font-bold text-primary hover:underline">Ver →</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-display text-lg text-primary">Últimas Vendas</div>
          <div className="text-xs text-muted-foreground mt-0.5">As 8 vendas mais recentes</div>
        </div>
        <button onClick={() => onNavigate('vendas')} className="bg-background text-text-2 border border-border rounded-lg px-3.5 py-[7px] text-xs font-bold hover:bg-border transition-colors">Ver todas →</button>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Nº', 'Data / Hora', 'Itens', 'Pagamento', 'Total'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lastSales.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-muted-foreground font-semibold">Nenhuma venda registrada ainda</td></tr>
            ) : lastSales.map(v => (
              <tr key={v.id} className="hover:bg-[#fafcfb] border-t border-border">
                <td className="px-4 py-[13px] text-[13.5px] font-bold">#{v.id.toString().slice(-5)}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{new Date(v.data).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{v.itens.length} item(s)</td>
                <td className="px-4 py-[13px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />{v.pgto}
                  </span>
                </td>
                <td className="px-4 py-[13px] text-[13.5px] font-bold text-primary">{fmt(v.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
