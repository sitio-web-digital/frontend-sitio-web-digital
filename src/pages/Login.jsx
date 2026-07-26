import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthGate from '../components/AuthGate';
import Logo from '../components/Logo';
import HeroWall from '../components/home/HeroWall';
import { useApp } from '../context/AppContext';

// A dónde va cada rol después de loguearse — mismo criterio en los dos
// lugares de acá abajo que lo necesitan (ya logueado, y justo después de
// loguearse).
const homeForRole = (role) => (role === 'admin' ? '/admin' : role === 'analytics' ? '/analytics' : '/dashboard');

export default function Login() {
  const { user, login, register } = useApp();
  const navigate = useNavigate();

  // Si ya hay sesión iniciada, no dejamos ver el formulario — entrar a otra
  // cuenta desde acá sin pasar por "Cerrar sesión" es justo el caso que
  // hacía que el borrador de la cuenta anterior se filtrara a la nueva.
  useEffect(() => {
    if (user) navigate(homeForRole(user.role), { replace: true });
  }, [user, navigate]);

  if (user) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy-900 text-white flex flex-col">
      <HeroWall />

      <div className="relative z-10 px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
        <Logo size="sm" />
        <Link to="/" className="text-xs text-ink-400 hover:text-white transition-colors">
          Volver al inicio
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-5 sm:px-8 py-10">
        <div className="w-full max-w-sm animate-fade-in-up">
          <div className="mb-6 text-center">
            <span className="font-mono text-[0.72rem] tracking-[0.14em] uppercase text-gold-500">
              Bienvenido de vuelta
            </span>
            <h1 className="font-display text-2xl font-extrabold tracking-tight mt-2 text-balance">
              Entrá a tu cuenta
            </h1>
            <p className="text-ink-400 text-sm mt-1">Para ver o administrar tu página publicada.</p>
          </div>
          <AuthGate
            login={login}
            register={register}
            title="Entrá a tu cuenta"
            onSuccess={(result) => navigate(homeForRole(result.user?.role))}
          />
        </div>
      </div>
    </div>
  );
}
