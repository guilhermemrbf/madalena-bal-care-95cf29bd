import { useState } from 'react';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/Toast';
import { useStore } from '@/store/useStore';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import POS from '@/pages/POS';
import SalesHistory from '@/pages/SalesHistory';
import DailyReport from '@/pages/DailyReport';

const pageMeta: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral da farmácia' },
  produtos: { title: 'Produtos / Estoque', sub: 'Gerencie seu catálogo e estoque' },
  caixa: { title: 'Caixa — PDV', sub: 'Ponto de Venda · Madalena Bal Farmácia' },
  vendas: { title: 'Histórico de Vendas', sub: 'Todas as transações registradas' },
  relatorio: { title: 'Relatório do Dia', sub: 'Resumo financeiro diário' },
};

const Index = () => {
  const [page, setPage] = useState('dashboard');
  const store = useStore();
  const meta = pageMeta[page] || pageMeta.dashboard;

  return (
    <ToastProvider>
      <Layout
        currentPage={page}
        onNavigate={setPage}
        pageTitle={meta.title}
        pageSub={meta.sub}
        criticalCount={store.criticalCount}
      >
        {page === 'dashboard' && <Dashboard produtos={store.produtos} vendas={store.vendas} onNavigate={setPage} />}
        {page === 'produtos' && <Products produtos={store.produtos} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} />}
        {page === 'caixa' && <POS produtos={store.produtos} onSale={store.addSale} />}
        {page === 'vendas' && <SalesHistory vendas={store.vendas} />}
        {page === 'relatorio' && <DailyReport produtos={store.produtos} vendas={store.vendas} />}
      </Layout>
    </ToastProvider>
  );
};

export default Index;
