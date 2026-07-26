import { useEffect, useRef } from 'react';
import { trackEvent, saveLead } from '../utils/analytics';

// Embudo de conversión + captura de leads del quiz (ver Admin > Analytics y
// Admin > Leads) — compartido entre /quiz (Quiz.jsx) y el demo en vivo de la
// Home (LiveDemoWidget.jsx), que son dos formularios distintos pero llenan
// el mismo `quiz` de AppContext. Si en algún momento se agrega un tercer
// lugar donde alguien pueda completar el quiz, basta con llamar este mismo
// hook ahí para que quede igual de trackeado — así no se repite el error de
// habérselo agregado solo a uno de los dos formularios.
export function useQuizLeadTracking({ quiz, step, stage }) {
  // Un id nuevo por cada vez que se monta este formulario (no el de
  // analytics, que dura toda la visita) — así, si alguien vuelve a entrar
  // más tarde y completa otro negocio distinto, queda como un lead aparte
  // en vez de pisar el anterior. Mientras siga en esta misma pasada, los
  // guardados se acumulan sobre el mismo lead.
  const leadSessionIdRef = useRef(null);
  if (!leadSessionIdRef.current) leadSessionIdRef.current = crypto.randomUUID();

  // Un evento por cada paso al que llega el visitante, y otro al llegar a
  // la pantalla de resultado — así se ve en qué paso concreto se queda la
  // mayoría de la gente.
  useEffect(() => {
    if (stage === 'form') trackEvent('funnel', `quiz_paso_${step}`, { step });
  }, [stage, step]);

  useEffect(() => {
    if (stage === 'resultado') trackEvent('funnel', 'quiz_resultado', {});
  }, [stage]);

  // Lo que va completando vale aunque nunca lo termine ni se registre — se
  // guarda solo desde que escribe el nombre del negocio (no recién con el
  // teléfono), con un pequeño debounce para no mandar un guardado por cada
  // tecla. `lastStep` queda en el punto más lejano al que llegó (el backend
  // nunca lo hace retroceder).
  useEffect(() => {
    const tieneAlgo = [quiz.nombreNegocio, quiz.tipoNegocio, quiz.frase, quiz.whatsapp].some(
      (v) => v?.trim().length >= 2
    );
    if (!tieneAlgo) return;
    const t = setTimeout(() => {
      saveLead({
        sessionId: leadSessionIdRef.current,
        nombreNegocio: quiz.nombreNegocio,
        telefono: quiz.whatsapp,
        rubro: quiz.tipoNegocio,
        frase: quiz.frase,
        lastStep: stage === 'resultado' ? 5 : step,
      });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz.whatsapp, quiz.nombreNegocio, quiz.tipoNegocio, quiz.frase, step, stage]);
}
