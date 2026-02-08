'use client';

import React from 'react';
import { X } from 'lucide-react';

interface Category {
    id?: string;
    nombre: string;
    slug: string;
    descripcion: string;
    icono_url: string;
    color_hex: string;
    parent_id?: string | null;
}

interface CategoryDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Category>) => void;
    category?: Category | null;
}

export function CategoryDialog({ isOpen, onClose, onSave, category }: CategoryDialogProps) {
    const [formData, setFormData] = React.useState<Partial<Category>>({
        nombre: '',
        slug: '',
        descripcion: '',
        icono_url: '',
        color_hex: '#3b82f6',
        parent_id: null
    });

    React.useEffect(() => {
        if (category) {
            setFormData({
                ...category,
                color_hex: category.color_hex || '#3b82f6'
            });
        } else {
            setFormData({
                nombre: '',
                slug: '',
                descripcion: '',
                icono_url: '',
                color_hex: '#3b82f6',
                parent_id: null
            });
        }
    }, [category]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-bold">{category ? 'Editar Categoría' : 'Nueva Categoría'}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form className="p-6 space-y-4" onSubmit={(e) => {
                    e.preventDefault();
                    onSave(formData);
                }}>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Nombre</label>
                        <input
                            type="text"
                            required
                            value={formData.nombre || ''}
                            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Slug (opcional)</label>
                        <input
                            type="text"
                            value={formData.slug || ''}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors"
                            placeholder="ej: comercios-minoristas"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400">Descripción</label>
                        <textarea
                            value={formData.descripcion || ''}
                            onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors h-24 resize-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Icono URL / Emoji</label>
                            <input
                                type="text"
                                value={formData.icono_url || ''}
                                onChange={(e) => setFormData({ ...formData, icono_url: e.target.value })}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors"
                                placeholder="ej: 🛒"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">Color (Hex)</label>
                            <div className="flex gap-2">
                                <input
                                    type="color"
                                    value={formData.color_hex || '#3b82f6'}
                                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                    className="h-10 w-12 bg-white/5 border border-white/10 rounded-lg overflow-hidden p-0 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={formData.color_hex || '#3B82F6'}
                                    onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm uppercase"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 transition-colors font-semibold"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="flex-1 bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20"
                        >
                            {category ? 'Guardar Cambios' : 'Crear Categoría'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
