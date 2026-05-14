import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { HiLightningBolt, HiDownload } from 'react-icons/hi';

import { Navbar } from '../src/components/Layout';
import { apiRequest, uploadFile } from '../src/services/api';
import CommunityDashboard from '../src/components/CommunityDashboard';

function DashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [energySourceType, setEnergySourceType] = useState(null);
    const [metrics, setMetrics] = useState({
        total_produced_kwh: 0,
        total_consumed_kwh: 0,
        net_balance_kwh: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [days, setDays] = useState(7);
    const [error, setError] = useState(null);
    const [chartType, setChartType] = useState('line');
    const [isImporting, setIsImporting] = useState(false);
    const [importFeedback, setImportFeedback] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const fileInputRef = useRef(null);

    const getTimePeriodLabel = daysValue => {
        switch (daysValue) {
            case 7:
                return 'de la semana';
            case 14:
                return 'de los últimos 14 días';
            case 30:
                return 'del último mes';
            case 90:
                return 'de los últimos 90 días';
            default:
                return 'de hoy';
        }
    };

    const formatDate = dateStr => {
        const parts = dateStr.split('-');
        return parts[2] + '/' + parts[1];
    };

    const ChartTooltip = ({ active, payload, label }) => {
        if (!active || !payload?.length) return null;
        return (
            <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-sm min-w-[160px]">
                <p className="font-semibold text-slate-700 mb-2">{formatDate(label)}</p>
                {payload.map(entry => (
                    <div
                        key={entry.dataKey}
                        className="flex justify-between gap-4 text-slate-600"
                    >
                        <span style={{ color: entry.color }}>{entry.name}</span>
                        <span className="font-medium">
                            {Number(entry.value).toFixed(2)} kWh
                        </span>
                    </div>
                ))}
            </div>
        );
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const fetchEnergyData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await apiRequest(`/api/energy/chart?days=${days}`);

                if (response.user_role) setUserRole(response.user_role);
                if (response.energy_source_type)
                    setEnergySourceType(response.energy_source_type);
                if (response.metrics) setMetrics(response.metrics);
                if (response.chart_data) setChartData(response.chart_data);
            } catch (err) {
                console.error('Error fetching energy data:', err);
                setError(err.message);
                setMetrics({
                    total_produced_kwh: 25.4,
                    total_consumed_kwh: 18.7,
                    net_balance_kwh: 6.7,
                });
                setChartData([
                    { date: 'Lun', produced: 3.2, consumed: 2.8 },
                    { date: 'Mar', produced: 5.1, consumed: 3.5 },
                    { date: 'Mié', produced: 6.8, consumed: 4.2 },
                    { date: 'Jue', produced: 4.5, consumed: 3.1 },
                    { date: 'Vie', produced: 3.9, consumed: 3.8 },
                    { date: 'Sáb', produced: 5.2, consumed: 2.1 },
                    { date: 'Dom', produced: 2.1, consumed: 1.9 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnergyData();
    }, [router, days, refreshTrigger]);

    const handleExport = async () => {
        try {
            const dataToExport = {
                metrics,
                chartData,
                exportedAt: new Date().toLocaleString(),
            };
            const dataStr = JSON.stringify(dataToExport, null, 2);
            const element = document.createElement('a');
            element.setAttribute(
                'href',
                'data:text/json;charset=utf-8,' + encodeURIComponent(dataStr)
            );
            element.setAttribute('download', `energy-data-${days}days.json`);
            element.style.display = 'none';
            document.body.appendChild(element);
            element.click();
            document.body.removeChild(element);
        } catch (err) {
            console.error('Error exporting data:', err);
        }
    };

    const handleImport = async e => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';
        setIsImporting(true);
        setImportFeedback(null);
        try {
            const result = await uploadFile('/api/energy/import', file);
            setImportFeedback({ type: 'success', message: result.message });
            setRefreshTrigger(t => t + 1);
        } catch (err) {
            setImportFeedback({ type: 'error', message: err.message });
        } finally {
            setIsImporting(false);
            setTimeout(() => setImportFeedback(null), 6000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Cargando...</div>
            </div>
        );
    }

    const isNetSurplus = metrics.net_balance_kwh >= 0;

    // Etiqueta de fuente de energía
    const sourceLabel =
        {
            solar: '☀️ Solar',
            wind: '💨 Eólica',
            battery: '🔋 Batería',
        }[energySourceType] ?? energySourceType;

    // Título del panel según rol
    const chartTitle =
        {
            producer: 'Producción de Energía',
            consumer: 'Consumo de Energía',
            prosumer: 'Producción vs Consumo',
        }[userRole] ?? 'Energía';

    return (
        <>
            <Head>
                <title>Dashboard | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {/* Dashboard comunitario global */}
                    <div className="mb-8">
                        <CommunityDashboard />
                    </div>

                    {importFeedback && (
                        <div
                            className={`mb-4 p-4 rounded-lg text-sm ${
                                importFeedback.type === 'success'
                                    ? 'bg-green-50 border border-green-200 text-green-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                            }`}
                        >
                            {importFeedback.message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            <p className="font-semibold">
                                Nota: Mostrando datos de ejemplo
                            </p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* ── Panel personal ──────────────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        {/* Cabecera */}
                        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {chartTitle}
                            </h2>

                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Importar */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2 transition"
                                    title="Importar datos"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="17 8 12 3 7 8" />
                                        <line x1="12" y1="3" x2="12" y2="15" />
                                    </svg>
                                    {isImporting ? 'Importando...' : 'Importar'}
                                </button>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    accept=".csv,.json,.txt"
                                    className="hidden"
                                />

                                {/* Exportar */}
                                <button
                                    onClick={handleExport}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-sm flex items-center gap-2 transition"
                                    title="Exportar datos"
                                >
                                    <svg
                                        className="w-4 h-4"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                    >
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Exportar
                                </button>

                                {/* Switcher línea / barra */}
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
                                            <rect
                                                x="2"
                                                y="10"
                                                width="4"
                                                height="12"
                                                rx="1"
                                            />
                                            <rect
                                                x="10"
                                                y="6"
                                                width="4"
                                                height="16"
                                                rx="1"
                                            />
                                            <rect
                                                x="18"
                                                y="3"
                                                width="4"
                                                height="19"
                                                rx="1"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                {/* Selector de período */}
                                <select
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={days}
                                    onChange={e => setDays(parseInt(e.target.value))}
                                >
                                    <option value={7}>Últimos 7 días</option>
                                    <option value={14}>Últimos 14 días</option>
                                    <option value={30}>Últimos 30 días</option>
                                    <option value={90}>Últimos 90 días</option>
                                </select>
                            </div>
                        </div>

                        {/* ── KPIs — mismo estilo que CommunityDashboard ──────── */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100">
                            {/* Energía producida — siempre visible */}
                            <div className="bg-white px-5 py-5 flex items-start gap-3">
                                <span className="mt-0.5 p-1.5 rounded-lg bg-lime-50 text-lime-500 shrink-0">
                                    <HiLightningBolt className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                                        Energía producida {getTimePeriodLabel(days)}
                                    </p>
                                    <p className="text-2xl font-bold text-lime-600">
                                        {metrics.total_produced_kwh.toFixed(1)}{' '}
                                        <span className="text-base font-normal text-lime-500">
                                            kWh
                                        </span>
                                    </p>
                                    {energySourceType && (
                                        <p className="text-xs text-slate-400 mt-1">
                                            {sourceLabel}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Energía consumida — siempre visible */}
                            <div className="bg-white px-5 py-5 flex items-start gap-3">
                                <span className="mt-0.5 p-1.5 rounded-lg bg-cyan-50 text-cyan-500 shrink-0">
                                    <HiLightningBolt className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                                        Energía consumida {getTimePeriodLabel(days)}
                                    </p>
                                    <p className="text-2xl font-bold text-cyan-600">
                                        {metrics.total_consumed_kwh.toFixed(1)}{' '}
                                        <span className="text-base font-normal text-cyan-500">
                                            kWh
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Balance neto — siempre visible */}
                            <div className="bg-white px-5 py-5 flex items-start gap-3">
                                <span
                                    className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${isNetSurplus ? 'bg-lime-50 text-lime-500' : 'bg-orange-50 text-orange-500'}`}
                                >
                                    <HiDownload className="w-4 h-4" />
                                </span>
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                                        Balance neto
                                    </p>
                                    <p
                                        className={`text-2xl font-bold ${isNetSurplus ? 'text-lime-600' : 'text-orange-500'}`}
                                    >
                                        {isNetSurplus ? '+' : ''}
                                        {metrics.net_balance_kwh.toFixed(1)}{' '}
                                        <span
                                            className={`text-base font-normal ${isNetSurplus ? 'text-lime-500' : 'text-orange-400'}`}
                                        >
                                            kWh
                                        </span>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-1">
                                        {isNetSurplus
                                            ? 'Excedente del período'
                                            : 'Déficit del período'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* ── Gráfico ────────────────────────────────────────── */}
                        <div className="px-6 py-6">
                            {chartData.length > 0 ? (
                                <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        {chartType === 'bar' ? (
                                            <BarChart
                                                data={chartData}
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 0,
                                                    bottom: 5,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#e2e8f0"
                                                />
                                                <XAxis
                                                    dataKey="timestamp"
                                                    stroke="#64748b"
                                                    tickFormatter={formatDate}
                                                />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Legend />
                                                {(userRole === 'producer' ||
                                                    userRole === 'prosumer') && (
                                                    <Bar
                                                        dataKey="produced"
                                                        fill="#84cc16"
                                                        name="Producción"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                )}
                                                {(userRole === 'consumer' ||
                                                    userRole === 'prosumer') && (
                                                    <Bar
                                                        dataKey="consumed"
                                                        fill="#06b6d4"
                                                        name="Consumo"
                                                        radius={[4, 4, 0, 0]}
                                                    />
                                                )}
                                            </BarChart>
                                        ) : (
                                            <AreaChart
                                                data={chartData}
                                                margin={{
                                                    top: 5,
                                                    right: 30,
                                                    left: 0,
                                                    bottom: 5,
                                                }}
                                            >
                                                <defs>
                                                    <linearGradient
                                                        id="dashGradProd"
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
                                                        id="dashGradCons"
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
                                                />
                                                <YAxis stroke="#64748b" />
                                                <Tooltip content={<ChartTooltip />} />
                                                <Legend />
                                                {(userRole === 'producer' ||
                                                    userRole === 'prosumer') && (
                                                    <Area
                                                        type="monotone"
                                                        dataKey="produced"
                                                        stroke="#84cc16"
                                                        strokeWidth={2}
                                                        fill="url(#dashGradProd)"
                                                        dot={{ fill: '#84cc16', r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                        name="Producción"
                                                    />
                                                )}
                                                {(userRole === 'consumer' ||
                                                    userRole === 'prosumer') && (
                                                    <Area
                                                        type="monotone"
                                                        dataKey="consumed"
                                                        stroke="#06b6d4"
                                                        strokeWidth={2}
                                                        fill="url(#dashGradCons)"
                                                        dot={{ fill: '#06b6d4', r: 4 }}
                                                        activeDot={{ r: 6 }}
                                                        name="Consumo"
                                                    />
                                                )}
                                            </AreaChart>
                                        )}
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                                    <p className="text-slate-400 text-sm">
                                        Cargando gráfica...
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default DashboardPage;
