import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Minus, X, ShoppingBag, CreditCard, Check, Camera, ScanLine, Search, Percent, Trash2, Tag, User, Gift, Banknote, Smartphone, Building, Heart, ChevronRight, Package } from 'lucide-react';
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
  { name: 'Dinheiro', icon: Banknote },
  { name: 'Multicaixa Express', icon: Smartphone },
  { name: 'TPA Débito', icon: CreditCard },
  { name: 'TPA Crédito', icon: CreditCard },
  { name: 'Convênio', icon: Building },
  { name: 'Transferência Bancária', icon: Building },
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
    <div className="grid grid-cols-[1fr_420px] gap-5" style={{ height: 'calc(100vh - 180px)' }}>
      {/* Left - Product Grid */}
      <div className="flex flex-col gap-3 overflow-hidden">
        {/* Search bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
            <input
              ref={searchRef}
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full py-3.5 pl-12 pr-4 border-2 border-border rounded-2xl font-body text-[15px] outline-none bg-card focus:border-primary focus:shadow-[0_0_0_4px_hsl(148_61%_26%/0.08)] transition-all placeholder:text-muted-foreground/60"
              placeholder="Buscar produto por nome ou código..."
            />
          </div>
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:bg-[hsl(var(--primary-dark))] hover:shadow-lg transition-all shrink-0 active:scale-[0.97]"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden xl:inline">Escanear</span>
          </button>
        </div>

        {/* Scanner hint */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-[hsl(var(--accent-light))] rounded-xl text-xs font-semibold text-[hsl(var(--accent))]">
          <ScanLine className="w-4 h-4 shrink-0" />
          <span>Leitor USB/Bluetooth ativo — escaneie um código de barras ou pressione Enter</span>
        </div>

        {/* Category filter chips */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCat(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              !selectedCat
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'
            }`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedCat === cat
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 overflow-y-auto pb-2 pr-1" style={{ alignContent: 'start' }}>
          {available.length === 0 ? (
            <div className="col-span-3 text-center py-20 text-muted-foreground">
              <Package className="w-14 h-14 mx-auto mb-3 opacity-20" />
              <p className="font-bold text-[15px]">Nenhum produto encontrado</p>
              <p className="text-xs mt-1">Tente buscar por outro termo</p>
            </div>
          ) : available.map(p => {
            const inCart = cart.find(i => i.id === p.id);
            const isCritical = p.est <= p.min;
            return (
              <div
                key={p.id}
                onClick={() => addToCart(p)}
                className={`relative bg-card border-2 rounded-2xl p-4 cursor-pointer transition-all group hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm ${
                  inCart ? 'border-primary bg-[hsl(148_40%_97%)]' : 'border-border hover:border-primary/50'
                }`}
              >
                {/* In cart indicator */}
                {inCart && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[11px] font-extrabold shadow-md z-10">
                    {inCart.qty}
                  </div>
                )}

                {/* Category tag */}
                <div className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-[hsl(var(--accent))] bg-[hsl(var(--accent-light))] px-2 py-0.5 rounded-md mb-2.5">
                  <Tag className="w-2.5 h-2.5" />
                  {p.cat}
                </div>

                {/* Action buttons on hover */}
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setBarcodeModalProduct(p); }}
                    className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground hover:bg-foreground hover:text-background transition-colors"
                  >
                    <ScanLine className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="font-bold text-[13px] leading-snug mb-0.5 line-clamp-2 min-h-[36px]">{p.nome}</div>
                <div className="text-[10.5px] text-muted-foreground font-mono mb-3">{p.cod}</div>

                <div className="flex items-end justify-between">
                  <div>
                    <div className="font-display text-primary text-lg font-bold leading-none">{fmt(p.preco)}</div>
                    <div className={`text-[10.5px] mt-1 font-semibold ${isCritical ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {p.est} un.{isCritical && ' ⚠️'}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all group-hover:scale-105"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right - Cart Panel */}
      <div className="flex flex-col rounded-2xl border-2 border-border shadow-xl overflow-hidden bg-card">
        {/* Cart Header */}
        <div className="px-5 py-5 shrink-0" style={{ background: 'linear-gradient(145deg, hsl(152,61%,15%), hsl(148,61%,26%))' }}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-display text-[19px] text-white leading-tight">Carrinho</h3>
              <p className="text-[11px] text-white/50 mt-0.5">Madalena Bal Farmácia</p>
            </div>
            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button onClick={() => setCart([])} className="text-white/40 hover:text-white transition-colors p-1" title="Limpar">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="bg-white/15 backdrop-blur-sm rounded-lg px-3 py-1.5 text-white">
                <span className="text-[20px] font-extrabold leading-none">{totalItens}</span>
                <span className="text-[10px] ml-1 opacity-70">itens</span>
              </div>
            </div>
          </div>
        </div>

        {/* Client selection */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1.5">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider">Cliente</span>
          </div>
          {clienteSel ? (
            <div className="flex items-center justify-between bg-[hsl(148_40%_95%)] rounded-xl px-3.5 py-2.5 border border-primary/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {clienteSel.nome.charAt(0)}
                </div>
                <div>
                  <span className="font-bold text-[13px] text-foreground block leading-tight">{clienteSel.nome}</span>
                  <span className="text-[11px] text-[hsl(var(--accent))] font-bold flex items-center gap-1">
                    <Heart className="w-3 h-3" /> {clienteSel.pontos} pontos
                  </span>
                </div>
              </div>
              <button onClick={() => { setClienteSel(null); setClienteSearch(''); }} className="text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={clienteSearch}
                onChange={e => { setClienteSearch(e.target.value); setClienteDropdown(true); }}
                onFocus={() => setClienteDropdown(true)}
                onBlur={() => setTimeout(() => setClienteDropdown(false), 200)}
                className="w-full pl-9 pr-3 py-2.5 border border-border rounded-xl text-xs outline-none bg-background focus:border-primary focus:bg-card transition-all placeholder:text-muted-foreground/50"
                placeholder="Buscar por nome ou telefone..."
              />
              {clienteDropdown && clienteSearch && (
                <div className="absolute top-full left-0 right-0 bg-card border border-border rounded-xl shadow-xl mt-1 z-10 max-h-[150px] overflow-y-auto">
                  {filteredClientes.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-muted-foreground text-center">Nenhum cliente encontrado</div>
                  ) : filteredClientes.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setClienteSel(c); setClienteSearch(''); setClienteDropdown(false); }}
                      className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-muted transition-colors flex items-center justify-between gap-2 border-b border-border last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-[10px]">{c.nome.charAt(0)}</div>
                        <span className="font-bold">{c.nome}</span>
                      </div>
                      <span className="text-[hsl(var(--accent))] font-bold">{c.pontos} pts</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-16 px-5 text-center text-muted-foreground">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 opacity-30" />
              </div>
              <p className="font-bold text-sm">Carrinho vazio</p>
              <span className="text-xs mt-1.5 block text-muted-foreground/70">Clique em um produto ou escaneie o código de barras</span>
            </div>
          ) : cart.map((it, idx) => {
            const finalPrice = getItemFinalPrice(it);
            const hasDiscount = it.desconto && it.desconto > 0;
            return (
              <div key={it.id} className={`px-4 py-3.5 border-b border-border hover:bg-muted/30 transition-colors ${idx === 0 ? '' : ''}`}>
                <div className="flex items-start gap-3">
                  {/* Item number */}
                  <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0 mt-0.5">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-[13px] leading-tight truncate">{it.nome.split('—')[0].trim()}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {fmt(it.preco)} × {it.qty}
                      {hasDiscount && (
                        <span className="ml-1.5 text-destructive font-bold">
                          -{it.descontoTipo === '%' ? `${it.desconto}%` : fmt(it.desconto!)}
                        </span>
                      )}
                    </div>
                    <div className={`text-[13px] font-bold mt-0.5 ${hasDiscount ? 'text-[hsl(var(--accent))]' : 'text-foreground'}`}>
                      {fmt(finalPrice)}
                    </div>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => changeQty(it.id, -1)} className="w-7 h-7 border border-border rounded-lg bg-background flex items-center justify-center hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-all">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="font-extrabold text-sm min-w-[24px] text-center">{it.qty}</span>
                    <button onClick={() => changeQty(it.id, 1)} className="w-7 h-7 border border-border rounded-lg bg-background flex items-center justify-center hover:bg-primary/10 hover:border-primary hover:text-primary transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button onClick={() => setEditingDiscount(editingDiscount === it.id ? null : it.id)} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent-light))] transition-colors" title="Desconto">
                      <Percent className="w-3 h-3" />
                    </button>
                    <button onClick={() => setCart(prev => prev.filter(i => i.id !== it.id))} className="w-6 h-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-[hsl(var(--destructive-light))] transition-colors" title="Remover">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Inline discount editor */}
                {editingDiscount === it.id && (
                  <div className="flex items-center gap-1.5 mt-2.5 ml-9 bg-muted/50 rounded-lg p-2">
                    <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      value={itemDesconto}
                      onChange={e => setItemDesconto(e.target.value)}
                      type="number" min="0" step="0.01"
                      className="w-20 py-1.5 px-2.5 border border-border rounded-lg text-xs outline-none bg-background focus:border-primary"
                      placeholder="Valor"
                      autoFocus
                    />
                    <button onClick={() => setItemDescontoTipo(itemDescontoTipo === '%' ? 'Kz' : '%')}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-border bg-background hover:bg-card transition-colors min-w-[32px]">
                      {itemDescontoTipo}
                    </button>
                    <button onClick={() => applyItemDiscount(it.id)}
                      className="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-primary text-primary-foreground hover:bg-[hsl(var(--primary-dark))] transition-colors">
                      Aplicar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Cart Footer */}
        <div className="px-4 py-4 border-t-2 border-border shrink-0 bg-[hsl(145_12%_97%)]">
          {/* General discount */}
          {cart.length > 0 && (
            <div className="flex items-center gap-2 mb-3 bg-muted/50 rounded-xl p-2.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-[10.5px] font-bold text-muted-foreground whitespace-nowrap">Desconto geral</span>
              <input
                value={descontoGeral}
                onChange={e => setDescontoGeral(e.target.value)}
                type="number" min="0" step="0.01"
                className="flex-1 min-w-0 py-1.5 px-2.5 border border-border rounded-lg text-xs outline-none bg-background focus:border-primary"
                placeholder="0"
              />
              <button onClick={() => setDescontoGeralTipo(descontoGeralTipo === '%' ? 'R$' : '%')}
                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border border-border bg-background hover:bg-card transition-colors min-w-[32px]">
                {descontoGeralTipo}
              </button>
            </div>
          )}

          {/* Totals */}
          <div className="space-y-1.5 mb-4">
            <div className="flex justify-between text-[12.5px] text-muted-foreground">
              <span>Subtotal ({totalItens} itens)</span>
              <span className="font-semibold">{fmt(subtotal)}</span>
            </div>
            {(descontoGeralVal > 0) && (
              <div className="flex justify-between text-[12.5px] text-destructive font-semibold">
                <span>Desconto</span>
                <span>- {fmt(descontoGeralVal)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 mt-2 border-t-2 border-dashed border-border">
              <span className="text-sm font-bold text-muted-foreground">TOTAL</span>
              <span className="font-display text-[30px] text-primary font-bold leading-none">{fmt(total)}</span>
            </div>
          </div>

          {/* Finalize button */}
          <button
            onClick={openPgto}
            disabled={cart.length === 0}
            className="w-full py-4 rounded-2xl border-none font-display text-[17px] font-bold text-primary-foreground tracking-wide shadow-lg hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 flex items-center justify-center gap-2"
            style={{ background: cart.length > 0 ? 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' : undefined }}
          >
            <CreditCard className="w-5 h-5" />
            Finalizar Venda
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={pgtoOpen} onClose={() => setPgtoOpen(false)} width="w-[520px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[hsl(148_40%_93%)] rounded-2xl flex items-center justify-center text-primary">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl text-primary">Finalizar Venda</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Selecione a forma de pagamento</p>
          </div>
        </div>
        {clienteSel && (
          <div className="flex items-center gap-2.5 mb-4 bg-[hsl(148_40%_95%)] rounded-xl px-4 py-2.5 border border-primary/15">
            <User className="w-4 h-4 text-primary" />
            <span className="text-[13px] font-bold text-foreground">{clienteSel.nome}</span>
            <span className="text-[11px] text-[hsl(var(--accent))] font-bold ml-auto">{clienteSel.pontos} pts · +{Math.floor(total / 500)} novos</span>
          </div>
        )}
        <div className="rounded-2xl p-6 text-center mb-6" style={{ background: 'linear-gradient(145deg, hsl(152,61%,15%), hsl(148,61%,26%), hsl(90,60%,41%))' }}>
          <p className="text-white/60 text-[13px] font-semibold mb-1">Total a Pagar</p>
          <div className="font-display text-[44px] font-bold text-white leading-none">{fmt(total)}</div>
          {descontoGeralVal > 0 && <p className="text-white/40 text-xs mt-2 line-through">{fmt(subtotal)}</p>}
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          {paymentMethods.map(({ name, icon: Icon }) => (
            <button
              key={name}
              onClick={() => { setPgtoSel(name); if (name !== 'Dinheiro') setRecebido(''); }}
              className={`border-2 rounded-2xl py-4 px-3 flex flex-col items-center gap-2 text-[12px] font-bold transition-all ${
                pgtoSel === name
                  ? 'border-primary bg-[hsl(148_40%_93%)] text-primary shadow-sm'
                  : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-primary'
              }`}
            >
              <Icon className="w-5 h-5" />
              {name}
            </button>
          ))}
        </div>
        {pgtoSel === 'Dinheiro' && (
          <div className="bg-muted/30 rounded-2xl p-4">
            <label className="block text-[11px] font-extrabold text-muted-foreground uppercase tracking-wider mb-2">Valor Recebido (Kz)</label>
            <input
              type="number" value={recebido} onChange={e => setRecebido(e.target.value)}
              className="w-full py-3 px-4 border-2 border-border rounded-xl font-body text-base outline-none bg-background focus:border-primary transition-all mb-3"
              step="0.01" placeholder="0,00" autoFocus
            />
            <div className="bg-[hsl(148_40%_93%)] border border-primary/20 rounded-xl px-4 py-3.5 flex justify-between items-center">
              <span className="font-bold text-sm text-primary">💰 Troco</span>
              <span className="font-display text-[24px] font-bold text-primary">{fmt(troco >= 0 ? troco : 0)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setPgtoOpen(false)} className="bg-background text-foreground border border-border rounded-xl px-5 py-2.5 text-[13px] font-bold hover:bg-muted transition-colors">
            Cancelar
          </button>
          <button onClick={confirm} disabled={!canConfirm}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-primary-foreground hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: canConfirm ? 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' : 'hsl(var(--muted))' }}
          >
            <Check className="w-4 h-4" /> Confirmar Venda
          </button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal open={reciboOpen} onClose={novaVenda} width="w-[440px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, hsl(90,60%,41%), hsl(148,61%,26%))' }}>
            <Check className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display text-xl text-[hsl(var(--accent))]">Venda Confirmada!</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Recibo da transação</p>
          </div>
        </div>
        {lastSale && (
          <div className="bg-card border-2 border-dashed border-border rounded-2xl p-6 font-mono text-[13px] text-center my-4">
            <h4 className="font-display text-lg text-primary mb-1">Madalena Bal Farmácia</h4>
            <p className="text-[11px] text-muted-foreground">NIF: 5000947253</p>
            <p className="text-[11px] text-muted-foreground">Luanda — Angola</p>
            <p className="text-[11px] text-muted-foreground">Data: {new Date(lastSale.data).toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-muted-foreground mb-3">Venda #{lastSale.id.toString().slice(-6)}</p>
            {lastSale.clienteNome && <p className="text-[11px] text-primary font-bold mb-2">Cliente: {lastSale.clienteNome}</p>}
            <div className="border-t-2 border-dashed border-border pt-3 mb-2">
              {lastSale.itens.map((i, idx) => (
                <div key={idx} className="flex justify-between py-1 border-b border-dashed border-muted text-left text-[12px]">
                  <span className="truncate max-w-[200px]">{i.nome.split('—')[0].trim()} ×{i.qty}</span>
                  <span className="font-semibold">{fmt(i.preco * i.qty)}</span>
                </div>
              ))}
            </div>
            {lastSale.subtotal && lastSale.subtotal !== lastSale.total && (
              <>
                <div className="flex justify-between py-1 text-[12px]"><span>Subtotal</span><span>{fmt(lastSale.subtotal)}</span></div>
                <div className="flex justify-between py-1 text-[12px] text-destructive"><span>Desconto</span><span>- {fmt(lastSale.subtotal - lastSale.total)}</span></div>
              </>
            )}
            <div className="flex justify-between py-3 font-extrabold text-[16px] border-t-2 border-foreground mt-1">
              <span>TOTAL</span><span className="text-primary">{fmt(lastSale.total)}</span>
            </div>
            <div className="border-t-2 border-dashed border-border pt-2 mt-1">
              <div className="flex justify-between text-[12px]"><span>Pagamento</span><span className="font-bold">{lastSale.pgto}</span></div>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground font-body">Obrigado pela preferência! 💊</p>
          </div>
        )}
        <div className="flex gap-2.5 justify-end pt-3">
          <button onClick={novaVenda}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-bold text-primary-foreground transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
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
            <p className="text-xs text-muted-foreground mb-4">{barcodeModalProduct.cod}</p>
            <div className="flex justify-center mb-4">
              <Barcode value={barcodeModalProduct.cod} format="CODE128" width={2} height={80} fontSize={14} background="#ffffff" lineColor="#0f2118" />
            </div>
            <p className="text-xs text-muted-foreground font-semibold">Código de barras do produto</p>
          </div>
        )}
      </Modal>

      {scannerOpen && <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
