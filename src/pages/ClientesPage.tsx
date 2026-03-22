import { useState } from 'react';
import { Search, Plus, Check, Users, History } from 'lucide-react';
import { Cliente, Sale, fmt } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';

interface Props {
  clientes: Cliente[];
  vendas: Sale[];
  onAdd: (c: Omit<Cliente, 'id'>) => void;
  onUpdate: (id: number, data: Partial<Cliente>) => void;
  onDelete: (id: number) => void;
}

const emptyForm = { nome: '', telefone: '', documento: '', nascimento: '', endereco: '', observacoes: '' };

export default function ClientesPage({ clientes, vendas, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [historyClient, setHistoryClient] = useState<Cliente | null>(null);
  const { showToast } = useToastCustom();

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(search.toLowerCase()) || c.telefone.includes(search) || c.documento.includes(search)
  );

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (c: Cliente) => {
    setEditId(c.id);
    setForm({ nome: c.nome, telefone: c.telefone, documento: c.documento, nascimento: c.nascimento, endereco: c.endereco, observacoes: c.observacoes });
    setModalOpen(true);
  };

  const save = () => {
    const nome = form.nome.trim();
    if (!nome) { showToast('Informe o nome do cliente!', 'error'); return; }
    if (editId) {
      onUpdate(editId, { ...form, nome });
      showToast('Cliente atualizado!', 'success');
    } else {
      onAdd({ ...form, nome, pontos: 0, totalGasto: 0, ultimaCompra: '' });
      showToast('Cliente cadastrado!', 'success');
    }
    setModalOpen(false);
  };

  const del = (id: number) => {
    if (!confirm('Excluir este cliente?')) return;
    onDelete(id);
    showToast('Cliente excluído.', 'info');
  };

  const clientSales = historyClient ? vendas.filter(v => v.clienteId === historyClient.id) : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2.5 items-center">
          <div className="relative">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-[9px] border-[1.5px] border-border rounded-[10px] font-body text-[13.5px] bg-background w-[250px] outline-none focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
              placeholder="Buscar cliente..." />
          </div>
          <button onClick={openNew} className="flex items-center gap-[7px] px-[18px] py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13.5px] font-bold hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(26,107,60,0.35)] transition-all">
            <Plus className="w-4 h-4" /> Novo Cliente
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Nome', 'Telefone', 'Documento', 'Pontos', 'Total Gasto', 'Última Compra', 'Ações'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground font-semibold">Nenhum cliente encontrado</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id} className="hover:bg-[#fafcfb] border-t border-border">
                <td className="px-4 py-[13px] font-bold text-[13.5px]">{c.nome}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{c.telefone || '—'}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{c.documento || '—'}</td>
                <td className="px-4 py-[13px]"><span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-accent-light text-accent">{c.pontos} pts</span></td>
                <td className="px-4 py-[13px] text-[13.5px] font-bold text-primary">{fmt(c.totalGasto)}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{c.ultimaCompra ? new Date(c.ultimaCompra).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-[13px]">
                  <div className="flex gap-1.5">
                    <button onClick={() => setHistoryClient(c)} className="bg-background text-text-2 border border-border rounded-lg px-2.5 py-[5px] text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Histórico
                    </button>
                    <button onClick={() => openEdit(c)} className="bg-background text-text-2 border border-border rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-border transition-colors">✏️</button>
                    <button onClick={() => del(c.id)} className="bg-destructive-light text-destructive rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-[#f9d9d7] transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New/Edit Client Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-[hsl(148,40%,93%)] rounded-xl flex items-center justify-center text-primary"><Users className="w-[22px] h-[22px]" /></div>
          <div>
            <h3 className="font-display text-xl text-primary">{editId ? 'Editar Cliente' : 'Novo Cliente'}</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Preencha os dados do cliente</p>
          </div>
        </div>
        <Field label="Nome Completo" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Nome do cliente" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Telefone / WhatsApp" value={form.telefone} onChange={v => setForm({ ...form, telefone: v })} placeholder="923456789" />
          <Field label="NIF ou BI" value={form.documento} onChange={v => setForm({ ...form, documento: v })} placeholder="Documento" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Data de Nascimento" value={form.nascimento} onChange={v => setForm({ ...form, nascimento: v })} type="date" />
          <Field label="Endereço" value={form.endereco} onChange={v => setForm({ ...form, endereco: v })} placeholder="Endereço" />
        </div>
        <Field label="Observações (alergias, uso contínuo, etc.)" value={form.observacoes} onChange={v => setForm({ ...form, observacoes: v })} placeholder="Observações" />
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={save} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Check className="w-4 h-4" /> Salvar Cliente
          </button>
        </div>
      </Modal>

      {/* History Modal */}
      <Modal open={!!historyClient} onClose={() => setHistoryClient(null)} width="w-[600px]">
        {historyClient && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 bg-accent-light rounded-xl flex items-center justify-center text-accent font-bold text-lg">
                {historyClient.nome.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <div>
                <h3 className="font-display text-xl text-primary">{historyClient.nome}</h3>
                <p className="text-[13px] text-muted-foreground">{historyClient.pontos} pontos · Total gasto: {fmt(historyClient.totalGasto)}</p>
              </div>
            </div>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8fbf9]">
                  <tr>
                    {['Data', 'Itens', 'Pagamento', 'Total'].map(h => (
                      <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {clientSales.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-12 text-muted-foreground font-semibold">Nenhuma compra registrada</td></tr>
                  ) : clientSales.map(v => (
                    <tr key={v.id} className="border-t border-border">
                      <td className="px-4 py-[13px] text-[13.5px]">{new Date(v.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-[13px] text-[11.5px] text-muted-foreground truncate max-w-[200px]">{v.itens.map(i => i.nome.split('—')[0].trim()).join(', ')}</td>
                      <td className="px-4 py-[13px]"><span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">{v.pgto}</span></td>
                      <td className="px-4 py-[13px] font-bold text-primary text-[13.5px]">{fmt(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  const cls = "w-full py-[11px] px-[13px] border-[1.5px] border-border rounded-[10px] font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all";
  return (
    <div className="mb-4">
      <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} />
    </div>
  );
}
