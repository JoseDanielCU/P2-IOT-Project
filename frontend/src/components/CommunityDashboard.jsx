import { useEffect, useState } from 'react';
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
    Cell,
} from 'recharts';
import { HiLightningBolt, HiDownload } from 'react-icons/hi';
import { apiRequest } from '../services/api';

// ─── Tooltip: producción vs consumo ──────────────────────────────────────────
const TrendTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
            <p className="font-semibold text-slate-700 mb-2">{label}</p>
            {payload.map(entry => (
                <div
                    key={entry.dataKey}
                    className="flex justify-between gap-4 text-slate-600"
                >
                    <span style={{ color: entry.color }}>{entry.name}</span>
                    <span className="font-medium">
                        {Number(entry.value).toFixed(1)} kWh
                    </span>
                </div>
            ))}
        </div>
    );
};

// ─── Tooltip: balance excedente / déficit ─────────────────────────────────────
const BalanceTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const val = payload[0]?.value ?? 0;
    const isSurplus = val >= 0;
    return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[150px]">
            <p className="font-semibold text-slate-700 mb-1">{label}</p>
            <div
                className={`flex justify-between gap-4 font-semibold ${isSurplus ? 'text-lime-600' : 'text-orange-500'}`}
            >
                <span>{isSurplus ? '▲ Excedente' : '▼ Déficit'}</span>
                <span>
                    {isSurplus ? '+' : ''}
                    {Number(val).toFixed(1)} kWh
                </span>
            </div>
        </div>
    );
};

// ─── Badge de estado global ───────────────────────────────────────────────────
const StatusBadge = ({ value }) => {
    const ok = value >= 0;
    return (
        <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full
            ${ok ? 'bg-lime-100 text-lime-700' : 'bg-orange-100 text-orange-600'}`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-lime-500' : 'bg-orange-500'}`}
            />
            {ok ? 'Excedente comunitario' : 'Déficit comunitario'}
        </span>
    );
};

// ─── Datos de ejemplo (fallback sin API) ──────────────────────────────────────
const buildMock = days => {
    const prod7 = [248, 312, 189, 276, 301, 265, 251];
    const cons7 = [215, 278, 241, 198, 256, 201, 198];
    const daily = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        const p = prod7[i % 7];
        const c = cons7[i % 7];
        return {
            timestamp: d.toISOString().slice(0, 10),
            produced: p,
            consumed: c,
            balance: p - c,
        };
    });
    const totProd = daily.reduce((a, d) => a + d.produced, 0);
    const totCons = daily.reduce((a, d) => a + d.consumed, 0);
    return {
        metrics: {
            total_produced_kwh: totProd,
            total_consumed_kwh: totCons,
            net_balance_kwh: totProd - totCons,
            active_members: 34,
            surplus_members: 21,
            deficit_members: 13,
        },
        chart: daily,
    };
};

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CommunityDashboard() {
    const [globalMetrics, setGlobalMetrics] = useState({
        total_produced_kwh: 0,
        total_consumed_kwh: 0,
        net_balance_kwh: 0,
        active_members: 0,
        surplus_members: 0,
        deficit_members: 0,
    });
    const [globalChartData, setGlobalChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Preferencias persistidas
    const [days, setDaysState] = useState(() =>
        Number(localStorage.getItem('community_days') || 30)
    );
    const [chartType, setChartTypeState] = useState(
        () => localStorage.getItem('community_chartType') || 'line'
    );
    // 'trend' = producción vs consumo | 'balance' = excedente/déficit
    const [view, setView] = useState('trend');

    const setDays = val => {
        setDaysState(val);
        localStorage.setItem('community_days', val);
    };
    const setChartType = val => {
        setChartTypeState(val);
        localStorage.setItem('community_chartType', val);
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const metrics = await apiRequest(
                    `/api/energy/metrics/global?days=${days}`
                );
                setGlobalMetrics(metrics);
                const chart = await apiRequest(`/api/energy/chart/global?days=${days}`);
                setGlobalChartData(
                    chart.map(d => ({
                        ...d,
                        balance: (d.produced ?? 0) - (d.consumed ?? 0),
                    }))
                );
            } catch {
                const mock = buildMock(days);
                setGlobalMetrics(mock.metrics);
                setGlobalChartData(mock.chart);
                setError('Mostrando datos de ejemplo');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days]);

    const formatDate = dateStr => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' });
    };

    const isNetSurplus = globalMetrics.net_balance_kwh >= 0;
    const surplusPercent = globalMetrics.active_members
        ? Math.round(
              (globalMetrics.surplus_members / globalMetrics.active_members) * 100
          )
        : 0;

    const surplusDays = globalChartData.filter(d => d.balance >= 0);
    const deficitDays = globalChartData.filter(d => d.balance < 0);
    const surplusTotal = surplusDays.reduce((a, d) => a + d.balance, 0);
    const deficitTotal = deficitDays.reduce((a, d) => a + d.balance, 0);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex items-center justify-center min-h-[200px]">
                <div className="flex items-center gap-3 text-slate-500 text-sm">
                    <svg
                        className="w-4 h-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeOpacity="0.25"
                        />
                        <path
                            d="M12 2a10 10 0 0 1 10 10"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    </svg>
                    Cargando métricas globales…
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* ── Cabecera ──────────────────────────────────────────────────── */}
            <div className="px-6 pt-6 pb-4 border-b border-slate-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">
                            Métricas Comunitarias Globales
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Comparativo global de producción y consumo
                        </p>
                    </div>
                    <StatusBadge value={globalMetrics.net_balance_kwh} />
                </div>
                {error && <p className="text-xs text-amber-600 mt-2">⚠ {error}</p>}
            </div>

            {/* ── KPIs ──────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100">
                {[
                    {
                        label: 'Energía producida',
                        value: `${globalMetrics.total_produced_kwh.toFixed(1)} kWh`,
                        color: 'text-lime-600',
                        icon: <HiLightningBolt className="w-4 h-4" />,
                        iconBg: 'bg-lime-50 text-lime-500',
                    },
                    {
                        label: 'Energía consumida',
                        value: `${globalMetrics.total_consumed_kwh.toFixed(1)} kWh`,
                        color: 'text-cyan-600',
                        icon: <HiLightningBolt className="w-4 h-4" />,
                        iconBg: 'bg-cyan-50 text-cyan-500',
                    },
                    {
                        label: 'Balance neto',
                        value: `${isNetSurplus ? '+' : ''}${globalMetrics.net_balance_kwh.toFixed(1)} kWh`,
                        color: isNetSurplus ? 'text-lime-600' : 'text-orange-500',
                        icon: <HiDownload className="w-4 h-4" />,
                        iconBg: isNetSurplus
                            ? 'bg-lime-50 text-lime-500'
                            : 'bg-orange-50 text-orange-500',
                    },
                    {
                        label: 'Miembros activos',
                        value: globalMetrics.active_members,
                        color: 'text-slate-700',
                        sub: `${globalMetrics.surplus_members} excedente · ${globalMetrics.deficit_members} déficit`,
                        icon: null,
                        iconBg: null,
                    },
                ].map((kpi, i) => (
                    <div key={i} className="bg-white px-5 py-4 flex items-start gap-3">
                        {kpi.icon && (
                            <span
                                className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${kpi.iconBg}`}
                            >
                                {kpi.icon}
                            </span>
                        )}
                        <div>
                            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                                {kpi.label}
                            </p>
                            <p className={`text-2xl font-bold ${kpi.color}`}>
                                {kpi.value}
                            </p>
                            {kpi.sub && (
                                <p className="text-xs text-slate-400 mt-1">{kpi.sub}</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Barra de participación ────────────────────────────────────── */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                    <span>Miembros en excedente</span>
                    <span className="font-semibold text-slate-700">
                        {globalMetrics.surplus_members}/{globalMetrics.active_members}
                    </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-lime-400 to-lime-500 transition-all duration-700"
                        style={{ width: `${surplusPercent}%` }}
                    />
                </div>
            </div>

            {/* ── Tabs + controles ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-6 pt-5 pb-3 gap-3">
                <div className="flex gap-1">
                    {[
                        { key: 'trend', label: 'Producción vs Consumo' },
                        { key: 'balance', label: 'Excedente / Déficit' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setView(tab.key)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                                view === tab.key
                                    ? 'bg-slate-800 text-white'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3">
                    {/* Switcher línea/barra solo en vista trend */}
                    {view === 'trend' && (
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                            <button
                                onClick={() => setChartType('line')}
                                title="Gráfico de líneas"
                                className={`p-1.5 rounded-md transition ${chartType === 'line' ? 'bg-white shadow text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="22 12 18 12 15 18 9 6 6 12 2 12" />
                                </svg>
                            </button>
                            <button
                                onClick={() => setChartType('bar')}
                                title="Gráfico de barras"
                                className={`p-1.5 rounded-md transition ${chartType === 'bar' ? 'bg-white shadow text-cyan-600' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <svg
                                    className="w-4 h-4"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                >
                                    <rect x="2" y="10" width="4" height="12" rx="1" />
                                    <rect x="10" y="6" width="4" height="16" rx="1" />
                                    <rect x="18" y="3" width="4" height="19" rx="1" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <select
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                    >
                        <option value={7}>Últimos 7 días</option>
                        <option value={14}>Últimos 14 días</option>
                        <option value={30}>Últimos 30 días</option>
                        <option value={90}>Últimos 90 días</option>
                    </select>
                </div>
            </div>

            {/* ── Vista: Producción vs Consumo ──────────────────────────────── */}
            {view === 'trend' && (
                <div className="px-6 pb-6">
                    <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'bar' ? (
                                <BarChart
                                    data={globalChartData}
                                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                    />
                                    <XAxis
                                        dataKey="timestamp"
                                        stroke="#64748b"
                                        tickFormatter={formatDate}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                                    <Tooltip content={<TrendTooltip />} />
                                    <Legend />
                                    <Bar
                                        dataKey="produced"
                                        fill="#84cc16"
                                        name="Producción"
                                        radius={[4, 4, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="consumed"
                                        fill="#06b6d4"
                                        name="Consumo"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            ) : (
                                <AreaChart
                                    data={globalChartData}
                                    margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                                >
                                    <defs>
                                        <linearGradient
                                            id="gradProd"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#84cc16"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#84cc16"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                        <linearGradient
                                            id="gradCons"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="5%"
                                                stopColor="#06b6d4"
                                                stopOpacity={0.2}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor="#06b6d4"
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e2e8f0"
                                    />
                                    <XAxis
                                        dataKey="timestamp"
                                        stroke="#64748b"
                                        tickFormatter={formatDate}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                                    <Tooltip content={<TrendTooltip />} />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="produced"
                                        name="Producción"
                                        stroke="#84cc16"
                                        strokeWidth={2.5}
                                        fill="url(#gradProd)"
                                        dot={{ r: 3, fill: '#84cc16' }}
                                        activeDot={{ r: 5 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="consumed"
                                        name="Consumo"
                                        stroke="#06b6d4"
                                        strokeWidth={2.5}
                                        fill="url(#gradCons)"
                                        dot={{ r: 3, fill: '#06b6d4' }}
                                        activeDot={{ r: 5 }}
                                    />
                                </AreaChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Vista: Excedente / Déficit ────────────────────────────────── */}
            {view === 'balance' && (
                <div className="px-6 pb-6">
                    {/* Leyenda */}
                    <div className="flex items-center gap-5 mb-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-lime-400 inline-block" />
                            Excedente (producción &gt; consumo)
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-sm bg-orange-400 inline-block" />
                            Déficit (consumo &gt; producción)
                        </span>
                    </div>

                    {/* Gráfico de barras coloreadas por signo */}
                    <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={globalChartData}
                                margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="timestamp"
                                    stroke="#64748b"
                                    tickFormatter={formatDate}
                                    tick={{ fontSize: 11 }}
                                />
                                <YAxis
                                    stroke="#64748b"
                                    tick={{ fontSize: 11 }}
                                    tickFormatter={v => `${v > 0 ? '+' : ''}${v}`}
                                />
                                {/* Línea de equilibrio — referencia clave */}
                                <ReferenceLine
                                    y={0}
                                    stroke="#94a3b8"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    label={{
                                        value: 'Equilibrio',
                                        position: 'insideTopRight',
                                        fontSize: 11,
                                        fill: '#94a3b8',
                                    }}
                                />
                                <Tooltip content={<BalanceTooltip />} />
                                <Bar
                                    dataKey="balance"
                                    name="Balance neto"
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={40}
                                >
                                    {globalChartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={
                                                entry.balance >= 0
                                                    ? '#84cc16'
                                                    : '#fb923c'
                                            }
                                            fillOpacity={0.85}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Tarjetas resumen de días en excedente / déficit */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
                            <p className="text-xs text-lime-700 font-medium mb-1">
                                Días en excedente
                            </p>
                            <p className="text-2xl font-bold text-lime-600">
                                {surplusDays.length}
                                <span className="text-sm font-normal text-lime-500 ml-1">
                                    / {globalChartData.length} días
                                </span>
                            </p>
                            <p className="text-xs text-lime-600 mt-1">
                                +{surplusTotal.toFixed(1)} kWh acumulado
                            </p>
                        </div>
                        <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
                            <p className="text-xs text-orange-700 font-medium mb-1">
                                Días en déficit
                            </p>
                            <p className="text-2xl font-bold text-orange-500">
                                {deficitDays.length}
                                <span className="text-sm font-normal text-orange-400 ml-1">
                                    / {globalChartData.length} días
                                </span>
                            </p>
                            <p className="text-xs text-orange-500 mt-1">
                                {deficitTotal.toFixed(1)} kWh acumulado
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
