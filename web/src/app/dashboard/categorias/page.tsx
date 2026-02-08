'use client';

import React, { useEffect, useState } from 'react';
import { Tag, Search, Plus, MoreVertical, Edit2, Trash2, FolderTree } from 'lucide-react';
import { motion } from 'framer-motion';
import { CategoryDialog } from '@/components/dashboard/CategoryDialog';

interface Category {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string;
    icono_url: string;
    color_hex: string;
    parent_id: string | null;
    nivel_profundidad: number;
    created_at: string;
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleSave = async (formData: Partial<Category>) => {
        try {
            const method = editingCategory ? 'PUT' : 'POST';
            const url = editingCategory
                ? `http://localhost:4000/api/categories/${editingCategory.id}`
                : 'http://localhost:4000/api/categories';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchCategories();
                setIsDialogOpen(false);
                setEditingCategory(null);
            } else {
                const errorData = await res.json();
                alert(`Error al guardar: ${errorData.error || 'Error desconocido'}`);
            }
        } catch (err: any) {
            console.error('Error saving category:', err);
            alert(`Error de red: ${err.message}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta categoría?')) return;
        try {
            const res = await fetch(`http://localhost:4000/api/categories/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchCategories();
            } else {
                const data = await res.json();
                alert(data.error || 'Error al eliminar');
            }
        } catch (err) {
            console.error('Error deleting category:', err);
        }
    };

    const filteredCategories = categories.filter(c =>
        c.nombre.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold mb-2">Categorías</h1>
                    <p className="text-gray-400">Define y organiza los sectores de las PyMEs</p>
                </div>
                <button
                    onClick={() => {
                        setEditingCategory(null);
                        setIsDialogOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-500 px-5 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                >
                    <Plus size={20} />
                    Nueva Categoría
                </button>
            </div>

            <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o slug..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 focus:outline-none focus:border-blue-500/50 transition-colors"
                    />
                </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/5">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest">
                            <th className="px-6 py-4">Categoría</th>
                            <th className="px-6 py-4">Slug</th>
                            <th className="px-6 py-4">Descripción</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                    Cargando categorías...
                                </td>
                            </tr>
                        ) : filteredCategories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                    No se encontraron categorías
                                </td>
                            </tr>
                        ) : filteredCategories.map((category, i) => (
                            <motion.tr
                                key={category.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="hover:bg-white/[0.02] transition-colors group"
                            >
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                            style={{ backgroundColor: `${category.color_hex}15`, color: category.color_hex }}
                                        >
                                            {category.icono_url ? (
                                                <span>{category.icono_url}</span>
                                            ) : (
                                                <Tag size={18} />
                                            )}
                                        </div>
                                        <div>
                                            <div className="font-semibold">{category.nombre}</div>
                                            {category.parent_id && (
                                                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <FolderTree size={10} /> Subcategoría
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-sm font-mono text-gray-400">
                                    {category.slug}
                                </td>
                                <td className="px-6 py-5 text-sm text-gray-500 max-w-xs truncate">
                                    {category.descripcion || '-'}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => {
                                                setEditingCategory(category);
                                                setIsDialogOpen(true);
                                            }}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-blue-400"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <CategoryDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSave={handleSave}
                category={editingCategory}
            />
        </div>
    );
}
