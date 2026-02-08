'use client';

import React, { useEffect, useState } from 'react';
import { Building2, Search, Filter, MoreVertical, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface Entity {
    id: string;
    nombre_legal: string;
    cuit: string;
    activa: boolean;
    validation_score: number;
}

export default function EntitiesList() {
    const [entities, setEntities] = useState<Entity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterWithWeb, setFilterWithWeb] = useState(false);

    useEffect(() => {
        setLoading(true);
        const url = new URL('http://localhost:4000/api/entities');
        if (filterWithWeb) url.searchParams.append('has_web', 'true');

        fetch(url.toString())
            .then(res => {
                if (!res.ok) throw new Error('API connection failed');
                return res.json();
            })
            .then(data => {
                setEntities(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Fetch error:', err);
                setLoading(false);
                setEntities([]);
            });
    }, [filterWithWeb]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Entidades</h1>
                    <p className="text-gray-400">Gestiona y valida la base de datos de PyMEs</p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
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
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>

                <button
                    onClick={() => setFilterWithWeb(!filterWithWeb)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${filterWithWeb
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                >
                    <Filter size={20} />
                    Solo con Web
                </button>
            </div>

            <div className="glass rounded-3xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <th className="px-6 py-4">Empresa / CUIT</th>
                            <th className="px-6 py-4">Estado</th>
                            <th className="px-6 py-4">Validación</th>
                            <th className="px-6 py-4">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {entities.map((entity, i) => (
                            <motion.tr
                                key={entity.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-white/[0.02] transition-colors"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                            <Building2 size={20} />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{entity.nombre_legal}</div>
                                            <div className="text-xs text-gray-500">{entity.cuit || 'Sin CUIT'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${entity.activa ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                                        }`}>
                                        {entity.activa ? 'Activa' : 'Inactiva'}
                                    </span>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden max-w-[100px]">
                                            <div
                                                className={`h-full ${entity.validation_score > 0.7 ? 'bg-green-500' : 'bg-yellow-500'}`}
                                                style={{ width: `${(entity.validation_score || 0) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-xs font-mono">{Math.round((entity.validation_score || 0) * 100)}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-500 hover:text-white">
                                        <MoreVertical size={20} />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
