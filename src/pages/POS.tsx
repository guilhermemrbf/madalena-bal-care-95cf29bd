import { useState, useRef, useCallback, useEffect } from 'react';
import { Plus, Minus, X, ShoppingBag, CreditCard, Check, Camera, ScanLine } from 'lucide-react';
import { Product, CartItem, Sale, fmt } from '@/store/useStore';
import { useToastCustom } from '@/components/Toast';
import Modal from '@/components/Modal';
import BarcodeScanner from '@/components/BarcodeScanner';
import Barcode from 'react-barcode';

interface Props {
  produtos: Product[];
  onSale: (sale: Omit<Sale, 'id'>) => Sale;
}

const paymentMethods = ['Dinheiro', 'Débito', 'Crédito', 'PIX', 'Vale Farmácia', 'Convênio'];

export default function POS({ produtos, onSale }: Props) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [pgtoOpen, setPgtoOpen] = useState(false);
  const [reciboOpen, setReciboOpen] = useState(false);
  const [pgtoSel, setPgtoSel] = useState<string | null>(null);
  const [recebido, setRecebido] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [barcodeModalProduct, setBarcodeModalProduct] = useState<Product | null>(null);
  const { showToast } = useToastCustom();
  const searchRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef(0);
  const barcodeBuffer = useRef('');

  const available = produtos.filter(p => p.est > 0 && (p.nome.toLowerCase().includes(search.toLowerCase()) || p.cod.toLowerCase().includes(search.toLowerCase())));
  const total = cart.reduce((a, i) => a + i.preco * i.qty, 0);
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
      if (product.est <= 0) {
        showToast(`${product.nome.split('—')[0].trim()} — sem estoque!`, 'error');
        return;
      }
      addToCart(product);
      setSearch('');
    } else {
      showToast(`Produto não encontrado: ${code}`, 'error');
    }
  }, [produtos, addToCart, showToast]);

  // Detect barcode scanner input (rapid keystrokes ending with Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      // Ignore if typing in other inputs (modals etc)
      if (pgtoOpen || reciboOpen || scannerOpen) return;
      
      if (e.key === 'Enter' && barcodeBuffer.current.length >= 3) {
        e.preventDefault();
        findAndAddByCode(barcodeBuffer.current);
        barcodeBuffer.current = '';
        return;
      }

      if (now - lastKeyTime.current > 100) {
        barcodeBuffer.current = '';
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
        lastKeyTime.current = now;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [findAndAddByCode, pgtoOpen, reciboOpen, scannerOpen]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && search.trim()) {
      findAndAddByCode(search);
    }
  };

  const handleScan = useCallback((code: string) => {
    findAndAddByCode(code);
  }, [findAndAddByCode]);

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

  const openPgto = () => { setPgtoSel(null); setRecebido(''); setPgtoOpen(true); };

  const troco = parseFloat(recebido) - total;
  const canConfirm = pgtoSel && (pgtoSel !== 'Dinheiro' || parseFloat(recebido) >= total);

  const confirm = () => {
    if (!pgtoSel) return;
    const sale = onSale({ data: new Date().toISOString(), itens: [...cart], pgto: pgtoSel, total });
    setLastSale(sale);
    setPgtoOpen(false);
    setReciboOpen(true);
  };

  const novaVenda = () => { setReciboOpen(false); setCart([]); };

  return (
    <div className="grid grid-cols-[1fr_380px] gap-[22px]" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Left - Product Grid */}
      <div className="flex flex-col gap-3.5 overflow-hidden">
        <div className="flex gap-2.5">
          <input
            ref={searchRef}
            value={search} onChange={e => setSearch(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 py-[13px] px-[18px] border-2 border-border rounded-xl font-body text-[15px] outline-none bg-card focus:border-primary focus:shadow-[0_0_0_4px_rgba(26,107,60,0.08)] transition-all"
            placeholder="🔍  Digite o nome, código ou use o leitor de barras..."
          />
          <button
            onClick={() => setScannerOpen(true)}
            className="flex items-center gap-2 px-4 py-[13px] bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(26,107,60,0.35)] transition-all shrink-0"
            title="Abrir leitor de código de barras"
          >
            <Camera className="w-5 h-5" />
            <span className="hidden xl:inline">Escanear</span>
          </button>
        </div>

        {/* Barcode scanner mode hint */}
        <div className="flex items-center gap-2 px-3 py-2 bg-accent-light rounded-lg text-xs font-semibold text-accent">
          <ScanLine className="w-4 h-4 shrink-0" />
          <span>Leitor USB/Bluetooth ativo — escaneie um código de barras ou pressione Enter após digitar o código</span>
        </div>

        <div className="grid grid-cols-3 gap-3 overflow-y-auto pb-2" style={{ alignContent: 'start' }}>
          {available.length === 0 ? (
            <div className="col-span-3 text-center py-16 text-muted-foreground font-bold text-[15px]">Nenhum produto disponível</div>
          ) : available.map(p => (
            <div
              key={p.id}
              className="bg-card border-2 border-border rounded-[14px] p-4 cursor-pointer hover:border-primary hover:shadow-[0_6px_20px_rgba(26,107,60,0.15)] hover:-translate-y-[3px] active:-translate-y-px transition-all relative group"
            >
              <div className="inline-block text-[10px] font-extrabold uppercase tracking-wide text-accent bg-accent-light px-2 py-0.5 rounded-full mb-2">{p.cat}</div>
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setBarcodeModalProduct(p); }}
                  className="w-7 h-7 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary hover:text-primary-foreground"
                  title="Ver código de barras"
                >
                  <ScanLine className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center text-primary-foreground text-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div onClick={() => addToCart(p)}>
                <div className="font-bold text-[13.5px] leading-tight mb-1">{p.nome}</div>
                <div className="text-[11px] text-muted-foreground mb-2.5">{p.cod}</div>
                <div className="font-display text-primary text-lg font-bold">{fmt(p.preco)}</div>
                <div className={`text-[11px] mt-0.5 ${p.est <= p.min ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                  Estoque: {p.est} un.{p.est <= p.min && ' ⚠️'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right - Cart */}
      <div className="flex flex-col bg-card rounded-lg border border-border shadow-md overflow-hidden">
        <div className="px-5 py-[18px] bg-primary text-primary-foreground shrink-0">
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-display text-[17px]">Carrinho de Venda</h3>
            <span className="bg-white/20 rounded-full px-2.5 py-0.5 text-xs font-bold">{cart.length} item(s)</span>
          </div>
          <p className="text-xs opacity-65">Madalena Bal Farmácia · NIF 5000947253</p>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-[11px] text-white/60 underline font-semibold mt-1.5 hover:text-white transition-colors">🗑 Limpar carrinho</button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="py-[50px] px-5 text-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-25" />
              <p className="font-semibold text-sm">Carrinho vazio</p>
              <span className="text-xs mt-1 block">Selecione produtos ou escaneie um código</span>
            </div>
          ) : cart.map(it => (
            <div key={it.id} className="px-[18px] py-[13px] border-b border-border flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[13px] truncate">{it.nome.split('—')[0].trim()}</div>
                <div className="text-xs text-muted-foreground">{fmt(it.preco)} × {it.qty} = <b>{fmt(it.preco * it.qty)}</b></div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => changeQty(it.id, -1)} className="w-7 h-7 border border-border rounded-lg bg-background flex items-center justify-center font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"><Minus className="w-3.5 h-3.5" /></button>
                <span className="font-extrabold text-sm min-w-[22px] text-center">{it.qty}</span>
                <button onClick={() => changeQty(it.id, 1)} className="w-7 h-7 border border-border rounded-lg bg-background flex items-center justify-center font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"><Plus className="w-3.5 h-3.5" /></button>
              </div>
              <button onClick={() => setCart(prev => prev.filter(i => i.id !== it.id))} className="p-1 rounded-md text-muted-foreground hover:text-destructive transition-colors">
                <X className="w-[15px] h-[15px]" />
              </button>
            </div>
          ))}
        </div>

        <div className="px-[18px] py-[18px] border-t-2 border-border shrink-0 bg-[#fafcfb]">
          <div className="mb-3.5">
            <div className="flex justify-between text-[13px] text-muted-foreground mb-1"><span>Subtotal</span><span>{fmt(total)}</span></div>
            <div className="flex justify-between text-[13px] text-muted-foreground"><span>Itens</span><span>{totalItens}</span></div>
            <div className="flex justify-between items-baseline border-t border-border pt-3 mt-2">
              <span className="text-sm font-bold">Total a Pagar</span>
              <span className="font-display text-[28px] text-primary font-bold">{fmt(total)}</span>
            </div>
          </div>
          <button
            onClick={openPgto} disabled={cart.length === 0}
            className="w-full py-[15px] rounded-xl border-none font-display text-[17px] font-bold text-primary-foreground tracking-wide shadow-[0_4px_16px_rgba(26,107,60,0.35)] hover:-translate-y-px hover:shadow-[0_6px_20px_rgba(26,107,60,0.45)] transition-all disabled:bg-border disabled:text-muted-foreground disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
            style={{ background: cart.length > 0 ? 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' : undefined }}
          >
            Finalizar Venda →
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal open={pgtoOpen} onClose={() => setPgtoOpen(false)} width="w-[520px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-[hsl(148,40%,93%)] rounded-xl flex items-center justify-center text-primary">
            <CreditCard className="w-[22px] h-[22px]" />
          </div>
          <div>
            <h3 className="font-display text-xl text-primary">Finalizar Venda</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Selecione a forma de pagamento</p>
          </div>
        </div>
        <div className="rounded-[14px] p-5 text-center mb-5" style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}>
          <p className="text-white/75 text-[13px] font-semibold mb-1">Total a Pagar</p>
          <div className="font-display text-[42px] font-bold text-white">{fmt(total)}</div>
        </div>
        <div className="grid grid-cols-3 gap-2.5 mb-[18px]">
          {paymentMethods.map(m => (
            <button
              key={m} onClick={() => { setPgtoSel(m); if (m !== 'Dinheiro') setRecebido(''); }}
              className={`border-2 rounded-xl py-3.5 px-2 text-center text-[12.5px] font-bold transition-all ${pgtoSel === m ? 'border-primary bg-[hsl(148,40%,93%)] text-primary' : 'border-border bg-background text-text-2 hover:border-primary hover:bg-[hsl(148,40%,93%)] hover:text-primary'}`}
            >
              {m}
            </button>
          ))}
        </div>
        {pgtoSel === 'Dinheiro' && (
          <div>
            <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Valor Recebido (R$)</label>
            <input
              type="number" value={recebido} onChange={e => setRecebido(e.target.value)}
              className="w-full py-[11px] px-[13px] border-[1.5px] border-border rounded-[10px] font-body text-sm outline-none bg-background focus:border-primary focus:bg-card transition-all mb-2.5"
              step="0.01" placeholder="0,00"
            />
            <div className="bg-[hsl(148,40%,93%)] border border-border rounded-xl px-4 py-3.5 flex justify-between items-center">
              <span className="font-bold text-sm text-primary">💰 Troco</span>
              <span className="font-display text-[22px] font-bold text-primary">{fmt(troco >= 0 ? troco : 0)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2.5 justify-end mt-6 pt-5 border-t border-border">
          <button onClick={() => setPgtoOpen(false)} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Cancelar</button>
          <button onClick={confirm} disabled={!canConfirm} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <Check className="w-4 h-4" /> Confirmar Venda
          </button>
        </div>
      </Modal>

      {/* Receipt Modal */}
      <Modal open={reciboOpen} onClose={novaVenda} width="w-[440px]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-accent-light rounded-xl flex items-center justify-center text-accent">
            <Check className="w-[22px] h-[22px]" />
          </div>
          <div>
            <h3 className="font-display text-xl text-accent">Venda Confirmada!</h3>
            <p className="text-[13px] text-muted-foreground mt-0.5">Recibo da transação</p>
          </div>
        </div>
        {lastSale && (
          <div className="bg-card border-2 border-dashed border-border rounded-xl p-5 font-mono text-[13px] text-center my-4">
            <h4 className="font-display text-lg text-primary mb-1">Madalena Bal Farmácia</h4>
            <p className="text-[11px] text-muted-foreground">NIF: 5000947253</p>
            <p className="text-[11px] text-muted-foreground">Data: {new Date(lastSale.data).toLocaleString('pt-BR')}</p>
            <p className="text-[11px] text-muted-foreground mb-3">Venda #{lastSale.id.toString().slice(-6)}</p>
            <div className="border-t-2 border-dashed border-border pt-3 mb-2">
              {lastSale.itens.map((i, idx) => (
                <div key={idx} className="flex justify-between py-0.5 border-b border-dashed border-muted text-left">
                  <span className="truncate max-w-[200px]">{i.nome.split('—')[0].trim()} ×{i.qty}</span>
                  <span>{fmt(i.preco * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between py-2 font-extrabold text-[15px] border-t-2 border-foreground">
              <span>TOTAL</span><span>{fmt(lastSale.total)}</span>
            </div>
            <div className="border-t-2 border-dashed border-border pt-2 mt-2">
              <div className="flex justify-between"><span>Pagamento</span><span>{lastSale.pgto}</span></div>
            </div>
            <p className="mt-3.5 text-[11px] text-muted-foreground font-body">Obrigado pela preferência! 💊</p>
          </div>
        )}
        <div className="flex gap-2.5 justify-end pt-3">
          <button onClick={novaVenda} className="bg-background text-text-2 border border-border rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-border transition-colors">Nova Venda</button>
          <button onClick={novaVenda} className="flex items-center gap-[7px] bg-primary text-primary-foreground rounded-[10px] px-[18px] py-2.5 text-[13.5px] font-bold hover:bg-primary-dark transition-all">
            <Plus className="w-4 h-4" /> OK
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

      {/* Camera Scanner */}
      {scannerOpen && (
        <BarcodeScanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
      )}
    </div>
  );
}
