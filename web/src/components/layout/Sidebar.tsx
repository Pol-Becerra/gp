'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Building2, Ticket, BarChart3, Settings, LogOut, Database, Tag, Layers, Menu, X, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const menuItems = [
    { icon: LayoutDashboard, label: 'Resumen', href: '/dashboard' },
    { icon: Building2, label: 'Entidades', href: '/dashboard/entidades' },
    { icon: Tag, label: 'Categorías', href: '/dashboard/categorias' },
    { icon: Ticket, label: 'Tickets', href: '/dashboard/tareas' },
    { icon: Layers, label: 'Áreas', href: '/dashboard/areas' },
    { icon: BarChart3, label: 'Estadísticas', href: '/dashboard/analytics' },
    { icon: Database, label: 'Admin Scraper', href: '/dashboard/scraper', roles: ['admin', 'super_admin'] },
    { icon: Users, label: 'Usuarios', href: '/dashboard/usuarios', roles: ['admin', 'super_admin'] },
];

export function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = React.useState(false);
    const { user, logout } = useAuth();

    // Close sidebar when route changes (mobile)
    React.useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    return (
        <>
            {/* Mobile Toggle Button (FAB) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="md:hidden fixed bottom-6 right-6 z-[60] p-4 bg-blue-600 text-white rounded-full shadow-xl hover:bg-blue-500 transition-all active:scale-95 border border-white/10"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Backdrop for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar Container */}
            <div className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col h-screen transition-transform duration-300 ease-in-out
                md:relative md:translate-x-0
                ${isOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                            <Building2 size={18} />
                        </div>
                        <span className="font-bold">GuíaPymes <span className="text-[10px] text-blue-400 align-top">AD</span></span>
                    </div>
                    {/* Close button inside sidebar for mobile */}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="md:hidden text-gray-400 hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.filter(item => !item.roles || (user && item.roles.includes(user.rol))).map((item) => {
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
                    {user && (
                        <div className="mb-4 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
                            <p className="text-sm font-medium text-white truncate">{user.nombre_completo}</p>
                            <p className="text-xs text-gray-500 truncate capitalize">{user.rol.replace('_', ' ')}</p>
                        </div>
                    )}
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-red-400 transition-colors w-full rounded-xl hover:bg-white/5"
                    >
                        <LogOut size={20} />
                        <span className="text-sm font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </div>
        </>
    );
}
