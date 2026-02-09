'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Search, Filter, Plus, Pencil, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EntityFormModal from '@/components/crm/EntityFormModal';

interface Entity {
    id: string;
    nombre_legal: string;
    cuit: string;
    activa: boolean;
    validation_score: number;
    razon_social: string;
    tipo_entidad: string;
    descripcion: string;
    [key: string]: any;
}

export default function EntitiesList() {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWithWeb, setFilterWithWeb] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentEntity, setCurrentEntity] = useState<Entity | null>(null);

    const fetchEntities = () => {
        setLoading(true);
        const url = new URL('http://localhost:4000/api/entities');
        if (filterWithWeb) url.searchParams.append('has_web', 'true');

        fetch(url.toString())
            .then(res => {
                if (!res.ok) throw new Error('API connection failed');
                return res.json();
            })
            .then(data => {
                setEntities(data.data || []);
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
                setEntities([]);
            });
    };

    useEffect(() => {
        fetchEntities();
    }, [filterWithWeb]);

    const handleCreate = () => {
        setCurrentEntity(null);
        setIsModalOpen(true);
    };

    const handleEdit = async (entity: Entity) => {
        // Fetch full details before editing
        try {
            const res = await fetch(`http://localhost:4000/api/entities/${entity.id}`);
            if (!res.ok) throw new Error('Failed to fetch entity details');
            const fullEntity = await res.json();
            setCurrentEntity(fullEntity);
            setIsModalOpen(true);
        } catch (error) {
            console.error(error);
            alert('Error al cargar los detalles de la entidad');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta entidad? Esta acción no se puede deshacer.')) return;

        try {
            const res = await fetch(`http://localhost:4000/api/entities/${id}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Failed to delete');

            setEntities(prev => prev.filter(e => e.id !== id));
        } catch (error) {
            console.error(error);
            alert('Error al eliminar la entidad');
        }
    };

    const handleSave = async (formData: any) => {
        const isEdit = !!formData.id;
        const url = isEdit
            ? `http://localhost:4000/api/entities/${formData.id}`
            : 'http://localhost:4000/api/entities';

        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || 'Error al guardar');
        }

        fetchEntities(); // Refresh list
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Entidades</h1>
                    <p className="text-gray-400">Gestiona y valida la base de datos de PyMEs</p>
                </div>
                <button
                    onClick={handleCreate}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                >
                    <Plus size={20} />
                    Nueva Entidad
                </button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, CUIT o dirección..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-blue-500/50 transition-colors placeholder:text-gray-600"
                    />
                </div>

                <button
                    onClick={() => setFilterWithWeb(!filterWithWeb)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${filterWithWeb
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <Filter size={20} />
                    Solo con Web
                </button>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5 bg-[#1a1f2e]/50 backdrop-blur-xl">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
                        <p>Cargando entidades...</p>
                    </div>
                ) : entities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <AlertTriangle className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No se encontraron entidades</p>
                        <p className="text-sm">Intenta ajustar los filtros o crea una nueva.</p>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest border-b border-white/5">
                                <th className="px-6 py-4">Empresa / CUIT</th>
                                <th className="px-6 py-4">Tipo</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4">Validación</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            <AnimatePresence>
                                {entities.map((entity, i) => (
                                    <motion.tr
                                        key={entity.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ delay: i * 0.05 }}
                                        className="hover:bg-white/[0.02] transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                                    <Building2 size={20} />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-white">{entity.nombre_legal}</div>
                                                    <div className="text-xs text-gray-500 font-mono">{entity.cuit || 'Sin CUIT'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-400 capitalize bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                                {entity.tipo_entidad || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter border ${entity.activa
                                                ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                {entity.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 w-32">
                                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${(entity.validation_score || 0) > 0.7 ? 'bg-green-500' :
                                                            (entity.validation_score || 0) > 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${(entity.validation_score || 0) * 100}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-mono text-gray-400">{Math.round((entity.validation_score || 0) * 100)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(entity)}
                                                    className="p-2 hover:bg-blue-500/20 hover:text-blue-400 rounded-lg transition-colors text-gray-500"
                                                    title="Editar"
                                                >
                                                    <Pencil size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entity.id)}
                                                    className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors text-gray-500"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                )}
            </div>

            <EntityFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                initialData={currentEntity}
            />
        </div>
    );
}
