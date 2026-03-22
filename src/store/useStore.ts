import { useState, useEffect, useCallback } from 'react';
import { addToQueue } from './syncQueue';

export interface Product {
  id: number;
  cod: string;
  nome: string;
  cat: string;
  preco: number;
  custo: number;
  est: number;
  min: number;
}

export interface CartItem {
  id: number;
  cod: string;
  nome: string;
  preco: number;
  qty: number;
  desconto?: number;
  descontoTipo?: '%' | 'R$';
}

export interface Sale {
  id: number;
  data: string;
  itens: CartItem[];
  pgto: string;
  total: number;
  subtotal?: number;
  descontoGeral?: number;
  descontoGeralTipo?: '%' | 'R$';
  clienteId?: number | null;
  clienteNome?: string;
}

export interface Lote {
  id: number;
  produtoId: number;
  produtoNome: string;
  fornecedor: string;
  lote: string;
  quantidade: number;
  validade: string;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  documento: string;
  nascimento: string;
  endereco: string;
  observacoes: string;
  pontos: number;
  totalGasto: number;
  ultimaCompra: string;
}

export interface Fornecedor {
  id: number;
  nome: string;
  nif: string;
  telefone: string;
  email: string;
  contato: string;
  endereco: string;
  prazoEntrega: number;
  observacoes: string;
  ultimaEntrega: string;
}

export interface Lancamento {
  id: number;
  data: string;
  descricao: string;
  tipo: 'entrada' | 'saida';
  categoria: string;
  valor: number;
  observacoes?: string;
}

export interface Conta {
  id: number;
  fornecedor?: string;
  cliente?: string;
  descricao: string;
  vencimento: string;
  valor: number;
  status: 'pendente' | 'pago' | 'vencido';
  observacoes?: string;
}

const defaultProducts: Product[] = [
  { id: 1, cod: 'MED001', nome: 'Dipirona 500mg — cx 10 comp.', cat: 'Medicamentos', preco: 4.90, custo: 2.50, est: 120, min: 20 },
  { id: 2, cod: 'MED002', nome: 'Amoxicilina 500mg — cx 15 cap.', cat: 'Medicamentos', preco: 18.50, custo: 9.00, est: 45, min: 10 },
  { id: 3, cod: 'MED003', nome: 'Omeprazol 20mg — cx 28 cap.', cat: 'Medicamentos', preco: 12.90, custo: 6.00, est: 8, min: 10 },
  { id: 4, cod: 'SUP001', nome: 'Vitamina C 1g — fr 30 comp.', cat: 'Suplementos', preco: 22.00, custo: 12.00, est: 60, min: 15 },
  { id: 5, cod: 'HIG001', nome: 'Shampoo Anticaspa 400ml', cat: 'Higiene', preco: 16.90, custo: 9.00, est: 30, min: 5 },
  { id: 6, cod: 'MED004', nome: 'Ibuprofeno 600mg — cx 20 comp.', cat: 'Medicamentos', preco: 8.50, custo: 4.00, est: 3, min: 10 },
  { id: 7, cod: 'BEL001', nome: 'Protetor Solar FPS 50 — 120ml', cat: 'Beleza', preco: 34.90, custo: 18.00, est: 22, min: 5 },
  { id: 8, cod: 'SUP002', nome: 'Ômega 3 — fr 60 cáps.', cat: 'Suplementos', preco: 45.00, custo: 22.00, est: 18, min: 5 },
];

const now = new Date();
const in10days = new Date(now.getTime() + 10 * 86400000).toISOString().split('T')[0];
const ago5days = new Date(now.getTime() - 5 * 86400000).toISOString().split('T')[0];
const in120days = new Date(now.getTime() + 120 * 86400000).toISOString().split('T')[0];

const defaultLotes: Lote[] = [
  { id: 1, produtoId: 1, produtoNome: 'Dipirona 500mg', fornecedor: 'FarmaDistrib Angola', lote: 'L2024A', quantidade: 50, validade: in10days },
  { id: 2, produtoId: 2, produtoNome: 'Amoxicilina 500mg', fornecedor: 'MedSupply Lda', lote: 'L2023B', quantidade: 20, validade: ago5days },
  { id: 3, produtoId: 4, produtoNome: 'Vitamina C 1g', fornecedor: 'FarmaDistrib Angola', lote: 'L2025C', quantidade: 60, validade: in120days },
];

const defaultClientes: Cliente[] = [
  { id: 1, nome: 'Ana Madalena', telefone: '923456789', documento: '', nascimento: '', endereco: '', observacoes: '', pontos: 45, totalGasto: 450, ultimaCompra: '' },
  { id: 2, nome: 'João Carlos', telefone: '912345678', documento: '', nascimento: '', endereco: '', observacoes: '', pontos: 12, totalGasto: 120, ultimaCompra: '' },
  { id: 3, nome: 'Maria Luísa', telefone: '934567890', documento: '', nascimento: '', endereco: '', observacoes: '', pontos: 0, totalGasto: 0, ultimaCompra: '' },
];

const defaultFornecedores: Fornecedor[] = [
  { id: 1, nome: 'FarmaDistrib Angola', nif: '5001234567', telefone: '922111222', email: 'contato@farmadistrib.ao', contato: 'Carlos Silva', endereco: 'Luanda, Angola', prazoEntrega: 3, observacoes: '', ultimaEntrega: '' },
  { id: 2, nome: 'MedSupply Lda', nif: '5009876543', telefone: '923333444', email: 'vendas@medsupply.ao', contato: 'Maria Santos', endereco: 'Luanda, Angola', prazoEntrega: 5, observacoes: '', ultimaEntrega: '' },
];

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function useStore() {
  const [produtos, setProdutos] = useState<Product[]>(() => loadFromLS('mb_produtos', defaultProducts));
  const [vendas, setVendas] = useState<Sale[]>(() => loadFromLS('mb_vendas', []));
  const [lotes, setLotes] = useState<Lote[]>(() => loadFromLS('mb_lotes', defaultLotes));
  const [clientes, setClientes] = useState<Cliente[]>(() => loadFromLS('mb_clientes', defaultClientes));
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>(() => loadFromLS('mb_fornecedores', defaultFornecedores));
  const [financeiro, setFinanceiro] = useState<Lancamento[]>(() => loadFromLS('mb_financeiro', []));
  const [contasPagar, setContasPagar] = useState<Conta[]>(() => loadFromLS('mb_contas_pagar', []));
  const [contasReceber, setContasReceber] = useState<Conta[]>(() => loadFromLS('mb_contas_receber', []));

  useEffect(() => { localStorage.setItem('mb_produtos', JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { localStorage.setItem('mb_vendas', JSON.stringify(vendas)); }, [vendas]);
  useEffect(() => { localStorage.setItem('mb_lotes', JSON.stringify(lotes)); }, [lotes]);
  useEffect(() => { localStorage.setItem('mb_clientes', JSON.stringify(clientes)); }, [clientes]);
  useEffect(() => { localStorage.setItem('mb_fornecedores', JSON.stringify(fornecedores)); }, [fornecedores]);
  useEffect(() => { localStorage.setItem('mb_financeiro', JSON.stringify(financeiro)); }, [financeiro]);
  useEffect(() => { localStorage.setItem('mb_contas_pagar', JSON.stringify(contasPagar)); }, [contasPagar]);
  useEffect(() => { localStorage.setItem('mb_contas_receber', JSON.stringify(contasReceber)); }, [contasReceber]);

  const genId = () => Date.now() + Math.floor(Math.random() * 9999);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: genId() };
    setProdutos(prev => [...prev, newProduct]);
    if (!navigator.onLine) addToQueue('create_product', newProduct as unknown as Record<string, unknown>);
  }, []);

  const updateProduct = useCallback((id: number, data: Partial<Product>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
    if (!navigator.onLine) addToQueue('update_product', { id, ...data } as Record<string, unknown>);
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
    if (!navigator.onLine) addToQueue('delete_product', { id });
  }, []);

  const addSale = useCallback((sale: Omit<Sale, 'id'>) => {
    const newSale = { ...sale, id: genId() };
    setVendas(prev => [...prev, newSale]);
    setProdutos(prev => prev.map(p => {
      const item = sale.itens.find(i => i.id === p.id);
      return item ? { ...p, est: p.est - item.qty } : p;
    }));
    // Auto-register in financial
    setFinanceiro(prev => [...prev, {
      id: genId(),
      data: sale.data,
      descricao: `Venda #${newSale.id.toString().slice(-5)}`,
      tipo: 'entrada',
      categoria: 'Venda',
      valor: sale.total,
    }]);
    // Accumulate loyalty points if client linked
    if (sale.clienteId) {
      const pontosGanhos = Math.floor(sale.total / 10);
      setClientes(prev => prev.map(c => c.id === sale.clienteId ? {
        ...c,
        pontos: c.pontos + pontosGanhos,
        totalGasto: c.totalGasto + sale.total,
        ultimaCompra: sale.data,
      } : c));
    }
    if (!navigator.onLine) addToQueue('create_sale', newSale as unknown as Record<string, unknown>);
    return newSale;
  }, []);

  // Lotes
  const addLote = useCallback((l: Omit<Lote, 'id'>) => {
    setLotes(prev => [...prev, { ...l, id: genId() }]);
  }, []);

  // Clientes
  const addCliente = useCallback((c: Omit<Cliente, 'id'>) => {
    const nc = { ...c, id: genId() };
    setClientes(prev => [...prev, nc]);
    return nc;
  }, []);
  const updateCliente = useCallback((id: number, data: Partial<Cliente>) => {
    setClientes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteCliente = useCallback((id: number) => {
    setClientes(prev => prev.filter(c => c.id !== id));
  }, []);

  // Fornecedores
  const addFornecedor = useCallback((f: Omit<Fornecedor, 'id'>) => {
    const nf = { ...f, id: genId() };
    setFornecedores(prev => [...prev, nf]);
    return nf;
  }, []);
  const updateFornecedor = useCallback((id: number, data: Partial<Fornecedor>) => {
    setFornecedores(prev => prev.map(f => f.id === id ? { ...f, ...data } : f));
  }, []);
  const deleteFornecedor = useCallback((id: number) => {
    setFornecedores(prev => prev.filter(f => f.id !== id));
  }, []);

  // Financeiro
  const addLancamento = useCallback((l: Omit<Lancamento, 'id'>) => {
    setFinanceiro(prev => [...prev, { ...l, id: genId() }]);
  }, []);

  // Contas
  const addContaPagar = useCallback((c: Omit<Conta, 'id'>) => {
    setContasPagar(prev => [...prev, { ...c, id: genId() }]);
  }, []);
  const updateContaPagar = useCallback((id: number, data: Partial<Conta>) => {
    setContasPagar(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteContaPagar = useCallback((id: number) => {
    setContasPagar(prev => prev.filter(c => c.id !== id));
  }, []);

  const addContaReceber = useCallback((c: Omit<Conta, 'id'>) => {
    setContasReceber(prev => [...prev, { ...c, id: genId() }]);
  }, []);
  const updateContaReceber = useCallback((id: number, data: Partial<Conta>) => {
    setContasReceber(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);
  const deleteContaReceber = useCallback((id: number) => {
    setContasReceber(prev => prev.filter(c => c.id !== id));
  }, []);

  // Stock entry (creates lote + updates product + creates financial exit)
  const entradaEstoque = useCallback((entry: {
    produtoId: number;
    fornecedorNome: string;
    quantidade: number;
    lote: string;
    validade: string;
    custoPorUnidade: number;
    notaFiscal?: string;
    dataRecebimento: string;
    observacoes?: string;
  }) => {
    const produto = produtos.find(p => p.id === entry.produtoId);
    if (!produto) return;
    // Update product stock and cost
    setProdutos(prev => prev.map(p => p.id === entry.produtoId ? {
      ...p, est: p.est + entry.quantidade, custo: entry.custoPorUnidade
    } : p));
    // Create lote
    setLotes(prev => [...prev, {
      id: genId(),
      produtoId: entry.produtoId,
      produtoNome: produto.nome.split('—')[0].trim(),
      fornecedor: entry.fornecedorNome,
      lote: entry.lote,
      quantidade: entry.quantidade,
      validade: entry.validade,
    }]);
    // Financial exit
    const totalCusto = entry.quantidade * entry.custoPorUnidade;
    setFinanceiro(prev => [...prev, {
      id: genId(),
      data: entry.dataRecebimento,
      descricao: `Compra de Estoque — ${entry.fornecedorNome}`,
      tipo: 'saida',
      categoria: 'Compra de Estoque',
      valor: totalCusto,
      observacoes: entry.observacoes,
    }]);
    // Update supplier last delivery
    setFornecedores(prev => prev.map(f => f.nome === entry.fornecedorNome ? { ...f, ultimaEntrega: entry.dataRecebimento } : f));
  }, [produtos]);

  const criticalCount = produtos.filter(p => p.est <= p.min).length;

  const criticalLotesCount = lotes.filter(l => {
    const diff = Math.ceil((new Date(l.validade).getTime() - Date.now()) / 86400000);
    return diff <= 30;
  }).length;

  return {
    produtos, vendas, lotes, clientes, fornecedores, financeiro, contasPagar, contasReceber,
    addProduct, updateProduct, deleteProduct, addSale,
    addLote,
    addCliente, updateCliente, deleteCliente,
    addFornecedor, updateFornecedor, deleteFornecedor,
    addLancamento,
    addContaPagar, updateContaPagar, deleteContaPagar,
    addContaReceber, updateContaReceber, deleteContaReceber,
    entradaEstoque,
    criticalCount, criticalLotesCount,
    setProdutos,
  };
}

export const fmt = (v: number) => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const categories = ['Medicamentos', 'Higiene', 'Suplementos', 'Beleza', 'Outros'];
export const categoriasEntrada = ['Venda', 'Outros'];
export const categoriasSaida = ['Compra de Estoque', 'Aluguel', 'Salários', 'Água/Luz', 'Impostos', 'Manutenção', 'Outros'];
