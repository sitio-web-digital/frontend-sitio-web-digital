// Cliente de la API real (Express + PostgreSQL en Docker, ver /server). Guarda
// el JWT en localStorage para poder restaurar la sesión al recargar la página.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const TOKEN_KEY = 'sitiowebdigital.token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // no-op
  }
}

async function request(path, { method = 'GET', body, token } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || 'Ocurrió un error inesperado.' };
  return { ok: true, ...data };
}

// De acá para abajo, /uploads/* (sin el prefijo /api) — mismo servidor, pero
// las fotos se sirven como archivos estáticos, no como una ruta de la API.
const SERVER_ORIGIN = API_URL.replace(/\/api\/?$/, '');

// Sube una foto elegida en el editor (galería, productos, logo, ofertas del
// hero, etc.) y devuelve una URL que sigue funcionando después, para cualquier
// persona — a diferencia de URL.createObjectURL(file), que solo vale
// mientras dure esa pestaña. Si todavía no hay sesión iniciada (ej. el logo
// del quiz, antes de crear cuenta), no hay dónde subirla: quien llama tiene
// que quedarse con el blob: local como respaldo en ese caso.
export async function apiUploadImage(file) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para subir esta imagen.' };
  const form = new FormData();
  form.append('file', file);
  let res;
  try {
    res = await fetch(`${SERVER_ORIGIN}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: data.error || 'No se pudo subir la imagen.' };
  return { ok: true, url: `${SERVER_ORIGIN}${data.url}` };
}

export async function apiLogin({ email, password }) {
  const result = await request('/auth/login', { method: 'POST', body: { email, password } });
  if (!result.ok) return result;
  setToken(result.token);
  return { ok: true, user: result.user };
}

export async function apiRegister({ name, email, password }) {
  const result = await request('/auth/register', { method: 'POST', body: { name, email, password } });
  if (!result.ok) return result;
  setToken(result.token);
  return { ok: true, user: result.user };
}

export async function apiUpdateMe({ name, email }) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para editar tu perfil.' };
  const result = await request('/auth/me', { method: 'PATCH', body: { name, email }, token });
  return result.ok ? { ok: true, user: result.user } : result;
}

// Se llama al arrancar la app para recuperar la sesión a partir del token guardado.
export async function apiMe() {
  const token = getToken();
  if (!token) return null;
  const result = await request('/auth/me', { token });
  if (!result.ok) {
    setToken(null);
    return null;
  }
  return result.user;
}

export function apiLogoutLocal() {
  setToken(null);
}

// Se llama recién después de que el pago se confirma y hay sesión iniciada —
// antes de eso la página vive solo como borrador local (ver utils/siteSchema.js).
export async function apiSaveSite(siteJSON) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para guardar tu página.' };
  return request('/sites/me', { method: 'PUT', body: { site: siteJSON }, token });
}

export async function apiLoadSite() {
  const token = getToken();
  if (!token) return { site: null, locked: false, subdomain: null };
  const result = await request('/sites/me', { token });
  return result.ok
    ? { site: result.site, locked: result.locked, subdomain: result.subdomain }
    : { site: null, locked: false, subdomain: null };
}

// Elegir/cambiar el subdominio propio (Dashboard > Configuración).
export async function apiSetSubdomain(subdomain) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para elegir tu subdominio.' };
  return request('/sites/me/subdomain', { method: 'PUT', body: { subdomain }, token });
}

// Pública, sin sesión — la usa PublicSite.jsx para renderizar la página de un
// cliente a partir de su subdominio (ver ?site= en local, o el hostname real
// en producción).
export async function apiGetPublicSite(subdomain) {
  const result = await request(`/public/sites/${encodeURIComponent(subdomain)}`);
  return result.ok ? { ok: true, site: result.site } : { ok: false, error: result.error };
}

// Pública, sin sesión — el paso 1 del quiz la usa para mostrar en vivo si el
// subdominio sugerido (a partir del nombre que se va tipeando) está libre.
export async function apiCheckSubdomainAvailability(value) {
  const result = await request(`/public/subdomain-availability?value=${encodeURIComponent(value)}`);
  return result.ok ? { available: result.available, reason: result.reason } : { available: false, reason: result.error };
}

// Chequeo liviano de estado (bloqueo de edición + publicada o no), sin traer
// el sitio completo — el editor lo usa para sondear cada pocos segundos sin
// arriesgarse a pisar una edición en curso con datos viejos del servidor.
export async function apiGetSiteStatus() {
  const token = getToken();
  if (!token) return { locked: false, published: false };
  const result = await request('/sites/me/status', { token });
  return result.ok ? { locked: result.locked, published: result.published } : { locked: false, published: false };
}

// Suscripción real de Mercado Pago de la página del usuario logueado (ver
// Checkout.jsx, SuscripcionConfirmar.jsx y Dashboard > Suscripción).
export async function apiGetSubscription() {
  const token = getToken();
  if (!token) return { status: 'none', preapprovalId: null, published: false };
  const result = await request('/subscription/me', { token });
  return result.ok ? result : { status: 'none', preapprovalId: null, published: false };
}

// Se llama al tocar "Pagar" — antes de mandar al checkout de Mercado Pago,
// avisa al backend que esta página está yendo a pagar (para poder
// reconocerla después, ver server/src/routes/mercadopagoWebhook.js).
export async function apiStartSubscription() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para publicar tu página.' };
  return request('/subscription/me/start', { method: 'POST', token });
}

// Publica directo, sin pasar por Mercado Pago — solo funciona si la cuenta
// tiene una página gratis regalada por un admin (el backend revalida esto
// mismo, nunca confiar solo en el freeSubscriptions del token).
export async function apiPublishFree() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para publicar tu página.' };
  return request('/subscription/me/publish-free', { method: 'POST', token });
}

// Respaldo sin webhook: le pide al backend que consulte directo en Mercado
// Pago si ya hay una suscripción confirmada para esta cuenta.
export async function apiRefreshSubscription() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión.' };
  return request('/subscription/me/refresh', { method: 'POST', token });
}

export async function apiCancelSubscription() {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión.' };
  return request('/subscription/me/cancel', { method: 'POST', token });
}

export async function apiListSupportTickets() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/support', { token });
  return result.ok ? result.tickets : [];
}

export async function apiCreateSupportTicket({ asunto, mensaje, adjuntos }) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para escribirle a soporte.' };
  const result = await request('/support', { method: 'POST', body: { asunto, mensaje, adjuntos }, token });
  return result.ok ? { ok: true, ticket: result.ticket } : result;
}

// Sondeado cada 10s desde el Dashboard para avisarle al cliente si soporte le
// respondió algo nuevo (ver también apiAdminGetSupportUnread, la versión de
// esto para el admin).
export async function apiGetSupportUnread() {
  const token = getToken();
  if (!token) return { count: 0, tickets: [] };
  const result = await request('/support/unread', { token });
  return result.ok ? { count: result.count, tickets: result.tickets } : { count: 0, tickets: [] };
}

// Se llama al entrar a Soporte (Dashboard) — reinicia el contador del cliente.
export async function apiMarkSupportSeen() {
  const token = getToken();
  if (!token) return { ok: false };
  return request('/support/mark-seen', { method: 'POST', token });
}

// Chat de una consulta: el mensaje inicial + todas las réplicas, en orden —
// el backend deja ver/escribir solo al dueño de la consulta o a un admin.
export async function apiGetSupportThread(ticketId) {
  const token = getToken();
  if (!token) return null;
  const result = await request(`/support/${ticketId}/messages`, { token });
  return result.ok ? { asunto: result.asunto, messages: result.messages } : null;
}

export async function apiSendSupportMessage(ticketId, { mensaje, adjuntos }) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión para responder.' };
  const result = await request(`/support/${ticketId}/messages`, {
    method: 'POST',
    body: { mensaje, adjuntos },
    token,
  });
  return result.ok ? { ok: true, message: result.message } : result;
}

// Endpoints de administración: protegidos en el backend con requireRole('admin')
// (ver server/src/routes/admin.js) — un token de cuenta común recibe 403.
export async function apiAdminSummary() {
  const token = getToken();
  if (!token) return null;
  const result = await request('/admin/summary', { token });
  return result.ok ? result : null;
}

export async function apiAdminSubscriptions() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/subscriptions', { token });
  return result.ok ? result.subscriptions : [];
}

export async function apiAdminSupportTickets() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/support-tickets', { token });
  return result.ok ? result.tickets : [];
}

// Sondeado cada 10s desde Admin.jsx para avisar de tickets/respuestas nuevas
// sin tener que estar parado en la sección de Soporte.
export async function apiAdminGetSupportUnread() {
  const token = getToken();
  if (!token) return { count: 0, tickets: [] };
  const result = await request('/admin/support/unread', { token });
  return result.ok ? { count: result.count, tickets: result.tickets } : { count: 0, tickets: [] };
}

// Se llama al entrar a Admin > Soporte, para que ese contador se reinicie.
export async function apiAdminMarkSupportSeen() {
  const token = getToken();
  if (!token) return { ok: false };
  return request('/admin/support/mark-seen', { method: 'POST', token });
}

export async function apiAdminListSites() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/sites', { token });
  return result.ok ? result.sites : [];
}

export async function apiAdminGetSite(siteId) {
  const token = getToken();
  if (!token) return null;
  const result = await request(`/admin/sites/${siteId}`, { token });
  return result.ok
    ? { site: result.site, subdomain: result.subdomain, ownerEmail: result.ownerEmail, ownerName: result.ownerName }
    : null;
}

export async function apiAdminUpdateSite(siteId, siteJSON) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/sites/${siteId}`, { method: 'PUT', body: { site: siteJSON }, token });
}

// Pausa/reanuda la edición de una página desde Admin > Páginas — mientras
// esté pausada, el dueño no puede guardar cambios (ver PUT /api/sites/me).
export async function apiAdminSetSiteLock(siteId, locked) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/sites/${siteId}/lock`, { method: 'PATCH', body: { locked }, token });
}

// Despublica/republica una página directo desde Admin > Páginas — a
// diferencia de pausar la edición, esto la baja de circulación pero no le
// impide al dueño seguir editándola.
export async function apiAdminSetSitePublished(siteId, published) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/sites/${siteId}/publish`, { method: 'PATCH', body: { published }, token });
}

// Soporte puede pisar el subdominio de cualquier cuenta (Admin > Páginas).
export async function apiAdminSetSubdomain(siteId, subdomain) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/sites/${siteId}/subdomain`, { method: 'PATCH', body: { subdomain }, token });
}

// Admin > Usuarios: alta de cuentas y gestión de suscripciones gratuitas
// (cuentas de prueba a las que se les regala el servicio).
export async function apiAdminListUsers() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/users', { token });
  return result.ok ? result.users : [];
}

export async function apiAdminCreateUser({ name, email, password, role, freeSubscriptions }) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request('/admin/users', {
    method: 'POST',
    body: { name, email, password, role, freeSubscriptions },
    token,
  });
}

export async function apiAdminSetFreeSubscriptions(userId, freeSubscriptions) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/users/${userId}/free-subscriptions`, {
    method: 'PATCH',
    body: { freeSubscriptions },
    token,
  });
}

export async function apiAdminDeleteUser(userId) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/users/${userId}`, { method: 'DELETE', token });
}

// Telemetría (ver src/utils/analytics.js): pública, no requiere sesión — la
// mayoría de los eventos pasan mientras todavía es un visitante anónimo. Si
// hay sesión iniciada, mandamos el token igual para que el backend asocie el
// evento a esa cuenta (útil recién a partir del registro/login).
export async function apiTrackEvent({ sessionId, eventType, eventName, path, metadata }) {
  const token = getToken();
  return request('/analytics/events', {
    method: 'POST',
    body: { sessionId, eventType, eventName, path, metadata },
    ...(token ? { token } : {}),
  });
}

// `period`: 'week' | 'month' | undefined (histórico completo) — ver Admin >
// Analytics y el mismo filtro que también acota Admin > Leads.
export async function apiAdminAnalyticsSummary({ period } = {}) {
  const token = getToken();
  if (!token) return null;
  const qs = period ? `?period=${period}` : '';
  const result = await request(`/admin/analytics/summary${qs}`, { token });
  return result.ok ? result : null;
}

// Leads del quiz (ver src/utils/analytics.js): pública, no requiere sesión —
// lo que va completando en el quiz se guarda solo, mucho antes de dejar un
// teléfono o de registrarse. `analyticsSessionId` es el id persistente del
// navegador — el backend lo usa para buscar si esa persona aceptó los
// términos (ver POST /api/terms/accept) antes de guardarle cualquier dato.
export async function apiSaveLead({
  sessionId,
  nombreNegocio,
  telefono,
  rubro,
  frase,
  referrer,
  lastStep,
  analyticsSessionId,
}) {
  const token = getToken();
  return request('/leads', {
    method: 'POST',
    body: { sessionId, nombreNegocio, telefono, rubro, frase, referrer, lastStep, analyticsSessionId },
    ...(token ? { token } : {}),
  });
}

// Paginado + filtro por período + búsqueda, todo del lado del servidor (ver
// GET /api/admin/leads) — devuelve la página pedida más el total real, para
// poder armar la paginación sin haber traído todo de una.
export async function apiAdminListLeads({ page = 1, pageSize = 20, period, q } = {}) {
  const token = getToken();
  if (!token) return { leads: [], total: 0, page: 1, pageSize };
  const params = new URLSearchParams({ page, pageSize });
  if (period) params.set('period', period);
  if (q) params.set('q', q);
  const result = await request(`/admin/leads?${params}`, { token });
  return result.ok ? result : { leads: [], total: 0, page: 1, pageSize };
}

// Se llama al tocar "Acepto y continúo" en TermsGate — deja constancia de
// que esa sesión anónima aceptó los términos, para poder demostrarlo
// después si guardamos algún dato suyo (ver leads.js). Si hay sesión
// iniciada, manda el token también: el backend de paso marca esa cuenta
// como aceptada (users.terms_accepted_at) para no volver a pedírselo.
export async function apiAcceptTerms({ sessionId }) {
  return request('/terms/accept', { method: 'POST', body: { sessionId }, token: getToken() });
}

// Descarga de reportes en PDF (Admin > Analytics/Leads): a diferencia del
// resto de la API, esto no devuelve JSON — arma un blob con la respuesta y
// dispara la descarga con un <a> temporal, porque un <a href> común no
// puede mandar el header Authorization que necesitan estos endpoints.
async function downloadAuthenticatedFile(path, filename) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' };
  }
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false, error: data.error || 'No se pudo generar el PDF.' };
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return { ok: true };
}

export function apiDownloadLeadsReport({ period, q } = {}) {
  const params = new URLSearchParams();
  if (period) params.set('period', period);
  if (q) params.set('q', q);
  const qs = params.toString() ? `?${params}` : '';
  return downloadAuthenticatedFile(`/admin/reports/leads.pdf${qs}`, 'leads-sitiowebdigital.pdf');
}

export function apiDownloadAnalyticsReport({ period } = {}) {
  const qs = period ? `?period=${period}` : '';
  return downloadAuthenticatedFile(`/admin/reports/analytics.pdf${qs}`, 'analytics-sitiowebdigital.pdf');
}

// Catálogo de plantillas/rubros creados por el admin (Admin > Plantillas):
// públicos porque el quiz y la galería los necesitan sin sesión iniciada —
// se combinan con las plantillas/rubros de fábrica del lado del cliente
// (ver AppContext).
export async function apiListCatalogTemplates() {
  const result = await request('/catalog/templates');
  return result.ok ? result.templates : [];
}

export async function apiListCatalogRubros() {
  const result = await request('/catalog/rubros');
  return result.ok ? result.rubros : [];
}

export async function apiAdminListCatalogTemplates() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/catalog/templates', { token });
  return result.ok ? result.templates : [];
}

// Contenido completo (sections/demo/seeds) de una plantilla puntual, para
// volver a abrirla en el editor y seguir editándola — ver "Editar" en
// Admin > Plantillas.
export async function apiAdminGetTemplate(id) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/catalog/templates/${id}`, { token });
}

// Se llama desde el editor ("Guardar como plantilla") con una instantánea
// del sitio de ejemplo que armó el admin — ver server/src/routes/adminCatalog.js.
export async function apiAdminCreateTemplate(payload) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request('/admin/catalog/templates', { method: 'POST', body: payload, token });
}

export async function apiAdminUpdateTemplate(id, patch) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/catalog/templates/${id}`, { method: 'PATCH', body: patch, token });
}

export async function apiAdminDeleteTemplate(id) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/catalog/templates/${id}`, { method: 'DELETE', token });
}

export async function apiAdminListCatalogRubros() {
  const token = getToken();
  if (!token) return [];
  const result = await request('/admin/catalog/rubros', { token });
  return result.ok ? result.rubros : [];
}

export async function apiAdminCreateRubro(payload) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request('/admin/catalog/rubros', { method: 'POST', body: payload, token });
}

export async function apiAdminDeleteRubro(id) {
  const token = getToken();
  if (!token) return { ok: false, error: 'Iniciá sesión como admin.' };
  return request(`/admin/catalog/rubros/${id}`, { method: 'DELETE', token });
}
