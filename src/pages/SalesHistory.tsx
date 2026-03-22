import { useState } from 'react';
import { Search } from 'lucide-react';
import { Sale, fmt } from '@/store/useStore';

interface Props { vendas: Sale[]; }

export default function SalesHistory({ vendas }: Props) {
  const [search, setSearch] = useState('');
  const list = [...vendas].reverse().filter(v =>
    v.pgto.toLowerCase().includes(search.toLowerCase()) || v.id.toString().includes(search)
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-display text-lg text-primary">Histórico de Vendas</div>
          <div className="text-xs text-muted-foreground mt-0.5">Todas as transações registradas</div>
        </div>
        <div className="relative">
          <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 pr-3.5 py-[9px] border-[1.5px] border-border rounded-[10px] font-body text-[13.5px] bg-background w-[250px] outline-none focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
            placeholder="Buscar venda..."
          />
        </div>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Nº', 'Data / Hora', 'Produtos', 'Pagamento', 'Total'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-muted-foreground font-semibold">Nenhuma venda registrada</td></tr>
            ) : list.map(v => (
              <tr key={v.id} className="hover:bg-[#fafcfb] border-t border-border">
                <td className="px-4 py-[13px] text-[13.5px] font-bold">#{v.id.toString().slice(-5)}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{new Date(v.data).toLocaleString('pt-BR')}</td>
                <td className="px-4 py-[13px] text-[11.5px] text-muted-foreground max-w-[240px] truncate">
                  {v.itens.map(i => `${i.nome.split('—')[0].trim()} ×${i.qty}`).join(', ')}
                </td>
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
