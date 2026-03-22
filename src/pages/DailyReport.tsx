import { Product, Sale, fmt } from '@/store/useStore';

interface Props { produtos: Product[]; vendas: Sale[]; }

export default function DailyReport({ produtos, vendas }: Props) {
  const hoje = new Date().toDateString();
  const now = new Date();
  const vendasHoje = vendas.filter(v => new Date(v.data).toDateString() === hoje);
  const totalHoje = vendasHoje.reduce((a, v) => a + v.total, 0);
  const ticket = vendasHoje.length ? totalHoje / vendasHoje.length : 0;

  const pgtoMap: Record<string, number> = {};
  vendasHoje.forEach(v => { pgtoMap[v.pgto] = (pgtoMap[v.pgto] || 0) + v.total; });

  const baixo = produtos.filter(p => p.est <= p.min);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-display text-lg text-primary">Relatório do Dia</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-background text-text-2 border border-border rounded-lg px-3.5 py-[7px] text-xs font-bold hover:bg-border transition-colors">
          🖨️ Imprimir
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Faturamento do Dia', value: fmt(totalHoje) },
          { label: 'Vendas Realizadas', value: String(vendasHoje.length) },
          { label: 'Ticket Médio', value: fmt(ticket) },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-lg p-[22px] border border-border shadow-sm">
            <div className="font-display text-[30px] font-bold leading-none">{s.value}</div>
            <div className="text-[12.5px] text-muted-foreground mt-1.5 font-semibold">{s.label}</div>
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
                <td className="px-4 py-[13px]">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">{k}</span>
                </td>
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
                <tr>
                  {['Código', 'Produto', 'Estoque', 'Mínimo'].map(h => (
                    <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
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
