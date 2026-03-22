import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Shield, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import { useToastCustom } from '@/components/Toast';

interface UserRow {
  user_id: string;
  full_name: string;
  cargo: string;
  avatar_initials: string;
  role: 'admin' | 'funcionario';
  email?: string;
}

export default function UsersPage() {
  const { user: currentUser, isAdmin } = useAuth();
  const { showToast } = useToastCustom();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all users with their roles
  useState(() => {
    (async () => {
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
    })();
  });

  const toggleRole = async (userId: string, currentRole: string) => {
    if (!isAdmin) { showToast('Apenas administradores podem alterar cargos', 'error'); return; }
    if (userId === currentUser?.id) { showToast('Você não pode alterar seu próprio cargo', 'error'); return; }

    const newRole = currentRole === 'admin' ? 'funcionario' : 'admin';

    // Delete existing role and insert new one
    await supabase.from('user_roles').delete().eq('user_id', userId);
    const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });

    if (error) {
      showToast('Erro ao alterar permissão', 'error');
    } else {
      setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, role: newRole } : u));
      showToast(`Permissão alterada para ${newRole === 'admin' ? 'Administrador' : 'Funcionário'}`, 'success');
    }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <Shield className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p className="font-bold text-lg">Acesso Restrito</p>
        <p className="text-sm mt-1">Apenas administradores podem gerenciar usuários</p>
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
      </div>

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
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin
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
                      {u.role === 'admin' ? '↓ Rebaixar' : '↑ Promover Admin'}
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
