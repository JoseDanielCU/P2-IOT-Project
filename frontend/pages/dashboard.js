import { useEffect, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Navbar } from '../src/components/Layout';
import { apiRequest, uploadFile } from '../src/services/api';

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
            default:
                return 'de hoy';
        }
    };

    useEffect(() => {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Cargar datos de energía
        const fetchEnergyData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                const response = await apiRequest(`/api/energy/chart?days=${days}`);

                if (response.user_role) {
                    setUserRole(response.user_role);
                }
                if (response.energy_source_type) {
                    setEnergySourceType(response.energy_source_type);
                }
                if (response.metrics) {
                    setMetrics(response.metrics);
                }
                if (response.chart_data) {
                    setChartData(response.chart_data);
                }
            } catch (err) {
                console.error('Error fetching energy data:', err);
                setError(err.message);
                // Datos de ejemplo cuando no hay conexión
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
                    { date: 'Vie', processed: 3.9, consumed: 3.8 },
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

    return (
        <>
            <Head>
                <title>Dashboard | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            <p className="font-semibold">
                                Nota: Mostrando datos de ejemplo
                            </p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Métricas superiores */}
                    <div
                        className={`grid gap-6 mb-8 ${
                            userRole === 'prosumer'
                                ? 'grid-cols-1 md:grid-cols-3'
                                : 'grid-cols-1 md:grid-cols-2'
                        }`}
                    >
                        {/* Energía Producida - Se muestra para producer y prosumer */}
                        {(userRole === 'producer' || userRole === 'prosumer') && (
                            <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <p className="text-sm font-medium opacity-90">
                                            Energía Producida {getTimePeriodLabel(days)}
                                        </p>
                                        {energySourceType && (
                                            <p className="text-xs font-semibold opacity-75 mt-1 capitalize">
                                                Fuente:{' '}
                                                {energySourceType === 'solar'
                                                    ? '☀️ Solar'
                                                    : energySourceType === 'wind'
                                                      ? '💨 Eólica'
                                                      : energySourceType === 'battery'
                                                        ? '🔋 Batería'
                                                        : energySourceType}
                                            </p>
                                        )}
                                        <p className="text-4xl font-bold mt-2">
                                            {metrics.total_produced_kwh.toFixed(1)}{' '}
                                            <span className="text-2xl">kWh</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <svg
                                            className="w-8 h-8"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Energía Consumida - Se muestra para consumer y prosumer */}
                        {(userRole === 'consumer' || userRole === 'prosumer') && (
                            <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-medium opacity-90">
                                            Energía Consumida {getTimePeriodLabel(days)}
                                        </p>
                                        <p className="text-4xl font-bold mt-2">
                                            {metrics.total_consumed_kwh.toFixed(1)}{' '}
                                            <span className="text-2xl">kWh</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/20 p-3 rounded-xl">
                                        <svg
                                            className="w-8 h-8"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Balance Neto - Se muestra solo para prosumer */}
                        {userRole === 'prosumer' && (
                            <div
                                className={`bg-gradient-to-br rounded-2xl p-6 text-slate-800 shadow-lg hover:shadow-xl transition ${
                                    metrics.net_balance_kwh >= 0
                                        ? 'from-lime-300 to-lime-400'
                                        : 'from-orange-300 to-orange-400'
                                }`}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-semibold opacity-90">
                                            Balance Neto
                                        </p>
                                        <p className="text-4xl font-bold mt-2">
                                            {metrics.net_balance_kwh >= 0 ? '+' : ''}
                                            {metrics.net_balance_kwh.toFixed(1)}{' '}
                                            <span className="text-2xl">kWh</span>
                                        </p>
                                    </div>
                                    <div className="bg-white/40 p-3 rounded-xl">
                                        <svg
                                            className="w-8 h-8"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path
                                                fillRule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
                                                clipRule="evenodd"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Gráfica de Producción vs Consumo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                {userRole === 'producer' && 'Producción de Energía'}
                                {userRole === 'consumer' && 'Consumo de Energía'}
                                {userRole === 'prosumer' && 'Producción vs Consumo'}
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Chart type switcher */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setChartType('line')}
                                        title="Gráfico de líneas"
                                        className={`p-1.5 rounded-md transition ${
                                            chartType === 'line'
                                                ? 'bg-white shadow text-cyan-600'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
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
                                        className={`p-1.5 rounded-md transition ${
                                            chartType === 'bar'
                                                ? 'bg-white shadow text-cyan-600'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
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

                                <select
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                    value={days}
                                    onChange={e => setDays(parseInt(e.target.value))}
                                >
                                    <option value={7}>Últimos 7 Días</option>
                                    <option value={14}>Últimos 14 Días</option>
                                    <option value={30}>Últimos 30 Días</option>
                                </select>

                                {/* Import */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,.xlsx,.json,.txt"
                                    onChange={handleImport}
                                    className="hidden"
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isImporting}
                                    className="px-4 py-2 bg-lime-500 text-white rounded-lg text-sm font-medium hover:bg-lime-600 transition disabled:opacity-50"
                                >
                                    {isImporting ? 'Importando…' : 'Importar Datos'}
                                </button>

                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition"
                                >
                                    Exportar Datos
                                </button>
                            </div>
                        </div>

                        {/* Import feedback banner */}
                        {importFeedback && (
                            <div
                                className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${
                                    importFeedback.type === 'success'
                                        ? 'bg-lime-50 border border-lime-200 text-lime-800'
                                        : 'bg-red-50 border border-red-200 text-red-800'
                                }`}
                            >
                                {importFeedback.message}
                            </div>
                        )}

                        {/* Gráfica */}
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
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                }}
                                                formatter={value =>
                                                    `${value.toFixed(2)} kWh`
                                                }
                                            />
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
                                        <LineChart
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
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                }}
                                                formatter={value =>
                                                    `${value.toFixed(2)} kWh`
                                                }
                                            />
                                            <Legend />
                                            {(userRole === 'producer' ||
                                                userRole === 'prosumer') && (
                                                <Line
                                                    type="monotone"
                                                    dataKey="produced"
                                                    stroke="#84cc16"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#84cc16', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                    name="Producción"
                                                />
                                            )}
                                            {(userRole === 'consumer' ||
                                                userRole === 'prosumer') && (
                                                <Line
                                                    type="monotone"
                                                    dataKey="consumed"
                                                    stroke="#06b6d4"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#06b6d4', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                    name="Consumo"
                                                />
                                            )}
                                        </LineChart>
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
                </main>
            </div>
        </>
    );
}

export default DashboardPage;
