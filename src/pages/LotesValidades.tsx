import { useState } from 'react';
import { Lote, fmt } from '@/store/useStore';
import { AlertTriangle, Calendar, CheckCircle } from 'lucide-react';

interface Props { lotes: Lote[]; }

function diasRestantes(validade: string) {
  return Math.ceil((new Date(validade).getTime() - Date.now()) / 86400000);
}

function statusLote(dias: number) {
  if (dias < 0) return { label: '✗ Vencido', cls: 'bg-destructive-light text-destructive' };
  if (dias <= 30) return { label: '⚠️ A Vencer', cls: 'bg-[#fff3e0] text-[#e65100]' };
  if (dias <= 90) return { label: 'Atenção', cls: 'bg-[#fff8e6] text-[#8a6400]' };
  return { label: '✓ Ok', cls: 'bg-[hsl(148,40%,93%)] text-primary' };
}

export default function LotesValidades({ lotes }: Props) {
  const [tab, setTab] = useState<'todos' | 'avencer' | 'vencidos'>('todos');

  const enriched = lotes.map(l => ({ ...l, dias: diasRestantes(l.validade) }));
  const aVencer = enriched.filter(l => l.dias >= 0 && l.dias <= 30);
  const vencidos = enriched.filter(l => l.dias < 0);

  const filtered = tab === 'avencer' ? aVencer : tab === 'vencidos' ? vencidos : enriched;

  const tabs = [
    { key: 'todos' as const, label: 'Todos os Lotes', count: enriched.length },
    { key: 'avencer' as const, label: 'A Vencer (30 dias)', count: aVencer.length },
    { key: 'vencidos' as const, label: 'Vencidos', count: vencidos.length },
  ];

  return (
    <div>
      {(aVencer.length > 0 || vencidos.length > 0) && (
        <div className="bg-gradient-to-r from-[#fff8e6] to-[#fff3d6] border border-[#f0c040] rounded-xl px-[18px] py-3.5 flex items-center gap-3 mb-5">
          <AlertTriangle className="w-[22px] h-[22px] text-[#8a6400] shrink-0" />
          <p className="text-[13.5px] font-bold text-[#5a4000]">
            {aVencer.length} lote(s) vencendo em 30 dias · {vencidos.length} lote(s) vencido(s)
          </p>
        </div>
      )}

      <div className="flex gap-1 mb-5 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Produto', 'Fornecedor', 'Nº do Lote', 'Quantidade', 'Data de Validade', 'Dias Restantes', 'Status'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground font-semibold">Nenhum lote encontrado</td></tr>
            ) : filtered.map(l => {
              const st = statusLote(l.dias);
              return (
                <tr key={l.id} className="hover:bg-[#fafcfb] border-t border-border">
                  <td className="px-4 py-[13px] font-bold text-[13.5px]">{l.produtoNome}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{l.fornecedor}</td>
                  <td className="px-4 py-[13px]"><span className="font-mono bg-background px-2 py-0.5 rounded-md text-xs text-text-2">{l.lote}</span></td>
                  <td className="px-4 py-[13px] text-[13.5px]">{l.quantidade}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{new Date(l.validade).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-[13px] text-[13.5px] font-bold">{l.dias < 0 ? `${Math.abs(l.dias)} dias atrás` : `${l.dias} dias`}</td>
                  <td className="px-4 py-[13px]"><span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-bold ${st.cls}`}>{st.label}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
