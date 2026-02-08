'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, Search, Trash2, Edit2, Shield, Mail, Phone, CheckCircle, XCircle, User as UserIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface User {
    id: string;
    email: string;
    nombre_completo: string;
    rol: string;
    activo: boolean;
    last_login: string;
    created_at: string;
}

// API URL - Should match AuthContext
const API_URL = 'http://localhost:4000/api';

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        nombre_completo: '',
        rol: 'gestor',
        activo: true,
        telefono: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const url = editingUser
                ? `${API_URL}/users/${editingUser.id}`
                : `${API_URL}/users`;

            const method = editingUser ? 'PUT' : 'POST';

            // Remove password if editing and empty (optional update)
            const bodyData = { ...formData };
            if (editingUser && !bodyData.password) {
                delete (bodyData as any).password;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(bodyData)
            });

            if (res.ok) {
                setShowModal(false);
                fetchUsers();
                resetForm();
            } else {
                const err = await res.json();
                alert(err.error || 'Error al guardar usuario');
            }
        } catch (error) {
            console.error('Error saving user:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_URL}/users/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchUsers();
            }
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            email: '',
            password: '',
            nombre_completo: '',
            rol: 'gestor',
            activo: true,
            telefono: ''
        });
        setEditingUser(null);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            email: user.email,
            password: '', // Don't show password
            nombre_completo: user.nombre_completo || '',
            rol: user.rol,
            activo: user.activo,
            telefono: '' // If stored in DB fetch it, currently simplistic
        });
        setShowModal(true);
    };

    const filteredUsers = users.filter(user =>
        user.nombre_completo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-blue-500" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-400">Administra cuentas y permisos del sistema</p>
                </div>

                <button
                    onClick={() => { resetForm(); setShowModal(true); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                >
                    <Plus size={20} />
                    Nuevo Usuario
                </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-[#111] p-4 rounded-xl border border-white/5 flex gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar usuarios..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder:text-gray-600 focus:outline-none focus:border-blue-500/50"
                    />
                </div>
            </div>

            {/* Users List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-gray-500">Cargando usuarios...</div>
                ) : filteredUsers.map((user) => (
                    <div key={user.id} className="bg-[#111] p-5 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all group relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {user.nombre_completo?.charAt(0) || user.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{user.nombre_completo || 'Sin nombre'}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${user.rol === 'super_admin' ? 'bg-purple-500/20 text-purple-400' :
                                            user.rol === 'admin' ? 'bg-blue-500/20 text-blue-400' :
                                                'bg-gray-500/20 text-gray-400'
                                        }`}>
                                        {user.rol.replace('_', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => openEditModal(user)}
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-blue-400"
                                >
                                    <Edit2 size={16} />
                                </button>
                                {currentUser?.id !== user.id && (
                                    <button
                                        onClick={() => handleDelete(user.id)}
                                        className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-red-400"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <Mail size={14} />
                                <span className="truncate">{user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${user.activo ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span>{user.activo ? 'Activo' : 'Inactivo'}</span>
                            </div>
                            <div className="text-xs text-gray-600 mt-2 pt-2 border-t border-white/5">
                                Último acceso: {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Nunca'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            <AnimatePresence>
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-[#111] w-full max-w-lg rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        >
                            <div className="p-6 border-b border-white/5 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-white">
                                    {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                                </h2>
                                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Nombre Completo</label>
                                        <input
                                            type="text"
                                            value={formData.nombre_completo}
                                            onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Teléfono</label>
                                        <input
                                            type="text"
                                            value={formData.telefono}
                                            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                        required
                                        disabled={!!editingUser} // Prevent email change for now
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">
                                        {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                                    </label>
                                    <input
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                        required={!editingUser}
                                        placeholder={editingUser ? '••••••••' : ''}
                                        minLength={6}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Rol</label>
                                        <select
                                            value={formData.rol}
                                            onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                                            className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-2.5 text-white focus:border-blue-500/50 outline-none"
                                        >
                                            <option value="gestor">Gestor</option>
                                            <option value="admin">Administrador</option>
                                            <option value="super_admin">Super Admin</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm text-gray-400">Estado</label>
                                        <div className="flex items-center gap-3 h-[42px]">
                                            <label className="flex items-center gap-2 cursor-pointer text-white">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.activo}
                                                    onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                                                    className="w-5 h-5 rounded border-gray-600 bg-transparent text-blue-600 focus:ring-blue-500"
                                                />
                                                Usuario Activo
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="flex-1 py-3 px-4 rounded-xl border border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 transition-colors"
                                    >
                                        {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
