import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Button from '../components/Button';
import Photo from '../components/Photo';
import { StarIcon } from '../components/icons';
import { useApp } from '../context/AppContext';
import { recomendarPlantillaPorTexto, recomendarPlantillaPorTags } from '../data/mockData';

export default function Gallery() {
  const { quiz, selectableTemplates, rubros, chooseTemplate, logoUrl } = useApp();
  const navigate = useNavigate();
  // Se ofrecen las plantillas de fábrica y las creadas desde el editor,
  // siempre juntas (ver `selectableTemplates` en AppContext) — antes, apenas
  // existía una plantilla propia, tapaba el catálogo de fábrica entero.
  //
  // `quiz.tipoNegocio` es texto libre (lo que haya escrito en el paso 2, no
  // un id fijo) — antes acá se buscaba por id exacto contra TIPOS_NEGOCIO,
  // que nunca matcheaba (por eso siempre terminaba recomendando la última
  // plantilla del catálogo sin importar el rubro). Misma búsqueda difusa por
  // texto que ya usa el quiz en vivo (useDraftPreview).
  const recomendada =
    recomendarPlantillaPorTexto(quiz.tipoNegocio, selectableTemplates) ||
    recomendarPlantillaPorTags([], selectableTemplates);
  const [loadingId, setLoadingId] = useState(null);

  const elegir = (id) => {
    setLoadingId(id);
    // Simula el armado de la página: un toque de suspenso antes de mostrarla ya lista.
    setTimeout(() => {
      chooseTemplate(id);
      navigate('/editor');
    }, 1000);
  };

  const otras = selectableTemplates.filter((t) => t.id !== recomendada.id);
  // Agrupadas por rubro para que se entienda de un vistazo para qué tipo de
  // negocio pensamos cada plantilla (mismo agrupado que la pantalla de
  // resultado del quiz).
  const grupos = rubros
    .map((r) => ({ rubro: r, templates: otras.filter((t) => t.rubros?.includes(r.id)) }))
    .filter((g) => g.templates.length > 0);
  const sinRubro = otras.filter((t) => !rubros.some((r) => t.rubros?.includes(r.id)));

  if (loadingId) {
    return <LoadingOverlay logoUrl={logoUrl} nombreNegocio={quiz.nombreNegocio} />;
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-5 flex items-center justify-between border-b border-white/5">
        <Logo size="sm" />
        <span className="text-xs text-ink-400">Paso 2 · Elegí tu plantilla</span>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14">
        <div className="text-center max-w-xl mx-auto mb-12 animate-fade-in-up">
          <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight mb-3 text-balance">
            Elegí el estilo de tu página
          </h1>
          <p className="text-ink-300 text-balance">
            Ya la pre-cargamos con contenido de ejemplo. Después vas a poder editar todo.
          </p>
        </div>

        {/* Recomendada */}
        <div className="mb-14 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gold-500 bg-gold-500/10 border border-gold-500/25 rounded-full px-3 py-1">
              <StarIcon className="w-3.5 h-3.5" /> Recomendada para vos
            </span>
          </div>
          <TemplateCard template={recomendada} onElegir={elegir} featured />
        </div>

        {/* Otras opciones, agrupadas por rubro */}
        {grupos.map((g) => (
          <div key={g.rubro.id} className="mb-12">
            <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-5">{g.rubro.label}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {g.templates.map((t, i) => (
                <TemplateCard key={t.id} template={t} onElegir={elegir} delay={i * 80} />
              ))}
            </div>
          </div>
        ))}
        {sinRubro.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-5">
              Otras plantillas
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sinRubro.map((t, i) => (
                <TemplateCard key={t.id} template={t} onElegir={elegir} delay={i * 80} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template, onElegir, featured = false, delay = 0 }) {
  // Las plantillas creadas desde el editor pueden no tener foto propia, o
  // haber quedado (plantillas guardadas antes de este arreglo) con una URL
  // blob: de una subida local que ya no existe en ninguna sesión — nunca la
  // dejamos sin imagen, usamos una genérica estable como respaldo.
  const placeholder = `https://picsum.photos/seed/${template.id}/800/600`;
  const esUrlDurable = (url) => !!url && !url.startsWith('blob:');
  return (
    <div
      className={`group rounded-2xl overflow-hidden border transition-all duration-300 animate-fade-in-up ${
        featured
          ? 'border-gold-500/40 bg-navy-850 lg:grid lg:grid-cols-2'
          : 'border-white/10 bg-navy-850 hover:border-white/25 hover:-translate-y-1'
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={`relative flex items-end p-6 ${featured ? 'h-56 lg:h-full' : 'h-44'}`}>
        <Photo
          src={esUrlDurable(template.image) ? template.image : placeholder}
          fallback={esUrlDurable(template.imageFallback) ? template.imageFallback : placeholder}
          overlay="linear-gradient(0deg, rgba(13,11,18,0.25) 0%, rgba(13,11,18,0.8) 100%)"
        />
        <div className="relative z-10">
          <span className="text-[10px] uppercase font-semibold tracking-wide bg-white/15 text-white rounded-full px-2.5 py-1">
            {template.demo.rubroLabel}
          </span>
          <h3 className="font-display text-white font-bold text-xl mt-2 drop-shadow">
            {template.nombre}
          </h3>
        </div>
      </div>
      <div className={`p-6 flex flex-col ${featured ? 'justify-center' : ''}`}>
        <p className="text-sm text-ink-300 leading-relaxed mb-5">{template.tagline}</p>
        <Button
          onClick={() => onElegir(template.id)}
          size={featured ? 'md' : 'sm'}
          className="w-full sm:w-auto"
        >
          Elegir esta plantilla
        </Button>
      </div>
    </div>
  );
}

function LoadingOverlay({ logoUrl, nombreNegocio }) {
  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col items-center justify-center gap-6 px-6">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-white/10" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 animate-spin" />
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="w-14 h-14 rounded-2xl object-cover" />
        ) : (
          <Logo withWordmark={false} size="lg" />
        )}
      </div>
      <div className="text-center">
        <p className="font-display text-lg font-semibold text-balance">
          Armando {nombreNegocio?.trim() ? `la página de ${nombreNegocio}` : 'tu página'}...
        </p>
        <p className="text-sm text-ink-500 mt-1">Ya casi está.</p>
      </div>
    </div>
  );
}
