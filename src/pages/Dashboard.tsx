import { Product, Sale, fmt } from '@/store/useStore';
import { DollarSign, Lock, Package, AlertTriangle } from 'lucide-react';

interface Props {
  produtos: Product[];
  vendas: Sale[];
  onNavigate: (page: string) => void;
}

export default function Dashboard({ produtos, vendas, onNavigate }: Props) {
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

  const stats = [
    { label: 'Faturamento Hoje', value: fmt(totalHoje), sub: `${vendasHoje.length} venda(s) realizadas`, icon: DollarSign, color: 'primary', iconBg: 'bg-[hsl(148,40%,93%)] text-primary' },
    { label: 'Faturamento do Mês', value: fmt(totalMes), sub: `${vendasMes.length} vendas no mês`, icon: Lock, color: 'accent', iconBg: 'bg-accent-light text-accent' },
    { label: 'Produtos Cadastrados', value: String(produtos.length), sub: `${cats} categoria(s)`, icon: Package, color: 'info', iconBg: 'bg-info-light text-info' },
    { label: 'Estoque Crítico', value: String(baixo.length), sub: 'produtos abaixo do mínimo', icon: AlertTriangle, color: 'destructive', iconBg: 'bg-destructive-light text-destructive' },
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

      <div className="grid grid-cols-4 gap-[18px] mb-7">
        {stats.map((s) => (
          <div key={s.label} className="bg-card rounded-lg p-[22px] border border-border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all relative overflow-hidden">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${s.iconBg}`}>
              <s.icon className="w-[22px] h-[22px]" />
            </div>
            <div className="font-display text-[30px] font-bold leading-none">{s.value}</div>
            <div className="text-[12.5px] text-muted-foreground mt-1.5 font-semibold">{s.label}</div>
            <div className={`text-[11px] mt-2 font-bold ${s.color === 'destructive' ? 'text-destructive' : 'text-accent'}`}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-display text-lg text-primary">Últimas Vendas</div>
          <div className="text-xs text-muted-foreground mt-0.5">As 8 vendas mais recentes</div>
        </div>
        <button onClick={() => onNavigate('vendas')} className="bg-background text-text-2 border border-border rounded-lg px-3.5 py-[7px] text-xs font-bold hover:bg-border transition-colors">
          Ver todas →
        </button>
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
