import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { TrendUpIcon, WhatsAppIcon, PhoneCallIcon, PinIcon } from '../components/icons';
import Logo from '../components/Logo';
import { useApp } from '../context/AppContext';
import { ROOT_DOMAIN } from '../utils/rootDomain';

// Serie fija (no aleatoria) para que el gráfico no salte entre renders.
const VISITAS_14D = [
  { dia: '27/6', visitas: 42 },
  { dia: '28/6', visitas: 51 },
  { dia: '29/6', visitas: 38 },
  { dia: '30/6', visitas: 64 },
  { dia: '1/7', visitas: 71 },
  { dia: '2/7', visitas: 58 },
  { dia: '3/7', visitas: 82 },
  { dia: '4/7', visitas: 76 },
  { dia: '5/7', visitas: 69 },
  { dia: '6/7', visitas: 91 },
  { dia: '7/7', visitas: 88 },
  { dia: '8/7', visitas: 104 },
  { dia: '9/7', visitas: 97 },
  { dia: '10/7', visitas: 112 },
];

const FUENTES = [
  { name: 'Instagram', value: 412, color: '#9085e9' },
  { name: 'Google', value: 356, color: '#3987e5' },
  { name: 'WhatsApp', value: 289, color: '#199e70' },
  { name: 'Directo', value: 227, color: '#c98500' },
];

const KPIS = [
  { label: 'Visitas totales', value: '1.284', delta: '+18%', icon: TrendUpIcon },
  { label: 'Clics en WhatsApp', value: '312', delta: '+24%', icon: WhatsAppIcon },
  { label: 'Llamadas', value: '84', delta: '+6%', icon: PhoneCallIcon },
  { label: 'Vistas de ubicación', value: '156', delta: '+11%', icon: PinIcon },
];

export default function Stats() {
  const { siteData, template, subdomain, published } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (!siteData || !template) navigate('/plantillas', { replace: true });
  }, [siteData, template, navigate]);

  if (!siteData || !template) return null;

  const totalFuentes = FUENTES.reduce((acc, f) => acc + f.value, 0);

  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="px-5 sm:px-8 py-4 flex items-center justify-between border-b border-white/8">
        <Logo size="sm" />
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 border border-white/15 hover:bg-white/5 transition-colors text-sm font-semibold"
        >
          ← Volver al panel
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-12">
        <div className="mb-10 animate-fade-in-up">
          <div className="flex items-center gap-2 text-xs text-ink-400 mb-2">
            {published && (
              <span className="inline-flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Publicada
              </span>
            )}
            <span>·</span>
            <span>{subdomain}.{ROOT_DOMAIN}</span>
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-balance">
            Estadísticas de {siteData.nombreNegocio}
          </h1>
          <p className="text-ink-400 text-sm mt-1">Últimos 14 días · datos de ejemplo</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {KPIS.map((k, i) => (
            <div
              key={k.label}
              className="border border-white/10 bg-navy-850 p-5 animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <k.icon className="w-4 h-4 text-gold-500" />
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  ▲ {k.delta}
                </span>
              </div>
              <p className="font-display text-2xl font-bold">{k.value}</p>
              <p className="text-xs text-ink-400 mt-1">{k.label}</p>
            </div>
          ))}
        </div>

        {/* Gráficos */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          <div className="border border-white/10 bg-navy-850 p-6 animate-fade-in-up">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display font-semibold">Visitas por día</h2>
                <p className="text-xs text-ink-400 mt-0.5">Sesiones a tu página</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#FFC107' }} />
                Visitas
              </span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={VISITAS_14D} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitasFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFC107" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#FFC107" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis
                  dataKey="dia"
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: '#6b7590', fontSize: 12 }}
                  tickLine={false}
                  axisLine={{ stroke: 'rgba(255,255,255,0.15)' }}
                  interval={1}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.15)"
                  tick={{ fill: '#6b7590', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={32}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
                <Area
                  type="monotone"
                  dataKey="visitas"
                  stroke="#FFC107"
                  strokeWidth={2}
                  fill="url(#visitasFill)"
                  dot={false}
                  activeDot={{ r: 4, fill: '#FFC107', stroke: '#0B1120', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div
            className="border border-white/10 bg-navy-850 p-6 animate-fade-in-up"
            style={{ animationDelay: '80ms' }}
          >
            <h2 className="font-display font-semibold mb-0.5">Fuente de tráfico</h2>
            <p className="text-xs text-ink-400 mb-4">De dónde vienen tus visitas</p>
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={FUENTES}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={82}
                    paddingAngle={2}
                    stroke="#121b30"
                    strokeWidth={2}
                  >
                    {FUENTES.map((f) => (
                      <Cell key={f.name} fill={f.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip donut />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="font-display text-xl font-bold">{totalFuentes}</p>
                <p className="text-[10px] text-ink-400">visitas</p>
              </div>
            </div>
            <ul className="mt-4 space-y-2">
              {FUENTES.map((f) => (
                <li key={f.name} className="flex items-center gap-2.5 text-sm">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: f.color }} />
                  <span className="text-ink-200 flex-1">{f.name}</span>
                  <span className="text-ink-400 font-medium">
                    {Math.round((f.value / totalFuentes) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, donut }) {
  if (!active || !payload?.length) return null;
  if (donut) {
    const p = payload[0];
    return (
      <div className="border border-white/10 bg-navy-950 px-3 py-2 text-xs shadow-xl">
        <p className="font-semibold text-white">{p.name}</p>
        <p className="text-ink-400">{p.value} visitas</p>
      </div>
    );
  }
  return (
    <div className="border border-white/10 bg-navy-950 px-3 py-2 text-xs shadow-xl">
      <p className="text-ink-400 mb-0.5">{label}</p>
      <p className="font-semibold text-white">{payload[0].value} visitas</p>
    </div>
  );
}
