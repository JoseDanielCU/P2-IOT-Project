import Link from 'next/link';
import { useRouter } from 'next/router';

function Navbar() {
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/');
    };

    return (
        <nav className="bg-white border-b border-slate-200 px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">⚡</span>
                    </div>
                    <span className="text-xl font-bold text-slate-800">EnergyHub</span>
                </div>

                {/* Navigation Links */}
                <div className="flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className={`text-sm font-medium transition ${
                            router.pathname === '/dashboard'
                                ? 'text-cyan-500 border-b-2 border-cyan-500'
                                : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                        Dashboard
                    </Link>
                    <span className="text-sm font-medium text-slate-400 cursor-not-allowed">
                        Predicciones
                    </span>
                    <span className="text-sm font-medium text-slate-400 cursor-not-allowed">
                        Transacciones
                    </span>
                    <span className="text-sm font-medium text-slate-400 cursor-not-allowed">
                        Perfil
                    </span>
                </div>

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                >
                    Cerrar Sesión
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
