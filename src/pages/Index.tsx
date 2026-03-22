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
import { Loader2, Shield } from 'lucide-react';

const pageMeta: Record<string, { title: string; sub: string }> = {
  dashboard: { title: 'Dashboard', sub: 'Visão geral da farmácia' },
  produtos: { title: 'Produtos / Estoque', sub: 'Gerencie seu catálogo e estoque' },
  caixa: { title: 'Caixa — PDV', sub: 'Ponto de Venda · Madalena Bal Farmácia' },
  vendas: { title: 'Histórico de Vendas', sub: 'Todas as transações registradas' },
  relatorio: { title: 'Relatório do Dia', sub: 'Resumo financeiro diário' },
  usuarios: { title: 'Gestão de Funcionários', sub: 'Gerencie acessos e permissões' },
};

// Pages restricted to admin only
const adminOnlyPages = ['produtos', 'relatorio', 'usuarios'];

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
  const { user, profile, role, loading, isAdmin, signOut } = useAuth();
  const [page, setPage] = useState('dashboard');
  const store = useStore();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const meta = pageMeta[page] || pageMeta.dashboard;
  const canAccess = !adminOnlyPages.includes(page) || isAdmin;

  const navigate = (p: string) => {
    setPage(p);
  };

  return (
    <ToastProvider>
      <Layout
        currentPage={page}
        onNavigate={navigate}
        pageTitle={meta.title}
        pageSub={meta.sub}
        criticalCount={store.criticalCount}
        userName={profile?.full_name}
        userInitials={profile?.avatar_initials}
        userCargo={profile?.cargo}
        isAdmin={isAdmin}
        onLogout={signOut}
      >
        {!canAccess ? <AccessDenied /> : (
          <>
            {page === 'dashboard' && <Dashboard produtos={store.produtos} vendas={store.vendas} onNavigate={navigate} />}
            {page === 'produtos' && <Products produtos={store.produtos} onAdd={store.addProduct} onUpdate={store.updateProduct} onDelete={store.deleteProduct} />}
            {page === 'caixa' && <POS produtos={store.produtos} onSale={store.addSale} />}
            {page === 'vendas' && <SalesHistory vendas={store.vendas} />}
            {page === 'relatorio' && <DailyReport produtos={store.produtos} vendas={store.vendas} />}
            {page === 'usuarios' && <UsersPage />}
          </>
        )}
      </Layout>
    </ToastProvider>
  );
};

export default Index;
