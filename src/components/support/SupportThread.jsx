import { useEffect, useRef, useState } from 'react';
import { apiGetSupportThread, apiSendSupportMessage } from '../../api/client';

const POLL_MS = 4000;

// Hilo de chat de una consulta: mensaje inicial + réplicas, con burbujas a
// la derecha para lo que mandó el que está mirando (currentUserId) y a la
// izquierda para la otra parte — funciona igual para el usuario y para el
// admin, cada uno ve sus propios mensajes a la derecha. Hace polling simple
// (sin websockets) mientras el hilo está abierto, para simular el ida y
// vuelta sin necesitar tiempo real de verdad en este prototipo.
export default function SupportThread({ ticketId, currentUserId }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const thread = await apiGetSupportThread(ticketId);
      if (!cancelled && thread) setMessages(thread.messages);
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

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError('');
    const result = await apiSendSupportMessage(ticketId, { mensaje: text.trim(), adjuntos: [] });
    setSending(false);
    if (!result.ok) {
      setError(result.error || 'No se pudo enviar el mensaje.');
      return;
    }
    setText('');
    setMessages((list) => [...list, result.message]);
  };

  if (loading) return <p className="text-sm text-ink-500 px-4 py-3">Cargando conversación...</p>;

  return (
    <div className="border-t border-white/10">
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

      <form onSubmit={submit} className="flex items-center gap-2 px-4 py-3 border-t border-white/10">
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
      </form>
      {error && <p className="text-xs text-red-400 px-4 pb-3">{error}</p>}
    </div>
  );
}
