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

function ConsumoPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [userRole, setUserRole] = useState(null);
    const [metrics, setMetrics] = useState({
        total_consumed_kwh: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [error, setError] = useState(null);
    const [chartType, setChartType] = useState('line');
    const [filterType, setFilterType] = useState('predefined'); // 'predefined' or 'custom'
    const [predefinedPeriod, setPredefinedPeriod] = useState(7);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const getTimePeriodLabel = (filterType, period) => {
        if (filterType === 'custom') {
            return `del ${startDate} al ${endDate}`;
        }
        switch (period) {
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

    const calculateDates = period => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - period + 1);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0],
        };
    };

    useEffect(() => {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Verificar rol del usuario
        if (userRole && userRole !== 'consumer' && userRole !== 'prosumer') {
            router.push('/dashboard');
            return;
        }

        // Cargar datos de energía
        const fetchEnergyData = async () => {
            try {
                setIsLoading(true);
                setError(null);

                let queryParams = '';
                if (filterType === 'custom' && startDate && endDate) {
                    queryParams = `start_date=${startDate}&end_date=${endDate}`;
                } else {
                    queryParams = `days=${predefinedPeriod}`;
                }

                const response = await apiRequest(`/api/energy/chart?${queryParams}`);

                if (response.user_role) {
                    setUserRole(response.user_role);
                    if (
                        response.user_role !== 'consumer' &&
                        response.user_role !== 'prosumer'
                    ) {
                        router.push('/dashboard');
                        return;
                    }
                }
                if (response.metrics) {
                    setMetrics({
                        total_consumed_kwh: response.metrics.total_consumed_kwh,
                    });
                }
                if (response.chart_data) {
                    // Filtrar solo datos de consumo
                    setChartData(
                        response.chart_data.map(item => ({
                            date:
                                item.timestamp.split('-')[2] +
                                '/' +
                                item.timestamp.split('-')[1], // DD/MM
                            consumed: item.consumed,
                        }))
                    );
                }
            } catch (err) {
                console.error('Error fetching energy data:', err);
                setError(err.message);
                // Datos de ejemplo cuando no hay conexión
                setMetrics({ total_consumed_kwh: 18.7 });
                setChartData([
                    { date: '01/01', consumed: 2.8 },
                    { date: '02/01', consumed: 3.5 },
                    { date: '03/01', consumed: 4.2 },
                    { date: '04/01', consumed: 3.1 },
                    { date: '05/01', consumed: 3.8 },
                    { date: '06/01', consumed: 2.1 },
                    { date: '07/01', consumed: 1.9 },
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchEnergyData();
    }, [router, filterType, predefinedPeriod, startDate, endDate, userRole]);

    const handleFilterTypeChange = type => {
        setFilterType(type);
        if (type === 'predefined') {
            const dates = calculateDates(predefinedPeriod);
            setStartDate(dates.start);
            setEndDate(dates.end);
        }
    };

    const handlePredefinedChange = period => {
        setPredefinedPeriod(period);
        const dates = calculateDates(period);
        setStartDate(dates.start);
        setEndDate(dates.end);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Cargando...</div>
            </div>
        );
    }

    if (!userRole || (userRole !== 'consumer' && userRole !== 'prosumer')) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">Acceso no autorizado</div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Historial de Consumo | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-8">
                    {error && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            <p className="font-semibold">Nota: Mostrando datos de ejemplo</p>
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Métrica de Consumo */}
                    <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-1">
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Energía Consumida{' '}
                                        {getTimePeriodLabel(filterType, predefinedPeriod)}
                                    </p>
                                    <p className="text-4xl font-bold mt-2">
                                        {metrics.total_consumed_kwh.toFixed(1)}{' '}
                                        <span className="text-2xl">kWh</span>
                                    </p>
                                </div>
                                <div className="bg-white/20 p-3 rounded-xl">
                                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Gráfica de Consumo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h2 className="text-xl font-bold text-slate-800">
                                Historial de Consumo de Energía
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
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                                            <rect x="2" y="10" width="4" height="12" rx="1" />
                                            <rect x="10" y="6" width="4" height="16" rx="1" />
                                            <rect x="18" y="3" width="4" height="19" rx="1" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Filter type selector */}
                                <div className="flex items-center gap-2">
                                    <label className="text-sm text-slate-600">Filtro:</label>
                                    <select
                                        className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        value={filterType}
                                        onChange={e => handleFilterTypeChange(e.target.value)}
                                    >
                                        <option value="predefined">Predefinido</option>
                                        <option value="custom">Personalizado</option>
                                    </select>
                                </div>

                                {filterType === 'predefined' ? (
                                    <select
                                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        value={predefinedPeriod}
                                        onChange={e => handlePredefinedChange(parseInt(e.target.value))}
                                    >
                                        <option value={7}>Últimos 7 Días</option>
                                        <option value={14}>Últimos 14 Días</option>
                                        <option value={30}>Últimos 30 Días</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="date"
                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            value={startDate}
                                            onChange={e => setStartDate(e.target.value)}
                                        />
                                        <span className="text-slate-500">a</span>
                                        <input
                                            type="date"
                                            className="px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                            value={endDate}
                                            onChange={e => setEndDate(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Gráfica */}
                        {chartData.length > 0 ? (
                            <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'bar' ? (
                                        <BarChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                                formatter={value => `${value.toFixed(2)} kWh`}
                                            />
                                            <Legend />
                                            <Bar dataKey="consumed" fill="#06b6d4" name="Consumo" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    ) : (
                                        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#64748b" />
                                            <YAxis stroke="#64748b" />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                                formatter={value => `${value.toFixed(2)} kWh`}
                                            />
                                            <Legend />
                                            <Line
                                                type="monotone"
                                                dataKey="consumed"
                                                stroke="#06b6d4"
                                                strokeWidth={2}
                                                dot={{ fill: '#06b6d4', r: 4 }}
                                                activeDot={{ r: 6 }}
                                                name="Consumo"
                                            />
                                        </LineChart>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                                <p className="text-slate-400 text-sm">
                                    No hay datos de consumo disponibles para el período seleccionado.
                                </p>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

export default ConsumoPage;
