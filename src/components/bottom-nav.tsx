'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, PlusCircle, User, Settings, LogOut, History } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth-provider'

export function BottomNav() {
    const pathname = usePathname()
    const { profile, signOut } = useAuth()

    // Hide on auth pages and landing
    if (pathname === '/' || pathname === '/login' || pathname === '/register') return null

    const isDriver = profile?.role === 'driver'

    const navItems = [
        {
            href: '/passenger',
            label: 'Buscar',
            icon: Search,
            visible: true
        },
        {
            href: '/driver',
            label: 'Publicar',
            icon: PlusCircle,
            visible: isDriver
        },
        {
            href: '/history',
            label: 'Historial',
            icon: History,
            visible: true
        },
        {
            href: '/profile',
            label: 'Mi Perfil',
            icon: User,
            visible: true
        },
        {
            href: '/admin',
            label: 'Admin',
            icon: Settings,
            visible: profile?.role === 'admin'
        }
    ]

    return (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 border-t bg-background/80 backdrop-blur-lg">
            <nav className="flex h-20 items-center justify-around px-4">
                {navItems.map((item) => {
                    if (!item.visible) return null
                    const Icon = item.icon
                    const isActive = pathname === item.href

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center space-y-1 w-16 h-16 rounded-2xl transition-all",
                                isActive ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className={cn("h-6 w-6", isActive && "stroke-[3px]")} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
                        </Link>
                    )
                })}
                <button
                    onClick={() => signOut()}
                    className="flex flex-col items-center justify-center space-y-1 w-16 h-16 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                >
                    <LogOut className="h-6 w-6" />
                    <span className="text-[10px] font-black uppercase tracking-tighter">Salir</span>
                </button>
            </nav>
        </div>
    )
}
