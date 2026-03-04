import Head from 'next/head';
import Link from 'next/link';

function HomePage() {
    return (
    <>
        <Head>
        <title>Comunidad Energética</title>
        </Head>
        <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <section className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/90 p-8">
            <h1 className="text-3xl font-bold mb-3">Comunidad Energética</h1>
            <p className="text-slate-300 mb-6">Frontend migrado a Next.js con convenciones oficiales del proyecto.</p>
            <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-400 px-5 py-3 text-slate-900 font-semibold hover:bg-emerald-300 transition"
            >
            Ir al registro
            </Link>
        </section>
        </main>
    </>
    );
}

export default HomePage;
