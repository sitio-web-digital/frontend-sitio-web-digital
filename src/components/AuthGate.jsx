import { useState } from 'react';
import { LockIcon } from './icons';

// Login/registro reutilizable — lo usa tanto el checkout (para poder pagar) como
// la página de login independiente (para entrar al dashboard de una cuenta ya paga)
// y el editor (para poder escribirle a soporte).
export default function AuthGate({ login, register, title = 'Iniciá sesión para continuar', onSuccess }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    // MOCK: sin backend real — valida contra la API simulada (ver src/api/mockApi.js).
    const result = mode === 'login' ? await login({ email, password }) : await register({ name, email, password });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSuccess?.(result);
  };

  return (
    <div className="border border-white/10 bg-navy-850 overflow-hidden shadow-2xl">
      <div className="bg-navy-950 border-b border-white/8 px-6 py-4 flex items-center gap-2">
        <LockIcon className="w-4 h-4 text-gold-500" />
        <span className="text-white font-semibold text-sm">{title}</span>
      </div>

      <div className="p-6">
        <div className="flex gap-1 border border-white/10 p-1 mb-6">
          {[
            ['login', 'Iniciar sesión'],
            ['register', 'Crear cuenta'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setMode(id);
                setError('');
              }}
              className={`flex-1 py-2 text-sm font-semibold transition-colors ${
                mode === id ? 'bg-gold-500 text-navy-950' : 'text-ink-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'register' && (
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="w-full border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
            />
          )}
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
          />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            minLength={6}
            className="w-full border border-white/10 bg-navy-900 px-4 py-3 text-sm text-white placeholder:text-ink-500 outline-none focus:border-gold-500 transition-colors"
          />

          {error && <p className="text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gold-500 hover:bg-gold-400 transition-colors text-navy-950 font-bold py-3.5 disabled:opacity-50"
          >
            {submitting ? 'Un momento...' : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
}
