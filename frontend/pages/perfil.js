import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Navbar } from '../src/components/Layout';

export default function ProfilePage() {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [city, setCity] = useState('');
    const [userType, setUserType] = useState('');
    const [householdName, setHouseholdName] = useState('');

    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            router.push('/login');
            return;
        }

        loadProfile(token);
    }, []);

    const loadProfile = async token => {
        try {
            const res = await fetch('http://localhost:8000/api/users/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            setFullName(data.full_name);
            setEmail(data.email);
            setPhone(data.phone_number);
            setAddress(data.address);
            setCity(data.city);
            setUserType(data.user_type);
            setHouseholdName(data.household_name);
        } catch (error) {
            console.error(error);
        }

        setIsLoading(false);
    };

    const updateProfile = async () => {
        const token = localStorage.getItem('token');

        const res = await fetch('http://localhost:8000/api/users/me', {
            method: 'PUT',

            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },

            body: JSON.stringify({
                full_name: fullName,
                email: email,

                // necesarios para que FastAPI no devuelva 422
                user_type: userType,
                household_name: householdName,
                address: address,
                city: city,
                phone_number: phone,
            }),
        });

        if (res.ok) {
            setMessage('Perfil actualizado correctamente');
            setEditMode(false);
        } else {
            const error = await res.json();
            console.error(error);

            setMessage('Error al actualizar perfil');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                Cargando...
            </div>
        );
    }

    const InfoField = ({ label, value }) => (
        <div>
            <div className="text-sm text-slate-500 mb-1">{label}</div>
            <div className="px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-700">
                {value || '-'}
            </div>
        </div>
    );

    return (
        <>
            <Head>
                <title>Perfil | EnergyHub</title>
            </Head>

            <div className="min-h-screen bg-slate-50">
                <Navbar />

                <main className="max-w-3xl mx-auto px-6 py-10">
                    <div className="bg-white rounded-2xl shadow-sm border p-8">
                        <div className="flex justify-between items-center mb-8">
                            <h1 className="text-2xl font-bold">Mi Perfil</h1>

                            {!editMode && (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="px-4 py-2 bg-cyan-500 text-white rounded-lg"
                                >
                                    Editar perfil
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* nombre */}
                            <div>
                                <div className="text-sm text-slate-500 mb-1">
                                    Nombre
                                </div>

                                {editMode ? (
                                    <input
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                ) : (
                                    <div className="px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-700">
                                        {fullName}
                                    </div>
                                )}
                            </div>

                            {/* email */}
                            <div>
                                <div className="text-sm text-slate-500 mb-1">Email</div>

                                {editMode ? (
                                    <input
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border rounded-lg"
                                    />
                                ) : (
                                    <div className="px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-700">
                                        {email}
                                    </div>
                                )}
                            </div>

                            <InfoField label="Teléfono" value={phone} />
                            <InfoField label="Tipo usuario" value={userType} />
                            <InfoField label="Dirección" value={address} />
                            <InfoField label="Ciudad" value={city} />
                        </div>

                        {editMode && (
                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={updateProfile}
                                    className="px-6 py-3 bg-cyan-500 text-white rounded-lg"
                                >
                                    Guardar
                                </button>

                                <button
                                    onClick={() => setEditMode(false)}
                                    className="px-6 py-3 bg-gray-300 rounded-lg"
                                >
                                    Cancelar
                                </button>
                            </div>
                        )}

                        {message && (
                            <div className="mt-4 text-green-600">{message}</div>
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}
