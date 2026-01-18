'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CreditCard, Car, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black italic tracking-tighter">Resumen Global</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Usuarios Totales', value: '1,234', icon: Users, color: 'text-blue-500' },
                    { label: 'Viajes Activos', value: '56', icon: Car, color: 'text-indigo-500' },
                    { label: 'Ingresos Mensuales', value: 'S/ 15,400', icon: TrendingUp, color: 'text-green-500' },
                    { label: 'Pagos Pendientes', value: '12', icon: CreditCard, color: 'text-yellow-500' },
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-lg hover:translate-y-[-4px] transition-transform duration-300">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</CardTitle>
                            <stat.icon className={`h-5 w-5 ${stat.color}`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-black">{stat.value}</div>
                            <p className="text-xs text-muted-foreground mt-1">+20.1% vs mes anterior</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-lg border-none h-[400px]">
                    <CardHeader>
                        <CardTitle>Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-full text-muted-foreground font-medium italic">
                        Gráficos en construcción...
                    </CardContent>
                </Card>
                <Card className="shadow-lg border-none h-[400px]">
                    <CardHeader>
                        <CardTitle>Mapa de Calor</CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-full text-muted-foreground font-medium italic">
                        Mapa en construcción...
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
