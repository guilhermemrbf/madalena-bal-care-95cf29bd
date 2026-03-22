import { ReactNode, useState, useEffect } from 'react';
import { LayoutDashboard, Package, CreditCard, ClipboardList, Activity } from 'lucide-react';
import PharmacyLogo from './PharmacyLogo';

interface LayoutProps {
  children: ReactNode;
  currentPage: string;
  onNavigate: (page: string) => void;
  pageTitle: string;
  pageSub: string;
  criticalCount: number;
}

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Menu Principal' },
  { key: 'produtos', label: 'Produtos / Estoque', icon: Package, section: null },
  { key: 'caixa', label: 'Caixa — PDV', icon: CreditCard, section: null },
  { key: 'vendas', label: 'Histórico de Vendas', icon: ClipboardList, section: 'Relatórios' },
  { key: 'relatorio', label: 'Relatório do Dia', icon: Activity, section: null },
];

export default function Layout({ children, currentPage, onNavigate, pageTitle, pageSub, criticalCount }: LayoutProps) {
  const [clock, setClock] = useState('');

  useEffect(() => {
    const update = () => {
      const n = new Date();
      setClock(n.toLocaleDateString('pt-BR') + '  ' + n.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-[260px] fixed h-screen flex flex-col z-20" style={{ background: 'linear-gradient(180deg, #0f3d22 0%, #1a6b3c 50%, #1e7a43 100%)' }}>
        <div className="px-6 pt-7 pb-5 border-b border-white/[0.12]">
          <div className="flex items-center gap-3 mb-1.5">
            <PharmacyLogo />
            <div>
              <h1 className="font-display text-[17px] text-white leading-tight tracking-wide">Madalena Bal</h1>
              <span className="text-[11px] text-white/55 tracking-widest uppercase">Farmácia</span>
            </div>
          </div>
          <div className="mt-2.5 bg-white/[0.08] border border-white/[0.15] rounded-lg px-2.5 py-1.5 text-[10.5px] text-white/60 tracking-wide">
            NIF: <b className="text-white/85">5000947253</b>
          </div>
        </div>

        <nav className="px-3.5 py-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <div key={item.key}>
              {item.section && (
                <div className="text-[10px] font-extrabold uppercase tracking-[1.2px] text-white/35 px-2.5 pt-3 pb-1.5 mt-2">
                  {item.section}
                </div>
              )}
              <button
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center gap-[11px] px-3 py-3 rounded-xl text-[14px] font-semibold mb-0.5 transition-all relative
                  ${currentPage === item.key
                    ? 'bg-white/[0.18] text-white shadow-[0_2px_8px_rgba(0,0,0,0.15)]'
                    : 'text-white/65 hover:bg-white/10 hover:text-white'}`}
              >
                {currentPage === item.key && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-[60%] bg-accent rounded-r-md" />
                )}
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                {item.label}
                {item.key === 'produtos' && criticalCount > 0 && (
                  <span className="ml-auto bg-destructive text-white text-[10px] font-extrabold px-[7px] py-0.5 rounded-full">
                    {criticalCount}
                  </span>
                )}
              </button>
            </div>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10 text-[11px] text-white/40 text-center">
          © 2026 Madalena Bal Farmácia
        </div>
      </aside>

      {/* Main */}
      <main className="ml-[260px] flex-1 min-h-screen flex flex-col">
        <div className="bg-card border-b border-border px-8 py-[18px] flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <div>
            <h2 className="font-display text-[22px] text-primary">{pageTitle}</h2>
            <p className="text-[13px] text-muted-foreground mt-0.5">{pageSub}</p>
          </div>
          <div className="flex items-center gap-3.5">
            <div className="text-xs text-muted-foreground bg-background border border-border rounded-full px-3.5 py-1.5">
              {clock}
            </div>
            <div className="flex items-center gap-2 bg-accent-light border border-border rounded-full py-[7px] px-3.5 pr-4 text-[13px] font-bold text-primary">
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center text-white text-xs font-extrabold">MB</div>
              Proprietário
            </div>
          </div>
        </div>
        <div className="p-7 flex-1 animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
