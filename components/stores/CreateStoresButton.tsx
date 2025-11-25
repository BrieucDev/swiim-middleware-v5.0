'use client'

import { createDemoStores } from '@/app/actions/stores'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Store } from 'lucide-react'

export function CreateStoresButton() {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await createDemoStores()
      if (result.success) {
        // Recharger la page après un court délai
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      } else {
        alert(result.message || 'Erreur lors de la création des magasins')
      }
    })
  }

  return (
    <Button
      variant="default"
      onClick={handleClick}
      disabled={isPending}
      className="rounded-full bg-[#C7FF06] text-gray-900 hover:bg-[#B0E605]"
    >
      <Store className="h-4 w-4 mr-2" />
      {isPending ? 'Création...' : 'Créer des magasins de démonstration'}
    </Button>
  )
}

