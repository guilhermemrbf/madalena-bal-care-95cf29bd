import { useState } from 'react';
import { Plus, Check, DollarSign, AlertTriangle } from 'lucide-react';
import { Lancamento, Conta, Fornecedor, fmt, categoriasSaida } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';

interface Props {
  financeiro: Lancamento[];
  contasPagar: Conta[];
  contasReceber: Conta[];
  fornecedores: Fornecedor[];
  onAddLancamento: (l: Omit<Lancamento, 'id'>) => void;
  onAddContaPagar: (c: Omit<Conta, 'id'>) => void;
  onUpdateContaPagar: (id: number, data: Partial<Conta>) => void;
  onDeleteContaPagar: (id: number) => void;
  onAddContaReceber: (c: Omit<Conta, 'id'>) => void;
  onUpdateContaReceber: (id: number, data: Partial<Conta>) => void;
  onDeleteContaReceber: (id: number) => void;
}

export default function FinanceiroPage(props: Props) {
  const { financeiro, contasPagar, contasReceber, onAddLancamento, onAddContaPagar, onUpdateContaPagar, onDeleteContaPagar, onAddContaReceber, onUpdateContaReceber, onDeleteContaReceber } = props;
  const [tab, setTab] = useState<'fluxo' | 'pagar' | 'receber'>('fluxo');
  const [despesaOpen, setDespesaOpen] = useState(false);
  const [contaOpen, setContaOpen] = useState(false);
  const [contaType, setContaType] = useState<'pagar' | 'receber'>('pagar');
  const [form, setForm] = useState({ descricao: '', categoria: 'Compra de Estoque', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  const [contaForm, setContaForm] = useState({ fornecedor: '', cliente: '', descricao: '', vencimento: '', valor: '', observacoes: '' });
  const { showToast } = useToastCustom();

  const now = new Date();
  const mesAtual = (l: Lancamento) => {
    const d = new Date(l.data);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };
  const entradasMes = financeiro.filter(l => l.tipo === 'entrada' && mesAtual(l)).reduce((a, l) => a + l.valor, 0);
  const saidasMes = financeiro.filter(l => l.tipo === 'saida' && mesAtual(l)).reduce((a, l) => a + l.valor, 0);
  const saldoMes = entradasMes - saidasMes;
  const saldoTotal = financeiro.reduce((a, l) => a + (l.tipo === 'entrada' ? l.valor : -l.valor), 0);

  const contasVencidas = contasPagar.filter(c => c.status === 'pendente' && new Date(c.vencimento) < now);

  const saveDespesa = () => {
    const desc = form.descricao.trim();
    const valor = parseFloat(form.valor);
    if (!desc || isNaN(valor)) { showToast('Preencha todos os campos!', 'error'); return; }
    onAddLancamento({ data: form.data, descricao: desc, tipo: 'saida', categoria: form.categoria, valor, observacoes: form.observacoes });
    showToast('Despesa lançada!', 'success');
    setDespesaOpen(false);
    setForm({ descricao: '', categoria: 'Compra de Estoque', valor: '', data: new Date().toISOString().split('T')[0], observacoes: '' });
  };

  const saveConta = () => {
    const desc = contaForm.descricao.trim();
    const valor = parseFloat(contaForm.valor);
    if (!desc || isNaN(valor) || !contaForm.vencimento) { showToast('Preencha todos os campos!', 'error'); return; }
    const conta: Omit<Conta, 'id'> = { ...contaForm, valor, status: 'pendente' };
    if (contaType === 'pagar') onAddContaPagar(conta);
    else onAddContaReceber(conta);
    showToast('Conta registrada!', 'success');
    setContaOpen(false);
  };

  const tabs = [
    { key: 'fluxo' as const, label: 'Fluxo de Caixa' },
    { key: 'pagar' as const, label: 'Contas a Pagar' },
    { key: 'receber' as const, label: 'Contas a Receber' },
  ];

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-muted rounded-lg p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-[13px] font-bold transition-all ${tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'fluxo' && (
        <div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Entradas do Mês', value: fmt(entradasMes), cls: 'text-primary' },
              { label: 'Saídas do Mês', value: fmt(saidasMes), cls: 'text-destructive' },
              { label: 'Saldo do Mês', value: fmt(saldoMes), cls: saldoMes >= 0 ? 'text-primary' : 'text-destructive' },
              { label: 'Saldo Acumulado', value: fmt(saldoTotal), cls: saldoTotal >= 0 ? 'text-primary' : 'text-destructive' },
            ].map(s => (
              <div key={s.label} className="bg-card rounded-lg p-[22px] border border-border shadow-sm">
                <div className={`font-display text-[26px] font-bold leading-none ${s.cls}`}>{s.value}</div>
                <div className="text-[12.5px] text-muted-foreground mt-1.5 font-semibold">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center mb-4">
            <div className="font-display text-lg text-primary">Lançamentos</div>
            <button onClick={() => setDespesaOpen(true)} className="flex items-center gap-[7px] px-[18px] py-2.5 rounded-[10px] bg-destructive text-white text-[13.5px] font-bold hover:opacity-90 transition-all">
              <Plus className="w-4 h-4" /> Lançar Despesa
            </button>
          </div>
          <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-[#f8fbf9]">
                <tr>
                  {['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor'].map(h => (
                    <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {financeiro.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-16 text-muted-foreground font-semibold">Nenhum lançamento registrado</td></tr>
                ) : [...financeiro].reverse().map(l => (
                  <tr key={l.id} className="hover:bg-[#fafcfb] border-t border-border">
                    <td className="px-4 py-[13px] text-[13.5px]">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-[13px] text-[13.5px]">{l.descricao}</td>
                    <td className="px-4 py-[13px]">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-bold ${l.tipo === 'entrada' ? 'bg-[hsl(148,40%,93%)] text-primary' : 'bg-destructive-light text-destructive'}`}>
                        {l.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </td>
                    <td className="px-4 py-[13px] text-[13.5px]">{l.categoria}</td>
                    <td className={`px-4 py-[13px] font-bold text-[13.5px] ${l.tipo === 'entrada' ? 'text-primary' : 'text-destructive'}`}>
                      {l.tipo === 'entrada' ? '+' : '-'} {fmt(l.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'pagar' || tab === 'receber') && (
        <ContasTab
          contas={tab === 'pagar' ? contasPagar : contasReceber}
          tipo={tab}
          contasVencidas={tab === 'pagar' ? contasVencidas : []}
          onAdd={() => { setContaType(tab === 'pagar' ? 'pagar' : 'receber'); setContaForm({ fornecedor: '', cliente: '', descricao: '', vencimento: '', valor: '', observacoes: '' }); setContaOpen(true); }}
          onPay={(id) => { (tab === 'pagar' ? onUpdateContaPagar : onUpdateContaReceber)(id, { status: 'pago' }); showToast('Marcado como pago!', 'success'); }}
          onDelete={(id) => { if (confirm('Excluir?')) (tab === 'pagar' ? onDeleteContaPagar : onDeleteContaReceber)(id); }}
        />
      )}

      {/* Despesa Modal */}
      <Modal open={despesaOpen} onClose={() => setDespesaOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-destructive-light rounded-xl flex items-center justify-center text-destructive"><DollarSign className="w-[22px] h-[22px]" /></div>
          <div>
            <h3 className="font-display text-xl text-primary">Lançar Despesa</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Registrar saída de caixa</p>
          </div>
        </div>
        <FField label="Descrição" value={form.descricao} onChange={v => setForm({ ...form, descricao: v })} placeholder="Descrição" />
        <div className="grid grid-cols-2 gap-3.5">
          <div className="mb-4">
            <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Categoria</label>
            <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="w-full py-[11px] px-[13px] border-[1.5px] border-border rounded-[10px] font-body text-sm outline-none bg-background focus:border-primary transition-all">
              {categoriasSaida.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <FField label="Valor (Kz)" value={form.valor} onChange={v => setForm({ ...form, valor: v })} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <FField label="Data" value={form.data} onChange={v => setForm({ ...form, data: v })} type="date" />
          <FField label="Observações" value={form.observacoes} onChange={v => setForm({ ...form, observacoes: v })} placeholder="Obs" />
        </div>
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setDespesaOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={saveDespesa} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Check className="w-4 h-4" /> Lançar
          </button>
        </div>
      </Modal>

      {/* Conta Modal */}
      <Modal open={contaOpen} onClose={() => setContaOpen(false)}>
        <h3 className="font-display text-xl text-primary mb-5">Registrar Conta a {contaType === 'pagar' ? 'Pagar' : 'Receber'}</h3>
        <FField label={contaType === 'pagar' ? 'Fornecedor' : 'Cliente'} value={contaType === 'pagar' ? contaForm.fornecedor : contaForm.cliente}
          onChange={v => setContaForm({ ...contaForm, [contaType === 'pagar' ? 'fornecedor' : 'cliente']: v })} placeholder="Nome" />
        <FField label="Descrição" value={contaForm.descricao} onChange={v => setContaForm({ ...contaForm, descricao: v })} placeholder="Descrição" />
        <div className="grid grid-cols-2 gap-3.5">
          <FField label="Vencimento" value={contaForm.vencimento} onChange={v => setContaForm({ ...contaForm, vencimento: v })} type="date" />
          <FField label="Valor (R$)" value={contaForm.valor} onChange={v => setContaForm({ ...contaForm, valor: v })} type="number" />
        </div>
        <FField label="Observações" value={contaForm.observacoes} onChange={v => setContaForm({ ...contaForm, observacoes: v })} placeholder="Obs" />
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setContaOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={saveConta} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Check className="w-4 h-4" /> Registrar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function ContasTab({ contas, tipo, contasVencidas, onAdd, onPay, onDelete }: {
  contas: Conta[]; tipo: string; contasVencidas: Conta[];
  onAdd: () => void; onPay: (id: number) => void; onDelete: (id: number) => void;
}) {
  const now = new Date();
  const getStatus = (c: Conta) => {
    if (c.status === 'pago') return { label: 'Pago', cls: 'bg-[hsl(148,40%,93%)] text-primary' };
    if (new Date(c.vencimento) < now) return { label: 'Vencido', cls: 'bg-destructive-light text-destructive' };
    return { label: 'Pendente', cls: 'bg-[#fff8e6] text-[#8a6400]' };
  };

  return (
    <div>
      {contasVencidas.length > 0 && (
        <div className="bg-gradient-to-r from-[#fde8e8] to-[#fdd] border border-destructive/30 rounded-xl px-[18px] py-3.5 flex items-center gap-3 mb-5">
          <AlertTriangle className="w-[22px] h-[22px] text-destructive shrink-0" />
          <p className="text-[13.5px] font-bold text-destructive">{contasVencidas.length} conta(s) vencida(s)!</p>
        </div>
      )}
      <div className="flex justify-end mb-4">
        <button onClick={onAdd} className="flex items-center gap-[7px] px-[18px] py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13.5px] font-bold hover:bg-primary-dark transition-all">
          <Plus className="w-4 h-4" /> Registrar Conta
        </button>
      </div>
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {[tipo === 'pagar' ? 'Fornecedor' : 'Cliente', 'Descrição', 'Vencimento', 'Valor', 'Status', 'Ações'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contas.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-muted-foreground font-semibold">Nenhuma conta registrada</td></tr>
            ) : contas.map(c => {
              const st = getStatus(c);
              return (
                <tr key={c.id} className="hover:bg-[#fafcfb] border-t border-border">
                  <td className="px-4 py-[13px] font-bold text-[13.5px]">{c.fornecedor || c.cliente || '—'}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{c.descricao}</td>
                  <td className="px-4 py-[13px] text-[13.5px]">{new Date(c.vencimento).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-[13px] font-bold text-[13.5px]">{fmt(c.valor)}</td>
                  <td className="px-4 py-[13px]"><span className={`px-2.5 py-0.5 rounded-full text-[11.5px] font-bold ${st.cls}`}>{st.label}</span></td>
                  <td className="px-4 py-[13px]">
                    <div className="flex gap-1.5">
                      {c.status !== 'pago' && (
                        <button onClick={() => onPay(c.id)} className="bg-[hsl(148,40%,93%)] text-primary rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-primary hover:text-primary-foreground transition-colors">✓ Pago</button>
                      )}
                      <button onClick={() => onDelete(c.id)} className="bg-destructive-light text-destructive rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-[#f9d9d7] transition-colors">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full py-[11px] px-[13px] border-[1.5px] border-border rounded-[10px] font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
        step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0' : undefined} />
    </div>
  );
}
