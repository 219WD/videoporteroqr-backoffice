import { LogOut, UserCircle2 } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { Outlet } from 'react-router-dom';

export function BackofficeLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(211,47,47,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(211,47,47,0.12),_transparent_26%),linear-gradient(180deg,#fff4f4_0%,#f8fafc_100%)] px-4 py-4 text-zinc-900">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
        <header className="overflow-hidden rounded-[30px] border border-[#f2d0d0] bg-white shadow-[0_18px_50px_rgba(211,47,47,0.08)]">
          <div className="flex flex-col gap-4 bg-gradient-to-br from-[#d32f2f] to-[#8e1b1b] px-5 py-5 text-white md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                <img
                  src="/splash/logotipo-color.png"
                  alt="Albiero Seguridad"
                  className="h-10 w-10 select-none object-contain drop-shadow-sm"
                  draggable={false}
                />
              </div>
              <div className="space-y-2">
                <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">Backoffice</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight">Panel de usuarios</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/85">
                  Gestiona los usuarios y descarga sus QR en PNG.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm text-white/90 ring-1 ring-white/10">
                <UserCircle2 className="h-4 w-4" />
                <span>{user?.name || 'Administrador'}</span>
              </div>
              <Button variant="secondary" onClick={logout}>
                <LogOut className="h-4 w-4" />
                Cerrar sesion
              </Button>
            </div>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
