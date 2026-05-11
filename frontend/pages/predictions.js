import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Navbar } from '../src/components/Layout';
import PredictionForecast from '../src/components/PredictionForecast';

function PredictionsPage() {
    const router = useRouter();

    useEffect(() => {
        // Verificar si el usuario está autenticado
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <>
            <Head>
                <title>Predicciones | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-7xl mx-auto px-6 py-8">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-slate-800">
                            🔮 Pronóstico de Consumo Energético
                        </h1>
                        <p className="text-slate-600 mt-2">
                            Visualiza predicciones de tu consumo y producción futura
                            para planificar mejor tu uso energético.
                        </p>
                    </div>

                    <PredictionForecast />
                </main>
            </div>
        </>
    );
}

export default PredictionsPage;
