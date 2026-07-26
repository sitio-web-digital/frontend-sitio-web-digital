import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import Logo from '../components/Logo';
import { AnalyticsSection, LeadsSection } from './Admin';

const NAV_ITEMS = [
  { id: 'analytics', label: 'Analytics' },
  { id: 'leads', label: 'Leads' },
];

// Panel acotado para la cuenta de rol "analytics" (ver Admin > Usuarios):
// mismas secciones de Leads y Analytics que ve un admin (reutilizadas tal
// cual, ver Admin.jsx), pero sin el resto del panel — páginas, plantillas,
// suscripciones, usuarios, soporte quedan fuera de acá.
export default function AnalyticsHome() {
  const { user, authReady, logout } = useApp();
  const navigate = useNavigate();
  const [section, setSection] = useState('analytics');

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    if (user.role === 'admin') {
      navigate('/admin', { replace: true });
      return;
    }
    if (user.role !== 'analytics') {
      navigate('/dashboard', { replace: true });
    }
  }, [authReady, user, navigate]);

  if (!user || user.role !== 'analytics') return null;

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
        <div className="flex items-center gap-2">
          <Logo size="sm" />
          <span className="text-ink-500 font-normal text-sm">· analytics</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-400">
          <span className="hidden sm:inline">{user.email}</span>
          <button
            onClick={() => {
              logout();
              navigate('/');
            }}
            className="hover:text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 grid lg:grid-cols-[200px_1fr] gap-8 items-start">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible lg:sticky lg:top-10 -mx-1 px-1 lg:mx-0 lg:px-0">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`shrink-0 text-left px-3.5 py-2.5 text-sm font-semibold border-l-2 transition-colors ${
                section === item.id
                  ? 'border-gold-500 bg-white/5 text-white'
                  : 'border-transparent text-ink-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 animate-fade-in-up">
          {section === 'analytics' && <AnalyticsSection />}
          {section === 'leads' && <LeadsSection />}
        </div>
      </div>
    </div>
  );
}
