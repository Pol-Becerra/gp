'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Ticket, BarChart3, Settings, LogOut, Database, Tag } from 'lucide-react';

const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: Building2, label: 'Entidades', href: '/dashboard/entidades' },
    { icon: Tag, label: 'Categorías', href: '/dashboard/categorias' },
    { icon: Database, label: 'Admin Scraper', href: '/dashboard/scraper' },
    { icon: Ticket, label: 'Tickets', href: '/dashboard/tareas' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/analytics' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 size={18} />
                    </div>
                    <span className="font-bold">GuíaPymes <span className="text-[10px] text-blue-400 align-top">AD</span></span>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <item.icon size={20} />
                            <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/5">
                <button className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors w-full rounded-xl">
                    <LogOut size={20} />
                    <span className="text-sm font-medium">Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
}
