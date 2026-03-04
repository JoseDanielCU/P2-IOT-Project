import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { loginUser } from '../../services/authService';

function LoginForm() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [fieldErrors, setFieldErrors] = useState({});
    const [globalMessage, setGlobalMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = event => {
        const { name, value } = event.target;
        setFormData(currentFormData => ({
            ...currentFormData,
            [name]: value,
        }));
        setFieldErrors(currentErrors => ({
            ...currentErrors,
            [name]: '',
        }));
    };

    const handleSubmit = async event => {
        event.preventDefault();

        // Validación básica
        const validationErrors = {};
        if (!formData.email.trim()) {
            validationErrors.email = 'El correo es obligatorio';
        }
        if (!formData.password) {
            validationErrors.password = 'La contraseña es obligatoria';
        }

        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setGlobalMessage('Por favor completa todos los campos.');
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);
        setGlobalMessage('');

        try {
            const responseData = await loginUser({
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
            });

            // Guardar token en localStorage
            localStorage.setItem('token', responseData.access_token);

            setGlobalMessage('¡Inicio de sesión exitoso!');
            setIsSuccess(true);

            // Redirigir al dashboard
            setTimeout(() => {
                router.push('/dashboard');
            }, 500);
        } catch (error) {
            setGlobalMessage(
                error.message || 'Error al iniciar sesión. Verifica tus credenciales.'
            );
            setIsSuccess(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md mx-auto rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Iniciar Sesión</h2>
            <p className="text-slate-600 mb-6">
                Accede a tu cuenta de la comunidad energética
            </p>

            {globalMessage && (
                <div
                    className={`mb-4 p-3 rounded-lg ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                >
                    {globalMessage}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Correo Electrónico
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="tu@email.com"
                    />
                    {fieldErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                    )}
                </div>

                {/* Password */}
                <div>
                    <label
                        htmlFor="password"
                        className="block text-sm font-medium text-slate-700 mb-1"
                    >
                        Contraseña
                    </label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg bg-white border border-slate-300 text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        placeholder="••••••••"
                    />
                    {fieldErrors.password && (
                        <p className="mt-1 text-sm text-red-600">
                            {fieldErrors.password}
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-500 text-white py-3 rounded-lg font-semibold hover:bg-cyan-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                {/* Link to Register */}
                <div className="text-center text-sm text-slate-600 mt-4">
                    ¿No tienes cuenta?{' '}
                    <Link
                        href="/register"
                        className="text-cyan-600 hover:text-cyan-700 font-medium"
                    >
                        Regístrate aquí
                    </Link>
                </div>
            </form>
        </div>
    );
}

export default LoginForm;
