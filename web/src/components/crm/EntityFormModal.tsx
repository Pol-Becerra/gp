'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Building2, MapPin, Phone, Mail, Globe, Share2, Tag, AlertCircle, Trash2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Interfaces ---
interface Phone { id: string; numero: string; tipo: string; uso: string; }
interface Email { id: string; email: string; uso: string; }
interface Website { id: string; url: string; tipo: string; }
interface Social { id: string; plataforma: string; url: string; }
interface Address { id: string; calle: string; numero: string; localidad: string; provincia: string; tipo: string; }
interface Category { id: string; nombre: string; es_primaria: boolean; }

interface Entity {
    id?: string;
    nombre_legal: string;
    cuit: string;
    razon_social: string;
    tipo_entidad: string;
    descripcion: string;
    activa: boolean;
    manager_id?: string;
    telefonos?: Phone[];
    emails?: Email[];
    websites?: Website[];
    socials?: Social[];
    direcciones?: Address[];
    categorias?: Category[];
    etiquetas?: any[];
}

interface Option {
    value: string;
    label: string;
}

interface EntityFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (entity: Entity) => Promise<void>;
    initialData?: Entity | null;
}

export default function EntityFormModal({ isOpen, onClose, onSave, initialData }: EntityFormModalProps) {
    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState<Entity>({
        nombre_legal: '',
        cuit: '',
        razon_social: '',
        tipo_entidad: 'comercio',
        descripcion: '',
        activa: true,
        manager_id: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Master Data
    const [availableCategories, setAvailableCategories] = useState<any[]>([]);
    const [availableTags, setAvailableTags] = useState<any[]>([]);
    const [availableUsers, setAvailableUsers] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchMasterData();
        }
    }, [isOpen]);

    const fetchMasterData = async () => {
        try {
            const [catRes, tagRes, userRes] = await Promise.all([
                fetch('http://localhost:4000/api/categories'),
                fetch('http://localhost:4000/api/tags'),
                fetch('http://localhost:4000/api/users')
            ]);

            if (catRes.ok) setAvailableCategories(await catRes.json());
            if (tagRes.ok) setAvailableTags(await tagRes.json());
            if (userRes.ok) setAvailableUsers(await userRes.json());
        } catch (err) {
            console.error('Error fetching master data:', err);
        }
    };

    // Initial Data Effect
    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                nombre_legal: initialData.nombre_legal || '',
                cuit: initialData.cuit || '',
                razon_social: initialData.razon_social || '',
                tipo_entidad: initialData.tipo_entidad || 'comercio',
                descripcion: initialData.descripcion || '',
                activa: initialData.activa !== undefined ? initialData.activa : true,
                manager_id: initialData.manager_id || '',
                // Relations
                telefonos: initialData.telefonos || [],
                emails: initialData.emails || [],
                websites: initialData.websites || [],
                socials: initialData.socials || [],
                direcciones: initialData.direcciones || [],
                categorias: initialData.categorias || [],
                etiquetas: initialData.etiquetas || []
            });
            setActiveTab('general');
        } else {
            setFormData({
                nombre_legal: '',
                cuit: '',
                razon_social: '',
                tipo_entidad: 'comercio',
                descripcion: '',
                activa: true,
                manager_id: ''
            });
            setActiveTab('general');
        }
        setError(null);
    }, [initialData, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // Clean CUIT
        const cleanCuit = formData.cuit ? formData.cuit.replace(/\D/g, '') : '';
        if (cleanCuit && cleanCuit.length !== 11) {
            setError('El CUIT debe tener exactamente 11 dígitos numéricos');
            setIsLoading(false);
            return;
        }

        try {
            await onSave({ ...formData, cuit: cleanCuit });
            onClose();
        } catch (err: any) {
            setError(err.message || 'Error al guardar la entidad');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Generic List Handler ---
    const handleAddItem = async (endpoint: string, itemData: any, listKey: keyof Entity) => {
        if (!formData.id) return;
        try {
            const res = await fetch(`http://localhost:4000/api/entities/${formData.id}/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(itemData)
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.error || 'Error al agregar el ítem');
            }

            // Refetch entity to update everything correctly
            const fetchRes = await fetch(`http://localhost:4000/api/entities/${formData.id}`);
            if (fetchRes.ok) {
                const updatedEntity = await fetchRes.json();
                setFormData(updatedEntity);
            }
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Error al agregar el ítem');
        }
    };

    const handleRemoveItem = async (endpoint: string, itemId: string, listKey: keyof Entity) => {
        try {
            // If the endpoint already contains the entity id context (starts with /), use it as is
            const baseUrl = 'http://localhost:4000/api/entities';
            const url = endpoint.startsWith('/')
                ? `${baseUrl}${endpoint}`
                : `${baseUrl}/${endpoint}/${itemId}`;

            const res = await fetch(url, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error('Error deleting item');

            setFormData(prev => ({
                ...prev,
                [listKey]: (prev[listKey] as any[]).filter(i => i.id !== itemId)
            }));
        } catch (error) {
            console.error(error);
            setError('Error al eliminar el ítem');
        }
    };

    // --- Sub-Component: Generic List used in tabs ---
    const GenericList = ({
        title,
        items,
        onAdd,
        onRemove,
        fields,
        renderItem
    }: {
        title: string,
        items: any[],
        onAdd: (data: any) => Promise<void>,
        onRemove: (id: string) => Promise<void>,
        fields: { name: string, placeholder: string, type?: string, options?: (string | Option)[] }[],
        renderItem: (item: any) => React.ReactNode
    }) => {
        const [newItemData, setNewItemData] = useState<any>({});
        const [isAdding, setIsAdding] = useState(false);

        const handleAdd = async () => {
            // Basic validation: all fields must have a value
            const incomplete = fields.some(f => !newItemData[f.name]);
            if (incomplete) {
                setError('Por favor complete todos los campos requeridos');
                return;
            }

            setIsAdding(true);
            await onAdd(newItemData);
            setNewItemData({});
            setIsAdding(false);
        };

        return (
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                    <h3 className="font-semibold text-gray-300 text-sm uppercase tracking-wider">{title}</h3>
                </div>

                <div className="p-4 space-y-3">
                    {items.length === 0 && <p className="text-gray-500 text-sm italic py-2 text-center">No hay registros</p>}

                    {items.map((item, idx) => (
                        <div key={item.id || idx} className="flex justify-between items-center bg-black/20 rounded-lg p-3 group">
                            <div className="text-sm text-gray-300 flex-1">
                                {renderItem(item)}
                            </div>
                            <button
                                type="button"
                                onClick={() => onRemove(item.id)}
                                className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}

                    <div className="flex gap-2 mt-4 pt-3 border-t border-white/5">
                        {fields.map(field => (
                            field.options ? (
                                <select
                                    key={field.name}
                                    value={newItemData[field.name] || ''}
                                    onChange={e => setNewItemData({ ...newItemData, [field.name]: e.target.value })}
                                    className="bg-[#0f172a] border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 flex-1"
                                >
                                    <option value="" disabled className="bg-[#0f172a]">{field.placeholder}</option>
                                    {field.options.map((opt, i) => (
                                        typeof opt === 'string' ? (
                                            <option key={`${field.name}-opt-${i}`} value={opt} className="bg-[#0f172a]">{opt}</option>
                                        ) : (
                                            <option key={`${field.name}-opt-${i}`} value={opt.value} className="bg-[#0f172a]">{opt.label}</option>
                                        )
                                    ))}
                                </select>
                            ) : (
                                <input
                                    key={field.name}
                                    type={field.type || 'text'}
                                    placeholder={field.placeholder}
                                    value={newItemData[field.name] || ''}
                                    onChange={e => setNewItemData({ ...newItemData, [field.name]: e.target.value })}
                                    className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500/50 flex-1 min-w-0"
                                />
                            )
                        ))}
                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={isAdding}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 p-2 rounded-lg border border-blue-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            {isAdding ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> : <Plus size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // --- Tab Content Renderers ---

    const renderGeneralTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">
                        Nombre Legal <span className="text-red-400">*</span>
                    </label>
                    <input type="text" name="nombre_legal" value={formData.nombre_legal} onChange={handleChange} required className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Ej: Mi Empresa S.A." />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Razón Social</label>
                    <input type="text" name="razon_social" value={formData.razon_social} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Ej: Mi Empresa S.A." />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">CUIT</label>
                    <input type="text" name="cuit" value={formData.cuit} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors" placeholder="Ej: 20-12345678-9" />
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tipo de Entidad</label>
                    <select
                        name="tipo_entidad"
                        value={formData.tipo_entidad}
                        onChange={handleChange}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                    >
                        <option value="comercio" className="bg-[#0f172a]">Comercio</option>
                        <option value="servicio" className="bg-[#0f172a]">Servicio</option>
                        <option value="franquicia" className="bg-[#0f172a]">Franquicia</option>
                        <option value="profesional" className="bg-[#0f172a]">Profesional</option>
                        <option value="produccion" className="bg-[#0f172a]">Producción</option>
                    </select>
                </div>
                <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Gestor Asignado</label>
                    <select
                        name="manager_id"
                        value={formData.manager_id || ''}
                        onChange={handleChange}
                        className="w-full bg-[#0f172a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                    >
                        <option value="" className="bg-[#0f172a]">Sin asignar</option>
                        {availableUsers.map(u => (<option key={u.id} value={u.id} className="bg-[#0f172a]">{u.nombre_completo || u.email}</option>))}
                    </select>
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Descripción</label>
                    <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} rows={3} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500/50 transition-colors resize-none" placeholder="Breve descripción de la actividad..." />
                </div>
                <div className="col-span-2 flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
                    <input type="checkbox" name="activa" id="activa" checked={formData.activa} onChange={handleChange} className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-gray-900" />
                    <div>
                        <label htmlFor="activa" className="font-medium text-white block">Entidad Activa</label>
                        <p className="text-xs text-gray-400">Las entidades inactivas no aparecen en búsquedas públicas</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderContactTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <GenericList title="Teléfonos" items={formData.telefonos || []} onAdd={data => handleAddItem('phones', data, 'telefonos')} onRemove={id => handleRemoveItem('phones', id, 'telefonos')} fields={[{ name: 'numero', placeholder: 'Número' }, { name: 'tipo', placeholder: 'Tipo', options: ['movil', 'fijo', 'whatsapp'] }, { name: 'uso', placeholder: 'Uso', options: ['general', 'ventas', 'administracion'] }]} renderItem={item => (<div className="flex items-center gap-2"><Phone size={14} className="text-gray-500" /><span className="font-mono">{item.numero}</span><span className="text-xs bg-white/5 px-2 py-0.5 rounded text-gray-400 capitalize">{item.tipo}</span><span className="text-xs text-gray-500">({item.uso})</span></div>)} />
            <GenericList title="Emails" items={formData.emails || []} onAdd={data => handleAddItem('emails', data, 'emails')} onRemove={id => handleRemoveItem('emails', id, 'emails')} fields={[{ name: 'email', placeholder: 'Email', type: 'email' }, { name: 'uso', placeholder: 'Uso', options: ['general', 'facturacion', 'rrhh'] }]} renderItem={item => (<div className="flex items-center gap-2"><Mail size={14} className="text-gray-500" /><span>{item.email}</span><span className="text-xs text-gray-500">({item.uso})</span></div>)} />
            <GenericList title="Sitios Web" items={formData.websites || []} onAdd={data => handleAddItem('websites', data, 'websites')} onRemove={id => handleRemoveItem('websites', id, 'websites')} fields={[{ name: 'url', placeholder: 'URL' }, { name: 'tipo', placeholder: 'Tipo', options: ['web_principal', 'landing', 'catalogo'] }]} renderItem={item => (<div className="flex items-center gap-2"><Globe size={14} className="text-gray-500" /><a href={item.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[200px]">{item.url}</a><span className="text-xs text-gray-500">({item.tipo})</span></div>)} />
            <GenericList title="Redes Sociales" items={formData.socials || []} onAdd={data => handleAddItem('socials', data, 'socials')} onRemove={id => handleRemoveItem('socials', id, 'socials')} fields={[{ name: 'plataforma', placeholder: 'Plataforma', options: ['instagram', 'facebook', 'linkedin', 'twitter'] }, { name: 'url', placeholder: 'Usuario o URL' }]} renderItem={item => (<div className="flex items-center gap-2"><Share2 size={14} className="text-gray-500" /><span className="capitalize font-medium text-gray-300">{item.plataforma}:</span><span className="text-gray-400">{item.url}</span></div>)} />
        </div>
    );

    const renderLocationTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <GenericList title="Direcciones Físicas" items={formData.direcciones || []} onAdd={data => handleAddItem('addresses', data, 'direcciones')} onRemove={id => handleRemoveItem('addresses', id, 'direcciones')} fields={[{ name: 'calle', placeholder: 'Calle' }, { name: 'numero', placeholder: 'Altura' }, { name: 'localidad', placeholder: 'Localidad' }, { name: 'provincia', placeholder: 'Provincia', options: ['Buenos Aires', 'CABA', 'Córdoba', 'Santa Fe', 'Mendoza'] }, { name: 'tipo', placeholder: 'Tipo', options: ['principal', 'sucursal', 'deposito'] }]} renderItem={item => (<div className="flex items-start gap-2"><MapPin size={14} className="text-gray-500 mt-1" /><div className="flex flex-col"><span>{item.calle} {item.numero}</span><span className="text-xs text-gray-500">{item.localidad}, {item.provincia}</span><span className="text-[10px] bg-white/5 self-start px-2 rounded mt-1 text-gray-400 border border-white/5">{item.tipo}</span></div></div>)} />
        </div>
    );

    const renderCategoriesTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <GenericList title="Categorías Vinculadas" items={formData.categorias || []} onAdd={async (data) => { const { category_id, is_primary } = data; await handleAddItem('categories', { category_id, is_primary: is_primary === 'true' }, 'categorias'); }} onRemove={id => handleRemoveItem(`/${formData.id}/categories/${id}`, id, 'categorias')} fields={[{ name: 'category_id', placeholder: 'Seleccionar Categoría', options: availableCategories.map(c => ({ value: c.id, label: c.nombre })) }, { name: 'is_primary', placeholder: '¿Es Principal?', options: [{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No' }] }]} renderItem={item => (<div className="flex items-center gap-2"><Tag size={14} className={item.es_primaria ? "text-yellow-400" : "text-gray-500"} /><span className={item.es_primaria ? "font-bold text-white" : ""}>{item.nombre}</span>{item.es_primaria && <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20 uppercase font-bold text-xs ml-2">Principal</span>}</div>)} />
        </div>
    );

    const renderTagsTab = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            <GenericList title="Etiquetas de Segmentación" items={formData.etiquetas || []} onAdd={data => handleAddItem('tags', { tag_id: data.tag_id }, 'etiquetas')} onRemove={id => handleRemoveItem(`/${formData.id}/tags/${id}`, id, 'etiquetas')} fields={[{ name: 'tag_id', placeholder: 'Seleccionar Etiqueta', options: availableTags.map(t => ({ value: t.id, label: t.nombre })) }]} renderItem={item => (<div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: item.color_hex || '#ccc' }} /><span className="font-medium">{item.nombre}</span><span className="text-xs text-gray-500 ml-auto bg-white/5 px-2 py-0.5 rounded italic">{item.tipo}</span></div>)} />
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none" >
                        <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400"><Building2 size={20} /></div>
                                    <div><h2 className="text-xl font-bold text-white">{initialData ? 'Editar Entidad' : 'Nueva Entidad'}</h2><p className="text-sm text-gray-400">{initialData ? 'Gestione los detalles de la empresa' : 'Complete los datos de la empresa'}</p></div>
                                </div>
                                <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="flex border-b border-white/5 px-6 gap-6 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'general', label: 'General', icon: Building2 },
                                    { id: 'contact', label: 'Contacto', icon: Phone, disabled: !initialData },
                                    { id: 'location', label: 'Ubicación', icon: MapPin, disabled: !initialData },
                                    { id: 'categories', label: 'Categorías', icon: Tag, disabled: !initialData },
                                    { id: 'tags', label: 'Etiquetas', icon: Share2, disabled: !initialData },
                                ].map(tab => (
                                    <button key={tab.id} onClick={() => !tab.disabled && setActiveTab(tab.id)} disabled={tab.disabled} className={`py-4 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'} ${tab.disabled ? 'opacity-50 cursor-not-allowed' : ''}`} >
                                        <tab.icon size={16} />{tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                                <form id="entity-form" onSubmit={handleSubmit}>
                                    {error && (<div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl flex items-center gap-3 mb-6"><AlertCircle size={20} /><p className="text-sm">{error}</p></div>)}
                                    {activeTab === 'general' && renderGeneralTab()}
                                    {activeTab === 'contact' && renderContactTab()}
                                    {activeTab === 'location' && renderLocationTab()}
                                    {activeTab === 'categories' && renderCategoriesTab()}
                                    {activeTab === 'tags' && renderTagsTab()}
                                </form>
                            </div>
                            <div className="p-6 border-t border-white/5 bg-white/[0.02] flex justify-end gap-3">
                                <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-gray-400 font-medium hover:text-white hover:bg-white/5 transition-colors" >Cerrar</button>
                                {activeTab === 'general' && (
                                    <button type="submit" form="entity-form" disabled={isLoading} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed" >
                                        {isLoading ? (<div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />) : (<Save size={18} />)}
                                        {initialData ? 'Guardar Cambios' : 'Crear Entidad'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
