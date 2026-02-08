'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Users, Building2, Ticket, TrendingUp } from 'lucide-react';

const stats = [
    { label: 'Entidades Totales', value: '1,240', icon: Building2, color: 'text-blue-400' },
    { label: 'Tickets Abiertos', value: '12', icon: Ticket, color: 'text-orange-400' },
    { label: 'Ingesta Diaria', value: '+45', icon: TrendingUp, color: 'text-green-400' },
    { label: 'Gestores Activos', value: '4', icon: Users, color: 'text-purple-400' },
];

export default function DashboardSummary() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold mb-2">Resumen General</h1>
                <p className="text-gray-400">Panel de control de GuíaPymes System v2.0</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all"
                    >
                        <div className={`p-3 w-fit rounded-xl bg-white/5 mb-4 ${stat.color}`}>
                            <stat.icon size={24} />
                        </div>
                        <div className="text-2xl font-bold mb-1">{stat.value}</div>
                        <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 glass rounded-3xl p-8">
                    <h2 className="text-xl font-bold mb-6">Últimas Entidades Ingestadas</h2>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/[0.08] transition-colors border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                                        <Building2 size={20} />
                                    </div>
                                    <div>
                                        <div className="font-semibold">Comercios S.A. {i + 1}</div>
                                        <div className="text-xs text-gray-500">CABA, Buenos Aires</div>
                                    </div>
                                </div>
                                <div className="text-xs font-mono px-2 py-1 rounded-md bg-green-500/10 text-green-400 uppercase tracking-wider">
                                    Validado
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass rounded-3xl p-8">
                    <h2 className="text-xl font-bold mb-6">Tickets Urgentes</h2>
                    <div className="space-y-4">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border-l-4 border-orange-500">
                                <div className="text-sm font-bold mb-1">Revisión de CUIT Fallida</div>
                                <div className="text-xs text-gray-400 mb-2 truncate">La empresa presenta inconsistencias en...</div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] uppercase font-bold text-orange-400 tracking-widest">Alta</span>
                                    <button className="text-[10px] text-blue-400 font-bold hover:underline">VER DETALLE</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
