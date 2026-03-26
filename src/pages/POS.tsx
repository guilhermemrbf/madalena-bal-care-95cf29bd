import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Minus, X, ShoppingBag, CreditCard, Check, Camera, ScanLine, Search, Percent, Trash2, Tag, User, Gift, Banknote, Smartphone, Building, Heart, ChevronRight, Package, Clock, Hash, Receipt, Printer, ArrowRight, Sparkles, Zap } from 'lucide-react';
import { Product, CartItem, Sale, Cliente, fmt } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';
import BarcodeScanner from '@/components/BarcodeScanner';
import Barcode from 'react-barcode';

interface Props {
  produtos: Product[];
  clientes: Cliente[];
  onSale: (sale: Omit<Sale, 'id'>) => Sale;
}

const paymentMethods = [
  { name: 'Dinheiro', icon: Banknote, color: 'hsl(45,90%,50%)' },
  { name: 'Multicaixa Express', icon: Smartphone, color: 'hsl(210,90%,55%)' },
  { name: 'TPA Débito', icon: CreditCard, color: 'hsl(148,61%,36%)' },
  { name: 'TPA Crédito', icon: CreditCard, color: 'hsl(280,60%,55%)' },
  { name: 'Convênio', icon: Building, color: 'hsl(20,80%,55%)' },
  { name: 'Transferência Bancária', icon: Building, color: 'hsl(190,70%,45%)' },
];

export default function POS({ produtos, clientes, onSale }: Props) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pgtoOpen, setPgtoOpen] = useState(false);
  const [reciboOpen, setReciboOpen] = useState(false);
  const [pgtoSel, setPgtoSel] = useState<string | null>(null);
  const [recebido, setRecebido] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const { showToast } = useToastCustom();
  const searchRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef(0);
  const barcodeBuffer = useRef('');

  // Client selection
  const [clienteSearch, setClienteSearch] = useState('');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [clienteDropdown, setClienteDropdown] = useState(false);

  // Discounts
  const [descontoGeral, setDescontoGeral] = useState('');
  const [descontoGeralTipo, setDescontoGeralTipo] = useState<'%' | 'Kz'>('%');
  const [editingDiscount, setEditingDiscount] = useState<number | null>(null);
  const [itemDesconto, setItemDesconto] = useState('');
  const [itemDescontoTipo, setItemDescontoTipo] = useState<'%' | 'Kz'>('%');

  // Clock
  const [clock, setClock] = useState('');
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, []);

  const categories = [...new Set(produtos.filter(p => p.est > 0).map(p => p.cat))];

  const available = produtos.filter(p =>
    p.est > 0 &&
    (p.nome.toLowerCase().includes(search.toLowerCase()) || p.cod.toLowerCase().includes(search.toLowerCase())) &&
    (!selectedCat || p.cat === selectedCat)
  );

  // Calculate totals with discounts
  const subtotal = cart.reduce((a, i) => {
    const itemTotal = i.preco * i.qty;
    if (i.desconto && i.desconto > 0) {
      return a + (i.descontoTipo === '%' ? itemTotal * (1 - i.desconto / 100) : Math.max(0, itemTotal - i.desconto));
    }
    return a + itemTotal;
  }, 0);

  const descontoGeralVal = descontoGeral ? (descontoGeralTipo === '%' ? subtotal * parseFloat(descontoGeral) / 100 : parseFloat(descontoGeral)) : 0;
  const total = Math.max(0, subtotal - (descontoGeralVal || 0));
  const totalItens = cart.reduce((a, i) => a + i.qty, 0);

  const addToCart = useCallback((p: Product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === p.id);
      if (ex) {
        if (ex.qty >= p.est) { showToast('Estoque insuficiente!', 'error'); return prev; }
        return prev.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { id: p.id, cod: p.cod, nome: p.nome, preco: p.preco, qty: 1 }];
    });
    showToast(`+ ${p.nome.split('—')[0].trim()}`, 'success');
  }, [showToast]);

  const findAndAddByCode = useCallback((code: string) => {
    const normalized = code.trim().toUpperCase();
    const product = produtos.find(p => p.cod.toUpperCase() === normalized);
    if (product) {
      if (product.est <= 0) { showToast(`${product.nome.split('—')[0].trim()} — sem estoque!`, 'error'); return; }
      addToCart(product);
      setSearch('');
    } else {
      showToast(`Produto não encontrado: ${code}`, 'error');
    }
  }, [produtos, addToCart, showToast]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      if (pgtoOpen || reciboOpen || scannerOpen) return;
      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        e.preventDefault();
        findAndAddByCode(barcodeBuffer.current);
        barcodeBuffer.current = '';
        return;
      }
      if (now - lastKeyTime.current > 100) barcodeBuffer.current = '';
      if (e.key.length === 1) { barcodeBuffer.current += e.key; lastKeyTime.current = now; }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findAndAddByCode, pgtoOpen, reciboOpen, scannerOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) findAndAddByCode(search);
  };

  const handleScan = useCallback((code: string) => { findAndAddByCode(code); }, [findAndAddByCode]);

  const changeQty = (id: number, d: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const newQty = item.qty + d;
      if (newQty <= 0) return prev.filter(i => i.id !== id);
      const prod = produtos.find(p => p.id === id);
      if (prod && newQty > prod.est) { showToast('Limite de estoque atingido!', 'error'); return prev; }
      return prev.map(i => i.id === id ? { ...i, qty: newQty } : i);
    });
  };

  const applyItemDiscount = (id: number) => {
    const val = parseFloat(itemDesconto);
    if (isNaN(val) || val < 0) return;
    setCart(prev => prev.map(i => i.id === id ? { ...i, desconto: val, descontoTipo: itemDescontoTipo as '%' | 'Kz' } : i));
    setEditingDiscount(null);
    setItemDesconto('');
  };

  const openPgto = () => { setPgtoSel(null); setRecebido(''); setPgtoOpen(true); };
  const troco = parseFloat(recebido) - total;
  const canConfirm = pgtoSel && (pgtoSel !== 'Dinheiro' || parseFloat(recebido) >= total);

  const confirm = () => {
    if (!pgtoSel) return;
    const saleData: Omit<Sale, 'id'> = {
      data: new Date().toISOString(),
      itens: [...cart],
      pgto: pgtoSel,
      total,
      subtotal: cart.reduce((a, i) => a + i.preco * i.qty, 0),
      descontoGeral: descontoGeralVal || 0,
      descontoGeralTipo,
      clienteId: clienteSel?.id || null,
      clienteNome: clienteSel?.nome || undefined,
    };
    const sale = onSale(saleData);
    setLastSale(sale);
    setPgtoOpen(false);
    setReciboOpen(true);
  };

  const novaVenda = () => {
    setReciboOpen(false);
    setCart([]);
    setClienteSel(null);
    setClienteSearch('');
    setDescontoGeral('');
  };

  const filteredClientes = clientes.filter(c =>
    c.nome.toLowerCase().includes(clienteSearch.toLowerCase()) || c.telefone.includes(clienteSearch)
  );

  const getItemFinalPrice = (item: CartItem) => {
    const raw = item.preco * item.qty;
    if (item.desconto && item.desconto > 0) {
      return item.descontoTipo === '%' ? raw * (1 - item.desconto / 100) : Math.max(0, raw - item.desconto);
    }
    return raw;
  };

  return (
    <div className="grid grid-cols-[1fr_440px] gap-4" style={{ height: 'calc(100vh - 160px)' }}>
      {/* ═══════════ LEFT — Product Catalog ═══════════ */}
      <div className="flex flex-col gap-3 overflow-hidden">
        {/* Top bar with search & actions */}
        <div className="flex gap-2.5 items-stretch">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-muted-foreground/50 pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full h-full py-3 pl-12 pr-4 border border-border rounded-xl font-body text-sm outline-none bg-card shadow-sm focus:border-primary focus:shadow-[0_0_0_3px_hsl(148_61%_26%/0.06)] transition-all placeholder:text-muted-foreground/40"
              placeholder="Buscar produto, código ou escanear..."
            />
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-5 rounded-xl font-bold text-sm transition-all shrink-0 active:scale-[0.97] text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-px"
            style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(148,50%,32%))' }}
          >
            <Camera className="w-[18px] h-[18px]" />
            <span className="hidden xl:inline">Câmera</span>
          </button>
        </div>

        {/* Scanner indicator */}
        <div className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg">
          <div className="relative flex items-center justify-center w-5 h-5">
            <span className="absolute w-2 h-2 bg-accent rounded-full animate-ping opacity-60" />
            <span className="relative w-2 h-2 bg-accent rounded-full" />
          </div>
          <span className="text-[11px] font-semibold text-muted-foreground">Leitor de código de barras ativo</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground/50 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {clock}
          </span>
        </div>

        {/* Category pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-3.5 py-[7px] rounded-lg text-[11px] font-bold transition-all border ${
              !selectedCat
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            Todos ({produtos.filter(p => p.est > 0).length})
          </button>
          {categories.map(cat => {
            const count = produtos.filter(p => p.est > 0 && p.cat === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                className={`px-3.5 py-[7px] rounded-lg text-[11px] font-bold transition-all border ${
                  selectedCat === cat
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 overflow-y-auto pb-2 pr-1 flex-1" style={{ alignContent: 'start' }}>
          {available.length === 0 ? (
            <div className="col-span-full text-center py-20 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-15" />
              <p className="font-bold text-sm">Nenhum produto encontrado</p>
              <p className="text-[11px] mt-1 opacity-60">Tente outro termo de busca</p>
            </div>
          ) : available.map(p => {
            const inCart = cart.find(i => i.id === p.id);
            const isCritical = p.est <= p.min;
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`relative bg-card border rounded-xl p-3.5 cursor-pointer transition-all group hover:shadow-md hover:-translate-y-px active:translate-y-0 active:shadow-sm ${
                  inCart ? 'border-primary ring-1 ring-primary/20 shadow-sm' : 'border-border hover:border-primary/40'
                }`}
              >
                {/* Quantity badge */}
                {inCart && (
                  <div className="absolute -top-1.5 -right-1.5 min-w-[22px] h-[22px] px-1 rounded-full flex items-center justify-center text-[10px] font-extrabold shadow-md z-10 text-primary-foreground"
                    style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}>
                    {inCart.qty}
                  </div>
                )}

                {/* Barcode on hover */}
                <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setBarcodeModalProduct(p); }}
                    className="w-6 h-6 bg-muted/80 backdrop-blur-sm rounded-md flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <ScanLine className="w-3 h-3" />
                  </button>
                </div>

                {/* Content */}
                <div className="text-[10px] font-bold text-muted-foreground/60 font-mono mb-1.5 tracking-wide">{p.cod}</div>
                <div className="font-bold text-[12.5px] leading-snug mb-2 line-clamp-2 min-h-[32px] text-foreground">{p.nome}</div>

                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <div className="font-display text-primary text-[17px] font-bold leading-none">{fmt(p.preco)}</div>
                    <div className={`text-[10px] mt-1 font-semibold flex items-center gap-0.5 ${isCritical ? 'text-destructive' : 'text-muted-foreground/60'}`}>
                      <Package className="w-2.5 h-2.5" />
                      {p.est} un.{isCritical && ' ⚠'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="w-8 h-8 rounded-lg bg-primary/8 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all active:scale-90"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══════════ RIGHT — Cart Panel ═══════════ */}
      <div className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-border/50" style={{ background: 'linear-gradient(180deg, hsl(0,0%,100%) 0%, hsl(145,15%,98%) 100%)' }}>
        {/* Cart Header — dark gradient */}
        <div className="px-5 py-4 shrink-0 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(152,65%,12%), hsl(148,61%,22%), hsl(152,50%,28%))' }}>
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} />

          <div className="relative flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Receipt className="w-4 h-4 text-white/80" />
                </div>
                <div>
                  <h3 className="font-display text-[17px] text-white leading-tight tracking-wide">Venda Actual</h3>
                  <p className="text-[10px] text-white/40 font-semibold mt-0.5">Madalena Bal Farmácia</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="w-8 h-8 rounded-lg bg-white/8 text-white/40 hover:bg-red-500/20 hover:text-red-300 transition-all flex items-center justify-center" title="Limpar carrinho">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="bg-white/12 backdrop-blur-sm rounded-lg px-3 py-2 flex items-baseline gap-1">
                <span className="text-[22px] font-extrabold text-white leading-none">{totalItens}</span>
                <span className="text-[9px] text-white/50 font-bold uppercase tracking-wide">itens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client selection */}
        <div className="px-4 py-3 border-b border-border bg-card/50">
          <div className="flex items-center gap-1.5 mb-1.5">
            <User className="w-3 h-3 text-muted-foreground/60" />
            <span className="text-[9px] font-extrabold text-muted-foreground/60 uppercase tracking-[1px]">Cliente vinculado</span>
          </div>
          {clienteSel ? (
            <div className="flex items-center justify-between bg-gradient-to-r from-[hsl(148,40%,96%)] to-[hsl(148,30%,98%)] rounded-xl px-3.5 py-2.5 border border-primary/15">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground font-bold text-[11px]" style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}>
                  {clienteSel.nome.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-bold text-[12.5px] text-foreground block leading-tight">{clienteSel.nome}</span>
                  <span className="text-[10px] text-accent font-bold flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> {clienteSel.pontos} pontos fidelidade
                  </span>
                </div>
              </div>
              <button onClick={() => { setClienteSel(null); setClienteSearch(''); }} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/40" />
              <input
                value={clienteSearch}
                onChange={e => { setClienteSearch(e.target.value); setClienteDropdown(true); }}
                onFocus={() => setClienteDropdown(true)}
                onBlur={() => setTimeout(() => setClienteDropdown(false), 200)}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-[12px] outline-none bg-background focus:border-primary focus:shadow-[0_0_0_2px_hsl(148_61%_26%/0.06)] transition-all placeholder:text-muted-foreground/40"
                placeholder="Buscar cliente..."
              />
              {clienteDropdown && clienteSearch && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-xl mt-1 z-20 max-h-[150px] overflow-y-auto">
                  {filteredClientes.length === 0 ? (
                    <div className="px-3 py-3 text-[11px] text-muted-foreground text-center">Nenhum cliente encontrado</div>
                  ) : filteredClientes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setClienteSel(c); setClienteSearch(''); setClienteDropdown(false); }}
                      className="w-full text-left px-3.5 py-2.5 text-[12px] hover:bg-muted/50 transition-colors flex items-center justify-between gap-2 border-b border-border/50 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[9px]">{c.nome.charAt(0)}</div>
                        <span className="font-bold">{c.nome}</span>
                      </div>
                      <span className="text-accent font-bold text-[10px]">{c.pontos} pts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-16 px-5 text-center text-muted-foreground">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-muted/40 flex items-center justify-center border border-border/50">
                <ShoppingBag className="w-9 h-9 opacity-20" />
              </div>
              <p className="font-bold text-[14px] text-foreground/60">Carrinho vazio</p>
              <p className="text-[11px] mt-1.5 text-muted-foreground/60 max-w-[200px] mx-auto leading-relaxed">
                Selecione produtos à esquerda ou escaneie um código de barras
              </p>
            </div>
          ) : cart.map((it, idx) => {
            const finalPrice = getItemFinalPrice(it);
            const hasDiscount = it.desconto && it.desconto > 0;
            return (
              <div key={it.id} className={`px-4 py-3 border-b border-border/50 hover:bg-primary/[0.02] transition-colors ${idx === 0 ? 'border-t-0' : ''}`}>
                <div className="flex items-start gap-2.5">
                  {/* Item index */}
                  <div className="w-5 h-5 rounded-md bg-primary/8 flex items-center justify-center text-[9px] font-extrabold text-primary shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[12.5px] leading-tight truncate text-foreground">{it.nome.split('—')[0].trim()}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground font-mono">{fmt(it.preco)} × {it.qty}</span>
                      {hasDiscount && (
                        <span className="text-[9px] font-bold text-destructive bg-destructive/8 px-1.5 py-0.5 rounded-md">
                          −{it.descontoTipo === '%' ? `${it.desconto}%` : fmt(it.desconto!)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Price */}
                  <div className={`text-[13px] font-bold shrink-0 ${hasDiscount ? 'text-accent' : 'text-foreground'}`}>
                    {fmt(finalPrice)}
                  </div>
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between mt-2 ml-[30px]">
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => changeQty(it.id, -1)} className="w-6 h-6 border border-border rounded-md bg-background flex items-center justify-center hover:bg-destructive/10 hover:border-destructive/30 hover:text-destructive transition-all">
                      <Minus className="w-2.5 h-2.5" />
                    </button>
                    <span className="font-extrabold text-[12px] min-w-[28px] text-center tabular-nums">{it.qty}</span>
                    <button onClick={() => changeQty(it.id, 1)} className="w-6 h-6 border border-border rounded-md bg-background flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all">
                      <Plus className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => setEditingDiscount(editingDiscount === it.id ? null : it.id)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${editingDiscount === it.id ? 'bg-accent/15 text-accent' : 'text-muted-foreground/40 hover:text-accent hover:bg-accent/8'}`} title="Desconto">
                      <Percent className="w-2.5 h-2.5" />
                    </button>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== it.id))}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/8 transition-all" title="Remover">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>

                {/* Inline discount editor */}
                {editingDiscount === it.id && (
                  <div className="flex items-center gap-1.5 mt-2 ml-[30px] bg-accent/5 border border-accent/15 rounded-lg p-2 animate-fade-in">
                    <input
                      value={itemDesconto}
                      onChange={e => setItemDesconto(e.target.value)}
                      type="number" min="0" step="0.01"
                      className="w-20 py-1.5 px-2.5 border border-border rounded-md text-[11px] outline-none bg-background focus:border-primary"
                      placeholder="Valor"
                      autoFocus
                    />
                    <button onClick={() => setItemDescontoTipo(itemDescontoTipo === '%' ? 'Kz' : '%')}
                      className="px-2 py-1.5 rounded-md text-[10px] font-bold border border-border bg-background hover:bg-muted transition-colors min-w-[28px]">
                      {itemDescontoTipo}
                    </button>
                    <button onClick={() => applyItemDiscount(it.id)}
                      className="px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-primary text-primary-foreground hover:opacity-90 transition-colors">
                      OK
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Cart Footer ── */}
        <div className="shrink-0 border-t border-border">
          {/* General discount */}
          {cart.length > 0 && (
            <div className="px-4 pt-3 pb-0">
              <div className="flex items-center gap-2 bg-muted/30 border border-border/50 rounded-lg p-2">
                <Tag className="w-3 h-3 text-muted-foreground/50 shrink-0" />
                <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap">Desc. geral</span>
                <input
                  value={descontoGeral}
                  onChange={e => setDescontoGeral(e.target.value)}
                  type="number" min="0" step="0.01"
                  className="flex-1 min-w-0 py-1 px-2 border border-border rounded-md text-[11px] outline-none bg-background focus:border-primary"
                  placeholder="0"
                />
                <button onClick={() => setDescontoGeralTipo(descontoGeralTipo === '%' ? 'Kz' : '%')}
                  className="px-2 py-1 rounded-md text-[9px] font-bold border border-border bg-background hover:bg-muted transition-colors min-w-[28px]">
                  {descontoGeralTipo}
                </button>
              </div>
            </div>
          )}

          {/* Totals section */}
          <div className="px-4 py-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[11.5px] text-muted-foreground">
                <span>Subtotal ({totalItens} {totalItens === 1 ? 'item' : 'itens'})</span>
                <span className="font-semibold tabular-nums">{fmt(subtotal)}</span>
              </div>
              {descontoGeralVal > 0 && (
                <div className="flex justify-between text-[11.5px] text-destructive font-semibold">
                  <span>Desconto</span>
                  <span className="tabular-nums">− {fmt(descontoGeralVal)}</span>
                </div>
              )}
            </div>

            {/* Total display */}
            <div className="flex justify-between items-end pt-3 mt-2.5 border-t-2 border-dashed border-border">
              <div>
                <span className="text-[9px] font-extrabold text-muted-foreground/50 uppercase tracking-[1.5px] block mb-0.5">Total a pagar</span>
                <span className="font-display text-[32px] text-primary font-bold leading-none tracking-tight">{fmt(total)}</span>
              </div>
              {clienteSel && total > 0 && (
                <div className="flex items-center gap-1 text-[10px] text-accent font-bold bg-accent/8 px-2 py-1 rounded-md">
                  <Sparkles className="w-3 h-3" />
                  +{Math.floor(total / 500)} pts
                </div>
              )}
            </div>
          </div>

          {/* Finalize button */}
          <div className="px-4 pb-4">
            <button
              onClick={openPgto}
              disabled={cart.length === 0}
              className="w-full py-4 rounded-xl border-none font-bold text-[15px] text-primary-foreground tracking-wide shadow-lg hover:-translate-y-px hover:shadow-xl active:translate-y-0 transition-all disabled:bg-muted disabled:text-muted-foreground/50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2.5"
              style={{ background: cart.length > 0 ? 'linear-gradient(135deg, hsl(148,61%,22%), hsl(148,61%,28%), hsl(90,55%,38%))' : undefined }}
            >
              <CreditCard className="w-5 h-5" />
              Finalizar Venda
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════ PAYMENT MODAL ═══════════ */}
      <Modal open={pgtoOpen} onClose={() => setPgtoOpen(false)} width="w-[520px]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-primary-foreground shadow-md"
            style={{ background: 'linear-gradient(135deg, hsl(148,61%,22%), hsl(90,55%,38%))' }}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-display text-xl text-primary leading-tight">Pagamento</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Selecione a forma de pagamento</p>
          </div>
        </div>

        {clienteSel && (
          <div className="flex items-center gap-2.5 mb-4 bg-gradient-to-r from-[hsl(148,40%,96%)] to-transparent rounded-xl px-4 py-2.5 border border-primary/10">
            <User className="w-4 h-4 text-primary/60" />
            <span className="text-[12.5px] font-bold text-foreground">{clienteSel.nome}</span>
            <span className="text-[10px] text-accent font-bold ml-auto flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {clienteSel.pontos} pts · +{Math.floor(total / 500)} novos
            </span>
          </div>
        )}

        {/* Total display */}
        <div className="rounded-2xl p-6 text-center mb-5 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(152,65%,12%), hsl(148,61%,22%), hsl(148,50%,30%))' }}>
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '16px 16px' }} />
          <p className="relative text-white/50 text-[12px] font-semibold mb-1 uppercase tracking-widest">Total a Pagar</p>
          <div className="relative font-display text-[46px] font-bold text-white leading-none tracking-tight">{fmt(total)}</div>
          {descontoGeralVal > 0 && <p className="relative text-white/30 text-[11px] mt-2 line-through">{fmt(subtotal)}</p>}
        </div>

        {/* Payment methods */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          {paymentMethods.map(({ name, icon: Icon, color }) => (
            <button
              key={name}
              onClick={() => { setPgtoSel(name); if (name !== 'Dinheiro') setRecebido(''); }}
              className={`border-2 rounded-xl py-3.5 px-2.5 flex flex-col items-center gap-2 text-[11px] font-bold transition-all leading-tight ${
                pgtoSel === name
                  ? 'border-primary bg-primary/5 text-primary shadow-sm scale-[1.02]'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/30 hover:text-foreground'
              }`}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: pgtoSel === name ? `${color}18` : 'hsl(var(--muted))' }}>
                <Icon className="w-4 h-4" style={{ color: pgtoSel === name ? color : undefined }} />
              </div>
              {name}
            </button>
          ))}
        </div>

        {/* Cash input */}
        {pgtoSel === 'Dinheiro' && (
          <div className="bg-muted/20 border border-border rounded-xl p-4 animate-fade-in">
            <label className="block text-[10px] font-extrabold text-muted-foreground/60 uppercase tracking-wider mb-2">Valor Recebido (Kz)</label>
            <input
              type="number" value={recebido} onChange={e => setRecebido(e.target.value)}
              className="w-full py-3.5 px-4 border-2 border-border rounded-xl font-body text-[16px] outline-none bg-background focus:border-primary transition-all font-bold tabular-nums"
              step="0.01" placeholder="0,00" autoFocus
            />
            <div className="mt-3 rounded-xl px-4 py-3.5 flex justify-between items-center border"
              style={{
                background: troco >= 0 ? 'hsl(148,40%,96%)' : 'hsl(0,80%,97%)',
                borderColor: troco >= 0 ? 'hsl(148,40%,85%)' : 'hsl(0,60%,90%)'
              }}>
              <span className="font-bold text-[12px]" style={{ color: troco >= 0 ? 'hsl(148,61%,26%)' : 'hsl(0,70%,50%)' }}>
                {troco >= 0 ? '💰 Troco' : '⚠ Falta'}
              </span>
              <span className="font-display text-[24px] font-bold leading-none"
                style={{ color: troco >= 0 ? 'hsl(148,61%,26%)' : 'hsl(0,70%,50%)' }}>
                {fmt(Math.abs(troco >= 0 ? troco : total - parseFloat(recebido || '0')))}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-2.5 justify-end mt-5 pt-4 border-t border-border">
          <button onClick={() => setPgtoOpen(false)} className="bg-background text-foreground border border-border rounded-xl px-5 py-2.5 text-[12.5px] font-bold hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={confirm} disabled={!canConfirm}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-[12.5px] font-bold text-primary-foreground shadow-md hover:shadow-lg hover:-translate-y-px transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            style={{ background: canConfirm ? 'linear-gradient(135deg, hsl(148,61%,22%), hsl(90,55%,38%))' : 'hsl(var(--muted))' }}
          >
            <Check className="w-4 h-4" /> Confirmar Venda
          </button>
        </div>
      </Modal>

      {/* ═══════════ RECEIPT MODAL ═══════════ */}
      <Modal open={reciboOpen} onClose={novaVenda} width="w-[440px]">
        {/* Success header */}
        <div className="text-center mb-4">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-primary-foreground shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(90,60%,41%), hsl(148,61%,26%))' }}>
            <Check className="w-8 h-8" strokeWidth={3} />
          </div>
          <h3 className="font-display text-xl text-primary">Venda Concluída!</h3>
          <p className="text-[12px] text-muted-foreground mt-0.5">Recibo da transação</p>
        </div>

        {lastSale && (
          <div id="recibo-print" className="bg-background border border-border rounded-xl p-5 font-mono text-[12px] text-center my-3 shadow-inner">
            {/* Store info */}
            <div className="pb-3 border-b-2 border-dashed border-border mb-3">
              <h4 className="font-display text-[16px] text-primary font-bold mb-0.5">Madalena Bal Farmácia</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed">NIF: 5000947253<br />Luanda — Angola</p>
            </div>

            {/* Transaction info */}
            <div className="flex justify-between text-[10px] text-muted-foreground mb-3 px-1">
              <span>{new Date(lastSale.data).toLocaleDateString('pt-BR')} · {new Date(lastSale.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              <span>Nº {lastSale.id.toString().slice(-6)}</span>
            </div>

            {lastSale.clienteNome && (
              <div className="text-[10px] text-primary font-bold mb-3 bg-primary/5 rounded-md py-1.5">
                Cliente: {lastSale.clienteNome}
              </div>
            )}

            {/* Items */}
            <div className="border-t border-dashed border-border pt-2 mb-2 space-y-0.5">
              {lastSale.itens.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1 text-left text-[11px]">
                  <span className="truncate max-w-[220px]">{i.nome.split('—')[0].trim()} ×{i.qty}</span>
                  <span className="font-semibold tabular-nums">{fmt(i.preco * i.qty)}</span>
                </div>
              ))}
            </div>

            {lastSale.subtotal && lastSale.subtotal !== lastSale.total && (
              <div className="border-t border-dashed border-border pt-2 mb-1 space-y-0.5">
                <div className="flex justify-between text-[11px]"><span>Subtotal</span><span className="tabular-nums">{fmt(lastSale.subtotal)}</span></div>
                <div className="flex justify-between text-[11px] text-destructive"><span>Desconto</span><span className="tabular-nums">− {fmt(lastSale.subtotal - lastSale.total)}</span></div>
              </div>
            )}

            {/* Total */}
            <div className="flex justify-between py-3 font-extrabold text-[15px] border-t-2 border-foreground mt-2">
              <span>TOTAL</span><span className="text-primary tabular-nums">{fmt(lastSale.total)}</span>
            </div>

            <div className="border-t border-dashed border-border pt-2 mt-1">
              <div className="flex justify-between text-[11px]"><span>Pagamento</span><span className="font-bold">{lastSale.pgto}</span></div>
            </div>

            <p className="mt-4 text-[10px] text-muted-foreground font-body leading-relaxed">
              Obrigado pela preferência!<br />
              <span className="text-[9px] opacity-60">Madalena Bal Farmácia — Luanda, Angola</span>
            </p>
          </div>
        )}

        <div className="flex gap-2.5 justify-end pt-3">
          <button onClick={() => {
            const printContent = document.getElementById('recibo-print');
            if (!printContent) return;
            const win = window.open('', '_blank', 'width=420,height=600');
            if (!win) return;
            win.document.write(`<html><head><title>Recibo — Madalena Bal</title><style>
              body{font-family:'Courier New',monospace;padding:20px;font-size:13px;text-align:center;max-width:380px;margin:0 auto;color:#222}
              .title,.font-display{font-family:Georgia,serif;font-size:18px;font-weight:bold;color:#1a6b3c}
              .total-row{font-size:16px;font-weight:800;border-top:2px solid #000;padding:8px 0;margin-top:4px}
              .item-row{display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #ccc;text-align:left;font-size:12px}
              .sep{border-top:2px dashed #ccc;padding-top:8px;margin-top:4px}
              .sub{font-size:11px;color:#666}
              .discount{color:#c00}
              @media print{body{padding:10px;margin:0}}
            </style></head><body>${printContent.innerHTML}</body></html>`);
            win.document.close();
            win.focus();
            win.print();
            win.close();
          }}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12.5px] font-bold border border-border bg-card text-foreground hover:bg-muted transition-all"
          >
            <Printer className="w-4 h-4" /> Imprimir
          </button>
          <button onClick={novaVenda}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[12.5px] font-bold text-primary-foreground transition-all hover:shadow-lg hover:-translate-y-px shadow-md"
            style={{ background: 'linear-gradient(135deg, hsl(148,61%,22%), hsl(90,55%,38%))' }}
          >
            <Plus className="w-4 h-4" /> Nova Venda
          </button>
        </div>
      </Modal>

      {/* Barcode View Modal */}
      <Modal open={!!barcodeModalProduct} onClose={() => setBarcodeModalProduct(null)} width="w-[380px]">
        {barcodeModalProduct && (
          <div className="text-center">
            <h3 className="font-display text-lg text-primary mb-1">{barcodeModalProduct.nome.split('—')[0].trim()}</h3>
            <p className="text-[11px] text-muted-foreground mb-4 font-mono">{barcodeModalProduct.cod}</p>
            <div className="flex justify-center mb-4 bg-white rounded-xl p-4 border border-border">
              <Barcode value={barcodeModalProduct.cod} format="CODE128" width={2} height={80} fontSize={14} background="#ffffff" lineColor="#0f2118" />
            </div>
            <p className="text-[11px] text-muted-foreground font-semibold">Código de barras do produto</p>
          </div>
        )}
      </Modal>

      {scannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
