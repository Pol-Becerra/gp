'use client';

import React, { useState, useEffect } from 'react';
import {
    Layers, Plus, Search, Edit2, Trash2, Loader2, X, Save,
    MoreVertical, Check, FolderOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AreaData {
    id: string;
    nombre: string;
    descripcion: string | null;
    color_hex: string;
    ticket_count: number;
    activa: boolean;
    created_at: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.105:4000/api';

export default function AreasPage() {
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingArea, setEditingArea] = useState<AreaData | null>(null);
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        color_hex: '#6366f1'
    });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        fetchAreas();
    }, []);

    const fetchAreas = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/areas?includeInactive=true`);
            const data = await res.json();
            setAreas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching areas:', err);
            setAreas([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (area?: AreaData) => {
        if (area) {
            setEditingArea(area);
            setFormData({
                nombre: area.nombre,
                descripcion: area.descripcion || '',
                color_hex: area.color_hex
            });
        } else {
            setEditingArea(null);
            setFormData({ nombre: '', descripcion: '', color_hex: '#6366f1' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingArea
                ? `${API_URL}/areas/${editingArea.id}`
                : `${API_URL}/areas`;

            const method = editingArea ? 'PUT' : 'POST';

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            setIsModalOpen(false);
            fetchAreas();
        } catch (err) {
            console.error('Error saving area:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, hard: boolean = false) => {
        try {
            await fetch(`${API_URL}/areas/${id}?hard=${hard}`, { method: 'DELETE' });
            setDeleteConfirm(null);
            fetchAreas();
        } catch (err) {
            console.error('Error deleting area:', err);
        }
    };

    const filteredAreas = areas.filter(a =>
        a.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Layers className="w-7 h-7 text-purple-400" />
                        Áreas de Tickets
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gestiona las áreas y departamentos para clasificar tickets
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-900/30"
                >
                    <Plus className="w-5 h-5" />
                    Nueva Área
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar áreas..."
                    className="w-full md:w-96 bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
            </div>

            {/* Areas Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {loading ? (
                        <div className="col-span-full flex justify-center py-20">
                            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                        </div>
                    ) : (
                        filteredAreas.map((area) => (
                            <motion.div
                                key={area.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-all group"
                            >
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-4">
                                        <div
                                            className="w-12 h-12 rounded-lg flex items-center justify-center shadow-lg"
                                            style={{ backgroundColor: `${area.color_hex}20` }}
                                        >
                                            <FolderOpen
                                                className="w-6 h-6"
                                                style={{ color: area.color_hex }}
                                            />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleOpenModal(area)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(area.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-white mb-1">{area.nombre}</h3>
                                    <p className="text-gray-400 text-sm line-clamp-2 min-h-[40px]">
                                        {area.descripcion || 'Sin descripción'}
                                    </p>

                                    <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tickets Activos
                                        </span>
                                        <span className="bg-slate-800 text-white px-2.5 py-1 rounded-md text-sm font-bold">
                                            {area.ticket_count}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className="h-1 w-full"
                                    style={{ backgroundColor: area.color_hex }}
                                />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h2 className="text-xl font-bold text-white">
                                    {editingArea ? 'Editar Área' : 'Nueva Área'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        placeholder="Ej: Marketing, Soporte..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Descripción
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={formData.descripcion}
                                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                                        placeholder="Descripción breve del área..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Color Identificativo
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={formData.color_hex}
                                            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                            className="w-12 h-12 rounded-lg border border-slate-700 cursor-pointer bg-transparent"
                                        />
                                        <input
                                            type="text"
                                            value={formData.color_hex}
                                            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 border border-slate-700 text-gray-400 font-medium rounded-lg hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        <span>{isSaving ? 'Guardando...' : 'Guardar'}</span>
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setDeleteConfirm(null)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                                    <Trash2 className="w-8 h-8 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    ¿Eliminar área?
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Esto también eliminará la asignación de área en los tickets existentes.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 px-4 py-2.5 border border-slate-700 text-gray-400 font-medium rounded-lg hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm, true)}
                                        className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-all"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
