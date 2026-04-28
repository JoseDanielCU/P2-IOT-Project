import Head from 'next/head';
import Link from 'next/link';
import { RegisterForm } from '../src/components/Auth';

function RegisterPage() {
    return (
        <>
            <Head>
                <title>Registro | EnergyHub</title>
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
                <main className="py-8 px-6">
                    <div className="max-w-2xl mx-auto">
                        <RegisterForm />
                    </div>
                </main>
            </div>
        </>
    );
}

export default RegisterPage;
