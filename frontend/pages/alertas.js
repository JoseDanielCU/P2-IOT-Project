import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar } from '../src/components/Layout';
import { apiRequest } from '../src/services/api';

// Etiquetas legibles para cada tipo de alerta
const ALERT_LABELS = {
    production_high: 'Producción alta',
    production_low: 'Producción baja',
    consumption_high: 'Consumo alto',
    consumption_low: 'Consumo bajo',
    balance_low: 'Balance neto bajo',
};

const ALERT_DESCRIPTIONS = {
    production_high: 'Se activa cuando la producción del día supera el umbral.',
    production_low: 'Se activa cuando la producción del día cae por debajo del umbral.',
    consumption_high: 'Se activa cuando el consumo del día supera el umbral.',
    consumption_low: 'Se activa cuando el consumo del día cae por debajo del umbral.',
    balance_low:
        'Se activa cuando el balance neto cae por debajo del umbral (puede ser negativo).',
};

// Valores por defecto cuando el usuario no ha configurado alertas aún
const DEFAULT_CONFIGS = [
    { alert_type: 'production_high', threshold_kwh: 10, is_enabled: false },
    { alert_type: 'production_low', threshold_kwh: 1, is_enabled: false },
    { alert_type: 'consumption_high', threshold_kwh: 10, is_enabled: false },
    { alert_type: 'consumption_low', threshold_kwh: 1, is_enabled: false },
    { alert_type: 'balance_low', threshold_kwh: 0, is_enabled: false },
];

function AlertasPage() {
    const router = useRouter();

    const [configs, setConfigs] = useState(DEFAULT_CONFIGS);
    const [triggeredAlerts, setTriggeredAlerts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [saveFeedback, setSaveFeedback] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }

        const initialize = async () => {
            setIsLoading(true);
            try {
                const saved = await apiRequest('/api/alerts/');
                if (saved.length > 0) {
                    const savedByType = Object.fromEntries(
                        saved.map(c => [c.alert_type, c])
                    );
                    const merged = DEFAULT_CONFIGS.map(def =>
                        savedByType[def.alert_type]
                            ? {
                                  alert_type: savedByType[def.alert_type].alert_type,
                                  threshold_kwh:
                                      savedByType[def.alert_type].threshold_kwh,
                                  is_enabled: savedByType[def.alert_type].is_enabled,
                              }
                            : def
                    );
                    setConfigs(merged);
                }
                await refreshTriggered();
            } catch (err) {
                console.error('Error al cargar alertas:', err);
            } finally {
                setIsLoading(false);
            }
        };

        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [router]);

    const refreshTriggered = async () => {
        try {
            const result = await apiRequest('/api/alerts/check');
            setTriggeredAlerts(result.triggered_alerts || []);
        } catch (err) {
            console.error('Error al verificar alertas activas:', err);
        }
    };

    const handleThresholdChange = (alertType, value) => {
        setConfigs(prev =>
            prev.map(c =>
                c.alert_type === alertType
                    ? { ...c, threshold_kwh: parseFloat(value) || 0 }
                    : c
            )
        );
    };

    const handleToggle = alertType => {
        setConfigs(prev =>
            prev.map(c =>
                c.alert_type === alertType ? { ...c, is_enabled: !c.is_enabled } : c
            )
        );
    };

    const handleSave = async () => {
        setIsSaving(true);
        setSaveFeedback(null);
        try {
            await apiRequest('/api/alerts/', {
                method: 'PUT',
                body: JSON.stringify({ configs }),
            });
            setSaveFeedback({
                type: 'success',
                message: 'Preferencias guardadas correctamente.',
            });
            await refreshTriggered();
        } catch (err) {
            setSaveFeedback({ type: 'error', message: err.message });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveFeedback(null), 5000);
        }
    };

    const handleCheckNow = async () => {
        setIsChecking(true);
        await refreshTriggered();
        setIsChecking(false);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-slate-600">
                    Cargando configuración de alertas...
                </div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Alertas | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-3xl mx-auto px-6 py-8">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-slate-800">
                            Configuración de alertas
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Define los umbrales energéticos para recibir solo las
                            notificaciones relevantes.
                        </p>
                    </div>

                    {/* Alertas actualmente disparadas */}
                    {triggeredAlerts.length > 0 && (
                        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5">
                            <h2 className="text-base font-semibold text-amber-800 mb-3">
                                Alertas activas ahora ({triggeredAlerts.length})
                            </h2>
                            <ul className="space-y-2">
                                {triggeredAlerts.map(alert => (
                                    <li
                                        key={alert.alert_type}
                                        className="flex items-start gap-2 text-sm text-amber-700"
                                    >
                                        <span className="mt-0.5">⚠️</span>
                                        <span>{alert.message}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {triggeredAlerts.length === 0 && (
                        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-sm text-emerald-700">
                            ✅ Ninguna alerta disparada con los datos de hoy.
                        </div>
                    )}

                    {/* Tarjetas de configuración */}
                    <div className="space-y-4">
                        {configs.map(config => (
                            <div
                                key={config.alert_type}
                                className={`bg-white rounded-2xl border p-5 shadow-sm transition ${
                                    config.is_enabled
                                        ? 'border-cyan-200'
                                        : 'border-slate-200 opacity-70'
                                }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <h3 className="text-base font-semibold text-slate-800">
                                            {ALERT_LABELS[config.alert_type]}
                                        </h3>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            {ALERT_DESCRIPTIONS[config.alert_type]}
                                        </p>
                                    </div>

                                    {/* Toggle activar/desactivar */}
                                    <button
                                        onClick={() => handleToggle(config.alert_type)}
                                        aria-label={
                                            config.is_enabled
                                                ? 'Desactivar alerta'
                                                : 'Activar alerta'
                                        }
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
                                            config.is_enabled
                                                ? 'bg-cyan-500'
                                                : 'bg-slate-300'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition duration-200 ${
                                                config.is_enabled
                                                    ? 'translate-x-5'
                                                    : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Campo de umbral */}
                                {config.is_enabled && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <label
                                            htmlFor={`threshold-${config.alert_type}`}
                                            className="text-sm text-slate-600 whitespace-nowrap"
                                        >
                                            Umbral:
                                        </label>
                                        <input
                                            id={`threshold-${config.alert_type}`}
                                            type="number"
                                            step="0.1"
                                            value={config.threshold_kwh}
                                            onChange={e =>
                                                handleThresholdChange(
                                                    config.alert_type,
                                                    e.target.value
                                                )
                                            }
                                            className="w-32 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                        />
                                        <span className="text-sm text-slate-500">
                                            kWh
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Acciones */}
                    <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-6 py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isSaving ? 'Guardando…' : 'Guardar preferencias'}
                        </button>

                        <button
                            onClick={handleCheckNow}
                            disabled={isChecking}
                            className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition disabled:opacity-50"
                        >
                            {isChecking ? 'Verificando…' : 'Verificar alertas ahora'}
                        </button>
                    </div>

                    {saveFeedback && (
                        <div
                            className={`mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
                                saveFeedback.type === 'success'
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                                    : 'bg-red-50 border border-red-200 text-red-800'
                            }`}
                        >
                            {saveFeedback.message}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}

export default AlertasPage;
