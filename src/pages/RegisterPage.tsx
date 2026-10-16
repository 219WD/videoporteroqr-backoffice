import { CheckCircle2, Eye, EyeOff, Loader2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';

function cleanPastedPassword(value: string) {
  return value.replace(/[\r\n\t\u200B-\u200D\uFEFF]/g, '');
}

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const normalizedPassword = password.trim();
    const normalizedConfirmation = confirmation.trim();

    if (normalizedPassword !== normalizedConfirmation) {
      setError('Las contraseñas no coinciden. Revisá que no haya espacios al principio o al final.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post<{ message?: string }>('/auth/register', {
        name: name.trim(),
        email: email.trim(),
        password: normalizedPassword,
        passwordConfirmation: normalizedConfirmation,
      });
      setSuccess(response.data.message || 'Cuenta creada. Verificá tu correo antes de ingresar.');
      setPassword('');
      setConfirmation('');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'No pudimos crear la cuenta');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,_rgba(211,47,47,0.24),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(211,47,47,0.12),_transparent_26%),linear-gradient(180deg,#fff4f4_0%,#f8fafc_100%)] px-4 py-4 text-zinc-900">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] w-full max-w-2xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-[#f2d0d0] bg-white p-6 shadow-[0_24px_70px_rgba(211,47,47,0.12)] sm:p-10">
          <div className="mx-auto max-w-md space-y-5">
            <div><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#fff1f1]"><UserPlus className="h-7 w-7 text-[#d32f2f]" /></div><h1 className="text-3xl font-extrabold tracking-tight">Crear usuario</h1><p className="mt-2 text-sm leading-6 text-zinc-500">La cuenta comienza como usuario normal. Un administrador podrá otorgarle acceso al backoffice.</p></div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <label className="block space-y-2"><span className="text-sm font-medium text-zinc-700">Nombre</span><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" autoComplete="name" required /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-zinc-700">Correo</span><Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="tu@correo.com" autoComplete="email" required /></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-zinc-700">Contraseña</span><span className="flex items-center gap-2"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} onPaste={(event) => { event.preventDefault(); setPassword(cleanPastedPassword(event.clipboardData.getData('text'))); }} autoComplete="new-password" required minLength={8} /><Button type="button" variant="outline" size="icon" onClick={() => setShowPassword((current) => !current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></span></label>
              <label className="block space-y-2"><span className="text-sm font-medium text-zinc-700">Confirmar contraseña</span><span className="flex items-center gap-2"><Input type={showConfirmation ? 'text' : 'password'} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} onPaste={(event) => { event.preventDefault(); setConfirmation(cleanPastedPassword(event.clipboardData.getData('text'))); }} autoComplete="new-password" required minLength={8} /><Button type="button" variant="outline" size="icon" onClick={() => setShowConfirmation((current) => !current)} aria-label={showConfirmation ? 'Ocultar confirmación' : 'Mostrar confirmación'}>{showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</Button></span></label>
              {error ? <div className="rounded-2xl border border-[#f4c4c4] bg-[#fdecec] px-4 py-3 text-sm text-[#b3261e]">{error}</div> : null}
              {success ? <div className="flex gap-3 rounded-2xl border border-[#cbe7d4] bg-[#f1faf4] px-4 py-3 text-sm text-[#23784b]"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /><span>{success}</span></div> : null}
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}{submitting ? 'Creando cuenta' : 'Crear cuenta'}</Button>
            </form>
            <div className="flex items-center justify-between text-sm"><Link className="font-semibold text-[#8a3237] hover:underline" to="/login">Volver al login</Link>{success ? <button type="button" className="font-semibold text-[#8a3237] hover:underline" onClick={() => navigate('/login')}>Ir a iniciar sesión</button> : null}</div>
          </div>
        </section>
      </div>
    </main>
  );
}
