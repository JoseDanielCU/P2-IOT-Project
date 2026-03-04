import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar } from '../src/components/Layout';

function DashboardPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        setIsLoading(false);
    }, [router]);

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
                    {/* Métricas superiores */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {/* Energía Producida Hoy */}
                        <div className="bg-gradient-to-br from-lime-400 to-lime-500 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Energía Producida Hoy
                                    </p>
                                    <p className="text-4xl font-bold mt-2">
                                        25.4 <span className="text-2xl">kWh</span>
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

                        {/* Energía Consumida Hoy */}
                        <div className="bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-medium opacity-90">
                                        Energía Consumida Hoy
                                    </p>
                                    <p className="text-4xl font-bold mt-2">
                                        18.7 <span className="text-2xl">kWh</span>
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

                        {/* Balance Neto */}
                        <div className="bg-gradient-to-br from-lime-300 to-lime-400 rounded-2xl p-6 text-slate-800 shadow-lg">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-semibold opacity-90">
                                        Balance Neto
                                    </p>
                                    <p className="text-4xl font-bold mt-2">
                                        +6.7 <span className="text-2xl">kWh</span>
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
                    </div>

                    {/* Gráfica de Producción vs Consumo */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800">
                                Producción vs Consumo
                            </h2>
                            <div className="flex items-center gap-4">
                                <select className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500">
                                    <option>Últimos 7 Días</option>
                                    <option>Últimos 30 Días</option>
                                    <option>Este Año</option>
                                </select>
                                <button className="px-4 py-2 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600 transition">
                                    Exportar Datos
                                </button>
                            </div>
                        </div>

                        {/* Placeholder para gráfica */}
                        <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-200">
                            <p className="text-slate-400 text-sm">
                                Gráfica de Producción vs Consumo (Próximamente)
                            </p>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default DashboardPage;
