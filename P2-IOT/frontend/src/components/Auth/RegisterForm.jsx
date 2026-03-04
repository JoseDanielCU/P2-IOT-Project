import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { registerUser } from '../../services/authService';
import { getRegisterValidationErrors } from '../../utils/validators';

const initialFormData = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
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
        [name]: value
    }));

    setFieldErrors(currentErrors => ({
        ...currentErrors,
        [name]: ''
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
        full_name: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password
        });

    if (responseData.access_token) {
        localStorage.setItem('token', responseData.access_token);
    }

      setIsSuccess(true);
      setGlobalMessage('Cuenta creada exitosamente. Redirigiendo...');
      setFormData(initialFormData);

      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      setIsSuccess(false);
      setGlobalMessage(error.message || 'No fue posible registrar el usuario.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-2xl">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-2xl">
          ⚡
        </div>
        <h1 className="text-3xl font-bold text-slate-100">Comunidad Energética</h1>
        <p className="mt-2 text-sm text-slate-400">Únete a la red de energía colaborativa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div>
          <label htmlFor="fullName" className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
            Nombre completo
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            value={formData.fullName}
            onChange={handleInputChange}
            placeholder="Ana García López"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
          />
          {fieldErrors.fullName && <p className="mt-1 text-sm text-rose-400">{fieldErrors.fullName}</p>}
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="ana@empresa.com"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-rose-400">{fieldErrors.email}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
            />
            {fieldErrors.password && <p className="mt-1 text-sm text-rose-400">{fieldErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-xs uppercase tracking-wide text-slate-400">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition focus:border-emerald-400"
            />
            {fieldErrors.confirmPassword && (
              <p className="mt-1 text-sm text-rose-400">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </div>

        {globalMessage && (
          <p className={`rounded-lg px-3 py-2 text-sm ${isSuccess ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
            {globalMessage}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-emerald-400 px-4 py-3 font-semibold text-slate-900 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'Registrando...' : 'Crear mi cuenta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/" className="font-medium text-cyan-400 hover:text-emerald-300">
          Inicia sesión
        </Link>
      </p>
    </section>
  );
}

export default RegisterForm;
