import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, ShieldCheck, Loader2, UserPlus, Eye, EyeOff, X } from 'lucide-react';
import { useToastCustom } from '@/components/Toast';

interface UserRow {
  user_id: string;
  full_name: string;
  cargo: string;
  avatar_initials: string;
  role: 'admin' | 'funcionario';
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const { showToast } = useToastCustom();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formCargo, setFormCargo] = useState('Atendente');
  const [formRole, setFormRole] = useState<'funcionario' | 'admin'>('funcionario');
  const [formShowPw, setFormShowPw] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: roles } = await supabase.from('user_roles').select('*');

    if (profiles) {
      const userList: UserRow[] = profiles.map(p => ({
        user_id: p.user_id,
        full_name: p.full_name,
        cargo: p.cargo,
        avatar_initials: p.avatar_initials,
        role: roles?.find(r => r.user_id === p.user_id)?.role ?? 'funcionario',
      }));
      setUsers(userList);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (userId: string, currentRole: string) => {
    if (!isAdmin) { showToast('Apenas o proprietário pode alterar permissões', 'error'); return; }
    if (userId === currentUser?.id) { showToast('Você não pode alterar sua própria permissão', 'error'); return; }

    const newRole = currentRole === 'admin' ? 'funcionario' : 'admin';
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });

    if (error) {
      showToast('Erro ao alterar permissão', 'error');
    } else {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      showToast(`Permissão alterada para ${newRole === 'admin' ? 'Proprietário' : 'Funcionário'}`, 'success');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim() || !formPassword.trim()) {
      showToast('Preencha todos os campos', 'error');
      return;
    }
    if (formPassword.length < 6) {
      showToast('A senha deve ter no mínimo 6 caracteres', 'error');
      return;
    }

    setFormLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke('create-user', {
      body: {
        email: formEmail.trim(),
        password: formPassword,
        fullName: formName.trim(),
        cargo: formCargo,
        role: formRole,
      },
    });

    if (res.error || res.data?.error) {
      showToast(res.data?.error || 'Erro ao criar conta', 'error');
    } else {
      showToast('Conta criada com sucesso!', 'success');
      setShowForm(false);
      setFormName(''); setFormEmail(''); setFormPassword(''); setFormCargo('Atendente'); setFormRole('funcionario');
      await fetchUsers();
    }
    setFormLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-bold text-lg">Acesso Restrito</p>
        <p className="text-sm mt-1">Apenas o proprietário pode gerenciar usuários</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <div className="font-display text-lg text-primary">Gestão de Funcionários</div>
          <div className="text-xs text-muted-foreground mt-0.5">Gerencie acessos e permissões</div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-primary-foreground transition-all hover:opacity-90"
          style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
        >
          <UserPlus className="w-4 h-4" /> Criar Conta
        </button>
      </div>

      {/* Create User Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-2xl w-full max-w-md p-6 shadow-2xl border border-border relative">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display text-lg text-primary mb-1">Criar Nova Conta</h3>
            <p className="text-xs text-muted-foreground mb-5">Cadastro de funcionário ou proprietário</p>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Nome Completo</label>
                <input
                  value={formName} onChange={e => setFormName(e.target.value)} required
                  className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                  placeholder="Ex: Maria Silva"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">E-mail</label>
                <input
                  type="email" value={formEmail} onChange={e => setFormEmail(e.target.value)} required
                  className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                  placeholder="funcionario@farmacia.com"
                />
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Senha</label>
                <div className="relative">
                  <input
                    type={formShowPw ? 'text' : 'password'} value={formPassword} onChange={e => setFormPassword(e.target.value)} required minLength={6}
                    className="w-full py-3 px-3.5 pr-12 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card focus:shadow-[0_0_0_3px_rgba(26,107,60,0.08)] transition-all"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button type="button" onClick={() => setFormShowPw(!formShowPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                    {formShowPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Cargo / Função</label>
                <select
                  value={formCargo} onChange={e => setFormCargo(e.target.value)}
                  className="w-full py-3 px-3.5 border-[1.5px] border-border rounded-xl font-body text-sm outline-none bg-background focus:border-primary focus:bg-card transition-all"
                >
                  <option>Atendente</option>
                  <option>Farmacêutico(a)</option>
                  <option>Caixa</option>
                  <option>Gerente</option>
                  <option>Proprietário(a)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-muted-foreground uppercase tracking-wider mb-1.5">Tipo de Acesso</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setFormRole('funcionario')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-[1.5px] transition-all flex items-center justify-center gap-2 ${formRole === 'funcionario' ? 'border-primary bg-[hsl(148,40%,93%)] text-primary' : 'border-border bg-background text-muted-foreground'}`}
                  >
                    <Users className="w-4 h-4" /> Funcionário
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormRole('admin')}
                    className={`flex-1 py-3 rounded-xl font-bold text-sm border-[1.5px] transition-all flex items-center justify-center gap-2 ${formRole === 'admin' ? 'border-primary bg-[hsl(148,40%,93%)] text-primary' : 'border-border bg-background text-muted-foreground'}`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Proprietário
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={formLoading}
                className="w-full py-3.5 rounded-xl font-bold text-[15px] text-primary-foreground transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, hsl(148,61%,26%), hsl(90,60%,41%))' }}
              >
                {formLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                {formLoading ? 'Criando...' : 'Criar Conta'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#f8fbf9]">
            <tr>
              {['', 'Nome', 'Cargo', 'Permissão', 'Ações'].map(h => (
                <th key={h} className="px-4 py-[11px] text-left text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-12"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-muted-foreground font-semibold">Nenhum funcionário cadastrado</td></tr>
            ) : users.map(u => (
              <tr key={u.user_id} className="hover:bg-[#fafcfb] border-t border-border">
                <td className="px-4 py-[13px] w-12">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs text-primary-foreground" style={{ background: 'linear-gradient(135deg, #1a6b3c, #6aaa2a)' }}>
                    {u.avatar_initials}
                  </div>
                </td>
                <td className="px-4 py-[13px]">
                  <div className="font-bold text-[13.5px]">{u.full_name}</div>
                  {u.user_id === currentUser?.id && <span className="text-[10px] text-accent font-bold">(Você)</span>}
                </td>
                <td className="px-4 py-[13px]">
                  <span className="px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-accent-light text-[#4a7a1e]">{u.cargo}</span>
                </td>
                <td className="px-4 py-[13px]">
                  {u.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-[hsl(148,40%,93%)] text-primary">
                      <ShieldCheck className="w-3.5 h-3.5" /> Proprietário
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-bold bg-info-light text-info">
                      <Users className="w-3.5 h-3.5" /> Funcionário
                    </span>
                  )}
                </td>
                <td className="px-4 py-[13px]">
                  {u.user_id !== currentUser?.id && (
                    <button
                      onClick={() => toggleRole(u.user_id, u.role)}
                      className="bg-background text-text-2 border border-border rounded-lg px-3 py-[7px] text-xs font-bold hover:bg-border transition-colors"
                    >
                      {u.role === 'admin' ? '↓ Rebaixar' : '↑ Promover'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
