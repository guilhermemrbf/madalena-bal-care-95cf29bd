import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import PharmacyLogo from '@/components/PharmacyLogo';
import { LogIn, UserPlus, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [cargo, setCargo] = useState('Atendente');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isRegister) {
      if (!fullName.trim()) { setError('Informe o nome completo'); setLoading(false); return; }
      const { error: err } = await signUp(email, password, fullName.trim(), cargo);
      if (err) setError(err);
      else setSuccess('Conta criada! Verifique seu e-mail para confirmar o cadastro.');
    } else {
      const { error: err } = await signIn(email, password);
      if (err) setError(err === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f3f6f4 0%, #eaf5ee 50%, #e0efe4 100%)' }}>
      <div className="w-full max-w-[440px]">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0f3d22, #1a6b3c)' }}>
              <PharmacyLogo />
            </div>
          </div>
          <h1 className="font-display text-2xl text-primary">Madalena Bal</h1>
          <p className="text-sm text-muted-foreground font-semibold tracking-wider uppercase mt-1">Sistema de Gestão — Farmácia</p>
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl p-8 shadow-[0_8px_40px_rgba(26,107,60,0.12)] border border-border">
          <h2 className="font-display text-xl text-primary mb-1">{isRegister ? 'Criar Conta' : 'Entrar no Sistema'}</h2>
          <p className="text-sm text-muted-foreground mb-6">{isRegister ? 'Cadastro de novo funcionário' : 'Acesse com suas credenciais'}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Nome Completo</label>
                  <input
                    value={fullName} onChange={e => setFullName(e.target.value)} required
                    className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                    placeholder="Ex: Maria Silva"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Cargo / Função</label>
                  <select
                    value={cargo} onChange={e => setCargo(e.target.value)}
                    className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card transition-all"
                  >
                    <option>Atendente</option>
                    <option>Farmacêutico(a)</option>
                    <option>Caixa</option>
                    <option>Gerente</option>
                    <option>Proprietário(a)</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                placeholder="funcionario@farmacia.com"
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
              <div className="bg-destructive-light text-destructive rounded-xl px-4 py-3 text-sm font-bold">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-[hsl(148,40%,93%)] text-primary rounded-xl px-4 py-3 text-sm font-bold">
                {success}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegister ? <UserPlus className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              {loading ? 'Aguarde...' : isRegister ? 'Criar Conta' : 'Entrar'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center">
            <button onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }} className="text-sm font-semibold text-primary hover:underline">
              {isRegister ? '← Já tenho conta, fazer login' : 'Criar conta de funcionário →'}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">© 2026 Madalena Bal Farmácia · NIF 5000947253</p>
      </div>
    </div>
  );
}
