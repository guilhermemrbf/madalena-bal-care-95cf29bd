import { useState } from 'react';
import { Search, Plus, Check, Package, ScanLine } from 'lucide-react';
import { Product, fmt, categories } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';
import Barcode from 'react-barcode';

interface Props {
  produtos: Product[];
  onAdd: (p: Omit<Product, 'id'>) => void;
  onUpdate: (id: number, data: Partial<Product>) => void;
  onDelete: (id: number) => void;
}

const emptyForm = { cod: '', nome: '', cat: 'Medicamentos', preco: '', custo: '', est: '', min: '10' };

export default function Products({ produtos, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const { showToast } = useToastCustom();

  const filtered = produtos.filter(p =>
    (p.nome.toLowerCase().includes(search.toLowerCase()) || p.cod.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.cat === catFilter)
  );

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ cod: p.cod, nome: p.nome, cat: p.cat, preco: String(p.preco), custo: String(p.custo), est: String(p.est), min: String(p.min) });
    setModalOpen(true);
  };

  const save = () => {
    const cod = form.cod.trim().toUpperCase();
    const nome = form.nome.trim();
    const preco = parseFloat(form.preco);
    const custo = parseFloat(form.custo) || 0;
    const est = parseInt(form.est);
    const min = parseInt(form.min) || 10;
    if (!cod || !nome || isNaN(preco) || isNaN(est)) { showToast('Preencha todos os campos obrigatórios!', 'error'); return; }
    if (editId) {
      onUpdate(editId, { cod, nome, cat: form.cat, preco, custo, est, min });
      showToast('Produto atualizado com sucesso!', 'success');
    } else {
      if (produtos.find(p => p.cod === cod)) { showToast('Código já existe!', 'error'); return; }
      onAdd({ cod, nome, cat: form.cat, preco, custo, est, min });
      showToast('Produto cadastrado!', 'success');
    }
    setModalOpen(false);
  };

  const del = (id: number) => {
    if (!confirm('Excluir este produto permanentemente?')) return;
    onDelete(id);
    showToast('Produto excluído.', 'info');
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div />
        <div className="flex gap-2.5 items-center">
          <div className="relative">
            <Search className="absolute left-[11px] top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-3.5 py-[9px] border-[1.5px] border-border rounded-[10px] font-body text-[13.5px] bg-background w-[250px] outline-none focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
              placeholder="Buscar produto..."
            />
          </div>
          <select
            value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="py-[9px] px-3 border-[1.5px] border-border rounded-[10px] font-body text-[13.5px] bg-background outline-none"
          >
            <option value="">Todas categorias</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
          <button onClick={openNew} className="flex items-center gap-[7px] px-[18px] py-2.5 rounded-[10px] bg-primary text-primary-foreground text-[13.5px] font-bold hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(26,107,60,0.35)] transition-all">
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['Código', 'Produto', 'Categoria', 'Estoque', 'Mín.', 'Preço', 'Status', 'Barras', 'Ações'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-muted-foreground font-semibold">Nenhum produto encontrado</td></tr>
            ) : filtered.map(p => {
              const pct = Math.min(100, Math.round((p.est / Math.max(p.min * 3, 1)) * 100));
              const barColor = p.est <= 0 ? 'bg-destructive' : p.est <= p.min ? 'bg-[#f0a030]' : 'bg-accent';
              return (
                <tr key={p.id} className="hover:bg-[#fafcfb] border-t border-border">
                  <td className="px-4 py-[13px]"><span className="font-mono bg-background px-2 py-0.5 rounded-md text-xs text-text-2">{p.cod}</span></td>
                  <td className="px-4 py-[13px] font-bold text-[13.5px]">{p.nome}</td>
                  <td className="px-4 py-[13px]"><span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-accent-light text-[#4a7a1e]">{p.cat}</span></td>
                  <td className="px-4 py-[13px]">
                    <div className="flex items-center gap-2">
                      <b className={p.est <= p.min ? 'text-destructive' : ''}>{p.est}</b>
                      <div className="h-1.5 bg-border rounded-full flex-1 max-w-[80px] overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-[13px] text-muted-foreground text-[13.5px]">{p.min}</td>
                  <td className="px-4 py-[13px] font-bold text-primary text-[13.5px]">{fmt(p.preco)}</td>
                  <td className="px-4 py-[13px]">
                    {p.est <= 0 ? <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-destructive-light text-destructive">Sem Estoque</span>
                      : p.est <= p.min ? <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[#fff8e6] text-[#8a6400]">⚠️ Crítico</span>
                      : <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">✓ Ok</span>}
                  </td>
                  <td className="px-4 py-[13px]">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p)} className="bg-background text-text-2 border border-border rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-border transition-colors">✏️ Editar</button>
                      <button onClick={() => del(p.id)} className="bg-destructive-light text-destructive rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-[#f9d9d7] transition-colors">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-[hsl(148,40%,93%)] rounded-xl flex items-center justify-center text-primary">
            <Package className="w-[22px] h-[22px]" />
          </div>
          <div>
            <h3 className="font-display text-xl text-primary">{editId ? 'Editar Produto' : 'Novo Produto'}</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Preencha os dados do produto</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Código do Produto" value={form.cod} onChange={v => setForm({ ...form, cod: v })} placeholder="Ex: MED001" uppercase />
          <Field label="Categoria" value={form.cat} onChange={v => setForm({ ...form, cat: v })} type="select" options={categories} />
        </div>
        <Field label="Nome Completo do Produto" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Ex: Dipirona 500mg — caixa c/10 comprimidos" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Preço de Venda (R$)" value={form.preco} onChange={v => setForm({ ...form, preco: v })} type="number" />
          <Field label="Preço de Custo (R$)" value={form.custo} onChange={v => setForm({ ...form, custo: v })} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Quantidade em Estoque" value={form.est} onChange={v => setForm({ ...form, est: v })} type="number" />
          <Field label="Estoque Mínimo (alerta)" value={form.min} onChange={v => setForm({ ...form, min: v })} type="number" />
        </div>
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={save} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Check className="w-4 h-4" /> Salvar Produto
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', options, uppercase }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; options?: string[]; uppercase?: boolean;
}) {
  const cls = "w-full py-[11px] px-[13px] border-[1.5px] border-border rounded-[10px] font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all";
  return (
    <div className="mb-4">
      <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={cls}>
          {options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type} value={value} onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder} className={`${cls} ${uppercase ? 'uppercase' : ''}`}
          step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0' : undefined}
        />
      )}
    </div>
  );
}
