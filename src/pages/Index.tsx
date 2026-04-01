import { useState } from 'react';
import Layout from '@/components/Layout';
import { ToastProvider } from '@/components/Toast';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/hooks/useAuth';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import POS from '@/pages/POS';
import SalesHistory from '@/pages/SalesHistory';
import DailyReport from '@/pages/DailyReport';
import UsersPage from '@/pages/UsersPage';
import LoginPage from '@/pages/LoginPage';
import SetupPage from '@/pages/SetupPage';
import LotesValidades from '@/pages/LotesValidades';
import ClientesPage from '@/pages/ClientesPage';
import FornecedoresPage from '@/pages/FornecedoresPage';
import FinanceiroPage from '@/pages/FinanceiroPage';
import { isSetupComplete, markSetupComplete } from '@/lib/offlineAuth';
import { Loader2, Shield } from 'lucide-react';

const pageMeta: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral da farmácia' },
  produtos: { title: 'Produtos / Estoque', sub: 'Gerencie seu catálogo e estoque' },
  caixa: { title: 'Caixa — PDV', sub: 'Ponto de Venda · Madalena Bal Farmácia' },
  vendas: { title: 'Histórico de Vendas', sub: 'Todas as transações registradas' },
  relatorio: { title: 'Relatório do Dia', sub: 'Resumo financeiro e análises' },
  usuarios: { title: 'Gestão de Funcionários', sub: 'Gerencie acessos e permissões' },
  lotes: { title: 'Validades e Lotes', sub: 'Controle de validade dos produtos' },
  clientes: { title: 'Clientes', sub: 'Cadastro e programa de fidelidade' },
  fornecedores: { title: 'Fornecedores', sub: 'Cadastro de fornecedores' },
  financeiro: { title: 'Financeiro', sub: 'Fluxo de caixa e contas' },
};

const adminOnlyPages = ['produtos', 'relatorio', 'usuarios', 'fornecedores', 'financeiro'];

function AccessDenied() {
  return (
    <div className="text-center py-20 text-muted-foreground">
      <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
      <p className="font-bold text-lg">Acesso Restrito</p>
      <p className="text-sm mt-1">Esta página é exclusiva para administradores</p>
    </div>
  );
}

const Index = () => {
  const { user, profile, role, loading, isAdmin, isOfflineSession, signOut } = useAuth();
  const [page, setPage] = useState('dashboard');
  const [setupDone, setSetupDone] = useState(isSetupComplete());
  const store = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Show setup page if no admin account has been created yet
  if (!setupDone && !user) {
    return (
      <SetupPage onComplete={() => {
        markSetupComplete();
        setSetupDone(true);
      }} />
    );
  }

  if (!user) return <LoginPage />;

  const meta = pageMeta[page] || pageMeta.dashboard;
  const canAccess = !adminOnlyPages.includes(page) || isAdmin;
  const navigate = (p: string) => setPage(p);

  return (
    <ToastProvider>
      <Layout
        currentPage={page} onNavigate={navigate} pageTitle={meta.title} pageSub={meta.sub}
        criticalCount={store.criticalCount} criticalLotesCount={store.criticalLotesCount}
        userName={profile?.full_name} userInitials={profile?.avatar_initials}
        userCargo={profile?.cargo} isAdmin={isAdmin} onLogout={signOut}
      >
        {!canAccess ? <AccessDenied /> : (
          <>
            {page === 'dashboard' && <Dashboard produtos={store.produtos} vendas={store.vendas} clientes={store.clientes} lotes={store.lotes} contasPagar={store.contasPagar} onNavigate={navigate} />}
            {page === 'produtos' && <Products produtos={store.produtos} fornecedores={store.fornecedores} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} onEntradaEstoque={store.entradaEstoque} />}
            {page === 'caixa' && <POS produtos={store.produtos} clientes={store.clientes} onSale={store.addSale} />}
            {page === 'vendas' && <SalesHistory vendas={store.vendas} />}
            {page === 'relatorio' && <DailyReport produtos={store.produtos} vendas={store.vendas} clientes={store.clientes} />}
            {page === 'usuarios' && <UsersPage />}
            {page === 'lotes' && <LotesValidades lotes={store.lotes} />}
            {page === 'clientes' && <ClientesPage clientes={store.clientes} vendas={store.vendas} onAdd={store.addCliente} onUpdate={store.updateCliente} onDelete={store.deleteCliente} />}
            {page === 'fornecedores' && <FornecedoresPage fornecedores={store.fornecedores} financeiro={store.financeiro} onAdd={store.addFornecedor} onUpdate={store.updateFornecedor} onDelete={store.deleteFornecedor} />}
            {page === 'financeiro' && <FinanceiroPage financeiro={store.financeiro} contasPagar={store.contasPagar} contasReceber={store.contasReceber} fornecedores={store.fornecedores} onAddLancamento={store.addLancamento} onAddContaPagar={store.addContaPagar} onUpdateContaPagar={store.updateContaPagar} onDeleteContaPagar={store.deleteContaPagar} onAddContaReceber={store.addContaReceber} onUpdateContaReceber={store.updateContaReceber} onDeleteContaReceber={store.deleteContaReceber} />}
          </>
        )}
      </Layout>
    </ToastProvider>
  );
};

export default Index;
