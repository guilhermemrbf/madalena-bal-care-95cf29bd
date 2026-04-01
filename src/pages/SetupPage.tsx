import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import PharmacyLogo from '@/components/PharmacyLogo';
import { ShieldCheck, Eye, EyeOff, Loader2, Wifi, WifiOff, Sparkles } from 'lucide-react';

interface SetupPageProps {
  onComplete: () => void;
}

export default function SetupPage({ onComplete }: SetupPageProps) {
  const { signUp } = useAuth();
  const { isOnline } = useOnlineStatus();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPw) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    const { error: err } = await signUp(email, password, fullName, 'Proprietário');
    if (err) {
      setError(err);
    } else {
      onComplete();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f3f6f4 0%, #eaf5ee 50%, #e0efe4 100%)' }}>
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f3d22, #1a6b3c)' }}>
              <PharmacyLogo />
            </div>
          </div>
          <h1 className="font-display text-2xl text-primary">Madalena Bal</h1>
          <p className="text-sm text-muted-foreground font-semibold tracking-wider uppercase mt-1">Sistema de Gestão — Farmácia</p>
        </div>

        {/* Card */}
        <div className="bg-card rounded-2xl p-8 shadow-[0_8px_40px_rgba(26,107,60,0.12)] border border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl text-primary">Configuração Inicial</h2>
              <p className="text-xs text-muted-foreground">Crie a conta do proprietário</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4 mb-6 p-3 rounded-xl bg-primary/5 border border-primary/10">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Esta configuração só pode ser feita <strong>uma vez</strong>. A conta criada terá acesso total ao sistema como proprietário.
            </p>
          </div>

          {!isOnline && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <WifiOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <p className="text-xs text-amber-700"><strong>Modo Offline:</strong> A conta será criada localmente e sincronizada quando houver internet.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Nome Completo</label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)} required
                className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                placeholder="Seu nome completo"
              />
            </div>

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

            <div>
              <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Confirmar Senha</label>
              <input
                type={showPw ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={6}
                className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                placeholder="Repita a senha"
              />
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 text-sm font-bold">
                {error}
              </div>
            )}

            <button
              type="submit" disabled={loading || !isOnline}
              className="w-full py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {loading ? 'Criando conta...' : 'Criar Conta do Proprietário'}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-500" /> : <WifiOff className="w-3.5 h-3.5 text-destructive" />}
            {isOnline ? 'Conectado' : 'Sem conexão'}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 Madalena Bal Farmácia · Luanda, Angola</p>
      </div>
    </div>
  );
}
