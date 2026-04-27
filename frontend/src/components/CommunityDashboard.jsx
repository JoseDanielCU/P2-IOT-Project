import { useEffect, useState } from 'react';
import { apiRequest } from '../services/api';
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
import { HiLightningBolt, HiDownload } from 'react-icons/hi';

export default function CommunityDashboard() {
    const [globalMetrics, setGlobalMetrics] = useState({
        total_produced_kwh: 0,
        total_consumed_kwh: 0,
        net_balance_kwh: 0,
    });
    const [globalChartData, setGlobalChartData] = useState([]);
    // Persistir days y chartType en localStorage
    const [days, setDaysState] = useState(() => {
        const saved = localStorage.getItem('community_days');
        return saved ? Number(saved) : 30;
    });
    const [chartType, setChartTypeState] = useState(() => {
        const saved = localStorage.getItem('community_chartType');
        return saved ? saved : 'line';
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Setters que actualizan localStorage
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
                setGlobalChartData(chart);
            } catch (err) {
                setError('No se pudieron cargar los datos globales.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [days]);

    // Fechas para el eje X
    const formatDate = dateStr => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-CO', { month: '2-digit', day: '2-digit' });
    };

    if (loading)
        return (
            <div className="min-h-[200px] flex items-center justify-center text-slate-600">
                Cargando métricas globales...
            </div>
        );
    if (error)
        return (
            <div className="min-h-[200px] flex items-center justify-center text-red-600">
                {error}
            </div>
        );

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mt-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <h2 className="text-xl font-bold text-slate-800">
                    Métricas Comunitarias Globales
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
                                <rect x="2" y="10" width="4" height="12" rx="1" />
                                <rect x="10" y="6" width="4" height="16" rx="1" />
                                <rect x="18" y="3" width="4" height="19" rx="1" />
                            </svg>
                        </button>
                    </div>
                    <select
                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        value={days}
                        onChange={e => setDays(Number(e.target.value))}
                    >
                        <option value={7}>Últimos 7 Días</option>
                        <option value={14}>Últimos 14 Días</option>
                        <option value={30}>Últimos 30 Días</option>
                        <option value={90}>Últimos 90 Días</option>
                    </select>
                </div>
            </div>
            <div className="grid gap-6 mb-8 grid-cols-1 md:grid-cols-3">
                <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition flex items-center justify-between relative">
                    <div>
                        <p className="text-sm font-medium opacity-90">
                            Energía Producida del período
                        </p>
                        <p className="text-4xl font-bold mt-2">
                            {globalMetrics.total_produced_kwh?.toFixed(1)}{' '}
                            <span className="text-2xl">kWh</span>
                        </p>
                    </div>
                    <span className="absolute top-4 right-4 text-4xl opacity-30">
                        <HiLightningBolt />
                    </span>
                </div>
                <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition flex items-center justify-between relative">
                    <div>
                        <p className="text-sm font-medium opacity-90">
                            Energía Consumida del período
                        </p>
                        <p className="text-4xl font-bold mt-2">
                            {globalMetrics.total_consumed_kwh?.toFixed(1)}{' '}
                            <span className="text-2xl">kWh</span>
                        </p>
                    </div>
                    <span className="absolute top-4 right-4 text-4xl opacity-30">
                        <HiLightningBolt />
                    </span>
                </div>
                <div
                    className={`bg-gradient-to-br rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition flex items-center justify-between relative ${globalMetrics.net_balance_kwh >= 0 ? 'from-lime-400 to-lime-500' : 'from-orange-400 to-orange-500'}`}
                >
                    <div>
                        <p className="text-sm font-medium opacity-90">Balance Neto</p>
                        <p className="text-4xl font-bold mt-2">
                            {globalMetrics.net_balance_kwh >= 0 ? '+' : ''}
                            {globalMetrics.net_balance_kwh?.toFixed(1)}{' '}
                            <span className="text-2xl">kWh</span>
                        </p>
                    </div>
                    <span className="absolute top-4 right-4 text-4xl opacity-30">
                        <HiDownload />
                    </span>
                </div>
            </div>
            <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'bar' ? (
                        <BarChart
                            data={globalChartData}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                stroke="#64748b"
                                tickFormatter={formatDate}
                            />
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
                            <Bar
                                dataKey="consumed"
                                fill="#06b6d4"
                                name="Consumo"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    ) : (
                        <LineChart
                            data={globalChartData}
                            margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis
                                dataKey="timestamp"
                                stroke="#64748b"
                                tickFormatter={formatDate}
                            />
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
        </div>
    );
}
