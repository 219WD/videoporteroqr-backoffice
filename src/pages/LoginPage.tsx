import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { LoadingScreen } from '../components/LoadingScreen';
import { useAuth } from '../context/AuthContext';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user?.role === 'admin') {
    const target = (location.state as { from?: string } | null)?.from || '/users';
    return <Navigate to={target} replace />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/users', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.message || 'No pudimos iniciar sesión');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(211,47,47,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(211,47,47,0.12),_transparent_26%),linear-gradient(180deg,#fff4f4_0%,#f8fafc_100%)] px-4 py-4 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-6xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-[32px] border border-[#f2d0d0] bg-white shadow-[0_24px_70px_rgba(211,47,47,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between gap-8 bg-gradient-to-br from-[#d32f2f] to-[#8e1b1b] px-8 py-10 text-white">
            <div className="space-y-6">
              <div className="grid h-16 w-16 place-items-center rounded-2xl bg-white/12 ring-1 ring-white/15">
                <img
                  src="/splash/logotipo-color.png"
                  alt="Albiero Seguridad"
                  className="h-10 w-10 select-none object-contain"
                  draggable={false}
                />
              </div>
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/75">Backoffice</p>
                <h1 className="max-w-md text-4xl font-extrabold tracking-tight">Acceso al panel</h1>
                <p className="max-w-lg text-sm leading-6 text-white/85">
                  Inresa con tu cuenta autorizada para revisar los usuarios y descargar sus QR.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/8 p-4 text-sm text-white/80">
              Solo las cuentas autorizadas pueden entrar.
            </div>
          </div>

          <div className="flex items-center justify-center px-6 py-10">
            <form className="w-full max-w-md space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Iniciar sesion</h2>
                <p className="text-sm leading-6 text-zinc-500">Usa tus credenciales para continuar.</p>
              </div>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700">Correo</span>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Tu correo"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-zinc-700">Contrasena</span>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Tu contrasena"
                  autoComplete="current-password"
                  required
                />
              </label>

              {error ? (
                <div className="rounded-2xl border border-[#f4c4c4] bg-[#fdecec] px-4 py-3 text-sm text-[#b3261e]">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                {submitting ? 'Ingresando' : 'Entrar al panel'}
              </Button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}
