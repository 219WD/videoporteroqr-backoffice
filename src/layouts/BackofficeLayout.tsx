import { ClipboardList, LogOut, ShieldCheck, UserCircle2, Users } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { NavLink, Outlet } from 'react-router-dom';

export function BackofficeLayout() {
  const { user, logout } = useAuth();
  const isPlateManager = user?.role === 'plate_manager';
  const isTechnician = user?.role === 'technician';
  const restrictedToPlates = isPlateManager || isTechnician;

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
                <Badge className="w-fit bg-white/10 text-white hover:bg-white/10">{isTechnician ? 'Instalaciones' : restrictedToPlates ? 'Gestión de placas' : 'Administración'}</Badge>
                <h1 className="text-3xl font-extrabold tracking-tight">{restrictedToPlates ? (isTechnician ? 'Panel de instalaciones' : 'Gestión de placas') : 'Panel de administración'}</h1>
                <p className="max-w-2xl text-sm leading-6 text-white/85">
                  {isTechnician ? 'Consultá las instalaciones pendientes y las direcciones de cada usuario.' : isPlateManager ? 'Revisá solicitudes y descargá el QR de cada usuario.' : 'Gestioná usuarios, QR y solicitudes de placas desde un solo lugar.'}
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
          <nav className="flex flex-wrap gap-2 border-t border-[#f2d0d0] bg-white px-5 py-3" aria-label="Secciones del backoffice">
            {!restrictedToPlates ? <NavLink to="/users" className={({ isActive }) => `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'bg-[#7d1522] text-white' : 'text-zinc-700 hover:bg-[#fff1f1]'}`}><Users className="h-4 w-4" />Usuarios</NavLink> : null}
            <NavLink to="/plate-requests" className={({ isActive }) => `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'bg-[#7d1522] text-white' : 'text-zinc-700 hover:bg-[#fff1f1]'}`}><ClipboardList className="h-4 w-4" />{isTechnician ? 'Instalaciones' : 'Solicitudes de placas'}</NavLink>
            {!restrictedToPlates ? <NavLink to="/administrators" className={({ isActive }) => `inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-bold transition-colors ${isActive ? 'bg-[#7d1522] text-white' : 'text-zinc-700 hover:bg-[#fff1f1]'}`}><ShieldCheck className="h-4 w-4" />Usuarios y permisos</NavLink> : null}
          </nav>
        </header>

        <Outlet />
      </div>
    </div>
  );
}
