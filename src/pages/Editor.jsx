import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SitePreview from '../components/SitePreview';
import Logo from '../components/Logo';
import EditorTutorial from '../components/EditorTutorial';
import AuthGate from '../components/AuthGate';
import {
  MonitorIcon,
  TabletIcon,
  SmartphoneIcon,
  WidgetsIcon,
  WhatsAppIcon,
  HelpCircleIcon,
  SendIcon,
  XIcon,
  CheckBadgeIcon,
  CartIcon,
  LayoutIcon,
  PlusIcon,
  PaletteIcon,
  TypeIcon,
} from '../components/icons';
import { FONT_OPTIONS } from '../data/mockData';
import { useApp } from '../context/AppContext';
import { validateImageFile } from '../utils/imageValidation';
import { uploadImage } from '../utils/uploadImage';

const TUTORIAL_SEEN_KEY = 'sitiowebdigital.editorTutorialSeen';

const DEVICES = [
  { id: 'desktop', label: 'Escritorio', icon: MonitorIcon, width: '100%' },
  { id: 'tablet', label: 'Tablet', icon: TabletIcon, width: '760px' },
  { id: 'mobile', label: 'Celular', icon: SmartphoneIcon, width: '390px' },
];

export default function Editor() {
  const {
    template,
    siteData,
    updateSiteData,
    logoUrl,
    setLogoUrl,
    logoPalette,
    theme,
    setPalette,
    setCustomColor,
    setSiteFont,
    importGoogleFont,
    sections,
    addSection,
    removeSection,
    moveSection,
    reorderSection,
    setSectionStyle,
    productos,
    addProducto,
    removeProducto,
    updateProducto,
    addProductoImagen,
    removeProductoImagen,
    faqs,
    addFAQ,
    removeFAQ,
    updateFAQ,
    testimonios,
    addTestimonio,
    removeTestimonio,
    updateTestimonio,
    connectVerifiedReviews,
    planes,
    equipo,
    menuItems,
    marcas,
    posts,
    addListItem,
    removeListItem,
    updateListItem,
    widgets,
    toggleWidget,
    setWidgetOption,
    textStyles,
    setTextStyle,
    user,
    login,
    register,
    saveSiteToBackend,
    adminEditingSite,
    stopAdminEditSite,
    siteLocked,
    refreshSiteStatus,
    rubros,
    saveAsTemplate,
    createRubro,
    editingTemplate,
    isBuildingTemplate,
    resetAll,
  } = useApp();
  const navigate = useNavigate();
  const [device, setDevice] = useState('desktop');
  const [widgetsOpen, setWidgetsOpen] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [saveTemplateOpen, setSaveTemplateOpen] = useState(false);
  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const [fontPickerOpen, setFontPickerOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  // Un admin editando (adminEditingSite) siempre puede seguir, sea cual sea
  // el bloqueo — el bloqueo es específicamente para frenar al dueño.
  const editingBlocked = siteLocked && !adminEditingSite;

  // `leaving` corta este efecto durante "Atrás": al salir del modo admin,
  // limpiar el estado (resetAll) deja template/siteData en null un instante
  // antes de que el router termine de irse a /admin — sin este freno, este
  // mismo efecto lo redirige a /plantillas y gana la carrera.
  useEffect(() => {
    if (leaving) return;
    if (!template || !siteData) navigate('/plantillas', { replace: true });
  }, [template, siteData, navigate, leaving]);

  // Si soporte bloqueó esta página, ni entrar deja — corta directo al panel
  // en vez de mostrar el editor en modo lectura. También cubre el caso de
  // que la bloqueen mientras el dueño ya la tenía abierta: el sondeo de
  // abajo actualiza `siteLocked` y este efecto reacciona enseguida.
  useEffect(() => {
    if (editingBlocked) navigate('/dashboard', { replace: true });
  }, [editingBlocked, navigate]);

  // Sondea el bloqueo cada pocos segundos mientras el editor está abierto —
  // sin esto, un bloqueo de soporte recién se notaría al recargar la página.
  useEffect(() => {
    if (adminEditingSite) return undefined;
    const interval = setInterval(refreshSiteStatus, 3000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminEditingSite]);

  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(TUTORIAL_SEEN_KEY) === '1';
    } catch {
      seen = true;
    }
    if (seen) return;
    setTutorialOpen(true);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, '1');
    } catch {
      // localStorage puede fallar (modo privado, cuota llena) — no debe romper el editor.
    }
  }, []);

  if (!template || !siteData) return null;

  const onLogo = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!(await validateImageFile(file, 'logo'))) return;
    setLogoUrl(await uploadImage(file));
  };

  const shuffleGallery = () => {
    const seed = Math.random().toString(36).slice(2, 8);
    updateSiteData({
      galeria: siteData.galeria.map((_, i) => `https://picsum.photos/seed/${seed}${i}/800/600`),
    });
  };

  // Guarda ya mismo (sin esperar el debounce del autoguardado) antes de
  // salir del editor, y vuelve a donde tenga sentido según quién esté
  // editando: un admin vuelve a su panel (y deja de "pisar" esta página),
  // un usuario común vuelve a su dashboard, y si todavía no hay cuenta
  // (recién viniendo del quiz, antes de pagar) vuelve al inicio.
  const goBack = async () => {
    setLeaving(true);
    if (user) await saveSiteToBackend();
    if (adminEditingSite) {
      // Primero navega y recién después limpia el estado — si no, el efecto
      // de arriba ("sin template, ir a /plantillas") alcanza a reaccionar a
      // ese estado ya vacío antes de que el router llegue a /admin, y termina
      // ganando esa redirección en vez de la nuestra.
      navigate('/admin');
      stopAdminEditSite();
    } else if (isBuildingTemplate) {
      // Volver de armar/editar una plantilla: esto no es el sitio propio del
      // admin, tiene que volver al panel y no dejar la plantilla cargada
      // como si fuera su página (ver isBuildingTemplate en AppContext).
      navigate('/admin');
      resetAll();
    } else if (user) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-navy-900 text-white flex flex-col">
      {adminEditingSite && (
        <div className="px-5 sm:px-8 py-2 bg-gold-500/10 border-b border-gold-500/25 text-sm shrink-0 text-ink-200">
          Editando como admin la página de{' '}
          <strong className="text-gold-400">{adminEditingSite.ownerEmail}</strong> — "← Atrás" te devuelve al panel.
        </div>
      )}
      {editingBlocked && (
        <div className="px-5 sm:px-8 py-2 bg-red-500/10 border-b border-red-500/25 text-sm shrink-0 text-red-200">
          Soporte pausó la edición de esta página temporalmente — no se puede editar hasta que se reanude.
        </div>
      )}
      {/* Barra superior */}
      <div className="px-5 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={leaving}
            className="px-3 py-2 border border-white/15 hover:bg-white/5 transition-colors text-sm font-semibold disabled:opacity-50 shrink-0"
          >
            ← Atrás
          </button>
          <div className="hidden sm:flex">
            <Logo size="sm" />
          </div>
        </div>
        <div data-tour="device-toggle" className="flex items-center gap-1 border border-white/10 p-1">
          {DEVICES.map((d) => {
            const Icon = d.icon;
            const active = device === d.id;
            return (
              <button
                key={d.id}
                onClick={() => setDevice(d.id)}
                title={d.label}
                aria-label={d.label}
                aria-pressed={active}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? 'bg-gold-500 text-navy-950' : 'text-ink-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{d.label}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5">
          {/* Diseño global: todo lo que cambia toda la página de una, agrupado
              como un solo control segmentado en vez de botones sueltos. */}
          <div className="flex items-center border border-white/10 divide-x divide-white/10 shrink-0">
            <button
              data-tour="color-picker"
              type="button"
              onClick={() => setColorPickerOpen(true)}
              title="Color general de la página"
              aria-label="Color general de la página"
              className="w-9 h-9 text-ink-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <PaletteIcon className="w-4 h-4" />
            </button>
            <button
              data-tour="font-picker"
              type="button"
              onClick={() => setFontPickerOpen(true)}
              title="Tipografía general de la página"
              aria-label="Tipografía general de la página"
              className="w-9 h-9 text-ink-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <TypeIcon className="w-4 h-4" />
            </button>
            <button
              data-tour="widgets-fab"
              type="button"
              onClick={() => setWidgetsOpen(true)}
              title="Widgets de la página"
              aria-label="Widgets de la página"
              className="w-9 h-9 text-ink-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <WidgetsIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Ayuda: tutorial y soporte, agrupados aparte para no mezclarlos
              con las herramientas de diseño de arriba. */}
          <div className="hidden sm:flex items-center border border-white/10 divide-x divide-white/10 shrink-0">
            <button
              type="button"
              onClick={() => setTutorialOpen(true)}
              title="Ver el tutorial del editor"
              aria-label="Ver el tutorial del editor"
              className="w-9 h-9 text-ink-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <HelpCircleIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              title="Soporte"
              aria-label="Contactar a soporte"
              className="w-9 h-9 text-ink-400 hover:text-white hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <SendIcon className="w-4 h-4" />
            </button>
          </div>

          {user?.role === 'admin' && (
            <button
              data-tour="save-template"
              type="button"
              onClick={() => setSaveTemplateOpen(true)}
              title={
                editingTemplate
                  ? 'Guardar los cambios en esta plantilla'
                  : 'Guardar esta página como plantilla reutilizable'
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 border border-white/15 hover:bg-white/5 transition-colors text-sm font-semibold shrink-0"
            >
              <LayoutIcon className="w-4 h-4" /> {editingTemplate ? 'Guardar cambios' : 'Guardar como plantilla'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/preview')}
            className="px-4 py-2 bg-gold-500 text-navy-950 font-bold text-sm hover:bg-gold-400 transition-colors shrink-0"
          >
            Ver mi página →
          </button>
        </div>
      </div>

      {/* Canvas editable */}
      <div className="flex-1 overflow-y-auto bg-navy-950/50 p-4 sm:p-8 relative">
        <div
          className="mx-auto overflow-hidden border border-white/10 shadow-2xl transition-[max-width] duration-300"
          style={{ maxWidth: DEVICES.find((d) => d.id === device).width }}
        >
          <SitePreview
            template={template}
            siteData={siteData}
            logoUrl={logoUrl}
            logoPalette={logoPalette}
            theme={theme}
            sections={sections}
            productos={productos}
            editable={!editingBlocked}
            onUpdateField={(field, value) => updateSiteData({ [field]: value })}
            onLogoChange={onLogo}
            onShuffleGallery={shuffleGallery}
            onAddSection={addSection}
            onRemoveSection={removeSection}
            onMoveSection={moveSection}
            onReorderSection={reorderSection}
            onSetSectionStyle={setSectionStyle}
            onAddProducto={addProducto}
            onRemoveProducto={removeProducto}
            onUpdateProducto={updateProducto}
            onAddProductoImagen={addProductoImagen}
            onRemoveProductoImagen={removeProductoImagen}
            faqs={faqs}
            onAddFAQ={addFAQ}
            onRemoveFAQ={removeFAQ}
            onUpdateFAQ={updateFAQ}
            testimonios={testimonios}
            onAddTestimonio={addTestimonio}
            onRemoveTestimonio={removeTestimonio}
            onUpdateTestimonio={updateTestimonio}
            onConnectVerifiedReviews={connectVerifiedReviews}
            planes={planes}
            equipo={equipo}
            menuItems={menuItems}
            marcas={marcas}
            posts={posts}
            onAddListItem={addListItem}
            onRemoveListItem={removeListItem}
            onUpdateListItem={updateListItem}
            widgets={widgets}
            textStyles={textStyles}
            onSetTextStyle={setTextStyle}
          />
        </div>
      </div>

      {widgetsOpen && (
        <WidgetsMenu
          widgets={widgets}
          toggleWidget={toggleWidget}
          setWidgetOption={setWidgetOption}
          showCarrito={!!template?.rubros?.includes('gastronomia')}
          onClose={() => setWidgetsOpen(false)}
        />
      )}

      {colorPickerOpen && (
        <ColorPickerPopover
          theme={theme}
          template={template}
          logoPalette={logoPalette}
          onSetPalette={setPalette}
          onSetCustomColor={setCustomColor}
          onClose={() => setColorPickerOpen(false)}
        />
      )}

      {fontPickerOpen && (
        <FontPickerPopover
          theme={theme}
          onSetFont={setSiteFont}
          onImportFont={importGoogleFont}
          onClose={() => setFontPickerOpen(false)}
        />
      )}

      <EditorTutorial open={tutorialOpen} isAdmin={user?.role === 'admin'} onClose={() => setTutorialOpen(false)} />

      {supportOpen && (
        <SupportModal user={user} login={login} register={register} onClose={() => setSupportOpen(false)} />
      )}

      {saveTemplateOpen && (
        <SaveTemplateModal
          rubros={rubros}
          editing={editingTemplate}
          onCreateRubro={createRubro}
          onSave={saveAsTemplate}
          onClose={() => setSaveTemplateOpen(false)}
        />
      )}
    </div>
  );
}

// Modal para escribirle a soporte — si todavía no hay una cuenta creada, antes
// de poder mandar el mensaje pide registrarte (reutiliza el mismo AuthGate
// que usan el checkout y el login), y recién ahí deja enviar.
function SupportModal({ user, login, register, onClose }) {
  const [mensaje, setMensaje] = useState('');
  const [sent, setSent] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!mensaje.trim()) return;
    if (!user) {
      setNeedsAuth(true);
      return;
    }
    // MOCK: acá se mandaría el mensaje a un backend real de soporte.
    setSent(true);
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm relative" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute -top-3 -right-3 w-8 h-8 bg-navy-800 border border-white/10 text-ink-300 flex items-center justify-center hover:text-white transition-colors z-10"
        >
          <XIcon className="w-4 h-4" />
        </button>

        {needsAuth ? (
          <AuthGate
            login={login}
            register={register}
            title="Creá tu cuenta para escribirle a soporte"
            onSuccess={() => {
              setNeedsAuth(false);
              setSent(true);
            }}
          />
        ) : (
          <div className="border border-white/10 bg-navy-850 p-6 text-left">
            {sent ? (
              <div className="text-center py-4">
                <span className="inline-flex w-12 h-12 bg-emerald-500/15 text-emerald-400 items-center justify-center mb-3">
                  <CheckBadgeIcon className="w-6 h-6" />
                </span>
                <p className="font-display text-lg font-semibold text-white">¡Mensaje enviado!</p>
                <p className="text-sm text-ink-400 mt-1">Te vamos a responder por email a la brevedad.</p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-5 text-sm font-semibold text-gold-500 hover:text-gold-400 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <p className="font-display text-lg font-semibold text-white mb-1">Contactar a soporte</p>
                <p className="text-xs text-ink-500 mb-4">Contanos qué necesitás — te vamos a responder por email.</p>
                <textarea
                  required
                  autoFocus
                  rows={5}
                  maxLength={800}
                  value={mensaje}
                  onChange={(e) => setMensaje(e.target.value)}
                  placeholder="Escribí tu consulta acá..."
                  className="w-full border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 resize-none mb-3"
                />
                <button
                  type="submit"
                  className="w-full bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3"
                >
                  Enviar mensaje
                </button>
                {!user && (
                  <p className="text-[11px] text-ink-500 text-center mt-3">
                    Te vamos a pedir que crees una cuenta para poder enviarlo.
                  </p>
                )}
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Guarda la página de ejemplo actual como una plantilla reutilizable (solo
// lo ve el admin) — reusa el editor de siempre para armarla: el admin la
// arma con contenido, secciones y colores como si fuera un cliente más, y
// acá solo elige a qué rubro(s) corresponde antes de publicarla.
function SaveTemplateModal({ rubros, editing, onCreateRubro, onSave, onClose }) {
  const [nombre, setNombre] = useState(editing?.nombre || '');
  const [tagline, setTagline] = useState(editing?.tagline || '');
  const [selected, setSelected] = useState(editing?.rubros || []);
  const [published, setPublished] = useState(editing ? !!editing.published : true);
  const [showNuevoRubro, setShowNuevoRubro] = useState(false);
  const [nuevoRubro, setNuevoRubro] = useState({ label: '', accent: '#9d6400' });
  const [saving, setSaving] = useState(false);
  const [creatingRubro, setCreatingRubro] = useState(false);
  const [error, setError] = useState('');

  const toggleRubro = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));

  const crearRubro = async (e) => {
    e.preventDefault();
    if (!nuevoRubro.label.trim()) return;
    setCreatingRubro(true);
    setError('');
    const result = await onCreateRubro(nuevoRubro);
    setCreatingRubro(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSelected((prev) => [...prev, result.rubro.id]);
    setNuevoRubro({ label: '', accent: '#9d6400' });
    setShowNuevoRubro(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || selected.length === 0) return;
    setSaving(true);
    setError('');
    const result = await onSave({ nombre: nombre.trim(), tagline: tagline.trim(), rubros: selected, published });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto border border-white/10 bg-navy-850"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">
            {editing ? `Editando "${editing.nombre}"` : 'Guardar como plantilla'}
          </span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <p className="text-xs text-ink-400">
            {editing
              ? 'Los cambios se guardan sobre esta misma plantilla — quien ya la haya elegido no se ve afectado.'
              : 'Esta página de ejemplo va a quedar disponible para que cualquier usuario la elija desde la galería o se la recomiende el quiz.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-ink-400 mb-1.5">Nombre de la plantilla</label>
            <input
              required
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Panadería Artesanal"
              maxLength={60}
              className="w-full border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-400 mb-1.5">Bajada (opcional)</label>
            <input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Ej: Para panaderías, pastelerías y confiterías."
              maxLength={120}
              className="w-full border border-white/10 bg-navy-900 px-3 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-400 mb-2">
              Rubro(s) — puede servir para más de uno
            </label>
            <div className="flex flex-wrap gap-2">
              {rubros.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRubro(r.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border text-xs font-semibold transition-colors ${
                    selected.includes(r.id)
                      ? 'border-gold-500 bg-gold-500/10 text-gold-500'
                      : 'border-white/15 text-ink-300 hover:border-white/30'
                  }`}
                >
                  {r.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNuevoRubro((v) => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-white/20 text-xs font-semibold text-ink-400 hover:text-white hover:border-white/40 transition-colors"
              >
                <PlusIcon className="w-3 h-3" /> Nuevo rubro
              </button>
            </div>

            {showNuevoRubro && (
              <div className="mt-3 border border-white/10 bg-navy-900 p-3 flex flex-wrap items-end gap-2">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-[11px] text-ink-500 mb-1">Nombre</label>
                  <input
                    value={nuevoRubro.label}
                    onChange={(e) => setNuevoRubro((v) => ({ ...v, label: e.target.value }))}
                    placeholder="Ej: Panaderías"
                    maxLength={40}
                    className="w-full border border-white/10 bg-navy-850 px-2.5 py-2 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                <div className="w-16">
                  <label className="block text-[11px] text-ink-500 mb-1">Color</label>
                  <input
                    type="color"
                    value={nuevoRubro.accent}
                    onChange={(e) => setNuevoRubro((v) => ({ ...v, accent: e.target.value }))}
                    className="w-full h-[38px] border border-white/10 bg-navy-850 cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={crearRubro}
                  disabled={creatingRubro || !nuevoRubro.label.trim()}
                  className="px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 transition-colors text-navy-950 font-bold text-xs shrink-0"
                >
                  {creatingRubro ? 'Creando...' : 'Crear'}
                </button>
              </div>
            )}
          </div>

          <label className="flex items-center justify-between gap-3 border border-white/10 bg-navy-900 px-4 py-3 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-white">Publicar ahora</p>
              <p className="text-xs text-ink-500">
                Si lo dejás apagado, queda guardada como borrador — no la ve ningún usuario todavía.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPublished((v) => !v)}
              role="switch"
              aria-checked={published}
              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                published ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  published ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </label>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={saving || !nombre.trim() || selected.length === 0}
            className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-navy-950 font-bold py-3"
          >
            {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Guardar plantilla'}
          </button>
        </form>
      </div>
    </div>
  );
}

function WidgetsMenu({ widgets, toggleWidget, setWidgetOption, showCarrito, onClose }) {
  const waOn = widgets.whatsappFloating !== false;
  const waSide = widgets.whatsappPosition === 'right' ? 'right' : 'left';
  const carritoOn = !!widgets.carrito;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-white/10 bg-navy-850 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold text-white">Widgets de la página</h2>
        </div>
        <p className="text-xs text-ink-500 mb-5">
          Elementos flotantes que aparecen en toda la página, sin importar qué sección estés viendo.
        </p>
        <div className="border border-white/10 bg-navy-800 px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-[#25D366] flex items-center justify-center text-white shrink-0">
                <WhatsAppIcon className="w-4 h-4" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">Botón de WhatsApp flotante</p>
                <p className="text-xs text-ink-500">Sigue pegado a la pantalla mientras se scrollea.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => toggleWidget('whatsappFloating')}
              role="switch"
              aria-checked={waOn}
              aria-label="Activar o desactivar el botón de WhatsApp flotante"
              className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                waOn ? 'bg-emerald-500' : 'bg-white/15'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  waOn ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {waOn && (
            <div className="flex items-center justify-between mt-3.5 pt-3.5 border-t border-white/5">
              <p className="text-xs text-ink-400">Lado de la pantalla</p>
              <div className="flex items-center gap-1 bg-navy-900 border border-white/10 p-1">
                {[
                  ['left', 'Izquierda'],
                  ['right', 'Derecha'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setWidgetOption?.('whatsappPosition', id)}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      waSide === id ? 'bg-gold-500 text-navy-950' : 'text-ink-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {showCarrito && (
          <div className="border border-white/10 bg-navy-800 px-4 py-3.5 mt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-gold-500 flex items-center justify-center text-navy-950 shrink-0">
                  <CartIcon className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">Carrito de compras</p>
                  <p className="text-xs text-ink-500">
                    Los productos se van sumando al carrito y el pedido completo se manda por WhatsApp.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggleWidget('carrito')}
                role="switch"
                aria-checked={carritoOn}
                aria-label="Activar o desactivar el carrito de compras"
                className={`relative w-11 h-6 rounded-full shrink-0 transition-colors ${
                  carritoOn ? 'bg-emerald-500' : 'bg-white/15'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    carritoOn ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
        <p className="text-xs text-ink-600 mt-4">Más widgets próximamente.</p>
      </div>
    </div>
  );
}

// Paleta de acentos sugeridos además de los del logo — colores de marca
// prolijos que cubren la mayoría de los rubros, para no obligar a abrir
// el selector nativo si ninguno de estos alcanza.
const ACCENT_PRESETS = [
  '#ffc107', '#bb5d00', '#c81e1e', '#d6336c', '#9c36b5',
  '#5f3dc4', '#3b5bdb', '#1971c2', '#0c8599', '#0ca678',
  '#2f9e44', '#5c940d', '#e8590c', '#495057', '#212529',
];

// Botón de color general de la página (barra del editor): cambia theme.accent
// en toda la página de una — a diferencia del selector de color por sección
// (fondo/título/texto/botones independientes), esto es el acento de marca
// que toman por default todas las secciones que no tengan su propio color
// puesto a mano.
function ColorPickerPopover({ theme, template, logoPalette, onSetPalette, onSetCustomColor, onClose }) {
  const current = theme?.accent ?? template?.accent ?? '#ffc107';

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-white/10 bg-navy-850 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold text-white">Color general de la página</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-ink-500 mb-5">
          El acento por default de toda la página — títulos, botones y detalles. Cada sección lo puede pisar con su
          propio color desde su paleta.
        </p>

        {logoPalette?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-ink-400 mb-2">De tu logo</p>
            <div className="flex flex-wrap gap-2">
              {logoPalette.map((hex, i) => (
                <button
                  key={hex + i}
                  type="button"
                  onClick={() => onSetCustomColor(hex)}
                  title={hex}
                  className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                    current === hex ? 'border-white' : 'border-white/15'
                  }`}
                  style={{ background: hex }}
                />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs font-semibold text-ink-400 mb-2">Presets</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {ACCENT_PRESETS.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => onSetCustomColor(hex)}
              title={hex}
              className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
                current === hex ? 'border-white' : 'border-white/15'
              }`}
              style={{ background: hex }}
            />
          ))}
        </div>

        <label className="flex items-center justify-between gap-3 border border-white/10 bg-navy-900 px-4 py-3 cursor-pointer">
          <span className="text-sm font-semibold text-white">Color personalizado</span>
          <input
            type="color"
            value={current}
            onChange={(e) => onSetCustomColor(e.target.value)}
            className="w-9 h-9 shrink-0"
          />
        </label>
      </div>
    </div>
  );
}

// Botón de tipografía general (barra del editor): cambia la fuente por
// default de toda la página (theme.font) — distinto del selector de fuente
// por texto puntual que ya tiene cada sección, que sigue pudiendo pisar esto
// para un título o párrafo específico. "Importar tipografía" trae cualquier
// familia de Google Fonts con solo escribir su nombre, sin subir ningún
// archivo (ver importGoogleFont en AppContext).
function FontPickerPopover({ theme, onSetFont, onImportFont, onClose }) {
  const [nombreImport, setNombreImport] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const currentId = theme?.font?.id;
  const opciones = [...FONT_OPTIONS, ...(theme?.importedFonts || [])];

  const importar = async (e) => {
    e.preventDefault();
    if (!nombreImport.trim()) return;
    setImporting(true);
    setError('');
    const result = onImportFont(nombreImport.trim());
    setImporting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSetFont(result.font);
    setNombreImport('');
  };

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm max-h-[85vh] overflow-y-auto border border-white/10 bg-navy-850 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display text-lg font-semibold text-white">Tipografía general de la página</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-400 hover:text-white transition-colors">
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-ink-500 mb-5">
          La fuente por default de toda la página. Un título o párrafo puntual puede seguir eligiendo la suya propia
          desde su propio editor de texto.
        </p>

        <div className="space-y-1.5 mb-4">
          <button
            type="button"
            onClick={() => onSetFont(null)}
            className={`w-full flex items-center justify-between px-3 py-2.5 border text-left transition-colors ${
              !currentId ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-white/10 text-ink-300 hover:border-white/25'
            }`}
          >
            <span className="text-sm">Work Sans (por defecto)</span>
            {!currentId && <CheckBadgeIcon className="w-4 h-4" />}
          </button>
          {opciones.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onSetFont(f)}
              className={`w-full flex items-center justify-between px-3 py-2.5 border text-left transition-colors ${
                currentId === f.id ? 'border-gold-500 bg-gold-500/10 text-gold-500' : 'border-white/10 text-ink-300 hover:border-white/25'
              }`}
              style={{ fontFamily: f.family }}
            >
              <span className="text-sm">{f.label}</span>
              {currentId === f.id && <CheckBadgeIcon className="w-4 h-4" />}
            </button>
          ))}
        </div>

        <form onSubmit={importar} className="border-t border-white/10 pt-4">
          <label className="block text-xs font-semibold text-ink-400 mb-1.5">Importar tipografía de Google Fonts</label>
          <div className="flex gap-2">
            <input
              value={nombreImport}
              onChange={(e) => setNombreImport(e.target.value)}
              placeholder="Ej: Roboto Slab"
              className="flex-1 min-w-0 border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={importing || !nombreImport.trim()}
              className="px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 transition-colors text-navy-950 font-bold text-xs shrink-0"
            >
              {importing ? 'Importando...' : 'Importar'}
            </button>
          </div>
          {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
          <p className="text-[11px] text-ink-600 mt-2">
            Tiene que existir en{' '}
            <a href="https://fonts.google.com" target="_blank" rel="noreferrer" className="underline hover:text-ink-400">
              fonts.google.com
            </a>{' '}
            — se escribe el nombre tal cual aparece ahí.
          </p>
        </form>
      </div>
    </div>
  );
}
