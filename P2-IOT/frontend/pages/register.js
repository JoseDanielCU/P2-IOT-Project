import Head from 'next/head';
import RegisterForm from '../src/components/Auth/RegisterForm';

function RegisterPage() {
    return (
    <>
        <Head>
        <title>Registro | Comunidad Energética</title>
        </Head>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <RegisterForm />
        </main>
    </>
    );
}

export default RegisterPage;
