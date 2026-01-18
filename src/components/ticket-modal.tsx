'use client'

import React from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Plane, Bus, MapPin, Calendar, Clock, User, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TicketModalProps {
    isOpen: boolean
    onClose: () => void
    trip: any
    passengerName: string
}

export function TicketModal({ isOpen, onClose, trip, passengerName }: TicketModalProps) {
    if (!trip) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                <div className="bg-white dark:bg-zinc-900 w-full max-w-sm mx-auto rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 relative">
                    {/* Header aka "Tear off" section */}
                    <div className="bg-indigo-600 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Plane className="h-24 w-24 transform rotate-12" />
                        </div>
                        <div className="relative z-10 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter">BOARDING PASS</h2>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Halador Official Ticket</p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6 relative bg-white dark:bg-zinc-900">
                        {/* Cities */}
                        <div className="flex justify-between items-center">
                            <div className="text-left">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Origen</p>
                                <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-100 uppercase leading-none">{trip.from_loc?.substring(0, 3)}</h3>
                                <p className="text-xs font-bold text-muted-foreground truncate max-w-[80px]">{trip.from_loc}</p>
                            </div>
                            <div className="flex-1 px-4 flex flex-col items-center">
                                <div className="w-full h-0.5 bg-zinc-200 dark:bg-zinc-700 relative flex items-center justify-center">
                                    <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 p-1.5 rounded-full">
                                        <Bus className="h-4 w-4 text-indigo-500" />
                                    </div>
                                </div>
                                <p className="text-[10px] font-bold text-indigo-500 mt-1">Premium</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Destino</p>
                                <h3 className="text-2xl font-black text-indigo-950 dark:text-indigo-100 uppercase leading-none">{trip.to_loc?.substring(0, 3)}</h3>
                                <p className="text-xs font-bold text-muted-foreground truncate max-w-[80px]">{trip.to_loc}</p>
                            </div>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-800/50 p-4 rounded-2xl">
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Pasajero</p>
                                <div className="flex items-center gap-2">
                                    <User className="h-3 w-3 text-indigo-500" />
                                    <p className="font-bold text-sm truncate">{passengerName}</p>
                                </div>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Asiento</p>
                                <p className="font-black text-sm">ASIGNADO</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Fecha</p>
                                <p className="font-bold text-sm">{trip.date}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mb-1">Hora</p>
                                <p className="font-bold text-sm">{trip.time}</p>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center pt-2 space-y-2">
                            <div className="bg-white p-2 rounded-xl border-2 border-dashed border-zinc-300">
                                <QrCode className="h-24 w-24 text-zinc-900" />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground font-medium uppercase">Muestra este código al conductor</p>
                        </div>
                    </div>

                    {/* Footer / Cutout effect */}
                    <div className="absolute top-[140px] -left-3 h-6 w-6 rounded-full bg-black dark:bg-black"></div>
                    <div className="absolute top-[140px] -right-3 h-6 w-6 rounded-full bg-black dark:bg-black"></div>

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-dashed">
                        <Button className="w-full font-black uppercase tracking-widest" onClick={onClose}>Cerrar Ticket</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
