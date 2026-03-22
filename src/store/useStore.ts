import { useState, useEffect, useCallback } from 'react';

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
}

export interface Sale {
  id: number;
  data: string;
  itens: CartItem[];
  pgto: string;
  total: number;
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

function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
}

export function useStore() {
  const [produtos, setProdutos] = useState<Product[]>(() => loadFromLS('mb_produtos', defaultProducts));
  const [vendas, setVendas] = useState<Sale[]>(() => loadFromLS('mb_vendas', []));

  useEffect(() => { localStorage.setItem('mb_produtos', JSON.stringify(produtos)); }, [produtos]);
  useEffect(() => { localStorage.setItem('mb_vendas', JSON.stringify(vendas)); }, [vendas]);

  const addProduct = useCallback((p: Omit<Product, 'id'>) => {
    setProdutos(prev => [...prev, { ...p, id: Date.now() + Math.floor(Math.random() * 9999) }]);
  }, []);

  const updateProduct = useCallback((id: number, data: Partial<Product>) => {
    setProdutos(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deleteProduct = useCallback((id: number) => {
    setProdutos(prev => prev.filter(p => p.id !== id));
  }, []);

  const addSale = useCallback((sale: Omit<Sale, 'id'>) => {
    const newSale = { ...sale, id: Date.now() + Math.floor(Math.random() * 9999) };
    setVendas(prev => [...prev, newSale]);
    // Deduct stock
    setProdutos(prev => prev.map(p => {
      const item = sale.itens.find(i => i.id === p.id);
      return item ? { ...p, est: p.est - item.qty } : p;
    }));
    return newSale;
  }, []);

  const criticalCount = produtos.filter(p => p.est <= p.min).length;

  return { produtos, vendas, addProduct, updateProduct, deleteProduct, addSale, criticalCount, setProdutos };
}

export const fmt = (v: number) => 'R$ ' + (v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const categories = ['Medicamentos', 'Higiene', 'Suplementos', 'Beleza', 'Outros'];
