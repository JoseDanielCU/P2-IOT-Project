import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ComposedChart,
} from 'recharts';
import { apiRequest } from '../services/api';

/**
 * Componente para visualizar predicciones de consumo energético
 * Muestra datos históricos reales vs predicciones futuras
 */
function PredictionForecast({ currentUser }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [forecastData, setForecastData] = useState(null);
    const [forecastDays, setForecastDays] = useState(7);
    const [historicalDays, setHistoricalDays] = useState(7);
    const [combinedChartData, setCombinedChartData] = useState([]);

    // Cargar datos de predicción
    useEffect(() => {
        const fetchForecast = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiRequest(
                    `/api/energy/predictions/detailed?forecast_days=${forecastDays}&historical_days=${historicalDays}`
                );

                setForecastData(response);

                // Combinar datos históricos y predicciones para el gráfico
                const chartData = [];

                if (response.historical_data) {
                    response.historical_data.forEach((point, index) => {
                        const isLast = index === response.historical_data.length - 1;
                        chartData.push({
                            timestamp: point.timestamp,
                            consumed: point.consumed,
                            produced: point.produced,
                            predictedConsumed: isLast ? point.consumed : null,
                            predictedProduced: isLast ? point.produced : null,
                            isHistorical: true,
                        });
                    });
                }

                if (response.predictions) {
                    response.predictions.forEach(point => {
                        chartData.push({
                            timestamp: point.timestamp,
                            consumed: null,
                            produced: null,
                            predictedConsumed: point.predicted_consumed,
                            predictedProduced: point.predicted_produced,
                            isHistorical: false,
                        });
                    });
                }

                setCombinedChartData(chartData);
            } catch (err) {
                console.error('Error fetching forecast:', err);
                setError(err.message || 'Error al cargar predicciones');
            } finally {
                setLoading(false);
            }
        };

        fetchForecast();
    }, [forecastDays, historicalDays]);

    // Tooltip personalizado para mostrar si es dato real o predicción
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isHistorical = data.isHistorical;

            return (
                <div className="bg-white p-3 border border-gray-300 rounded shadow-lg">
                    <p className="font-semibold text-gray-800">{data.timestamp}</p>
                    {isHistorical ? (
                        <>
                            <p className="text-blue-600">
                                Consumo Real: {data.consumed?.toFixed(2)} kWh
                            </p>
                            <p className="text-green-600">
                                Producción Real: {data.produced?.toFixed(2)} kWh
                            </p>
                            <p className="text-xs text-gray-500 font-bold mt-1">
                                [DATO REAL]
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-blue-400">
                                Consumo Predicho: {data.predictedConsumed?.toFixed(2)}{' '}
                                kWh
                            </p>
                            <p className="text-green-400">
                                Producción Predicha:{' '}
                                {data.predictedProduced?.toFixed(2)} kWh
                            </p>
                            <p className="text-xs text-gray-500 font-bold mt-1">
                                [PREDICCIÓN]
                            </p>
                        </>
                    )}
                </div>
            );
        }
        return null;
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-center items-center h-96">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Cargando predicciones...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="bg-red-50 border border-red-200 rounded p-4">
                    <h3 className="text-red-800 font-semibold mb-2">
                        Error al cargar predicciones
                    </h3>
                    <p className="text-red-700">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    📊 Pronóstico de Energía
                </h2>

                {/* Controles de período */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Días históricos a mostrar
                        </label>
                        <select
                            value={historicalDays}
                            onChange={e => setHistoricalDays(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value={7}>Última semana (7 días)</option>
                            <option value={14}>Últimas 2 semanas (14 días)</option>
                            <option value={30}>Último mes (30 días)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Días a predecir
                        </label>
                        <select
                            value={forecastDays}
                            onChange={e => setForecastDays(parseInt(e.target.value))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value={7}>Próxima semana (7 días)</option>
                            <option value={14}>Próximos 14 días</option>
                            <option value={30}>Próximos 30 días</option>
                        </select>
                    </div>
                </div>

                {/* Gráfico combinado */}
                <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Consumo y Producción: Real vs Predicho
                    </h3>
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={combinedChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                                dataKey="timestamp"
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                label={{
                                    value: 'kWh',
                                    angle: -90,
                                    position: 'insideLeft',
                                }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend />

                            {/* Líneas para datos reales */}
                            <Line
                                type="monotone"
                                dataKey="consumed"
                                stroke="#2563eb"
                                name="Consumo Real"
                                strokeWidth={2}
                                dot={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="produced"
                                stroke="#22c55e"
                                name="Producción Real"
                                strokeWidth={2}
                                dot={false}
                                connectNulls={false}
                            />

                            {/* Líneas punteadas para predicciones */}
                            <Line
                                type="monotone"
                                dataKey="predictedConsumed"
                                stroke="#60a5fa"
                                name="Consumo Predicho"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                connectNulls={false}
                            />
                            <Line
                                type="monotone"
                                dataKey="predictedProduced"
                                stroke="#86efac"
                                name="Producción Predicha"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={false}
                                connectNulls={false}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>

                    {/* Leyenda de diferenciación */}
                    <div className="mt-4 text-sm text-gray-600">
                        <p className="mb-2">
                            <span className="inline-block w-8 h-1 bg-blue-600 mr-2"></span>
                            <span className="inline-block w-8 h-1 bg-green-600 mr-4"></span>
                            = Datos reales
                        </p>
                        <p>
                            <span
                                className="inline-block w-8 h-1 bg-blue-400 mr-2"
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(to right, #60a5fa 0px, #60a5fa 2px, transparent 2px, transparent 5px)',
                                }}
                            ></span>
                            <span
                                className="inline-block w-8 h-1 mr-4"
                                style={{
                                    backgroundImage:
                                        'repeating-linear-gradient(to right, #86efac 0px, #86efac 2px, transparent 2px, transparent 5px)',
                                }}
                            ></span>
                            = Datos predichos
                        </p>
                    </div>
                </div>

                {/* Métricas comparativas */}
                {forecastData?.metrics && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 mb-3">
                                📈 Período Histórico (
                                {forecastData.metrics.historical_period_days} días)
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-700">
                                    Producción total:{' '}
                                    <span className="font-semibold text-green-600">
                                        {forecastData.metrics.historical_total_produced_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                                <p className="text-gray-700">
                                    Consumo total:{' '}
                                    <span className="font-semibold text-blue-600">
                                        {forecastData.metrics.historical_total_consumed_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                                <p className="text-gray-700">
                                    Balance neto:{' '}
                                    <span
                                        className={`font-semibold ${
                                            forecastData.metrics
                                                .historical_net_balance_kwh >= 0
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                        }`}
                                    >
                                        {forecastData.metrics.historical_net_balance_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                            <h4 className="font-semibold text-yellow-900 mb-3">
                                🔮 Período Predicho (
                                {forecastData.metrics.forecast_period_days} días)
                            </h4>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-700">
                                    Producción estimada:{' '}
                                    <span className="font-semibold text-green-400">
                                        {forecastData.metrics.predicted_total_produced_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                                <p className="text-gray-700">
                                    Consumo estimado:{' '}
                                    <span className="font-semibold text-blue-400">
                                        {forecastData.metrics.predicted_total_consumed_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                                <p className="text-gray-700">
                                    Balance estimado:{' '}
                                    <span
                                        className={`font-semibold ${
                                            forecastData.metrics
                                                .predicted_net_balance_kwh >= 0
                                                ? 'text-green-400'
                                                : 'text-red-400'
                                        }`}
                                    >
                                        {forecastData.metrics.predicted_net_balance_kwh?.toFixed(
                                            2
                                        )}{' '}
                                        kWh
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Información adicional */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="font-semibold mb-2">
                        ℹ️ Información sobre predicciones:
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                        <li>
                            Las predicciones son generadas por inteligencia artificial
                            (GPT-4o)
                        </li>
                        <li>
                            El modelo analiza patrones históricos de consumo y
                            producción
                        </li>
                        <li>Las predicciones se actualizan automáticamente</li>
                        <li>Utiliza datos históricos recientes para mayor precisión</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default PredictionForecast;
