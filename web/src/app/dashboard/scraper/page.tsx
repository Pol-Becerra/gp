'use client';

import React, { useState, useEffect } from 'react';
import { Database, Check, X, Search, Filter, ExternalLink, Star, Phone, Globe, Plus, MapPin, Loader2, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RawData {
    id: string;
    nombre: string;
    rating: number | null;
    search_category: string;
    search_postal_code: string;
    google_maps_url: string;
    raw_info: string;
    website?: string;
    telefono?: string;
}

interface ScraperStats {
    total: number;
    inserted: number;
    updated: number;
    errors: number;
    withPhone: number;
    withWeb: number;
}

export default function ScraperAdmin() {
    const [data, setData] = useState<RawData[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);
    const [filterWithWeb, setFilterWithWeb] = useState(false);

    // Modal state
    const [isIdModalOpen, setIsIdModalOpen] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [newCP, setNewCP] = useState('');
    const [isScraping, setIsScraping] = useState(false);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);
    const [scraperStats, setScraperStats] = useState<ScraperStats | null>(null);
    const [isCleanModalOpen, setIsCleanModalOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanMessage, setCleanMessage] = useState<string | null>(null);
    const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:4000/api/raw-data');
            if (!res.ok) throw new Error('Failed to fetch');
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleRunScraper = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsScraping(true);
        setStatusMessage('Extrayendo datos de Google Maps...');
        setScraperStats(null);
        setAutoCloseCountdown(null);

        try {
            const res = await fetch('http://localhost:4000/api/scraper/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ category: newCategory, postalCode: newCP }),
            });
            const result = await res.json();

            if (result.status === 'success' && result.stats) {
                setScraperStats(result.stats);
                setStatusMessage('¡Extracción completada!');
            } else if (result.status === 'error') {
                setStatusMessage(`Error: ${result.error}`);
            } else {
                setStatusMessage(result.message || 'Proceso completado');
            }

            console.log('Scraper Result:', result);

            // Start 5 second countdown
            setAutoCloseCountdown(5);
            const countdownInterval = setInterval(() => {
                setAutoCloseCountdown(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(countdownInterval);
                        return null;
                    }
                    return prev - 1;
                });
            }, 1000);

            // Auto close after 5 seconds
            setTimeout(() => {
                setIsIdModalOpen(false);
                setStatusMessage(null);
                setScraperStats(null);
                setNewCategory('');
                setNewCP('');
                setAutoCloseCountdown(null);
                fetchData();
            }, 5000);

        } catch (err) {
            console.error('Scraper Error:', err);
            setStatusMessage('Error crítico al iniciar el scraper. Revisa la consola.');
            setScraperStats(null);
        } finally {
            setIsScraping(false);
        }
    };

    const handleApprove = async (id: string) => {
        setApprovingId(id);
        try {
            const res = await fetch(`http://localhost:4000/api/raw-data/${id}/approve`, {
                method: 'POST',
            });
            if (res.ok) {
                setData(prev => prev.filter(item => item.id !== id));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setApprovingId(null);
        }
    };

    const handleClean = async () => {
        setIsCleaning(true);
        setCleanMessage('Limpiando tabla data_google_maps...');
        try {
            const res = await fetch('http://localhost:4000/api/raw-data/clean', {
                method: 'DELETE',
            });
            const result = await res.json();

            if (result.success) {
                setCleanMessage(`✅ ${result.message}`);
                setData([]); // Clear the list
            } else {
                setCleanMessage('❌ Error al limpiar la tabla');
            }

            // Close modal after 3 seconds
            setTimeout(() => {
                setIsCleanModalOpen(false);
                setCleanMessage(null);
            }, 3000);
        } catch (err) {
            console.error('Clean Error:', err);
            setCleanMessage('❌ Error crítico al limpiar la tabla');
            setTimeout(() => {
                setIsCleaning(false);
            }, 2000);
        } finally {
            setIsCleaning(false);
        }
    };

    const filteredData = filterWithWeb
        ? data.filter(item => item.website && item.website.trim() !== '')
        : data;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Administración de Scraper</h1>
                    <p className="text-gray-400 mt-1">Revisa y aprueba los datos extraídos de Google Maps.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setIsCleanModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-500 text-white font-medium transition-all shadow-lg shadow-red-900/20 active:scale-95"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Limpiar DGM</span>
                    </button>
                    <button
                        onClick={() => setIsIdModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Insertar</span>
                    </button>
                    <button
                        onClick={() => setFilterWithWeb(!filterWithWeb)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${filterWithWeb
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                            : 'bg-slate-800/50 border-slate-700 text-gray-400 hover:border-slate-600'
                            }`}
                    >
                        <Globe className="w-4 h-4" />
                        <span className="text-sm font-medium">Solo con Web</span>
                    </button>
                    <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 flex items-center gap-2">
                        <Database className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">{filteredData.length} resultados</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <AnimatePresence mode="popLayout">
                    {loading ? (
                        <div className="flex items-center justify-center p-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    ) : filteredData.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center"
                        >
                            <Database className="w-12 h-12 text-slate-700 mx-auto mb-4" />
                            <h3 className="text-xl font-medium text-white">No hay datos pendientes</h3>
                            <p className="text-gray-400 mt-2">Ejecuta el scraper para obtener nuevos resultados.</p>
                        </motion.div>
                    ) : (
                        filteredData.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, x: 20 }}
                                className="group bg-slate-900/40 hover:bg-slate-800/60 border border-slate-800/50 hover:border-blue-500/30 rounded-xl p-5 transition-all duration-300"
                            >
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                {item.nombre}
                                            </h3>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                {item.search_category}
                                            </span>
                                            {item.search_postal_code && (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-800/50 text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {item.search_postal_code}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500/20" />
                                                <span>Rating: <b className="text-white">{item.rating || 'N/A'}</b></span>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Phone className="w-4 h-4 text-blue-400" />
                                                <span className="truncate">{item.telefono || 'Sin teléfono'}</span>
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-400">
                                                <Globe className="w-4 h-4 text-purple-400" />
                                                {item.website ? (
                                                    <a href={item.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline truncate max-w-[150px]">
                                                        Sitio Web
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-600">Sin web</span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2 text-gray-500 italic truncate text-xs">
                                                {item.raw_info}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 lg:border-l lg:border-slate-800/50 lg:pl-6">
                                        <a
                                            href={item.google_maps_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2.5 rounded-lg bg-slate-800/50 hover:bg-slate-700 text-gray-400 hover:text-white transition-all border border-transparent hover:border-slate-600"
                                            title="Ver en Google Maps"
                                        >
                                            <ExternalLink className="w-5 h-5" />
                                        </a>
                                        <button
                                            onClick={() => handleApprove(item.id)}
                                            disabled={approvingId === item.id}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                                        >
                                            {approvingId === item.id ? (
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Check className="w-5 h-5" />
                                            )}
                                            <span>Aprobar</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Modal de Inserción */}
            <AnimatePresence>
                {isIdModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-400" />
                                    Nuevo Scraper
                                </h2>
                                <button
                                    onClick={() => setIsIdModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleRunScraper} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Categoría a buscar
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={newCategory}
                                            onChange={(e) => setNewCategory(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                            placeholder="Ej: Ferreterías, Gimnasios..."
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1.5">
                                        Código Postal
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                        <input
                                            type="text"
                                            required
                                            value={newCP}
                                            onChange={(e) => setNewCP(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                                            placeholder="Ej: 1425, 1001..."
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        disabled={isScraping || !!statusMessage}
                                        onClick={() => setIsIdModalOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-gray-400 font-medium hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isScraping || !!statusMessage}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
                                    >
                                        {isScraping ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <Search className="w-4 h-4" />
                                        )}
                                        <span>{isScraping ? 'Procesando...' : 'Buscar'}</span>
                                    </button>
                                </div>
                            </form>

                            <div className="px-6 pb-6 pt-2 space-y-3">
                                {isScraping && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium"
                                    >
                                        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                        <p>{statusMessage}</p>
                                    </motion.div>
                                )}

                                {scraperStats && !isScraping && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium">
                                            <CheckCircle2 className="w-5 h-5 shrink-0" />
                                            <p>{statusMessage}</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-white">{scraperStats.total}</p>
                                                <p className="text-xs text-gray-400">Total Procesados</p>
                                            </div>
                                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-green-400">{scraperStats.inserted}</p>
                                                <p className="text-xs text-gray-400">Nuevos</p>
                                            </div>
                                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-blue-400">{scraperStats.updated}</p>
                                                <p className="text-xs text-gray-400">Actualizados</p>
                                            </div>
                                            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                                                <p className="text-2xl font-bold text-red-400">{scraperStats.errors}</p>
                                                <p className="text-xs text-gray-400">Errores</p>
                                            </div>
                                        </div>

                                        <div className="flex gap-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Phone className="w-4 h-4 text-blue-400" />
                                                <span>Con Teléfono: <b className="text-white">{scraperStats.total > 0 ? Math.round(scraperStats.withPhone / scraperStats.total * 100) : 0}%</b></span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-300">
                                                <Globe className="w-4 h-4 text-purple-400" />
                                                <span>Con Web: <b className="text-white">{scraperStats.total > 0 ? Math.round(scraperStats.withWeb / scraperStats.total * 100) : 0}%</b></span>
                                            </div>
                                        </div>

                                        {autoCloseCountdown !== null && (
                                            <p className="text-xs text-gray-500 text-center">
                                                Cerrando automáticamente en {autoCloseCountdown} segundos...
                                            </p>
                                        )}
                                    </motion.div>
                                )}

                                {!statusMessage && !scraperStats && (
                                    <p className="text-[10px] text-gray-500 text-center leading-relaxed">
                                        El proceso puede tardar unos minutos. Los resultados se guardarán automáticamente como "Nuevos" y aparecerán en esta lista al recargar.
                                    </p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de Confirmación para Limpiar DGM */}
            <AnimatePresence>
                {isCleanModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                        >
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Trash2 className="w-5 h-5 text-red-400" />
                                    Limpiar Data Google Maps
                                </h2>
                                <button
                                    onClick={() => setIsCleanModalOpen(false)}
                                    className="p-1 rounded-lg hover:bg-slate-800 text-gray-400 transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="p-6 space-y-4">
                                {!cleanMessage ? (
                                    <>
                                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                                            <p className="text-red-400 text-sm">
                                                <strong>⚠️ Advertencia:</strong> Esta acción eliminará <strong>TODOS</strong> los registros de la tabla data_google_maps de forma permanente.
                                            </p>
                                        </div>
                                        <p className="text-gray-400 text-sm">
                                            Esta operación no se puede deshacer. ¿Estás seguro de que deseas continuar?
                                        </p>
                                    </>
                                ) : (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="flex items-center gap-2 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium"
                                    >
                                        {isCleaning ? (
                                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                                        ) : (
                                            <Check className="w-4 h-4 shrink-0" />
                                        )}
                                        <p>{cleanMessage}</p>
                                    </motion.div>
                                )}

                                <div className="pt-4 flex gap-3">
                                    {!cleanMessage && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => setIsCleanModalOpen(false)}
                                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 text-gray-400 font-medium hover:bg-slate-800 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleClean}
                                                disabled={isCleaning}
                                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-900/20"
                                            >
                                                {isCleaning ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-4 h-4" />
                                                )}
                                                <span>{isCleaning ? 'Limpiando...' : 'Sí, Limpiar'}</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
