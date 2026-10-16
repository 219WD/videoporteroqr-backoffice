import { CheckCircle2, Loader2, Search, ShieldCheck, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';

type ManagedUser = {
  id: string;
  name: string;
  email: string | null;
  role: 'admin' | 'plate_manager' | 'technician' | 'host';
  createdAt: string | null;
  emailVerified?: boolean;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha';
  return new Date(value).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function AdminUsersPage() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ users: ManagedUser[]; pagination: Pagination }>('/backoffice/users', {
        params: { role: 'all', page, limit: 25, search: search.trim() || undefined },
      });
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { page, limit: 25, total: 0, totalPages: 0 });
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No pudimos cargar los usuarios');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { void loadUsers(); }, [loadUsers]);

  const updateRole = async (user: ManagedUser, role: ManagedUser['role']) => {
    setUpdatingId(user.id);
    setError(null);
    try {
      const response = await api.patch<{ user: ManagedUser }>(`/backoffice/users/${encodeURIComponent(user.id)}/role`, { role });
      setUsers((current) => current.map((item) => item.id === user.id ? response.data.user : item));
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No pudimos actualizar los permisos');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <section className="rounded-[30px] border border-[#f2d0d0] bg-white p-4 shadow-[0_18px_50px_rgba(211,47,47,0.08)]">
      <div className="flex flex-col gap-4 border-b border-[#f2d0d0] pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#b3261e]"><ShieldCheck className="h-4 w-4" />Permisos</div>
          <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-zinc-900">Usuarios y permisos</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">Los usuarios se registran como cuentas normales. Desde acá podés asignar administrador, gestor de placas o técnico.</p>
        </div>
        <form className="flex items-center gap-2" onSubmit={(event) => { event.preventDefault(); setPage(1); void loadUsers(); }}>
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar usuario" className="w-[220px] rounded-2xl" />
          <Button type="submit" variant="outline"><Search className="h-4 w-4" />Buscar</Button>
        </form>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <div className="rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] px-4 py-3 text-sm text-zinc-600"><Users className="mr-2 inline h-4 w-4 text-[#d32f2f]" />{pagination.total} usuarios registrados</div>
        <div className="rounded-2xl border border-[#d2eadb] bg-[#f4fbf6] px-4 py-3 text-sm text-zinc-600"><ShieldCheck className="mr-2 inline h-4 w-4 text-[#2e9d63]" />{users.filter((user) => user.role === 'admin').length} administradores en esta página</div>
      </div>

      {error ? <div className="mt-4 rounded-2xl border border-[#f4c4c4] bg-[#fdecec] px-4 py-3 text-sm text-[#b3261e]">{error}</div> : null}

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-[760px] w-full border-collapse">
          <thead><tr className="border-b border-[#f2d0d0] text-left text-xs uppercase tracking-[0.18em] text-zinc-500"><th className="px-4 py-3 font-semibold">Usuario</th><th className="px-4 py-3 font-semibold">Registro</th><th className="px-4 py-3 font-semibold">Rol actual</th><th className="px-4 py-3 font-semibold">Permisos</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-zinc-500"><span className="inline-flex items-center gap-3 rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] px-5 py-4"><Loader2 className="h-4 w-4 animate-spin text-[#d32f2f]" />Cargando usuarios...</span></td></tr> : users.length === 0 ? <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-zinc-500">No encontramos usuarios.</td></tr> : users.map((user) => {
              const updating = updatingId === user.id;
              return <tr key={user.id} className="border-b border-zinc-100 last:border-b-0"><td className="px-4 py-4"><div className="font-semibold text-zinc-900">{user.name}</div><div className="mt-1 text-sm text-zinc-500">{user.email || 'Sin correo'}</div></td><td className="px-4 py-4 text-sm text-zinc-600">{formatDate(user.createdAt)}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user.role === 'admin' ? 'bg-[#fff1f1] text-[#8a3237]' : user.role === 'plate_manager' ? 'bg-[#f3f0ff] text-[#59438a]' : user.role === 'technician' ? 'bg-[#eef5ff] text-[#315b94]' : 'bg-zinc-100 text-zinc-600'}`}>{user.role === 'admin' ? 'Administrador' : user.role === 'plate_manager' ? 'Gestor de placas' : user.role === 'technician' ? 'Técnico' : 'Usuario'}</span></td><td className="px-4 py-4"><select value={user.role} disabled={updating} onChange={(event) => void updateRole(user, event.target.value as ManagedUser['role'])} className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-[#d32f2f] focus:ring-4 focus:ring-[#d32f2f]/10"><option value="host">Usuario</option><option value="plate_manager">Gestor de placas</option><option value="technician">Técnico</option><option value="admin">Administrador</option></select>{updating ? <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-[#d32f2f]" /> : null}</td></tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#f2d0d0] pt-4 text-sm text-zinc-500"><span>Página {pagination.page} de {pagination.totalPages || 1}</span><div className="flex gap-2"><Button variant="outline" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Anterior</Button><Button variant="outline" disabled={page >= pagination.totalPages || loading} onClick={() => setPage((current) => current + 1)}>Siguiente</Button></div></div>
    </section>
  );
}
