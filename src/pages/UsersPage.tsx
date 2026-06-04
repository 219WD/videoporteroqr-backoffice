import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDownToLine, ChevronLeft, ChevronRight, Loader2, QrCode, Search, X, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { api } from '../lib/api';

type UserRow = {
  id: string;
  name: string;
  email: string | null;
  role: 'host';
  qrCode: string | null;
  createdAt: string | null;
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type UsersResponse = {
  users: UserRow[];
  pagination: Pagination;
};

const DEFAULT_LIMIT = 10;
const PAGE_SIZES = [10, 25, 50];

function formatDate(value: string | null) {
  if (!value) return 'Sin fecha';

  return new Date(value).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function buildQrPngUrl(userId: string) {
  return `/backoffice/users/${encodeURIComponent(userId)}/qr.png`;
}

function buildQrFilename(name: string, userId: string) {
  const safeName =
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'usuario';

  return `${safeName}-${userId.slice(-6)}-qr.png`;
}

async function downloadQrPng(user: UserRow) {
  const response = await api.get(buildQrPngUrl(user.id), { responseType: 'blob' });
  const blob = response.data as Blob;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = buildQrFilename(user.name || 'usuario', user.id);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

function QrPreviewModal({
  user,
  onClose,
}: {
  user: UserRow | null;
  onClose: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, user]);

  useEffect(() => {
    if (!user) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [user]);

  useEffect(() => {
    const currentUser = user as UserRow;

    if (!currentUser || !currentUser.qrCode) {
      setPreviewUrl(null);
      setPreviewError(null);
      setLoadingPreview(false);
      return;
    }

    const controller = new AbortController();
    let objectUrl: string | null = null;

    async function loadPreview() {
      setLoadingPreview(true);
      setPreviewError(null);

      try {
        const response = await api.get(buildQrPngUrl(currentUser.id), {
          responseType: 'blob',
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        const blob = response.data as Blob;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
      } catch (err: any) {
        const canceled =
          controller.signal.aborted ||
          err?.code === 'ERR_CANCELED' ||
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError';

        if (!canceled) {
          setPreviewUrl(null);
          setPreviewError('No pudimos cargar la vista previa');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      controller.abort();
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [user]);

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#f2d0d0] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Vista previa de QR de ${user.name}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#f2d0d0] bg-[#fff7f7] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Vista previa</p>
            <h3 className="mt-1 text-xl font-extrabold tracking-tight text-zinc-900">{user.name}</h3>
            <p className="mt-1 text-sm text-zinc-500">{user.email || 'Sin correo'}</p>
          </div>

          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar vista previa">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="grid place-items-center rounded-[24px] border border-[#f2d0d0] bg-white p-4">
            {user.qrCode ? (
              loadingPreview ? (
                <div className="grid h-64 w-64 place-items-center rounded-2xl border border-dashed border-[#f2d0d0] bg-[#fff7f7] text-sm text-zinc-500">
                  Cargando vista previa...
                </div>
              ) : previewError ? (
                <div className="grid h-64 w-64 place-items-center rounded-2xl border border-dashed border-[#f2d0d0] bg-[#fff7f7] text-sm text-zinc-500">
                  {previewError}
                </div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={`QR de ${user.name}`}
                  className="h-64 w-64 rounded-2xl border border-[#f2d0d0] bg-white p-2"
                />
              ) : (
                <div className="grid h-64 w-64 place-items-center rounded-2xl border border-dashed border-[#f2d0d0] bg-[#fff7f7] text-sm text-zinc-500">
                  Cargando vista previa...
                </div>
              )
            ) : (
              <div className="grid h-64 w-64 place-items-center rounded-2xl border border-dashed border-[#f2d0d0] bg-[#fff7f7] text-sm text-zinc-500">
                No tiene QR disponible
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-zinc-500">
              <div className="font-medium text-zinc-900">{user.name}</div>
              <div>{user.id}</div>
            </div>

            <Button type="button" variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_LIMIT);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUser, setPreviewUser] = useState<UserRow | null>(null);
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async (nextPage = 1, nextLimit = DEFAULT_LIMIT, nextSearch = '') => {
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    setLoading(true);
    setError(null);

    try {
      const response = await api.get<UsersResponse>('/backoffice/users', {
        params: {
          page: nextPage,
          limit: nextLimit,
          search: nextSearch || undefined,
        },
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setUsers(response.data.users || []);
      setPagination(
        response.data.pagination || {
          page: nextPage,
          limit: nextLimit,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (err: any) {
      const canceled =
        controller.signal.aborted ||
        err?.code === 'ERR_CANCELED' ||
        err?.name === 'CanceledError' ||
        err?.name === 'AbortError';

      if (!canceled) {
        setError(err.response?.data?.error || 'No pudimos cargar los usuarios');
        setUsers([]);
      }
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadUsers(page, pageSize, debouncedSearch);

    return () => {
      requestControllerRef.current?.abort();
    };
  }, [loadUsers, page, pageSize, debouncedSearch]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    void loadUsers(page, pageSize, debouncedSearch);
  }, [loadUsers, page, pageSize, debouncedSearch]);

  const currentWithQr = useMemo(() => users.filter((user) => Boolean(user.qrCode)).length, [users]);
  const canGoPrev = pagination.page > 1;
  const canGoNext = pagination.page < pagination.totalPages;

  return (
    <>
      <QrPreviewModal user={previewUser} onClose={() => setPreviewUser(null)} />

      <section className="rounded-[30px] border border-[#f2d0d0] bg-white p-4 shadow-[0_18px_50px_rgba(211,47,47,0.08)]">
        <div className="flex flex-col gap-3 border-b border-[#f2d0d0] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-zinc-900">Usuarios</h2>
            <p className="mt-1 text-sm leading-6 text-zinc-500">Busca por nombre y descarga o previsualiza el QR.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <form
              className="flex items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                setPage(1);
                setDebouncedSearch(searchInput.trim());
              }}
            >
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar por nombre"
                className="w-[220px] rounded-2xl"
              />
              <Button type="submit" variant="outline">
                <Search className="h-4 w-4" />
                Buscar
              </Button>
              {debouncedSearch ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSearchInput('');
                    setDebouncedSearch('');
                    setPage(1);
                  }}
                >
                  Limpiar
                </Button>
              ) : null}
            </form>

            <Button variant="secondary" onClick={refresh} disabled={loading}>
              {refreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
              {refreshing ? 'Actualizando' : 'Actualizar'}
            </Button>

            <label className="flex items-center gap-2 text-sm text-zinc-600">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(event) => {
                  setPage(1);
                  setPageSize(Number(event.target.value));
                }}
                className="h-11 rounded-2xl border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-[#d32f2f] focus:ring-4 focus:ring-[#d32f2f]/10"
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <p className="mt-3 text-xs text-zinc-500">La busqueda se actualiza automaticamente mientras escribes.</p>

        <div className="grid gap-3 border-b border-[#f2d0d0] py-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Users className="h-4 w-4 text-[#d32f2f]" />
              Usuarios listados
            </div>
            <div className="mt-2 text-2xl font-extrabold">{users.length}</div>
          </div>
          <div className="rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <QrCode className="h-4 w-4 text-[#d32f2f]" />
              Con QR
            </div>
            <div className="mt-2 text-2xl font-extrabold">{currentWithQr}</div>
          </div>
          <div className="rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] p-4">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <Users className="h-4 w-4 text-[#d32f2f]" />
              Pagina actual
            </div>
            <div className="mt-2 text-2xl font-extrabold">
              {pagination.page} / {pagination.totalPages || 1}
            </div>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#f4c4c4] bg-[#fdecec] px-4 py-3 text-sm text-[#b3261e]">
            {error}
          </div>
        ) : null}

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-[980px] w-full border-collapse">
            <thead>
              <tr className="border-b border-[#f2d0d0] text-left text-xs uppercase tracking-[0.18em] text-zinc-500">
                <th className="px-4 py-3 font-semibold">Usuario</th>
                <th className="px-4 py-3 font-semibold">Correo</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">
                    <div className="inline-flex items-center gap-3 rounded-2xl border border-[#f2d0d0] bg-[#fff7f7] px-5 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-[#d32f2f]" />
                      Cargando usuarios...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-sm text-zinc-500">
                    No encontramos usuarios cargados.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const canPreview = Boolean(user.qrCode);

                  return (
                    <tr key={user.id} className="border-b border-zinc-100 align-top last:border-b-0">
                      <td className="px-4 py-4">
                        <div className="space-y-1">
                          <div className="font-semibold text-zinc-900">{user.name}</div>
                          <div className="text-xs text-zinc-500">{user.id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-zinc-700">{user.email || 'Sin correo'}</td>
                      <td className="px-4 py-4 text-sm text-zinc-600">{formatDate(user.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!canPreview}
                            onClick={() => setPreviewUser(user)}
                          >
                            <QrCode className="h-4 w-4" />
                            Ver
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            disabled={!canPreview}
                            onClick={() => {
                              void downloadQrPng(user);
                            }}
                          >
                            <ArrowDownToLine className="h-4 w-4" />
                            Descargar QR
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col gap-3 border-t border-[#f2d0d0] pt-4 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-zinc-500">
            Pagina {pagination.page} de {pagination.totalPages || 1} · {pagination.total} usuarios en total
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              disabled={!canGoPrev || loading}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              disabled={!canGoNext || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
