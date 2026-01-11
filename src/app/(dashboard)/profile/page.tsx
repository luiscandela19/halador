'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ShieldCheck, Star, User, LogOut, Phone, Check, Edit2, CreditCard, MapPin, Calendar, CarFront, X, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function ProfilePage() {
    const { profile, signOut } = useAuth()
    const supabase = createClient()

    const [phone, setPhone] = useState('')
    const [isEditingPhone, setIsEditingPhone] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (profile?.phone) {
            setPhone(profile.phone)
        }
    }, [profile])

    const handleSavePhone = async () => {
        if (!profile) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ phone })
                .eq('id', profile.id)

            if (error) throw error
            toast.success('Teléfono actualizado')
            setIsEditingPhone(false)
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const [isEditingCar, setIsEditingCar] = useState(false)
    const [carBrand, setCarBrand] = useState('')
    const [carModel, setCarModel] = useState('')
    const [carColor, setCarColor] = useState('')
    const [carPlate, setCarPlate] = useState('')

    useEffect(() => {
        if (profile) {
            setCarBrand(profile.car_brand || '')
            setCarModel(profile.car_model || '')
            setCarColor(profile.car_color || '')
            setCarPlate(profile.car_plate || '')
        }
    }, [profile])

    const handleSaveCar = async () => {
        if (!profile) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    car_brand: carBrand,
                    car_model: carModel,
                    car_color: carColor,
                    car_plate: carPlate
                })
                .eq('id', profile.id)

            if (error) throw error
            toast.success('Vehículo actualizado')
            setIsEditingCar(false)
            // Trigger a reload to refresh the profile in context? 
            // The AuthProvider should handle realtime updates if subscribed, but we might want to manually refresh or just rely on local state updates if we want instant feedback. 
            // Ideally we'd call a refreshProfile function from useAuth, but we don't have one exposed. 
            // However, the dashboard has a realtime listener for the profile. 
            // We can just rely on the local state for now or simple window reload if needed, but let's try just updating the DB.
            window.location.reload()
        } catch (error: any) {
            toast.error('Error: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    if (!profile) return null

    const initials = profile.full_name
        ?.split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()

    return (
        <div className="flex flex-col space-y-6 p-4 pb-20">
            <header className="py-4 border-b">
                <h1 className="text-2xl font-black italic tracking-tighter">MI PERFIL</h1>
                <p className="text-muted-foreground text-sm font-medium">Gestiona tu identidad y reputación</p>
            </header>

            <div className="flex flex-col items-center space-y-4 py-6 animate-in fade-in slide-in-from-bottom-4">
                <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-primary shadow-xl">
                        <AvatarImage src={profile.avatar_url || ''} />
                        <AvatarFallback className="text-4xl font-black bg-muted text-muted-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    {profile.is_verified && (
                        <Badge className="absolute -bottom-2 px-3 py-1 left-1/2 -translate-x-1/2 bg-green-600 border-2 border-white text-[10px] font-black uppercase tracking-widest animate-in zoom-in">
                            Verificado
                        </Badge>
                    )}
                </div>

                <div className="text-center w-full">
                    <h2 className="text-2xl font-black uppercase tracking-tight">{profile.full_name}</h2>
                    <Badge variant="outline" className="mt-1 font-bold text-xs uppercase tracking-widest text-primary border-primary/50">
                        {profile.role === 'driver' ? 'Conductor Oficial' : 'Pasajero Verificado'}
                    </Badge>

                    <div className="mt-4 flex items-center justify-center gap-2">
                        {isEditingPhone ? (
                            <div className="flex items-center gap-2 animate-in zoom-in-95">
                                <Input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="w-40 h-8 text-sm font-bold text-center"
                                    placeholder="+51 999..."
                                />
                                <Button size="sm" onClick={handleSavePhone} disabled={loading} className="h-8 w-8 rounded-full bg-green-600 hover:bg-green-700">
                                    <Check className="h-4 w-4 text-white" />
                                </Button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditingPhone(true)} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                <Phone className="h-4 w-4" />
                                <span className="text-sm font-bold">{phone || 'Agregar celular para WhatsApp'}</span>
                                <Edit2 className="h-3 w-3 opacity-50" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-md bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-transparent">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-3xl font-black text-indigo-600">{profile.rating_average || '5.0'}</span>
                        <div className="flex text-yellow-500 mb-1">
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                            <Star className="h-3 w-3 fill-current" />
                        </div>
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{profile.rating_count || 0} Reseñas</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-transparent">
                    <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                        <span className="text-3xl font-black text-emerald-600">{profile.trips_completed || 0}</span>
                        <ShieldCheck className="h-4 w-4 text-emerald-500 mb-1" />
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Viajes Completados</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
                <CardHeader>
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        Estado de Cuenta
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full text-green-600">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase">Identidad</p>
                                <p className="text-[10px] text-muted-foreground">DNI Validado por Halador</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">OK</Badge>
                    </div>

                    {profile.role === 'driver' && (
                        <div className="flex flex-col gap-3 p-3 bg-muted/30 rounded-lg">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full text-blue-600">
                                        <CarFront className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase">Mi Vehículo</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            Información visible para pasajeros
                                        </p>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => setIsEditingCar(!isEditingCar)} className="h-8 w-8 p-0">
                                    {isEditingCar ? <X className="h-4 w-4" /> : <Edit2 className="h-4 w-4 opacity-50" />}
                                </Button>
                            </div>

                            {isEditingCar ? (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 pt-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="Marca (ej. Toyota)" value={carBrand} onChange={e => setCarBrand(e.target.value)} className="h-8 text-xs font-bold" />
                                        <Input placeholder="Modelo (ej. Yaris)" value={carModel} onChange={e => setCarModel(e.target.value)} className="h-8 text-xs font-bold" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Input placeholder="Color (ej. Gris)" value={carColor} onChange={e => setCarColor(e.target.value)} className="h-8 text-xs font-bold" />
                                        <Input placeholder="Placa (ABC-123)" value={carPlate} onChange={e => setCarPlate(e.target.value)} className="h-8 text-xs font-bold uppercase" />
                                    </div>
                                    <Button size="sm" onClick={handleSaveCar} className="w-full h-8 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest">
                                        <Save className="h-3 w-3 mr-2" />
                                        Guardar Vehículo
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between pl-12 bg-background/50 p-2 rounded border border-dashed">
                                    <div className="text-left">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground">Vehículo</p>
                                        <p className="text-xs font-bold text-foreground uppercase">{profile.car_brand || '---'} {profile.car_model}</p>
                                        <p className="text-[10px] text-muted-foreground">{profile.car_color}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-black text-muted-foreground">Placa</p>
                                        <div className="bg-yellow-400 text-black px-2 py-0.5 rounded text-xs font-black font-mono border-2 border-black">
                                            {profile.car_plate || '---'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full text-yellow-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-xs font-bold uppercase">Suscripción</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {profile.subscription_status === 'active'
                                        ? `Vence: ${new Date(profile.subscription_end_date!).toLocaleDateString()}`
                                        : profile.subscription_status === 'pending'
                                            ? 'Pago en revisión'
                                            : 'Sin suscripción activa'}
                                </p>
                            </div>
                        </div>
                        <Badge variant={profile.subscription_status === 'active' ? 'default' : 'secondary'} className="text-[10px] uppercase">
                            {profile.subscription_status === 'active' ? 'ACTIVA' : profile.subscription_status === 'pending' ? 'PENDIENTE' : 'INACTIVA'}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            <Button variant="destructive" className="w-full h-12 font-black uppercase tracking-widest" onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" /> Cerrar Sesión
            </Button>

            <p className="text-center text-[10px] text-muted-foreground uppercase font-black tracking-widest pt-4 opacity-50">
                Halador V2 • Build 1.0.3
            </p>
        </div>
    )
}
