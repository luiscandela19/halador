'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && profile) {
      // Force hard redirect to avoid Next.js caching issues with layouts
      if (profile.role === 'admin') window.location.href = '/admin'
      else if (profile.role === 'driver') window.location.href = '/driver'
      else window.location.href = '/passenger'
    }
  }, [user, profile, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (user && !profile && !loading) {
    // Edge case: User is auth'd but has no profile (DB inconsistent)
    // We force logout to clean state
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-destructive" />
        <p className="text-sm font-bold text-destructive">Error de perfil. Cerrando sesión...</p>
        <Button onClick={() => signOut()} variant="destructive" size="sm">Forzar Salida</Button>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 font-bold uppercase tracking-widest text-sm">Validando acceso...</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background to-muted p-8 text-center space-y-12">
      <div className="space-y-4">
        <div className="w-24 h-24 bg-primary rounded-[2rem] mx-auto flex items-center justify-center rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
          <span className="text-4xl font-black text-primary-foreground italic">H</span>
        </div>
        <div>
          <h1 className="text-5xl font-black tracking-tighter italic">HALADOR</h1>
          <p className="text-muted-foreground font-bold uppercase tracking-[0.2em] text-xs">V2 • Conecta, viaja, llega.</p>
        </div>
      </div>

      <div className="w-full max-w-xs space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Button asChild className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-xl shadow-primary/20">
          <Link href="/login">Iniciar Sesión <ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest">
          <Link href="/register">Crear Cuenta</Link>
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground uppercase font-black tracking-[0.3em] opacity-40 pt-10">
        © {new Date().getFullYear()} Halador Inc.
      </p>
    </div>
  )
}
