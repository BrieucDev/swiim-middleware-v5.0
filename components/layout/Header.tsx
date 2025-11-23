'use client'

import { useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GenerateDataButton } from '@/components/generate-data-button'

export function Header({ stores }: { stores: Array<{ id: string; name: string }> }) {
  const [selectedStore, setSelectedStore] = useState<string>('all')

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 bg-white/90 backdrop-blur-sm px-8">
      <div className="flex items-center gap-4">
        <Select value={selectedStore} onValueChange={setSelectedStore}>
          <SelectTrigger className="w-[200px] rounded-full border-gray-200 bg-white">
            <SelectValue placeholder="Tous les magasins" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les magasins</SelectItem>
            {stores.map((store) => (
              <SelectItem key={store.id} value={store.id}>
                {store.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-4">
        <GenerateDataButton />
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">Admin Swiim</div>
        </div>
        <Avatar className="h-8 w-8">
          <AvatarFallback className="bg-gray-900 text-white text-xs">AS</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}

