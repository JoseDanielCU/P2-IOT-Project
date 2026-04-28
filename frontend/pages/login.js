import Head from 'next/head';
import Link from 'next/link';
import { LoginForm } from '../src/components/Auth';

function LoginPage() {
    return (
        <>
            <Head>
                <title>Iniciar Sesión | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-6 py-4">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">⚡</span>
                            </div>
                            <span className="text-xl font-bold text-slate-800">
                                EnergyHub
                            </span>
                        </Link>
                    </div>
                </header>

                {/* Main Content */}
                <main
                    className="flex items-center justify-center px-6"
                    style={{ minHeight: 'calc(100vh - 73px)' }}
                >
                    <LoginForm />
                </main>
            </div>
        </>
    );
}

export default LoginPage;
