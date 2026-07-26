import { useState } from 'react';
import { motion } from 'motion/react';
import MiniSitePreview from '../MiniSitePreview';
import {
  StepDots,
  StepNegocio,
  StepRubro,
  StepMensaje,
  StepLogo,
  ResultadoScreen,
  BuscandoPlantillaScreen,
  todasLasSecciones,
} from '../quiz/QuizSteps';
import { useApp } from '../../context/AppContext';
import { useDraftPreview } from '../../hooks/useDraftPreview';
import { useQuizLeadTracking } from '../../hooks/useQuizLeadTracking';
import { extractDominantColor } from '../../utils/extractColor';

const TOTAL_STEPS = 4;

export default function LiveDemoWidget() {
  const { quiz, setQuiz, logoUrl, setLogoUrl } = useApp();
  const [step, setStep] = useState(1);
  const [stage, setStage] = useState('form'); // 'form' | 'resultado' | 'loading'
  // Si en la pantalla de resultado elige otra plantilla de las sugeridas,
  // pisa la recomendación por defecto hasta que vuelva a esta pantalla.
  const [templateOverride, setTemplateOverride] = useState(null);

  const { rubroTexto, draftTemplate, draftTheme, draftSiteData, previewLogoUrl } = useDraftPreview(templateOverride);

  // Embudo de conversión + captura de leads (ver Admin > Analytics/Leads) —
  // mismo hook que usa /quiz (Quiz.jsx), así los dos formularios del quiz
  // quedan trackeados igual.
  useQuizLeadTracking({ quiz, step, stage });

  const canContinue =
    (step === 1 && !!quiz.nombreNegocio?.trim()) ||
    (step === 2 && !!quiz.tipoNegocio?.trim()) ||
    step === 3 ||
    step === 4;

  const next = () => {
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      return;
    }
    setStage('resultado');
  };
  const back = () => step > 1 && setStep((s) => s - 1);

  const expanded = stage !== 'form';

  return (
    <section id="como-funciona" style={{ maxWidth: 1200, margin: '0 auto', padding: 'clamp(3rem, 6vw, 4.5rem) clamp(1.25rem, 3vw, 2rem)' }}>
      <div style={{ textAlign: 'center', maxWidth: '36rem', margin: '0 auto 2.5rem' }}>
        <div style={{ fontFamily: '"Space Mono", monospace', fontSize: '0.75rem', letterSpacing: '0.18em', color: 'oklch(0.8 0.15 86)', marginBottom: '0.75rem' }}>
          ASÍ DE SIMPLE
        </div>
        <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', margin: '0 0 0.9rem' }}>
          Completá los datos y mirá, en vivo, cómo queda tu página
        </h2>
        <p style={{ fontSize: '0.98rem', color: 'oklch(0.78 0.02 258)', lineHeight: 1.6, margin: 0 }}>Empezá por el nombre.</p>
      </div>

      <motion.div
        layout
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={expanded ? 'fixed inset-0 z-50 overflow-y-auto' : 'relative flex border border-white/8 bg-navy-950/40'}
      >
        {stage === 'resultado' && (
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
        )}
        {stage === 'loading' && <BuscandoPlantillaScreen templateId={draftTemplate.id} />}
        {stage === 'form' && (
          <>
            <StepDots step={step} total={TOTAL_STEPS} />
            <div className="flex-1 grid lg:grid-cols-[380px_1fr] gap-8 xl:gap-12 items-start p-6 sm:p-8 text-white">
              <div key={step}>
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

                <div className="flex items-center gap-3 mt-6">
                  {step > 1 && (
                    <button
                      onClick={back}
                      className="px-5 py-2.5 border border-white/15 font-semibold text-sm hover:border-white/30 transition-colors"
                    >
                      ← Atrás
                    </button>
                  )}
                  <button
                    onClick={next}
                    disabled={!canContinue}
                    className="px-6 py-2.5 bg-gold-500 text-navy-950 font-bold text-sm hover:bg-gold-400 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {step < TOTAL_STEPS ? 'Continuar' : 'Ver mi página'}
                  </button>
                </div>
              </div>

              <div>
                <div className="border border-white/10 bg-navy-850 overflow-hidden">
                  <div key={draftTemplate.id} className="animate-fade-in-up">
                    <MiniSitePreview
                      template={draftTemplate}
                      siteData={draftSiteData}
                      theme={draftTheme}
                      logoUrl={previewLogoUrl}
                      sections={todasLasSecciones(draftTemplate)}
                      viewportHeight={480}
                    />
                  </div>
                </div>
                {rubroTexto && (
                  <p className="text-xs text-ink-500 mt-3 text-balance">
                    Plantilla sugerida para <span className="text-white font-semibold">{rubroTexto.toLowerCase()}</span>:{' '}
                    <span className="text-gold-500 font-semibold">{draftTemplate.nombre}</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </motion.div>
    </section>
  );
}
