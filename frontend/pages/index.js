import Head from 'next/head';
import Link from 'next/link';

function HomePage() {
    return (
        <>
            <Head>
                <title>EnergyHub | Comunidad Energética</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">⚡</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">
                                EnergyHub
                            </span>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main
                    className="flex items-center justify-center px-6"
                    style={{ minHeight: 'calc(100vh - 73px)' }}
                >
                    <div className="w-full max-w-2xl">
                        {/* Hero Section */}
                        <div className="text-center mb-12">
                            <h1 className="text-5xl font-bold text-slate-800 mb-4">
                                Comunidad Energética
                            </h1>
                            <p className="text-xl text-slate-600 mb-2">
                                Monitorea, gestiona y comercializa tu energía
                            </p>
                            <p className="text-slate-500">
                                Plataforma web para comunidades energéticas sostenibles
                            </p>
                        </div>

                        {/* Cards Grid */}
                        <div className="grid md:grid-cols-2 gap-6 mb-8">
                            {/* Register Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                                    <svg
                                        className="w-6 h-6 text-emerald-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    Crear Cuenta
                                </h3>
                                <p className="text-slate-600 mb-6">
                                    Únete a la comunidad energética y empieza a
                                    monitorear tu producción y consumo.
                                </p>
                                <Link
                                    href="/register"
                                    className="inline-flex items-center justify-center w-full rounded-lg bg-emerald-500 px-5 py-3 text-white font-semibold hover:bg-emerald-600 transition"
                                >
                                    Registrarse
                                </Link>
                            </div>

                            {/* Login Card */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition">
                                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4">
                                    <svg
                                        className="w-6 h-6 text-cyan-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">
                                    Iniciar Sesión
                                </h3>
                                <p className="text-slate-600 mb-6">
                                    ¿Ya tienes una cuenta? Accede a tu dashboard y
                                    gestiona tu energía.
                                </p>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center justify-center w-full rounded-lg bg-cyan-500 px-5 py-3 text-white font-semibold hover:bg-cyan-600 transition"
                                >
                                    Iniciar Sesión
                                </Link>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                            <div className="grid md:grid-cols-3 gap-6 text-center">
                                <div>
                                    <div className="text-3xl mb-2">📊</div>
                                    <h4 className="font-semibold text-slate-800 mb-1">
                                        Monitoreo
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        Producción y consumo en tiempo real
                                    </p>
                                </div>
                                <div>
                                    <div className="text-3xl mb-2">💱</div>
                                    <h4 className="font-semibold text-slate-800 mb-1">
                                        Trading
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        Comercializa tu energía excedente
                                    </p>
                                </div>
                                <div>
                                    <div className="text-3xl mb-2">🤖</div>
                                    <h4 className="font-semibold text-slate-800 mb-1">
                                        Predicciones
                                    </h4>
                                    <p className="text-sm text-slate-600">
                                        IA para pronósticos energéticos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default HomePage;
