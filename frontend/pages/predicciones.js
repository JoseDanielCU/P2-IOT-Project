import { useEffect, useState, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
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

// Opciones de horizonte disponibles para el selector (HU-IA-05)
const HORIZON_OPTIONS = [
    { value: 7,  label: 'Próximos 7 días' },
    { value: 14, label: 'Próximos 14 días' },
    { value: 30, label: 'Próximos 30 días' },
];

function PrediccionesPage() {
    const router = useRouter();

    const [horizon, setHorizon] = useState(7);
    const [forecastData, setForecastData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null);

    // Carga el rol del usuario una sola vez al montar
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        apiRequest('/api/energy/metrics/today')
            .then(data => setUserRole(data.user_role ?? null))
            .catch(() => setUserRole(null));
    }, [router]);

    // Consulta el endpoint de predicción
    const fetchForecast = useCallback(async (selectedHorizon) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiRequest(
                `/api/forecasting/predict?horizon=${selectedHorizon}`
            );
            setForecastData(
                (data.forecast ?? []).map(point => ({
                    date: point.date,
                    produced: point.predicted_produced_kwh,
                    consumed: point.predicted_consumed_kwh,
                }))
            );
        } catch (err) {
            setError(err.message);
            setForecastData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Actualización dinámica al cambiar el horizonte (< 2 s por HU-IA-05)
    useEffect(() => {
        fetchForecast(horizon);
    }, [horizon, fetchForecast]);

    const handleHorizonChange = (e) => {
        setHorizon(parseInt(e.target.value, 10));
    };

    return (
        <>
            <Head>
                <title>Predicciones | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">
                            Predicciones energéticas
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Proyección de producción y consumo basada en tu historial.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        {/* Barra superior con selector de horizonte */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                            <h2 className="text-lg font-semibold text-slate-800">
                                Horizonte de predicción
                            </h2>

                            {/* Selector de periodo — HU-IA-05 */}
                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="horizon-select"
                                    className="text-sm text-slate-600 whitespace-nowrap"
                                >
                                    Seleccionar periodo:
                                </label>
                                <select
                                    id="horizon-select"
                                    value={horizon}
                                    onChange={handleHorizonChange}
                                    className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                >
                                    {HORIZON_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {isLoading && (
                            <div className="h-80 flex items-center justify-center">
                                <p className="text-slate-400 text-sm animate-pulse">
                                    Calculando predicciones…
                                </p>
                            </div>
                        )}

                        {!isLoading && error && (
                            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Gráfica de predicción */}
                        {!isLoading && !error && forecastData.length > 0 && (
                            <div className="w-full h-80 bg-slate-50 rounded-xl p-4">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={forecastData}
                                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                        <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
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

                                        {(userRole === 'producer' || userRole === 'prosumer' || !userRole) && (
                                            <Line
                                                type="monotone"
                                                dataKey="produced"
                                                stroke="#84cc16"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={{ fill: '#84cc16', r: 3 }}
                                                activeDot={{ r: 5 }}
                                                name="Producción predicha"
                                            />
                                        )}

                                        {(userRole === 'consumer' || userRole === 'prosumer' || !userRole) && (
                                            <Line
                                                type="monotone"
                                                dataKey="consumed"
                                                stroke="#06b6d4"
                                                strokeWidth={2}
                                                strokeDasharray="5 5"
                                                dot={{ fill: '#06b6d4', r: 3 }}
                                                activeDot={{ r: 5 }}
                                                name="Consumo predicho"
                                            />
                                        )}
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {!isLoading && !error && forecastData.length === 0 && (
                            <div className="h-80 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                                <p className="text-slate-400 text-sm text-center px-4">
                                    No hay suficientes datos históricos para generar predicciones.
                                    <br />
                                    Importa registros de energía desde el Dashboard.
                                </p>
                            </div>
                        )}

                        {!isLoading && forecastData.length > 0 && (
                            <p className="mt-4 text-xs text-slate-400">
                                Las predicciones se calculan mediante regresión lineal sobre
                                los últimos 90 días de historial. Las líneas punteadas indican valores proyectados.
                            </p>
                        )}
                    </div>

                    {/* Tabla de valores predichos */}
                    {!isLoading && forecastData.length > 0 && (
                        <div className="mt-6 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-slate-100">
                                <h3 className="text-base font-semibold text-slate-800">
                                    Detalle por día
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-6 py-3 text-left font-medium">Fecha</th>
                                            {(userRole === 'producer' || userRole === 'prosumer' || !userRole) && (
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Producción predicha (kWh)
                                                </th>
                                            )}
                                            {(userRole === 'consumer' || userRole === 'prosumer' || !userRole) && (
                                                <th className="px-6 py-3 text-right font-medium">
                                                    Consumo predicho (kWh)
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {forecastData.map(point => (
                                            <tr key={point.date} className="hover:bg-slate-50">
                                                <td className="px-6 py-3 text-slate-700">{point.date}</td>
                                                {(userRole === 'producer' || userRole === 'prosumer' || !userRole) && (
                                                    <td className="px-6 py-3 text-right text-lime-600 font-medium">
                                                        {point.produced.toFixed(3)}
                                                    </td>
                                                )}
                                                {(userRole === 'consumer' || userRole === 'prosumer' || !userRole) && (
                                                    <td className="px-6 py-3 text-right text-cyan-600 font-medium">
                                                        {point.consumed.toFixed(3)}
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default PrediccionesPage;
