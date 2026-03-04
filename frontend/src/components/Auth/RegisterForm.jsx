import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser } from '../../services/authService';
import { getRegisterValidationErrors } from '../../utils/validators';

const initialFormData = {
    // Información básica
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',

    // Información de hogar/empresa
    userType: 'household',
    householdName: '',
    address: '',
    city: '',
    postalCode: '',

    // Rol en la comunidad energética
    primaryRole: 'consumer',

    // Información energética (opcional)
    installedCapacityKwh: '',
    energySourceType: '',
    averageMonthlyConsumptionKwh: '',
};

function RegisterForm() {
    const router = useRouter();
    const [formData, setFormData] = useState(initialFormData);
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

        const validationErrors = getRegisterValidationErrors(formData);
        if (Object.keys(validationErrors).length > 0) {
            setFieldErrors(validationErrors);
            setGlobalMessage('Revisa los campos marcados.');
            setIsSuccess(false);
            return;
        }

        setIsLoading(true);
        setGlobalMessage('');

        try {
            const responseData = await registerUser({
                // Información básica
                full_name: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                phone_number: formData.phoneNumber || null,

                // Información de hogar/empresa
                user_type: formData.userType,
                household_name: formData.householdName.trim(),
                address: formData.address.trim(),
                city: formData.city.trim(),
                postal_code: formData.postalCode.trim(),

                // Rol en la comunidad energética
                primary_role: formData.primaryRole,

                // Información energética (opcional)
                installed_capacity_kwh: formData.installedCapacityKwh
                    ? parseFloat(formData.installedCapacityKwh)
                    : null,
                energy_source_type: formData.energySourceType || null,
                average_monthly_consumption_kwh: formData.averageMonthlyConsumptionKwh
                    ? parseFloat(formData.averageMonthlyConsumptionKwh)
                    : null,
            });

            if (responseData.access_token) {
                localStorage.setItem('token', responseData.access_token);
            }

            setIsSuccess(true);
            setGlobalMessage('¡Cuenta creada exitosamente! Redirigiendo...');
            setFormData(initialFormData);

            setTimeout(() => {
                router.push('/dashboard');
            }, 1500);
        } catch (error) {
            setIsSuccess(false);
            setGlobalMessage(error.message || 'No fue posible registrar el usuario.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-500 text-2xl">
                    ⚡
                </div>
                <h1 className="text-3xl font-bold text-slate-800">Únete a EnergyHub</h1>
                <p className="mt-2 text-sm text-slate-600">
                    Completa tu registro para unirte a la comunidad energética
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                {/* Información Personal */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        Información Personal
                    </h3>

                    <div>
                        <label
                            htmlFor="fullName"
                            className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                        >
                            Nombre completo *
                        </label>
                        <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleInputChange}
                            placeholder="Ana García López"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {fieldErrors.fullName && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors.fullName}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Correo electrónico *
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="ana@empresa.com"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="phoneNumber"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Teléfono
                            </label>
                            <input
                                id="phoneNumber"
                                name="phoneNumber"
                                type="tel"
                                value={formData.phoneNumber}
                                onChange={handleInputChange}
                                placeholder="+57 123 456 7890"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.phoneNumber && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.phoneNumber}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="password"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Contraseña *
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.password && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.password}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Confirmar contraseña *
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="••••••••"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.confirmPassword && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.confirmPassword}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información de Hogar/Empresa */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        Información de Hogar/Empresa
                    </h3>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="userType"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Tipo de usuario *
                            </label>
                            <select
                                id="userType"
                                name="userType"
                                value={formData.userType}
                                onChange={handleInputChange}
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            >
                                <option value="household">Hogar</option>
                                <option value="company">Empresa</option>
                            </select>
                            {fieldErrors.userType && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.userType}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="householdName"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Nombre del hogar/empresa *
                            </label>
                            <input
                                id="householdName"
                                name="householdName"
                                type="text"
                                value={formData.householdName}
                                onChange={handleInputChange}
                                placeholder="Casa García o Empresa Solar S.A."
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.householdName && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.householdName}
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label
                            htmlFor="address"
                            className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                        >
                            Dirección *
                        </label>
                        <input
                            id="address"
                            name="address"
                            type="text"
                            value={formData.address}
                            onChange={handleInputChange}
                            placeholder="Calle 123 #45-67"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {fieldErrors.address && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors.address}
                            </p>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="city"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Ciudad *
                            </label>
                            <input
                                id="city"
                                name="city"
                                type="text"
                                value={formData.city}
                                onChange={handleInputChange}
                                placeholder="Medellín"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.city && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.city}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="postalCode"
                                className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                            >
                                Código postal *
                            </label>
                            <input
                                id="postalCode"
                                name="postalCode"
                                type="text"
                                value={formData.postalCode}
                                onChange={handleInputChange}
                                placeholder="050021"
                                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                            />
                            {fieldErrors.postalCode && (
                                <p className="mt-1 text-sm text-red-600">
                                    {fieldErrors.postalCode}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Información Energética */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-200 pb-2">
                        Información Energética
                    </h3>

                    <div>
                        <label
                            htmlFor="primaryRole"
                            className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                        >
                            Rol en la comunidad *
                        </label>
                        <select
                            id="primaryRole"
                            name="primaryRole"
                            value={formData.primaryRole}
                            onChange={handleInputChange}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        >
                            <option value="consumer">Consumidor</option>
                            <option value="producer">Productor</option>
                            <option value="prosumer">Productor y Consumidor</option>
                        </select>
                        {fieldErrors.primaryRole && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors.primaryRole}
                            </p>
                        )}
                    </div>

                    {(formData.primaryRole === 'producer' ||
                        formData.primaryRole === 'prosumer') && (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="installedCapacityKwh"
                                    className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                                >
                                    Capacidad instalada (kWh)
                                </label>
                                <input
                                    id="installedCapacityKwh"
                                    name="installedCapacityKwh"
                                    type="number"
                                    step="0.1"
                                    value={formData.installedCapacityKwh}
                                    onChange={handleInputChange}
                                    placeholder="5.5"
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                />
                                {fieldErrors.installedCapacityKwh && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.installedCapacityKwh}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label
                                    htmlFor="energySourceType"
                                    className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                                >
                                    Tipo de fuente energética
                                </label>
                                <select
                                    id="energySourceType"
                                    name="energySourceType"
                                    value={formData.energySourceType}
                                    onChange={handleInputChange}
                                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="solar">Solar</option>
                                    <option value="wind">Eólica</option>
                                    <option value="battery">Almacenamiento</option>
                                    <option value="other">Otra</option>
                                </select>
                                {fieldErrors.energySourceType && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {fieldErrors.energySourceType}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="averageMonthlyConsumptionKwh"
                            className="mb-1 block text-xs uppercase tracking-wide text-slate-700 font-medium"
                        >
                            Consumo promedio mensual (kWh)
                        </label>
                        <input
                            id="averageMonthlyConsumptionKwh"
                            name="averageMonthlyConsumptionKwh"
                            type="number"
                            step="0.1"
                            value={formData.averageMonthlyConsumptionKwh}
                            onChange={handleInputChange}
                            placeholder="300"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                        />
                        {fieldErrors.averageMonthlyConsumptionKwh && (
                            <p className="mt-1 text-sm text-red-600">
                                {fieldErrors.averageMonthlyConsumptionKwh}
                            </p>
                        )}
                    </div>
                </div>

                {globalMessage && (
                    <div
                        className={`rounded-lg px-4 py-3 text-sm ${isSuccess ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}
                    >
                        {globalMessage}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {isLoading ? 'Registrando...' : 'Crear mi cuenta en la comunidad'}
                </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link
                    href="/login"
                    className="font-medium text-cyan-600 hover:text-cyan-700"
                >
                    Inicia sesión
                </Link>
            </p>
        </section>
    );
}

export default RegisterForm;
