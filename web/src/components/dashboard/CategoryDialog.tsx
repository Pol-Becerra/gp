'use client';

import React from 'react';
import { X, FolderTree } from 'lucide-react';

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
    availableCategories?: Category[];
    initialParentCategory?: Category | null;
}

export function CategoryDialog({ isOpen, onClose, onSave, category, availableCategories = [], initialParentCategory }: CategoryDialogProps) {
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
        } else if (initialParentCategory) {
            // Pre-fill with parent category data for new subcategory
            setFormData({
                nombre: '',
                slug: '',
                descripcion: '',
                icono_url: initialParentCategory.icono_url || '',
                color_hex: initialParentCategory.color_hex || '#3b82f6',
                parent_id: initialParentCategory.id
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
    }, [category, initialParentCategory]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#111] border border-white/10 rounded-3xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <div>
                        <h2 className="text-xl font-bold">
                            {category ? 'Editar Categoría' : (initialParentCategory ? 'Nueva Subcategoría' : 'Nueva Categoría')}
                        </h2>
                        {initialParentCategory && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                <FolderTree size={12} className="text-blue-400" />
                                Heredando de: <span style={{ color: initialParentCategory.color_hex }}>{initialParentCategory.nombre}</span>
                            </p>
                        )}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form className="p-6" onSubmit={(e) => {
                    e.preventDefault();
                    onSave(formData);
                }}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        {/* Columna Izquierda */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nombre || ''}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors"
                                    placeholder="Nombre de la categoría"
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
                                <label className="text-sm font-medium text-gray-400">Categoría Padre</label>
                                <select
                                    value={formData.parent_id || ''}
                                    onChange={(e) => {
                                        const parentId = e.target.value || null;
                                        const parentCat = parentId ? availableCategories.find(c => c.id === parentId) : null;
                                        setFormData({ 
                                            ...formData, 
                                            parent_id: parentId,
                                            // Heredar color del padre automáticamente
                                            color_hex: parentCat ? parentCat.color_hex : formData.color_hex
                                        });
                                    }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors text-gray-300"
                                >
                                    <option value="" className="bg-[#111]">Sin categoría padre (Categoría principal)</option>
                                    {availableCategories
                                        .filter(cat => cat.id !== category?.id)
                                        .map(cat => (
                                            <option key={cat.id} value={cat.id} className="bg-[#111]">
                                                {cat.nombre}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <p className="text-xs text-gray-500 pt-1">
                                {formData.parent_id ? (
                                    <span className="text-blue-400">
                                        El color se heredará automáticamente del padre
                                    </span>
                                ) : (
                                    "Selecciona una categoría padre para crear una subcategoría"
                                )}
                            </p>
                        </div>

                        {/* Columna Derecha */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400">Descripción</label>
                                <textarea
                                    value={formData.descripcion || ''}
                                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors h-[88px] resize-none"
                                    placeholder="Descripción de la categoría..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Icono</label>
                                    <input
                                        type="text"
                                        value={formData.icono_url || ''}
                                        onChange={(e) => setFormData({ ...formData, icono_url: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500/50 transition-colors text-center"
                                        placeholder="🛒"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400">Color</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData.color_hex || '#3b82f6'}
                                            onChange={(e) => setFormData({ ...formData, color_hex: e.target.value })}
                                            className="h-10 w-12 bg-white/5 border border-white/10 rounded-xl overflow-hidden p-0.5 cursor-pointer hover:border-blue-500/50 transition-colors"
                                        />
                                        <div
                                            className="flex-1 h-10 rounded-xl border border-white/10 flex items-center justify-center font-mono text-xs uppercase"
                                            style={{ backgroundColor: `${formData.color_hex}20`, color: formData.color_hex, borderColor: `${formData.color_hex}40` }}
                                        >
                                            {formData.color_hex || '#3B82F6'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preview */}
                            <div className="pt-2">
                                <label className="text-xs text-gray-500 mb-2 block">Vista previa</label>
                                <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl">
                                    <div
                                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                                        style={{ backgroundColor: `${formData.color_hex}20`, color: formData.color_hex }}
                                    >
                                        {formData.icono_url || formData.nombre?.charAt(0) || '?'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{formData.nombre || 'Nombre'}</div>
                                        <div className="text-xs text-gray-500 truncate">{formData.slug || 'slug-categoria'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 border-t border-white/5">
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
                            {category ? 'Guardar Cambios' : (initialParentCategory ? 'Crear Subcategoría' : 'Crear Categoría')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
