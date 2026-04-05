import { useState } from 'react';
import { Search, Plus, Check, Package, ScanLine, ArrowDownToLine, AlertTriangle, TrendingUp } from 'lucide-react';
import { Product, Fornecedor, fmt, categories } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';
import Barcode from 'react-barcode';

interface Props {
  produtos: Product[];
  fornecedores: Fornecedor[];
  onAdd: (p: Omit<Product, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Product>) => void;
  onDelete: (id: string) => void;
  onEntradaEstoque: (entry: {
    produtoId: string; fornecedorNome: string; quantidade: number; lote: string;
    validade: string; custoPorUnidade: number; notaFiscal?: string; dataRecebimento: string; observacoes?: string;
  }) => void;
}

const emptyForm = { cod: '', nome: '', cat: 'Medicamentos', preco: '', custo: '', est: '', min: '10' };
const emptyEntry = { produtoId: '', fornecedorNome: '', quantidade: '', lote: '', validade: '', custoPorUnidade: '', notaFiscal: '', dataRecebimento: new Date().toISOString().split('T')[0], observacoes: '' };

export default function Products({ produtos, fornecedores, onAdd, onUpdate, onDelete, onEntradaEstoque }: Props) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entry, setEntry] = useState(emptyEntry);
  const { showToast } = useToastCustom();

  const filtered = produtos.filter(p =>
    (p.nome.toLowerCase().includes(search.toLowerCase()) || p.cod.toLowerCase().includes(search.toLowerCase())) &&
    (!catFilter || p.cat === catFilter)
  );

  const criticalCount = produtos.filter(p => p.est <= p.min).length;
  const outOfStock = produtos.filter(p => p.est <= 0).length;
  const totalValue = produtos.reduce((a, p) => a + p.preco * p.est, 0);

  const openNew = () => { setEditId(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({ cod: p.cod, nome: p.nome, cat: p.cat, preco: String(p.preco), custo: String(p.custo), est: String(p.est), min: String(p.min) });
    setModalOpen(true);
  };

  const save = () => {
    const cod = form.cod.trim().toUpperCase() || `PRD${Date.now().toString().slice(-6)}`;
    const nome = form.nome.trim() || 'Produto sem nome';
    const preco = parseFloat(form.preco) || 0;
    const custo = parseFloat(form.custo) || 0;
    const est = parseInt(form.est) || 0;
    const min = parseInt(form.min) || 10;
    if (editId) {
      onUpdate(editId, { cod, nome, cat: form.cat, preco, custo, est, min });
      showToast('Produto atualizado com sucesso!', 'success');
    } else {
      if (cod && produtos.find(p => p.cod === cod)) { showToast('Código já existe!', 'error'); return; }
      onAdd({ cod, nome, cat: form.cat, preco, custo, est, min });
      showToast('Produto cadastrado!', 'success');
    }
    setModalOpen(false);
  };

  const del = (id: string) => {
    if (!confirm('Excluir este produto permanentemente?')) return;
    onDelete(id);
    showToast('Produto excluído.', 'info');
  };

  const saveEntry = () => {
    const produtoId = parseInt(entry.produtoId);
    const quantidade = parseInt(entry.quantidade) || 0;
    const custoPorUnidade = parseFloat(entry.custoPorUnidade) || 0;
    if (!produtoId) {
      showToast('Selecione um produto!', 'error');
      return;
    }
    onEntradaEstoque({
      produtoId, fornecedorNome: entry.fornecedorNome || '', quantidade,
      lote: entry.lote || 'S/L', validade: entry.validade || '', custoPorUnidade,
      notaFiscal: entry.notaFiscal || undefined, dataRecebimento: entry.dataRecebimento || new Date().toISOString().split('T')[0],
      observacoes: entry.observacoes || undefined,
    });
    showToast('Estoque atualizado com sucesso!', 'success');
    setEntryOpen(false);
    setEntry(emptyEntry);
  };

  const summaryStats = [
    { label: 'Total Produtos', value: String(produtos.length), icon: Package, gradient: 'from-primary to-accent' },
    { label: 'Estoque Crítico', value: String(criticalCount), icon: AlertTriangle, gradient: 'from-[hsl(var(--gold))] to-[hsl(35,80%,50%)]', alert: criticalCount > 0 },
    { label: 'Sem Estoque', value: String(outOfStock), icon: Package, gradient: 'from-[hsl(var(--destructive))] to-[hsl(20,80%,50%)]', alert: outOfStock > 0 },
    { label: 'Valor em Estoque', value: fmt(totalValue), icon: TrendingUp, gradient: 'from-[hsl(var(--blue))] to-[hsl(210,70%,55%)]' },
  ];

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 animate-stagger">
        {summaryStats.map((s) => (
          <div key={s.label} className="card-premium p-4 group relative overflow-hidden">
            <div className={`absolute -top-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.gradient} opacity-[0.06] group-hover:opacity-[0.12] transition-opacity duration-300`} />
            <div className="flex items-center gap-3 relative">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br ${s.gradient} shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300`}>
                <s.icon className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase tracking-[1px] text-muted-foreground">{s.label}</div>
                <div className={`font-display text-lg font-bold leading-none mt-0.5 ${s.alert ? 'text-destructive' : 'text-foreground'}`}>{s.value}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex justify-between items-center animate-fade-in">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-border rounded-xl font-body text-[12.5px] bg-card w-[260px] outline-none focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all placeholder:text-muted-foreground/40"
              placeholder="Buscar produto..." />
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="py-2.5 px-3 border border-border rounded-xl font-body text-[12.5px] bg-card outline-none focus:border-primary transition-all">
            <option value="">Todas categorias</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex gap-2.5">
          <button onClick={() => { setEntry(emptyEntry); setEntryOpen(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground text-[12.5px] font-bold hover:opacity-90 shadow-sm hover:shadow-md transition-all active:scale-[0.97]">
            <ArrowDownToLine className="w-4 h-4" /> Entrada de Estoque
          </button>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-primary-foreground text-[12.5px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97]"
            style={{ background: 'var(--gradient-primary)' }}>
            <Plus className="w-4 h-4" /> Novo Produto
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card-premium overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/50">
              {['Código', 'Produto', 'Categoria', 'Estoque', 'Mín.', 'Preço', 'Status', 'Barras', 'Ações'].map(h => (
                <th key={h} className="px-4 py-3.5 text-left text-[10px] font-extrabold uppercase tracking-[1.2px] text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-20 text-muted-foreground">
                  <Package className="w-10 h-10 mx-auto mb-3 opacity-15" />
                  <p className="font-bold text-sm">Nenhum produto encontrado</p>
                </td>
              </tr>
            ) : filtered.map(p => {
              const pct = Math.min(100, Math.round((p.est / Math.max(p.min * 3, 1)) * 100));
              const barColor = p.est <= 0 ? 'bg-destructive' : p.est <= p.min ? 'bg-[hsl(var(--gold))]' : 'bg-accent';
              return (
                <tr key={p.id} className="table-row-hover group/row">
                  <td className="px-4 py-3.5">
                    <span className="font-mono bg-secondary px-2.5 py-0.5 rounded-lg text-[11px] text-text-2 font-bold">{p.cod}</span>
                  </td>
                  <td className="px-4 py-3.5 font-bold text-[13px] text-foreground">{p.nome}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-accent-light text-[hsl(90,40%,30%)]">{p.cat}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <b className={`text-[13px] ${p.est <= p.min ? 'text-destructive' : 'text-foreground'}`}>{p.est}</b>
                      <div className="h-2 bg-secondary rounded-full flex-1 max-w-[80px] overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground text-[13px]">{p.min}</td>
                  <td className="px-4 py-3.5 font-bold text-primary text-[13px]">{fmt(p.preco)}</td>
                  <td className="px-4 py-3.5">
                    {p.est <= 0 ? <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-destructive-light text-destructive">Sem Estoque</span>
                      : p.est <= p.min ? <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[hsl(48,80%,93%)] text-[hsl(var(--gold))]">⚠️ Crítico</span>
                      : <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[hsl(148,40%,93%)] text-primary">✓ Ok</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <button onClick={() => setBarcodeProduct(p)} className="bg-card text-text-2 border border-border rounded-xl px-3 py-1.5 text-[11px] font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-sm transition-all flex items-center gap-1.5 active:scale-95">
                      <ScanLine className="w-3.5 h-3.5" /> Ver
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={() => openEdit(p)} className="bg-card text-text-2 border border-border rounded-xl px-3 py-1.5 text-[11px] font-bold hover:border-primary/30 hover:text-primary transition-all active:scale-95">✏️ Editar</button>
                      <button onClick={() => del(p.id)} className="bg-destructive-light text-destructive rounded-xl px-3 py-1.5 text-[11px] font-bold hover:bg-destructive/15 transition-all active:scale-95">🗑</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-5 py-3.5 border-t border-border bg-secondary/30 flex justify-between items-center">
            <span className="text-[11px] font-bold text-muted-foreground">{filtered.length} produto(s)</span>
            <span className="text-[12px] font-bold text-muted-foreground">Valor total em estoque: <span className="text-primary font-extrabold">{fmt(totalValue)}</span></span>
          </div>
        )}
      </div>

      {/* New/Edit Product Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'var(--gradient-primary)' }}>
            <Package className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground">{editId ? 'Editar Produto' : 'Novo Produto'}</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Todos os campos são opcionais</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Código do Produto" value={form.cod} onChange={v => setForm({ ...form, cod: v })} placeholder="Ex: MED001" uppercase />
          <Field label="Categoria" value={form.cat} onChange={v => setForm({ ...form, cat: v })} type="select" options={categories} />
        </div>
        <Field label="Nome Completo do Produto" value={form.nome} onChange={v => setForm({ ...form, nome: v })} placeholder="Ex: Dipirona 500mg — caixa c/10 comprimidos" />
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Preço de Venda (Kz)" value={form.preco} onChange={v => setForm({ ...form, preco: v })} type="number" />
          <Field label="Preço de Custo (Kz)" value={form.custo} onChange={v => setForm({ ...form, custo: v })} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Quantidade em Estoque" value={form.est} onChange={v => setForm({ ...form, est: v })} type="number" />
          <Field label="Estoque Mínimo (alerta)" value={form.min} onChange={v => setForm({ ...form, min: v })} type="number" />
        </div>
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setModalOpen(false)} className="bg-card text-text-2 border border-border rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-secondary transition-colors">Cancelar</button>
          <button onClick={save} className="flex items-center gap-2 text-primary-foreground rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97]" style={{ background: 'var(--gradient-primary)' }}>
            <Check className="w-4 h-4" /> Salvar Produto
          </button>
        </div>
      </Modal>

      {/* Barcode Modal */}
      <Modal open={!!barcodeProduct} onClose={() => setBarcodeProduct(null)} width="w-[380px]">
        {barcodeProduct && (
          <div className="text-center">
            <h3 className="font-display text-lg text-foreground mb-1">{barcodeProduct.nome.split('—')[0].trim()}</h3>
            <p className="text-xs text-muted-foreground mb-4">{barcodeProduct.cod}</p>
            <div className="flex justify-center mb-4">
              <Barcode value={barcodeProduct.cod} format="CODE128" width={2} height={80} fontSize={14} background="#ffffff" lineColor="#0f2118" />
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Imprima este código para etiquetar o produto</p>
          </div>
        )}
      </Modal>

      {/* Stock Entry Modal */}
      <Modal open={entryOpen} onClose={() => setEntryOpen(false)} width="w-[550px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-md bg-gradient-to-br from-accent to-[hsl(100,50%,35%)]">
            <ArrowDownToLine className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-display text-xl text-foreground">Entrada de Estoque</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Registrar recebimento de mercadoria</p>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-[10.5px] font-extrabold text-muted-foreground uppercase tracking-[1px] mb-1.5">Produto</label>
          <select value={entry.produtoId} onChange={e => setEntry({ ...entry, produtoId: e.target.value })}
            className="w-full py-3 px-3.5 border border-border rounded-xl font-body text-[13px] outline-none bg-card focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all">
            <option value="">Selecione o produto...</option>
            {produtos.map(p => <option key={p.id} value={p.id}>{p.cod} — {p.nome}</option>)}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-[10.5px] font-extrabold text-muted-foreground uppercase tracking-[1px] mb-1.5">Fornecedor</label>
          <select value={entry.fornecedorNome} onChange={e => setEntry({ ...entry, fornecedorNome: e.target.value })}
            className="w-full py-3 px-3.5 border border-border rounded-xl font-body text-[13px] outline-none bg-card focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all">
            <option value="">Selecione o fornecedor...</option>
            {fornecedores.map(f => <option key={f.id} value={f.nome}>{f.nome}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Quantidade Recebida" value={entry.quantidade} onChange={v => setEntry({ ...entry, quantidade: v })} type="number" />
          <Field label="Preço de Custo (Kz)" value={entry.custoPorUnidade} onChange={v => setEntry({ ...entry, custoPorUnidade: v })} type="number" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Nº do Lote" value={entry.lote} onChange={v => setEntry({ ...entry, lote: v })} placeholder="Ex: L2025D" uppercase />
          <Field label="Data de Validade" value={entry.validade} onChange={v => setEntry({ ...entry, validade: v })} type="date" />
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Nº Nota Fiscal (opcional)" value={entry.notaFiscal} onChange={v => setEntry({ ...entry, notaFiscal: v })} placeholder="NF" />
          <Field label="Data de Recebimento" value={entry.dataRecebimento} onChange={v => setEntry({ ...entry, dataRecebimento: v })} type="date" />
        </div>
        <Field label="Observações" value={entry.observacoes} onChange={v => setEntry({ ...entry, observacoes: v })} placeholder="Observações" />
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setEntryOpen(false)} className="bg-card text-text-2 border border-border rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-secondary transition-colors">Cancelar</button>
          <button onClick={saveEntry} className="flex items-center gap-2 text-primary-foreground rounded-xl px-5 py-2.5 text-[13px] font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.97]" style={{ background: 'var(--gradient-primary)' }}>
            <Check className="w-4 h-4" /> Confirmar Entrada
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
  const cls = "w-full py-3 px-3.5 border border-border rounded-xl font-body text-[13px] outline-none bg-card focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all";
  return (
    <div className="mb-4">
      <label className="block text-[10.5px] font-extrabold text-muted-foreground uppercase tracking-[1px] mb-1.5">{label}</label>
      {type === 'select' ? (
        <select value={value} onChange={e => onChange(e.target.value)} className={cls}>
          {options?.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(uppercase ? e.target.value.toUpperCase() : e.target.value)}
          placeholder={placeholder} className={`${cls} ${uppercase ? 'uppercase' : ''}`}
          step={type === 'number' ? '0.01' : undefined} min={type === 'number' ? '0' : undefined} />
      )}
    </div>
  );
}
