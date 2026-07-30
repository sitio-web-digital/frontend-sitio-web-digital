import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SitePreview from '../components/SitePreview';
import Button from '../components/Button';
import { useApp } from '../context/AppContext';

export default function SubdomainPreview() {
  const {
    template,
    siteData,
    logoUrl,
    published,
    theme,
    sections,
    productos,
    faqs,
    testimonios,
    planes,
    equipo,
    menuItems,
    marcas,
    posts,
    widgets,
    textStyles,
  } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!template || !siteData) navigate('/plantillas', { replace: true });
  }, [template, siteData, navigate]);

  if (!template || !siteData) return null;

  return (
    <div className="min-h-screen bg-navy-950">
      <SitePreview
        template={template}
        siteData={siteData}
        logoUrl={logoUrl}
        theme={theme}
        sections={sections}
        productos={productos}
        faqs={faqs}
        testimonios={testimonios}
        planes={planes}
        equipo={equipo}
        menuItems={menuItems}
        marcas={marcas}
        posts={posts}
        widgets={widgets}
        textStyles={textStyles}
        raised={!published}
      />

      {!published && (
        <div className="sticky bottom-0 inset-x-0 z-20">
          <div className="bg-navy-950/95 backdrop-blur border-t border-gold-500/20">
            <div className="max-w-4xl mx-auto px-5 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-white font-display font-semibold">
                  Tu página está lista.
                </p>
                <p className="text-sm text-ink-400">Publicala para que todos la vean.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate('/editor')}
                  className="text-sm font-semibold text-ink-300 hover:text-white transition-colors px-3 py-2"
                >
                  Seguir editando
                </button>
                <Button onClick={() => navigate('/checkout')}>Publicar ahora</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
