import { useEffect, useState } from 'react';
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
import { apiRequest } from '../src/services/api';

function ProduccionPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [energySourceType, setEnergySourceType] = useState(null);
    const [metrics, setMetrics] = useState({
        total_produced_kwh: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [days, setDays] = useState(7);
    const [error, setError] = useState(null);
    const [chartType, setChartType] = useState('line');

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
                    if (
                        response.user_role !== 'producer' &&
                        response.user_role !== 'prosumer'
                    ) {
                        router.push('/dashboard');
                        return;
                    }
                }
                if (response.energy_source_type) {
                    setEnergySourceType(response.energy_source_type);
                }
                if (response.metrics) {
                    setMetrics({
                        total_produced_kwh: response.metrics.total_produced_kwh,
                    });
                }
                if (response.chart_data) {
                    // Filtrar solo datos de producción
                    setChartData(
                        response.chart_data.map(item => ({
                            date:
                                item.timestamp.split('-')[2] +
                                '/' +
                                item.timestamp.split('-')[1], // DD/MM
                            produced: item.produced,
                        }))
                    );
                }
            } catch (err) {
                console.error('Error fetching energy data:', err);
                setError(err.message);
                // Datos de ejemplo cuando no hay conexión
                setMetrics({
                    total_produced_kwh: 25.4,
                });
                setChartData([
                    { date: '01/01', produced: 3.2 },
                    { date: '02/01', produced: 5.1 },
                    { date: '03/01', produced: 6.8 },
                    { date: '04/01', produced: 4.5 },
                    { date: '05/01', produced: 3.9 },
                    { date: '06/01', produced: 5.2 },
                    { date: '07/01', produced: 2.1 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnergyData();
    }, [router, days, userRole]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Cargando...</div>
            </div>
        );
    }

    if (!userRole || (userRole !== 'producer' && userRole !== 'prosumer')) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Acceso no autorizado</div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Historial de Producción | EnergyHub</title>
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

                    {/* Métrica de Producción */}
                    <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-1">
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
                    </div>

                    {/* Gráfica de Producción */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                Historial de Producción de Energía
                            </h2>
                            <div className="flex items-center gap-3 flex-wrap">
                                {/* Chart type switcher */}
                                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setChartType('line')}
                                        title="Gráfico de líneas"
                                        className={`p-1.5 rounded-md transition ${
                                            chartType === 'line'
                                                ? 'bg-white shadow text-lime-600'
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
                                                ? 'bg-white shadow text-lime-600'
                                                : 'text-slate-400 hover:text-slate-600'
                                        }`}
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

                                <select
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-lime-500"
                                    value={days}
                                    onChange={e => setDays(parseInt(e.target.value))}
                                >
                                    <option value={7}>Últimos 7 Días</option>
                                    <option value={14}>Últimos 14 Días</option>
                                    <option value={30}>Últimos 30 Días</option>
                                </select>
                            </div>
                        </div>

                        {/* Gráfica */}
                        {chartData.length > 0 ? (
                            <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                }}
                                                formatter={value => `${value.toFixed(2)} kWh`}
                                            />
                                            <Legend />
                                            <Bar
                                                dataKey="produced"
                                                fill="#84cc16"
                                                name="Producción"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    ) : (
                                        <LineChart
                                            data={chartData}
                                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#f8fafc',
                                                    border: '1px solid #e2e8f0',
                                                    borderRadius: '8px',
                                                }}
                                                formatter={value => `${value.toFixed(2)} kWh`}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="produced"
                                                stroke="#84cc16"
                                                strokeWidth={2}
                                                dot={{ fill: '#84cc16', r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name="Producción"
                                            />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                                <p className="text-slate-400 text-sm">
                                    No hay datos de producción disponibles para el período seleccionado.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

export default ProduccionPage;
