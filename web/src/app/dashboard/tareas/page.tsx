'use client';

import React, { useState, useEffect } from 'react';
import {
    Ticket, Plus, Search, Edit2, Trash2, CheckCircle, Clock,
    AlertCircle, XCircle, User, Building, Loader2, X, Save,
    ChevronDown, Palette, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TicketData {
    id: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    entity_id: string | null;
    entidad_nombre: string | null;
    assigned_to: string | null;
    assigned_to_nombre: string | null;
    area_id: string | null;
    area_nombre: string | null;
    area_color: string | null;
    parent_id: string | null;
    sub_tickets_count: number;
    created_at: string;
    updated_at: string;
}

interface TicketStats {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
}

interface AreaData {
    id: string;
    nombre: string;
    descripcion: string | null;
    color_hex: string;
    ticket_count: number;
}

interface UserData {
    id: string;
    nombre_completo: string;
    email: string;
    rol: string;
}

const priorityColors = {
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-green-500/20 text-green-400 border-green-500/30'
};

const statusConfig = {
    Open: { icon: AlertCircle, color: 'text-blue-400', bg: 'bg-blue-500/20' },
    'In Progress': { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
    Resolved: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/20' },
    Closed: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-500/20' }
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.0.105:4000/api';

export default function TicketsPage() {
    const [tickets, setTickets] = useState<TicketData[]>([]);
    const [stats, setStats] = useState<TicketStats | null>(null);
    const [areas, setAreas] = useState<AreaData[]>([]);
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPriority, setFilterPriority] = useState<string>('');
    const [filterArea, setFilterArea] = useState<string>('');

    // Ticket Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<TicketData | null>(null);
    const [formData, setFormData] = useState({
        description: '',
        priority: 'Medium',
        status: 'Open',
        area_id: '',
        assigned_to: '',
        parent_id: ''
    });
    const [isSaving, setIsSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Area Modal state
    const [isAreaModalOpen, setIsAreaModalOpen] = useState(false);
    const [areaFormData, setAreaFormData] = useState({
        nombre: '',
        descripcion: '',
        color_hex: '#6366f1'
    });
    const [isSavingArea, setIsSavingArea] = useState(false);



    useEffect(() => {
        const loadData = async () => {
            await Promise.all([
                fetchTickets(),
                fetchStats(),
                fetchAreas(),
                fetchUsers()
            ]);
        };
        loadData();
    }, [filterStatus, filterPriority, filterArea]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus) params.append('status', filterStatus);
            if (filterPriority) params.append('priority', filterPriority);
            if (filterArea) params.append('area_id', filterArea);

            const url = `${API_URL}/tickets?${params.toString()}`;
            console.log(`[DEBUG] Fetching tickets from: ${url}`);

            const res = await fetch(url);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

            const data = await res.json();
            setTickets(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching tickets:', err);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch(`${API_URL}/tickets/stats`);
            if (!res.ok) return;
            const data = await res.json();
            setStats(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    };

    const fetchAreas = async () => {
        try {
            const res = await fetch(`${API_URL}/areas`);
            if (!res.ok) return;
            const data = await res.json();
            setAreas(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching areas:', err);
            setAreas([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_URL}/users/assignable`);
            if (!res.ok) return;
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error fetching users:', err);
            setUsers([]);
        }
    };

    const handleOpenModal = (ticket?: TicketData) => {
        if (ticket) {
            setEditingTicket(ticket);
            setFormData({
                description: ticket.description,
                priority: ticket.priority,
                status: ticket.status,
                area_id: ticket.area_id || '',
                assigned_to: ticket.assigned_to || '',
                parent_id: ticket.parent_id || ''
            });
        } else {
            setEditingTicket(null);
            setFormData({ description: '', priority: 'Medium', status: 'Open', area_id: '', assigned_to: '', parent_id: '' });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingTicket
                ? `${API_URL}/tickets/${editingTicket.id}`
                : `${API_URL}/tickets`;

            const method = editingTicket ? 'PUT' : 'POST';

            const body = {
                ...formData,
                area_id: formData.area_id || null,
                assigned_to: formData.assigned_to || null,
                parent_id: formData.parent_id || null
            };

            await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            setIsModalOpen(false);
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Error saving ticket:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await fetch(`${API_URL}/tickets/${id}`, { method: 'DELETE' });
            setDeleteConfirm(null);
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Error deleting ticket:', err);
        }
    };

    const handleStatusChange = async (id: string, status: string) => {
        try {
            await fetch(`${API_URL}/tickets/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            fetchTickets();
            fetchStats();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleCreateArea = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingArea(true);

        try {
            const res = await fetch(`${API_URL}/areas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(areaFormData)
            });
            const newArea = await res.json();

            // Add to areas list and select it
            setAreas([...areas, newArea]);
            setFormData({ ...formData, area_id: newArea.id });

            setIsAreaModalOpen(false);
            setAreaFormData({ nombre: '', descripcion: '', color_hex: '#6366f1' });
        } catch (err) {
            console.error('Error creating area:', err);
        } finally {
            setIsSavingArea(false);
        }
    };

    const filteredTickets = tickets.filter(t =>
        t.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <Ticket className="w-7 h-7 text-purple-400" />
                        Tickets / Tareas
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">
                        Gestión de tickets y tareas del equipo
                    </p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-all shadow-lg shadow-purple-900/30"
                >
                    <Plus className="w-5 h-5" />
                    Nuevo Ticket
                </button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                        <p className="text-3xl font-bold text-white">{stats.total}</p>
                        <p className="text-sm text-gray-400">Total Tickets</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                        <p className="text-3xl font-bold text-blue-400">{stats.open}</p>
                        <p className="text-sm text-gray-400">Abiertos</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                        <p className="text-3xl font-bold text-yellow-400">{stats.in_progress}</p>
                        <p className="text-sm text-gray-400">En Progreso</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                        <p className="text-3xl font-bold text-green-400">{stats.resolved}</p>
                        <p className="text-sm text-gray-400">Resueltos</p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                        type="text"
                        placeholder="Buscar tickets..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                </div>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                    <option value="">Todos los estados</option>
                    <option value="Open">Abierto</option>
                    <option value="In Progress">En Progreso</option>
                    <option value="Resolved">Resuelto</option>
                    <option value="Closed">Cerrado</option>
                </select>
                <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                    <option value="">Todas las prioridades</option>
                    <option value="High">Alta</option>
                    <option value="Medium">Media</option>
                    <option value="Low">Baja</option>
                </select>
                <select
                    value={filterArea}
                    onChange={(e) => setFilterArea(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                >
                    <option value="">Todas las áreas</option>
                    {areas.map(area => (
                        <option key={area.id} value={area.id}>{area.nombre}</option>
                    ))}
                </select>
            </div>

            {/* Tickets List */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
                    </div>
                ) : filteredTickets.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Ticket className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No hay tickets disponibles</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {filteredTickets.map((ticket) => {
                            const StatusIcon = statusConfig[ticket.status]?.icon || AlertCircle;
                            return (
                                <motion.div
                                    key={ticket.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-4 hover:bg-slate-800/30 transition-colors"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className={`p-2 rounded-lg shrink-0 ${statusConfig[ticket.status]?.bg || 'bg-gray-500/20'}`}>
                                                <StatusIcon className={`w-5 h-5 ${statusConfig[ticket.status]?.color || 'text-gray-400'}`} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="text-white font-medium line-clamp-2">
                                                    {ticket.description}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-400">
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${priorityColors[ticket.priority]}`}>
                                                        {ticket.priority === 'High' ? 'Alta' : ticket.priority === 'Medium' ? 'Media' : 'Baja'}
                                                    </span>
                                                    {ticket.area_nombre && (
                                                        <span
                                                            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                                                            style={{
                                                                backgroundColor: `${ticket.area_color}20`,
                                                                color: ticket.area_color || '#6366f1',
                                                                border: `1px solid ${ticket.area_color}40`
                                                            }}
                                                        >
                                                            <Layers className="w-3 h-3" />
                                                            {ticket.area_nombre}
                                                        </span>
                                                    )}
                                                    {ticket.assigned_to_nombre && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3.5 h-3.5" />
                                                            {ticket.assigned_to_nombre}
                                                        </span>
                                                    )}
                                                    {ticket.sub_tickets_count > 0 && (
                                                        <span className="flex items-center gap-1 text-purple-400">
                                                            <ChevronDown className="w-3.5 h-3.5" />
                                                            {ticket.sub_tickets_count} sub-tickets
                                                        </span>
                                                    )}
                                                    <span className="whitespace-nowrap">{formatDate(ticket.created_at)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end sm:self-start mt-2 sm:mt-0">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                                                className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none max-w-[100px]"
                                            >
                                                <option value="Open">Abierto</option>
                                                <option value="In Progress">En Progreso</option>
                                                <option value="Resolved">Resuelto</option>
                                                <option value="Closed">Cerrado</option>
                                            </select>
                                            <button
                                                onClick={() => handleOpenModal(ticket)}
                                                className="p-2 text-gray-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteConfirm(ticket.id)}
                                                className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create/Edit Ticket Modal */}
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
                            className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800 shrink-0">
                                <h2 className="text-xl font-bold text-white">
                                    {editingTicket ? 'Editar Ticket' : 'Nuevo Ticket'}
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Descripción *
                                    </label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 resize-none"
                                        placeholder="Describe el ticket o tarea..."
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {/* Área con botón + */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Área
                                        </label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.area_id}
                                                onChange={(e) => setFormData({ ...formData, area_id: e.target.value })}
                                                className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            >
                                                <option value="">Seleccionar área...</option>
                                                {areas.map(area => (
                                                    <option key={area.id} value={area.id}>{area.nombre}</option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setIsAreaModalOpen(true)}
                                                className="px-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition-all shrink-0"
                                                title="Crear nueva área"
                                            >
                                                <Plus className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Usuario asignado */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Asignar a
                                        </label>
                                        <select
                                            value={formData.assigned_to}
                                            onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        >
                                            <option value="">Sin asignar</option>
                                            {users.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.nombre_completo} ({user.rol})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Prioridad
                                        </label>
                                        <select
                                            value={formData.priority}
                                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        >
                                            <option value="High">Alta</option>
                                            <option value="Medium">Media</option>
                                            <option value="Low">Baja</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-2">
                                            Estado
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        >
                                            <option value="Open">Abierto</option>
                                            <option value="In Progress">En Progreso</option>
                                            <option value="Resolved">Resuelto</option>
                                            <option value="Closed">Cerrado</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Ticket padre (para sub-tickets) */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Ticket Padre (opcional)
                                    </label>
                                    <select
                                        value={formData.parent_id}
                                        onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                    >
                                        <option value="">Ninguno (ticket principal)</option>
                                        {tickets.filter(t => t.id !== editingTicket?.id).map(t => (
                                            <option key={t.id} value={t.id}>
                                                {t.description.substring(0, 80)}{t.description.length > 80 ? '...' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-slate-800 mt-2">
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

            {/* Create Area Modal */}
            <AnimatePresence>
                {isAreaModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsAreaModalOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-slate-800">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Layers className="w-5 h-5 text-purple-400" />
                                    Nueva Área
                                </h2>
                                <button
                                    onClick={() => setIsAreaModalOpen(false)}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-slate-800 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateArea} className="p-6 space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={areaFormData.nombre}
                                        onChange={(e) => setAreaFormData({ ...areaFormData, nombre: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        placeholder="Ej: Instagram, Servidores, Diseño..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Descripción
                                    </label>
                                    <input
                                        type="text"
                                        value={areaFormData.descripcion}
                                        onChange={(e) => setAreaFormData({ ...areaFormData, descripcion: e.target.value })}
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                        placeholder="Descripción opcional..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                        Color
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="color"
                                            value={areaFormData.color_hex}
                                            onChange={(e) => setAreaFormData({ ...areaFormData, color_hex: e.target.value })}
                                            className="w-12 h-12 rounded-lg border border-slate-700 cursor-pointer"
                                        />
                                        <input
                                            type="text"
                                            value={areaFormData.color_hex}
                                            onChange={(e) => setAreaFormData({ ...areaFormData, color_hex: e.target.value })}
                                            className="flex-1 bg-slate-800 border border-slate-700 rounded-lg p-3 text-white font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                                            placeholder="#6366f1"
                                        />
                                        <div
                                            className="w-12 h-12 rounded-lg border border-slate-600"
                                            style={{ backgroundColor: areaFormData.color_hex }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAreaModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 border border-slate-700 text-gray-400 font-medium rounded-lg hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSavingArea}
                                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 rounded-lg transition-all disabled:opacity-50"
                                    >
                                        {isSavingArea ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Plus className="w-4 h-4" />
                                        )}
                                        <span>{isSavingArea ? 'Creando...' : 'Crear Área'}</span>
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
                                    ¿Eliminar ticket?
                                </h3>
                                <p className="text-gray-400 mb-6">
                                    Esta acción no se puede deshacer.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirm(null)}
                                        className="flex-1 px-4 py-2.5 border border-slate-700 text-gray-400 font-medium rounded-lg hover:bg-slate-800 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={() => handleDelete(deleteConfirm)}
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
