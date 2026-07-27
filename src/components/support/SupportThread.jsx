import { useEffect, useRef, useState } from 'react';
import {
  apiGetSupportThread,
  apiSendSupportMessage,
  apiClaimSupportTicket,
  apiCloseSupportTicket,
} from '../../api/client';
import { validateImageFiles } from '../../utils/imageValidation';

const POLL_MS = 4000;

// Hilo de chat de una consulta: mensaje inicial + réplicas, con burbujas a
// la derecha para lo que mandó el que está mirando (currentUserId) y a la
// izquierda para la otra parte — funciona igual para el usuario y para el
// admin, cada uno ve sus propios mensajes a la derecha. Hace polling simple
// (sin websockets) mientras el hilo está abierto, para simular el ida y
// vuelta sin necesitar tiempo real de verdad en este prototipo. `isAdmin`
// habilita los botones de tomar/cerrar (Admin > Soporte); del lado del
// cliente (Dashboard) nunca se pasa.
export default function SupportThread({ ticketId, currentUserId, isAdmin = false, onTicketUpdated }) {
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('abierto');
  const [claimedByName, setClaimedByName] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [adjuntos, setAdjuntos] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [claimBusy, setClaimBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const thread = await apiGetSupportThread(ticketId);
      if (!cancelled && thread) {
        setMessages(thread.messages);
        setStatus(thread.status || 'abierto');
        setClaimedByName(thread.claimedByName || null);
      }
      if (!cancelled) setLoading(false);
    };

    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [ticketId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
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
  };

  const removeAdjunto = (i) => setAdjuntos((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    const result = await apiSendSupportMessage(ticketId, { mensaje: text.trim(), adjuntos });
    setSending(false);
    if (!result.ok) {
      setError(result.error || 'No se pudo enviar el mensaje.');
      return;
    }
    setText('');
    setAdjuntos([]);
    setMessages((list) => [...list, result.message]);
  };

  const tomarTicket = async () => {
    setClaimBusy(true);
    const result = await apiClaimSupportTicket(ticketId);
    setClaimBusy(false);
    if (result.ok) {
      setClaimedByName(result.claimedByName);
      onTicketUpdated?.({ claimedByName: result.claimedByName });
    }
  };

  const cerrarTicket = async () => {
    setClaimBusy(true);
    const result = await apiCloseSupportTicket(ticketId);
    setClaimBusy(false);
    if (result.ok) {
      setStatus('cerrado');
      onTicketUpdated?.({ status: 'cerrado' });
    }
  };

  if (loading) return <p className="text-sm text-ink-500 px-4 py-3">Cargando conversación...</p>;

  return (
    <div className="border-t border-white/10">
      {isAdmin && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-white/10 bg-navy-900/60">
          <p className="text-xs text-ink-400">
            {claimedByName ? (
              <>
                Tomado por <span className="text-white font-semibold">{claimedByName}</span>
              </>
            ) : (
              'Nadie tomó este ticket todavía.'
            )}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={tomarTicket}
              disabled={claimBusy}
              className="px-2.5 py-1.5 border border-white/15 hover:bg-white/5 disabled:opacity-50 transition-colors text-xs font-semibold text-white"
            >
              {claimedByName ? 'Volver a tomar' : 'Tomar ticket'}
            </button>
            {status !== 'cerrado' && (
              <button
                onClick={cerrarTicket}
                disabled={claimBusy}
                className="px-2.5 py-1.5 bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 disabled:opacity-50 transition-colors text-xs font-semibold"
              >
                Cerrar ticket
              </button>
            )}
          </div>
        </div>
      )}

      <div className="max-h-80 overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] px-3 py-2 text-sm ${
                  mine ? 'bg-gold-500 text-navy-950' : 'bg-navy-800 text-white border border-white/10'
                }`}
              >
                {!mine && (
                  <p className="text-[10px] font-mono uppercase tracking-wide opacity-70 mb-0.5">
                    {m.senderRole === 'admin' ? 'Soporte' : m.senderName}
                  </p>
                )}
                <p className="whitespace-pre-line">{m.mensaje}</p>
                {m.adjuntos?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {m.adjuntos.map((a, i) => (
                      <img
                        key={i}
                        src={a.dataUrl}
                        alt={a.name}
                        className="w-14 h-14 object-cover border border-white/10"
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {status === 'cerrado' ? (
        <p className="text-xs text-ink-500 italic px-4 py-3 border-t border-white/10">
          Este ticket está cerrado — ya no admite mensajes nuevos.
        </p>
      ) : (
        <form onSubmit={submit} className="px-4 py-3 border-t border-white/10 space-y-2">
          {adjuntos.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {adjuntos.map((a, i) => (
                <div key={i} className="relative w-12 h-12 shrink-0">
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
            </div>
          )}
          <div className="flex items-center gap-2">
            <label
              className={`shrink-0 w-9 h-9 border border-dashed border-white/15 hover:border-gold-500/60 transition-colors cursor-pointer flex items-center justify-center text-ink-400 text-lg ${
                adjuntos.length >= 3 ? 'opacity-40 pointer-events-none' : ''
              }`}
            >
              +
              <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} disabled={sending} />
            </label>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí una respuesta..."
              maxLength={800}
              className="flex-1 border border-white/10 bg-navy-900 px-3 py-2 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
            <button
              type="submit"
              disabled={!text.trim() || sending}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold text-sm disabled:opacity-40 disabled:pointer-events-none"
            >
              Enviar
            </button>
          </div>
        </form>
      )}
      {error && <p className="text-xs text-red-400 px-4 pb-3">{error}</p>}
    </div>
  );
}
