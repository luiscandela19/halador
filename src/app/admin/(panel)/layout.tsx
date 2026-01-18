'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { cn } from '@/lib/utils'
import { LayoutDashboard, CreditCard, Users, LogOut, ShieldCheck, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { profile, signOut } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(true)

    // Security
    React.useEffect(() => {
        if (profile && profile.role !== 'admin') {
            router.push('/')
        }
    }, [profile, router])

    if (!profile || profile.role !== 'admin') {
        return <div className="flex h-screen w-full items-center justify-center bg-zinc-950 text-white animate-pulse">Verificando Acceso Nivel Dios...</div>
    }

    const menuItems = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/payments', label: 'Aprobación Pagos', icon: CreditCard },
        { href: '/admin/users', label: 'Usuarios', icon: Users },
    ]

    return (
        <div className="flex h-screen w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
            {/* Sidebar */}
            <aside className={cn(
                "bg-zinc-950 text-white flex flex-col transition-all duration-300 shadow-2xl z-50",
                isSidebarOpen ? "w-64" : "w-16"
            )}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-zinc-800">
                    {isSidebarOpen && <span className="font-black italic text-xl tracking-tighter">HALADOR <span className="text-red-600">GOD</span></span>}
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-zinc-400 hover:text-white">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>

                <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
                    {menuItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all font-bold text-sm",
                                pathname === item.href
                                    ? "bg-red-600 text-white shadow-lg shadow-red-900/20"
                                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
                            )}
                        >
                            <item.icon className="h-5 w-5" />
                            {isSidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="p-4 border-t border-zinc-800">
                    <button
                        onClick={() => signOut()}
                        className={cn(
                            "flex items-center gap-3 w-full px-3 py-2 rounded-xl text-zinc-400 hover:bg-red-950/30 hover:text-red-500 transition-colors",
                            !isSidebarOpen && "justify-center"
                        )}
                    >
                        <LogOut className="h-5 w-5" />
                        {isSidebarOpen && <span className="font-bold text-sm">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="h-16 bg-white dark:bg-zinc-950 border-b flex items-center justify-between px-6 shadow-sm">
                    <h2 className="font-black uppercase tracking-widest text-zinc-500 text-sm flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-red-600" />
                        Panel de Administración
                    </h2>
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center font-black text-white text-xs">
                            {profile.full_name?.[0]}
                        </div>
                    </div>
                </header>
                <div className="flex-1 overflow-auto p-6">
                    {children}
                </div>
            </main>
        </div>
    )
}
