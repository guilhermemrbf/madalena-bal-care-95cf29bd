import { useState } from 'react';
import { Search, Plus, Check, Truck, History } from 'lucide-react';
import { Fornecedor, Lancamento, fmt } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';

interface Props {
  fornecedores: Fornecedor[];
  financeiro: Lancamento[];
  onAdd: (f: Omit<Fornecedor, 'id'>) => void;
  onUpdate: (id: number, data: Partial<Fornecedor>) => void;
  onDelete: (id: number) => void;
}

const emptyForm = { nome: '', nif: '', telefone: '', email: '', contato: '', endereco: '', prazoEntrega: '3', observacoes: '' };

export default function FornecedoresPage({ fornecedores, financeiro, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [historyForn, setHistoryForn] = useState<Fornecedor | null>(null);
  const { showToast } = useToastCustom();

  const filtered = fornecedores.filter(f =>
    f.nome.toLowerCase().includes(search.toLowerCase()) || f.nif.includes(search)
  );

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (f: Fornecedor) => {
    setEditId(f.id);
    setForm({ nome: f.nome, nif: f.nif, telefone: f.telefone, email: f.email, contato: f.contato, endereco: f.endereco, prazoEntrega: String(f.prazoEntrega), observacoes: f.observacoes });
    setModalOpen(true);
  };

  const save = () => {
    const nome = form.nome.trim();
    if (!nome) { showToast('Informe o nome do fornecedor!', 'error'); return; }
    if (editId) {
      onUpdate(editId, { ...form, nome, prazoEntrega: parseInt(form.prazoEntrega) || 3 });
      showToast('Fornecedor atualizado!', 'success');
    } else {
      onAdd({ ...form, nome, prazoEntrega: parseInt(form.prazoEntrega) || 3, ultimaEntrega: '' });
      showToast('Fornecedor cadastrado!', 'success');
    }
    setModalOpen(false);
  };

  const del = (id: number) => {
    if (!confirm('Excluir este fornecedor?')) return;
    onDelete(id);
    showToast('Fornecedor excluído.', 'info');
  };

  const fornEntregas = historyForn ? financeiro.filter(l => l.descricao.includes(historyForn.nome) && l.categoria === 'Compra de Estoque') : [];

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2.5 items-center">
          <div className="relative">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-[9px] border-[1.5px] border-border rounded-[10px] font-body text-[13.5px] bg-background w-[250px] outline-none focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
              placeholder="Buscar fornecedor..." />
          </div>
          <button onClick={openNew} className="flex items-center gap-[7px] px-[18px] py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13.5px] font-bold hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(26,107,60,0.35)] transition-all">
            <Plus className="w-4 h-4" /> Novo Fornecedor
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Nome', 'NIF/CNPJ', 'Telefone', 'Email', 'Contato', 'Última Entrega', 'Ações'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-16 text-muted-foreground font-semibold">Nenhum fornecedor encontrado</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="hover:bg-[#fafcfb] border-t border-border">
                <td className="px-4 py-[13px] font-bold text-[13.5px]">{f.nome}</td>
                <td className="px-4 py-[13px]"><span className="font-mono bg-background px-2 py-0.5 rounded-md text-xs text-text-2">{f.nif}</span></td>
                <td className="px-4 py-[13px] text-[13.5px]">{f.telefone}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{f.email}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{f.contato}</td>
                <td className="px-4 py-[13px] text-[13.5px]">{f.ultimaEntrega ? new Date(f.ultimaEntrega).toLocaleDateString('pt-BR') : '—'}</td>
                <td className="px-4 py-[13px]">
                  <div className="flex gap-1.5">
                    <button onClick={() => setHistoryForn(f)} className="bg-background text-text-2 border border-border rounded-lg px-2.5 py-[5px] text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors flex items-center gap-1">
                      <History className="w-3.5 h-3.5" /> Entregas
                    </button>
                    <button onClick={() => openEdit(f)} className="bg-background text-text-2 border border-border rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-border transition-colors">✏️</button>
                    <button onClick={() => del(f.id)} className="bg-destructive-light text-destructive rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-[#f9d9d7] transition-colors">🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-[hsl(148,40%,93%)] rounded-xl flex items-center justify-center text-primary"><Truck className="w-[22px] h-[22px]" /></div>
          <div>
            <h3 className="font-display text-xl text-primary">{editId ? 'Editar Fornecedor' : 'Novo Fornecedor'}</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Dados do fornecedor</p>
          </div>
        </div>
        <Field label="Nome da Empresa" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Nome" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="NIF ou CNPJ" value={form.nif} onChange={v => setForm({ ...form, nif: v })} placeholder="NIF" />
          <Field label="Telefone / WhatsApp" value={form.telefone} onChange={v => setForm({ ...form, telefone: v })} placeholder="Telefone" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="Email" />
          <Field label="Pessoa de Contato" value={form.contato} onChange={v => setForm({ ...form, contato: v })} placeholder="Contato" />
        </div>
        <Field label="Endereço" value={form.endereco} onChange={v => setForm({ ...form, endereco: v })} placeholder="Endereço" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Prazo Médio de Entrega (dias)" value={form.prazoEntrega} onChange={v => setForm({ ...form, prazoEntrega: v })} type="number" />
          <Field label="Observações" value={form.observacoes} onChange={v => setForm({ ...form, observacoes: v })} placeholder="Condições comerciais" />
        </div>
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={save} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Check className="w-4 h-4" /> Salvar
          </button>
        </div>
      </Modal>

      {/* Delivery History Modal */}
      <Modal open={!!historyForn} onClose={() => setHistoryForn(null)} width="w-[550px]">
        {historyForn && (
          <div>
            <h3 className="font-display text-xl text-primary mb-4">Entregas — {historyForn.nome}</h3>
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#f8fbf9]">
                  <tr>
                    {['Data', 'Descrição', 'Valor'].map(h => (
                      <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fornEntregas.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-12 text-muted-foreground font-semibold">Nenhuma entrega registrada</td></tr>
                  ) : fornEntregas.map(l => (
                    <tr key={l.id} className="border-t border-border">
                      <td className="px-4 py-[13px] text-[13.5px]">{new Date(l.data).toLocaleDateString('pt-BR')}</td>
                      <td className="px-4 py-[13px] text-[13.5px]">{l.descricao}</td>
                      <td className="px-4 py-[13px] font-bold text-destructive text-[13.5px]">{fmt(l.valor)}</td>
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
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls}
        step={type === 'number' ? '1' : undefined} min={type === 'number' ? '0' : undefined} />
    </div>
  );
}
