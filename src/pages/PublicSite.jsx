import { useEffect, useState } from 'react';
import SitePreview from '../components/SitePreview';
import { TEMPLATES, getTemplateById } from '../data/mockData';
import { hydrateSite } from '../utils/siteSchema';
import { apiGetPublicSite, apiListCatalogTemplates, apiTrackSiteEvent, apiCreateBooking } from '../api/client';
import { classifyReferrer } from '../utils/analytics';

// La página en vivo de un cliente, vista por un visitante anónimo real — sin
// AppProvider, sin TermsGate, sin HashRouter (ver la detección en App.jsx).
// Arma el mismo `template` + props planas que ya usa SitePreview en todos
// lados (ver el mini-preview de Dashboard.jsx > PageRow), solo que acá el
// contenido sale de un fetch público por subdominio en vez del estado en
// memoria de una sesión logueada.
export default function PublicSite({ subdomain }) {
  const [state, setState] = useState({ status: 'loading', hydrated: null, template: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [siteResult, customTemplates] = await Promise.all([
        apiGetPublicSite(subdomain),
        apiListCatalogTemplates(),
      ]);
      if (cancelled) return;
      if (!siteResult.ok) {
        setState({ status: 'not-found', hydrated: null, template: null });
        return;
      }
      const hydrated = hydrateSite(siteResult.site);
      const template = hydrated ? getTemplateById(hydrated.templateId, [...TEMPLATES, ...customTemplates]) : null;
      if (!hydrated || !template) {
        setState({ status: 'not-found', hydrated: null, template: null });
        return;
      }
      setState({ status: 'ready', hydrated, template });
    })();
    return () => {
      cancelled = true;
    };
  }, [subdomain]);

  // Visita real (KPIs de Dashboard/Estadísticas) — una por carga de página,
  // recién cuando se confirma que existe y está publicada. Clic en cualquier
  // link de WhatsApp del sitio, delegado por atributo (hay varios en
  // SitePreview: hero, floating widget, productos...), sin tener que cablear
  // un handler en cada uno.
  useEffect(() => {
    if (state.status !== 'ready') return undefined;
    apiTrackSiteEvent(subdomain, 'visita', classifyReferrer(document.referrer));

    const onClick = (e) => {
      if (e.target.closest('a[href*="wa.me"]')) apiTrackSiteEvent(subdomain, 'whatsapp_click');
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, [state.status, subdomain]);

  if (state.status === 'loading') return <div className="min-h-screen bg-navy-950" />;

  if (state.status === 'not-found') {
    return (
      <div className="min-h-screen bg-navy-950 text-white flex items-center justify-center text-center px-6">
        <div>
          <p className="font-display text-2xl font-bold mb-2">Esta página no existe</p>
          <p className="text-ink-400 text-sm">Revisá el subdominio o probá más tarde.</p>
        </div>
      </div>
    );
  }

  const { hydrated, template } = state;
  return (
    <SitePreview
      template={template}
      siteData={hydrated.siteData}
      logoUrl={hydrated.logoUrl}
      theme={hydrated.theme}
      sections={hydrated.sections}
      productos={hydrated.productos}
      faqs={hydrated.faqs}
      testimonios={hydrated.testimonios}
      planes={hydrated.planes}
      equipo={hydrated.equipo}
      menuItems={hydrated.menuItems}
      marcas={hydrated.marcas}
      posts={hydrated.posts}
      widgets={hydrated.widgets}
      textStyles={hydrated.textStyles}
      editable={false}
      onCreateBooking={(payload) => apiCreateBooking(subdomain, payload)}
    />
  );
}
