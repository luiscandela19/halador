'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface ReviewModalProps {
    isOpen: boolean
    onClose: () => void
    trip: any
    reviewerId: string
}

export function ReviewModal({ isOpen, onClose, trip, reviewerId }: ReviewModalProps) {
    const [rating, setRating] = useState(0)
    const [comment, setComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const supabase = createClient()

    if (!trip) return null

    const handleSubmit = async () => {
        if (rating === 0) return toast.error('Por favor selecciona una calificación')
        setIsSubmitting(true)

        try {
            const { error } = await supabase.from('reviews').insert({
                trip_id: trip.id,
                reviewer_id: reviewerId,
                reviewed_id: trip.driver_id,
                rating,
                comment
            })

            if (error) throw error

            toast.success('¡Gracias por tu opinión! ⭐')
            onClose()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border-none rounded-3xl shadow-2xl p-6">
                <DialogHeader>
                    <DialogTitle className="text-center text-xl font-black italic uppercase">Califica tu viaje</DialogTitle>
                    <p className="text-center text-sm text-muted-foreground">
                        {trip.from_loc} a {trip.to_loc}
                    </p>
                </DialogHeader>

                <div className="flex flex-col items-center gap-6 py-4">
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    className={`h-10 w-10 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-zinc-300 dark:text-zinc-700'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    <Textarea
                        placeholder="¿Qué tal estuvo el viaje? (Opcional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border-none resize-none h-24 rounded-xl"
                    />

                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full font-black uppercase tracking-widest h-12 text-lg bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ENVIAR RESEÑA'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
