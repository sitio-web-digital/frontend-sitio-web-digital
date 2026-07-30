import { useState } from 'react';
import { validateImageFiles } from '../../utils/imageValidation';

// Modal para armar una consulta nueva (asunto + mensaje + hasta 3 capturas).
// Lo usan tanto Dashboard > Soporte como el modal de soporte del editor —
// `onSubmit` hace el POST real contra el backend en cada caso.
export default function NewTicketModal({ onClose, onSubmit }) {
  const [asunto, setAsunto] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    const validos = await validateImageFiles(files.slice(0, 3 - adjuntos.length), 'soporte');
    const leidos = await Promise.all(
      validos.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
            reader.readAsDataURL(file);
          })
      )
    );
    setAdjuntos((prev) => [...prev, ...leidos].slice(0, 3));
    setBusy(false);
  };

  const removeAdjunto = (i) => setAdjuntos((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!asunto.trim() || !mensaje.trim()) return;
    setBusy(true);
    setError('');
    const result = await onSubmit({ asunto: asunto.trim(), mensaje: mensaje.trim(), adjuntos });
    setBusy(false);
    if (!result.ok) setError(result.error || 'No se pudo enviar la consulta.');
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-md border border-white/10 bg-navy-850 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center justify-between gap-2">
          <span className="text-white font-semibold text-sm">Contactar a soporte</span>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-ink-400 hover:text-white transition-colors text-lg leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-3">
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
              Asunto
            </label>
            <input
              required
              autoFocus
              value={asunto}
              onChange={(e) => setAsunto(e.target.value)}
              maxLength={80}
              placeholder="Ej: No me carga el editor"
              className="w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
          </div>
          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
              Mensaje
            </label>
            <textarea
              required
              rows={5}
              maxLength={800}
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              placeholder="Contanos qué necesitás..."
              className="w-full border border-white/10 bg-navy-900 px-3.5 py-2.5 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block font-mono text-[0.65rem] uppercase tracking-[0.06em] text-ink-500 mb-1.5">
              Adjuntar capturas <span className="text-ink-500 normal-case">(opcional, hasta 3)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {adjuntos.map((a, i) => (
                <div key={i} className="relative w-16 h-16 shrink-0">
                  <img src={a.dataUrl} alt={a.name} className="w-full h-full object-cover border border-white/10" />
                  <button
                    type="button"
                    onClick={() => removeAdjunto(i)}
                    aria-label="Quitar"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-navy-950 border border-white/15 text-white flex items-center justify-center text-[0.6rem] leading-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
              {adjuntos.length < 3 && (
                <label className="w-16 h-16 shrink-0 border-2 border-dashed border-white/15 hover:border-gold-500/60 transition-colors cursor-pointer flex items-center justify-center text-ink-400 text-xl">
                  +
                  <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={busy} />
                </label>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={!asunto.trim() || !mensaje.trim() || busy}
            className="w-full inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3 disabled:opacity-40 disabled:pointer-events-none"
          >
            {busy ? 'Enviando...' : 'Enviar mensaje'}
          </button>
        </form>
      </div>
    </div>
  );
}
