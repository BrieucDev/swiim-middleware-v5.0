'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { initializeLoyaltyProgram } from '@/app/actions/loyalty'
import { Sparkles } from 'lucide-react'

export function InitializeProgramButton() {
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleInitialize = () => {
    setMessage(null)
    startTransition(async () => {
      try {
        const result = await initializeLoyaltyProgram()
        if (result.success) {
          setMessage({ type: 'success', text: result.message || 'Programme initialisé avec succès !' })
          // Refresh the page after a short delay
          setTimeout(() => {
            window.location.reload()
          }, 1500)
        } else {
          setMessage({ 
            type: 'error', 
            text: result.error || 'Erreur lors de l\'initialisation' 
          })
        }
      } catch (error) {
        setMessage({ 
          type: 'error', 
          text: error instanceof Error ? error.message : 'Erreur inconnue' 
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Initialiser le programme de fidélité</h3>
            <p className="text-sm text-gray-500 mt-1">
              Créez un programme de fidélité par défaut avec 3 niveaux (Bronze, Argent, Or)
            </p>
          </div>
          <Button
            onClick={handleInitialize}
            disabled={isPending}
            className="rounded-full bg-[#C7FF06] text-gray-900 hover:bg-[#C7FF06]/90 font-semibold px-6"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isPending ? 'Initialisation...' : 'Initialiser le programme'}
          </Button>
        </div>
        {message && (
          <div className={`mt-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}
      </Card>
    </div>
  )
}

