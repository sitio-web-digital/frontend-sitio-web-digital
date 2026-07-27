import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import MiniSitePreview from '../components/MiniSitePreview';
import {
  StepDots,
  StepNegocio,
  StepRubro,
  StepMensaje,
  StepLogo,
  ResultadoScreen,
  BuscandoPlantillaScreen,
  todasLasSecciones,
} from '../components/quiz/QuizSteps';
import { useApp } from '../context/AppContext';
import { useDraftPreview } from '../hooks/useDraftPreview';
import { useQuizLeadTracking } from '../hooks/useQuizLeadTracking';
import { extractDominantColor } from '../utils/extractColor';
import { validateArgentinePhone } from '../utils/phoneValidation';

const TOTAL_STEPS = 4;

export default function Quiz() {
  const { quiz, setQuiz, logoUrl, setLogoUrl } = useApp();
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState('form'); // 'form' | 'resultado' | 'loading'
  const [transitioning, setTransitioning] = useState(false);
  // Si en la pantalla de resultado elige otra plantilla de las sugeridas,
  // pisa la recomendación por defecto hasta que vuelva a esta pantalla.
  const [templateOverride, setTemplateOverride] = useState(null);
  const navigate = useNavigate();

  const { rubroTexto, draftTemplate, draftTheme, draftSiteData, previewLogoUrl } = useDraftPreview(templateOverride);

  // Embudo de conversión + captura de leads (ver Admin > Analytics/Leads) —
  // mismo hook que usa el demo en vivo de la Home (LiveDemoWidget.jsx), así
  // los dos formularios del quiz quedan trackeados igual.
  useQuizLeadTracking({ quiz, step, stage });

  // Cada vez que se pasa de paso, la página "desaparece" un instante detrás de
  // un pin de carga grande (no un spinner chiquito) — refuerza la sensación de
  // que algo se está armando en cada respuesta, no solo un cambio de pantalla.
  const next = () => {
    setTransitioning(true);
    setTimeout(() => {
      if (step < TOTAL_STEPS) setStep((s) => s + 1);
      else setStage('resultado');
      setTransitioning(false);
    }, 900);
  };
  const back = () => (step > 1 ? setStep(step - 1) : navigate('/'));

  const canContinue =
    (step === 1 && !!quiz.nombreNegocio?.trim()) ||
    (step === 2 && !!quiz.tipoNegocio?.trim()) ||
    (step === 3 && validateArgentinePhone(quiz.whatsapp).ok) ||
    step === 4;

  if (stage === 'loading') return <BuscandoPlantillaScreen templateId={draftTemplate.id} />;

  if (stage === 'resultado') {
    return (
      <ResultadoScreen
        quiz={quiz}
        rubroTexto={rubroTexto}
        template={draftTemplate}
        siteData={draftSiteData}
        theme={draftTheme}
        logoUrl={previewLogoUrl}
        onSelectTemplate={setTemplateOverride}
        onEditar={() => setStage('loading')}
        onBack={() => setStage('form')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col">
      <QuizHeader />

      <div className="flex flex-1">
        <StepDots step={step} total={TOTAL_STEPS} />

        <div className="flex-1 grid lg:grid-cols-[400px_1fr] gap-8 xl:gap-10 items-start p-6 sm:p-8 lg:p-10">
          <div className="max-w-xl" key={step}>
            {step === 1 && (
              <StepNegocio
                value={quiz.nombreNegocio}
                onChange={(nombreNegocio) => setQuiz((q) => ({ ...q, nombreNegocio }))}
                onEnter={next}
              />
            )}
            {step === 2 && (
              <StepRubro
                value={quiz.tipoNegocio}
                onChange={(tipoNegocio) => setQuiz((q) => ({ ...q, tipoNegocio }))}
                onEnter={next}
              />
            )}
            {step === 3 && (
              <StepMensaje
                frase={quiz.frase}
                whatsapp={quiz.whatsapp}
                onFraseChange={(frase) => setQuiz((q) => ({ ...q, frase }))}
                onWhatsappChange={(whatsapp) => setQuiz((q) => ({ ...q, whatsapp }))}
              />
            )}
            {step === 4 && (
              <StepLogo
                logoUrl={logoUrl}
                onLogoChange={(url) => {
                  setLogoUrl(url);
                  extractDominantColor(url).then((hex) => {
                    if (hex) setQuiz((q) => ({ ...q, logoAccent: hex }));
                  });
                }}
              />
            )}

            <div className="flex items-center gap-4 mt-6">
              <button
                onClick={back}
                data-track="quiz_atras"
                className="px-6 py-3 border border-white/15 font-semibold text-sm hover:border-white/30 transition-colors"
              >
                ← Atrás
              </button>
              <button
                onClick={next}
                disabled={!canContinue}
                data-track="quiz_continuar"
                className="px-7 py-3 bg-gold-500 text-navy-950 font-bold text-sm hover:bg-gold-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
              >
                {step < TOTAL_STEPS ? 'Continuar' : 'Ver mi página'}
              </button>
            </div>
          </div>

          <LivePreviewPanel
            template={draftTemplate}
            siteData={draftSiteData}
            theme={draftTheme}
            logoUrl={previewLogoUrl}
            rubroTexto={rubroTexto}
            transitioning={transitioning}
          />
        </div>
      </div>
    </div>
  );
}

function QuizHeader() {
  return (
    <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
      <Logo size="sm" />
      <Link to="/" className="text-xs text-ink-400 hover:text-white transition-colors">
        Salir
      </Link>
    </div>
  );
}

// Overlay de transición entre pasos: sombrea solo la plantilla (este marco),
// no el resto de la página — el formulario y el header quedan sin tapar.
function TransitionOverlay() {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-navy-950/85 backdrop-blur-sm animate-fade-in-up">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-white/10" />
        <span className="absolute inset-0 rounded-full border-4 border-transparent border-t-gold-500 animate-spin" />
        <Logo withWordmark={false} size="lg" />
      </div>
    </div>
  );
}

// Vista previa en vivo, al lado del formulario: la plantilla COMPLETA (todas
// sus secciones reales, no solo header+hero) a una escala fija y legible,
// scrolleable — para que se vea de verdad todo lo que trae, no solo la
// portada. Se va actualizando a un ritmo pausado (ver el debounce en
// useDraftPreview) — así cambia de plantilla en base al tipo de negocio del
// paso 2 sin parpadear ni "romperse" a mitad de palabra mientras se tipea.
function LivePreviewPanel({ template, siteData, theme, logoUrl, rubroTexto, transitioning }) {
  return (
    <div className="hidden lg:block w-full lg:sticky lg:top-10">
      <p className="font-mono text-[0.7rem] tracking-[0.12em] uppercase text-ink-500 mb-3">
        Así va quedando tu página
      </p>
      <div className="relative border border-white/10 bg-navy-850 overflow-hidden">
        <div key={template.id} className="animate-fade-in-up">
          <MiniSitePreview
            template={template}
            siteData={siteData}
            theme={theme}
            logoUrl={logoUrl}
            sections={todasLasSecciones(template)}
            viewportHeight={480}
          />
        </div>
        {transitioning && <TransitionOverlay />}
      </div>
      {rubroTexto && (
        <p className="text-xs text-ink-500 mt-3 text-balance">
          Plantilla sugerida para <span className="text-white font-semibold">{rubroTexto.toLowerCase()}</span>:{' '}
          <span className="text-gold-500 font-semibold">{template.nombre}</span>
        </p>
      )}
    </div>
  );
}
