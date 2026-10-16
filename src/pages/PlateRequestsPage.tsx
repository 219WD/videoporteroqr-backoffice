import { CalendarClock, CheckCircle2, ClipboardList, Clock3, Download, Loader2, MapPin, PhoneCall, RefreshCw, UserRound, Wrench, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type RequestStatus = 'pending' | 'in_production' | 'ready_for_installation' | 'installed' | 'rejected';
type PlateRequest = {
  _id: string; asset: 'plate'; type: 'new_plate'; status: RequestStatus; note: string | null; createdAt: string; resolvedAt: string | null;
  shippingAddress?: string | null; contactPhone?: string | null; installationScheduledAt?: string | null; technicianAssignedAt?: string | null;
  statusHistory?: Array<{ status: RequestStatus; changedAt: string }>;
  assignedTechnician?: { _id?: string; name?: string; email?: string } | null;
  user?: { _id?: string; name?: string; email?: string; qrCode?: string; plateStatus?: string; plateInstalledAt?: string | null } | null;
};

const STATUS_OPTIONS: Array<{ value: RequestStatus; label: string }> = [
  { value: 'pending', label: 'Solicitud recibida' }, { value: 'in_production', label: 'En fabricación' },
  { value: 'ready_for_installation', label: 'Lista para instalar' }, { value: 'installed', label: 'Instalada' }, { value: 'rejected', label: 'Rechazada' },
];

function formatDateTime(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function scheduleInputs(value: string | null | undefined) {
  if (!value) return { date: '', time: '' };
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date(value));
  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
}
function statusLabel(status: RequestStatus) { return STATUS_OPTIONS.find((option) => option.value === status)?.label || status; }
function statusTone(status: RequestStatus) {
  if (status === 'installed') return 'border-[#cce9d7] bg-[#effaf3] text-[#24784c]';
  if (status === 'ready_for_installation') return 'border-[#cfe0f5] bg-[#f1f7ff] text-[#315b94]';
  if (status === 'in_production') return 'border-[#f2dfb4] bg-[#fff9e9] text-[#8a6417]';
  if (status === 'rejected') return 'border-[#f0caca] bg-[#fff2f2] text-[#9b3438]';
  return 'border-[#f2d0d0] bg-[#fff5f5] text-[#9b3438]';
}

export function PlateRequestsPage() {
  const { user } = useAuth();
  const isTechnician = user?.role === 'technician';
  const [requests, setRequests] = useState<PlateRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | RequestStatus>('all');
  const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null); const [pendingInstallation, setPendingInstallation] = useState<PlateRequest | null>(null); const [pendingSchedule, setPendingSchedule] = useState<PlateRequest | null>(null);
  const [scheduleDate, setScheduleDate] = useState(''); const [scheduleTime, setScheduleTime] = useState(''); const [error, setError] = useState<string | null>(null);

  const loadRequests = useCallback(async () => {
    setError(null);
    try {
      const response = await api.get<{ requests: PlateRequest[] }>('/backoffice/plate-requests', { params: statusFilter === 'all' ? undefined : { status: statusFilter } });
      setRequests(response.data.requests || []);
    } catch (err: any) { setError(err?.response?.data?.error || 'No pudimos cargar las solicitudes de placas'); setRequests([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [statusFilter]);
  useEffect(() => { setLoading(true); void loadRequests(); }, [loadRequests]);

  const applyUpdateRequest = async (request: PlateRequest, status: RequestStatus, installationScheduledAt?: string) => {
    setUpdatingId(request._id); setError(null);
    try {
      const response = await api.patch<{ request: PlateRequest }>(`/backoffice/plate-requests/${encodeURIComponent(request._id)}`, { status, ...(installationScheduledAt ? { installationScheduledAt } : {}) });
      if (statusFilter === 'all') setRequests((current) => current.map((item) => item._id === request._id ? response.data.request : item));
      else setRequests((current) => current.filter((item) => item._id !== request._id));
    } catch (err: any) { setError(err?.response?.data?.error || 'No pudimos actualizar la solicitud'); }
    finally { setUpdatingId(null); }
  };

  const updateRequest = async (request: PlateRequest, status: RequestStatus) => {
    if (status === 'ready_for_installation') {
      openScheduleModal(request); return;
    }
    if (status === 'installed' && request.status !== 'installed') { setPendingInstallation(request); return; }
    await applyUpdateRequest(request, status);
  };
  const openScheduleModal = (request: PlateRequest) => {
    const current = scheduleInputs(request.installationScheduledAt);
    setScheduleDate(current.date); setScheduleTime(current.time); setPendingSchedule(request);
  };
  const confirmSchedule = async () => {
    if (!pendingSchedule || !scheduleDate || !scheduleTime) return;
    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}:00-03:00`).toISOString(); const request = pendingSchedule; setPendingSchedule(null); await applyUpdateRequest(request, 'ready_for_installation', scheduledAt);
  };
  const claimInstallation = async (request: PlateRequest) => {
    setUpdatingId(request._id); setError(null);
    try { const response = await api.patch<{ request: PlateRequest }>(`/backoffice/plate-requests/${encodeURIComponent(request._id)}/claim`); setRequests((current) => current.map((item) => item._id === request._id ? response.data.request : item)); }
    catch (err: any) { setError(err?.response?.data?.error || 'No pudimos tomar esta instalación'); }
    finally { setUpdatingId(null); }
  };
  const downloadQr = async (request: PlateRequest) => {
    const userId = request.user?._id; if (!userId) { setError('Esta solicitud no tiene un usuario asociado para descargar el QR.'); return; }
    try { const response = await api.get<Blob>(`/backoffice/users/${encodeURIComponent(userId)}/qr.png`, { responseType: 'blob' }); const url = URL.createObjectURL(response.data); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${(request.user?.name || 'usuario').replace(/[^a-z0-9áéíóúñü]+/gi, '-').toLowerCase()}-qr.png`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url); }
    catch (err: any) { setError(err?.response?.data?.error || 'No pudimos descargar el QR'); }
  };
  const contactUser = (request: PlateRequest) => {
    const phone = request.contactPhone?.trim(); if (phone) { window.location.href = `tel:${phone}`; return; }
    const email = request.user?.email?.trim(); if (email) { const subject = encodeURIComponent('Coordinación de instalación de tu placa Portero QR'); const body = encodeURIComponent('Hola, tu placa ya está lista para instalar. Queremos coordinar el día y horario de instalación.'); window.location.href = `mailto:${email}?subject=${subject}&body=${body}`; }
  };
  const counters = useMemo(() => ({ pending: requests.filter((request) => request.status === 'pending').length, production: requests.filter((request) => request.status === 'in_production').length, ready: requests.filter((request) => request.status === 'ready_for_installation').length, installed: requests.filter((request) => request.status === 'installed').length, rejected: requests.filter((request) => request.status === 'rejected').length }), [requests]);
  const visibleStatusOptions = isTechnician ? STATUS_OPTIONS.filter((option) => ['ready_for_installation', 'installed'].includes(option.value)) : STATUS_OPTIONS;

  return <section className="space-y-5">
    <div className="flex flex-col gap-4 rounded-[30px] border border-[#f2d0d0] bg-white p-5 shadow-[0_18px_50px_rgba(211,47,47,0.08)] md:flex-row md:items-end md:justify-between">
      <div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[#b3261e]"><ClipboardList className="h-4 w-4" />{isTechnician ? 'Operaciones' : 'Operaciones de placas'}</div><h2 className="mt-2 text-3xl font-extrabold tracking-tight text-zinc-950">{isTechnician ? 'Instalaciones' : 'Solicitudes de placas'}</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-zinc-500">{isTechnician ? 'Tomá una instalación disponible y consultá su dirección y horario estimado.' : 'Seguimiento completo desde la solicitud hasta la instalación de la placa.'}</p></div>
      <Button variant="secondary" onClick={() => { setRefreshing(true); void loadRequests(); }} disabled={loading || refreshing}>{refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}{refreshing ? 'Actualizando' : 'Actualizar datos'}</Button>
    </div>

    {!isTechnician ? <div className="grid grid-cols-2 gap-3 md:grid-cols-5"><SummaryCard icon={<Clock3 />} label="Pendientes" value={counters.pending} tone="red" /><SummaryCard icon={<ClipboardList />} label="En fabricación" value={counters.production} tone="amber" /><SummaryCard icon={<CalendarClock />} label="Para instalar" value={counters.ready} tone="blue" /><SummaryCard icon={<CheckCircle2 />} label="Instaladas" value={counters.installed} tone="green" /><SummaryCard icon={<XCircle />} label="Rechazadas" value={counters.rejected} tone="gray" /></div> : null}

    <div className="flex flex-col gap-3 rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-zinc-900">{isTechnician ? 'Instalaciones asignables' : 'Bandeja de trabajo'}</p><p className="mt-1 text-xs text-zinc-500">{requests.length} {requests.length === 1 ? 'registro visible' : 'registros visibles'}</p></div><label className="flex items-center gap-3 text-sm text-zinc-600"><span className="font-semibold">Filtrar por estado</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | RequestStatus)} className="h-10 min-w-[190px] rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium outline-none focus:border-[#d32f2f] focus:ring-4 focus:ring-[#d32f2f]/10"><option value="all">{isTechnician ? 'Todas las instalaciones' : 'Todos los estados'}</option>{visibleStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label></div>

    {error ? <div className="rounded-2xl border border-[#f4c4c4] bg-[#fdecec] px-4 py-3 text-sm text-[#b3261e]">{error}</div> : null}
    {loading ? <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-14 text-center text-sm text-zinc-500 shadow-sm"><Loader2 className="mx-auto h-6 w-6 animate-spin text-[#d32f2f]" /><p className="mt-3">Cargando solicitudes...</p></div> : requests.length === 0 ? <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-5 py-14 text-center shadow-sm"><CheckCircle2 className="mx-auto h-10 w-10 text-[#2e9d63]" /><p className="mt-3 font-bold text-zinc-900">No hay registros en este filtro</p><p className="mt-1 text-sm text-zinc-500">Las nuevas solicitudes aparecerán acá automáticamente.</p></div> : <div className="space-y-3">{requests.map((request) => <RequestCard key={request._id} request={request} isTechnician={isTechnician} currentUserId={user?.id} updating={updatingId === request._id} onStatusChange={updateRequest} onSchedule={openScheduleModal} onDownloadQr={downloadQr} onContact={contactUser} onClaim={claimInstallation} />)}</div>}

    {pendingSchedule ? <ModalShell title="Programar instalación" onClose={() => setPendingSchedule(null)}><p className="text-sm leading-6 text-zinc-600">Elegí el día y horario estimados. El usuario recibirá estos datos junto con la notificación de que su placa está lista.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="text-sm font-semibold text-zinc-700">Día<input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-300 px-3 font-normal outline-none focus:border-[#d32f2f]" /></label><label className="text-sm font-semibold text-zinc-700">Horario estimado<input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-zinc-300 px-3 font-normal outline-none focus:border-[#d32f2f]" /></label></div><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setPendingSchedule(null)}>Cancelar</Button><Button onClick={() => void confirmSchedule()} disabled={!scheduleDate || !scheduleTime}><CalendarClock className="h-4 w-4" />Guardar y notificar</Button></div></ModalShell> : null}
    {pendingInstallation ? <ModalShell title="Confirmar instalación" onClose={() => setPendingInstallation(null)}><p className="text-sm leading-6 text-zinc-600">¿Confirmás que la placa de <strong>{pendingInstallation.user?.name || 'este usuario'}</strong> ya fue instalada? Se informará al usuario y se registrará la fecha.</p><div className="mt-6 flex justify-end gap-3"><Button variant="outline" onClick={() => setPendingInstallation(null)}>Cancelar</Button><Button onClick={() => { const request = pendingInstallation; setPendingInstallation(null); void applyUpdateRequest(request, 'installed'); }}><CheckCircle2 className="h-4 w-4" />Confirmar instalación</Button></div></ModalShell> : null}
  </section>;
}

function SummaryCard({ icon, label, value, tone }: { icon: ReactNode; label: string; value: number; tone: 'red' | 'amber' | 'blue' | 'green' | 'gray' }) {
  const tones = { red: 'border-[#f2d0d0] bg-[#fff7f7] text-[#b3261e]', amber: 'border-[#f2dfb4] bg-[#fffaf0] text-[#8a6417]', blue: 'border-[#cfe0f5] bg-[#f4f8ff] text-[#315b94]', green: 'border-[#cce9d7] bg-[#f3fbf6] text-[#24784c]', gray: 'border-zinc-200 bg-zinc-50 text-zinc-600' };
  return <div className={`rounded-2xl border p-4 ${tones[tone]}`}><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.12em] opacity-80">{label}</span><span className="[&>svg]:h-4 [&>svg]:w-4">{icon}</span></div><p className="mt-2 text-2xl font-extrabold text-zinc-950">{value}</p></div>;
}

function RequestCard({ request, isTechnician, currentUserId, updating, onStatusChange, onSchedule, onDownloadQr, onContact, onClaim }: { request: PlateRequest; isTechnician: boolean; currentUserId?: string; updating: boolean; onStatusChange: (request: PlateRequest, status: RequestStatus) => Promise<void>; onSchedule: (request: PlateRequest) => void; onDownloadQr: (request: PlateRequest) => Promise<void>; onContact: (request: PlateRequest) => void; onClaim: (request: PlateRequest) => Promise<void> }) {
  const installationDate = request.status === 'installed' ? request.user?.plateInstalledAt : request.installationScheduledAt;
  const isAssignedToMe = Boolean(request.assignedTechnician?._id && request.assignedTechnician._id === currentUserId);
  const history = request.statusHistory || [{ status: request.status, changedAt: request.createdAt }];
  if (isTechnician) return <article className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-[#d9aeb2] hover:shadow-md"><div className="grid gap-5 md:grid-cols-[1.15fr_1fr_auto] md:items-center"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"><MapPin className="h-4 w-4 text-[#d32f2f]" />Dirección</div><p className="mt-2 text-lg font-extrabold text-zinc-950">{request.shippingAddress || 'Dirección no informada'}</p><p className="mt-1 text-sm text-zinc-500">Contacto: {request.contactPhone || 'No informado'}</p></div><div><span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusTone(request.status)}`}>{statusLabel(request.status)}</span><p className="mt-3 flex items-center gap-2 text-sm text-zinc-600"><CalendarClock className="h-4 w-4 text-[#315b94]" /><span><strong>{request.status === 'installed' ? 'Instalada' : 'Horario estimado'}:</strong> {formatDateTime(installationDate)}</span></p></div><div className="md:text-right">{request.assignedTechnician ? <p className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-600"><Wrench className="h-4 w-4" />{isAssignedToMe ? 'Tomada por vos' : 'Tomada por otro técnico'}</p> : request.status === 'ready_for_installation' ? <Button onClick={() => void onClaim(request)} disabled={updating}><Wrench className="h-4 w-4" />{updating ? 'Tomando…' : 'Tomar instalación'}</Button> : <span className="text-sm text-zinc-400">Sin asignar</span>}</div></div></article>;
  return <article className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm transition hover:border-[#d9aeb2] hover:shadow-md"><div className="grid gap-6 p-5 lg:grid-cols-[1.05fr_1.2fr_1fr_auto] lg:items-start"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"><UserRound className="h-4 w-4 text-[#d32f2f]" />Solicitante</div><h3 className="mt-2 text-lg font-extrabold text-zinc-950">{request.user?.name || 'Usuario sin nombre'}</h3><p className="mt-1 break-all text-sm text-zinc-500">{request.user?.email || 'Sin correo'}</p><button type="button" onClick={() => void onDownloadQr(request)} disabled={!request.user?._id} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#e5bfc2] px-3 py-2 text-xs font-bold text-[#8a3237] transition hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-50"><Download className="h-3.5 w-3.5" />Descargar QR</button></div><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"><ClipboardList className="h-4 w-4 text-[#d32f2f]" />Solicitud</div><p className="mt-2 font-bold text-zinc-900">Solicitud de placa nueva</p><p className="mt-1 text-xs text-zinc-500">Recibida el {formatDateTime(request.createdAt)}</p>{request.note ? <p className="mt-3 rounded-xl bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-600">{request.note}</p> : null}<div className="mt-4 border-l-2 border-[#f0d8d8] pl-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Historial</p>{history.map((entry, index) => <div key={`${entry.changedAt}-${index}`} className="mt-2 flex items-start gap-2 text-xs text-zinc-600"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === history.length - 1 ? 'bg-[#d32f2f]' : 'bg-zinc-300'}`} /> <span><strong>{statusLabel(entry.status)}</strong><br />{formatDateTime(entry.changedAt)}</span></div>)}</div></div><div className="space-y-4"><div><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-zinc-400"><MapPin className="h-4 w-4 text-[#d32f2f]" />Entrega</div><p className="mt-2 font-bold text-zinc-900">{request.shippingAddress || 'Dirección no informada'}</p><p className="mt-1 text-sm text-zinc-500">Contacto: {request.contactPhone || 'No informado'}</p></div><div className="rounded-2xl bg-zinc-50 p-3"><p className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Estado de instalación</p><span className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusTone(request.status)}`}>{statusLabel(request.status)}</span><p className="mt-2 flex items-center gap-2 text-xs text-zinc-600"><CalendarClock className="h-4 w-4" />{request.status === 'installed' ? `Instalada: ${formatDateTime(request.user?.plateInstalledAt)}` : `Horario estimado: ${formatDateTime(request.installationScheduledAt)}`}</p>{request.assignedTechnician ? <p className="mt-2 flex items-center gap-2 text-xs text-zinc-600"><Wrench className="h-4 w-4" />Técnico: {request.assignedTechnician.name || 'Asignado'}</p> : null}</div></div><div className="flex flex-col gap-3 lg:min-w-[190px]"><label className="text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Gestionar<select value={request.status} disabled={updating} onChange={(event) => void onStatusChange(request, event.target.value as RequestStatus)} className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium outline-none focus:border-[#d32f2f] focus:ring-4 focus:ring-[#d32f2f]/10">{STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>{request.status === 'ready_for_installation' ? <><Button variant="outline" onClick={() => onSchedule(request)}><CalendarClock className="h-4 w-4" />Programar instalación</Button><Button onClick={() => onContact(request)} disabled={!request.contactPhone && !request.user?.email}><PhoneCall className="h-4 w-4" />Contactar usuario</Button></> : null}</div></div></article>;
}

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/45 px-4" role="presentation"><div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="backoffice-modal-title"><div className="flex items-start justify-between gap-4"><h3 id="backoffice-modal-title" className="text-xl font-extrabold text-zinc-950">{title}</h3><button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-2xl leading-none text-zinc-400 hover:bg-zinc-100" aria-label="Cerrar">×</button></div><div className="mt-3">{children}</div></div></div>;
}
