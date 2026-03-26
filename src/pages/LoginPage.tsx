import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LogIn, Eye, EyeOff, Loader2, ShieldCheck, UserRound } from 'lucide-react';

const roles = [
  { id: 'admin', label: 'Proprietário', icon: ShieldCheck, desc: 'Acesso total ao sistema' },
  { id: 'funcionario', label: 'Funcionário', icon: UserRound, desc: 'Acesso operacional' },
] as const;

export default function LoginPage() {
  const { signIn } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'admin' | 'funcionario' | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await signIn(email, password);
    if (err) setError(err === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : err);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f3f6f4 0%, #eaf5ee 50%, #e0efe4 100%)' }}>
      <div className="w-full max-w-[440px]">
        {/* Logo */}
         <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo-madalena-bal.png" alt="Madalena Bal Farmácia" className="w-[200px] h-auto object-contain" style={{ filter: 'drop-shadow(0px 2px 6px rgba(0,0,0,0.15))' }} />
          </div>
          <h1 className="font-display text-2xl text-primary">Madalena Bal</h1>
          <p className="text-sm text-muted-foreground font-semibold tracking-wider uppercase mt-1">Sistema de Gestão — Farmácia</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 shadow-[0_8px_40px_rgba(26,107,60,0.12)] border border-border">
          {!selectedRole ? (
            <>
              <h2 className="font-display text-xl text-primary mb-1">Entrar no Sistema</h2>
              <p className="text-sm text-muted-foreground mb-6">Selecione o seu perfil de acesso</p>

              <div className="grid grid-cols-2 gap-3">
                {roles.map(r => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      onClick={() => { setSelectedRole(r.id); setError(''); }}
                      className="group flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-border bg-background hover:border-primary hover:bg-primary/5 transition-all duration-200"
                    >
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-7 h-7 text-primary" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-sm text-foreground">{r.label}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 pt-5 border-t border-border text-center">
                <p className="text-xs text-muted-foreground">
                  Contas de funcionários são criadas pelo proprietário na área de gestão
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setSelectedRole(null); setError(''); setEmail(''); setPassword(''); }}
                  className="text-muted-foreground hover:text-primary transition-colors text-sm font-bold"
                >
                  ← Voltar
                </button>
              </div>

              <div className="flex items-center gap-3 mb-5 mt-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                {selectedRole === 'admin'
                  ? <ShieldCheck className="w-5 h-5 text-primary" />
                  : <UserRound className="w-5 h-5 text-primary" />}
                <div>
                  <p className="font-bold text-sm text-foreground">
                    {selectedRole === 'admin' ? 'Proprietário' : 'Funcionário'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {selectedRole === 'admin' ? 'Acesso total ao sistema' : 'Acesso operacional'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                    placeholder="seu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Senha</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required minLength={6}
                      className="w-full py-3 px-3.5 pr-12 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm font-bold">
                    {error}
                  </div>
                )}

                <button
                  type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
                  {loading ? 'Aguarde...' : 'Entrar'}
                </button>
              </form>

              {selectedRole === 'funcionario' && (
                <div className="mt-5 pt-5 border-t border-border text-center">
                  <p className="text-xs text-muted-foreground">
                    Solicite suas credenciais ao proprietário
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 Madalena Bal Farmácia · Luanda, Angola</p>
      </div>
    </div>
  );
}
