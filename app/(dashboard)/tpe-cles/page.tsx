import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { CreateTerminalDialog } from '@/components/tpe/CreateTerminalDialog'
import { formatDate } from '@/lib/format'
import { Plus } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getTerminals() {
  try {
    return await prisma.posTerminal.findMany({
      include: {
        store: true,
      },
      orderBy: {
        name: 'asc',
      },
    })
  } catch (error) {
    console.error('Error fetching terminals:', error)
    return []
  }
}

async function getStores() {
  try {
    return await prisma.store.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return []
  }
}

export default async function TPEClesPage() {
  const terminals = await getTerminals()
  const stores = await getStores()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">TPE & Clés</h1>
          <p className="text-sm text-gray-500 mt-2">
            Gestion des terminaux de paiement et clés d&apos;authentification
          </p>
        </div>
        <CreateTerminalDialog stores={stores} />
      </div>

      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Terminaux de paiement</CardTitle>
          <CardDescription className="text-sm text-gray-500">Liste de tous les TPE configurés</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Nom</TableHead>
                <TableHead className="font-semibold text-gray-600">Identifiant</TableHead>
                <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                <TableHead className="font-semibold text-gray-600 pr-6">Dernière activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terminals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Aucun terminal configuré
                  </TableCell>
                </TableRow>
              ) : (
                terminals.map((terminal) => (
                  <TableRow key={terminal.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                    <TableCell className="font-semibold text-gray-900 pl-6">{terminal.name}</TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {terminal.identifier}
                    </TableCell>
                    <TableCell className="text-gray-600">{terminal.store.name}</TableCell>
                    <TableCell>
                      <StatusBadge status={terminal.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 pr-6">
                      {terminal.lastSeenAt ? formatDate(terminal.lastSeenAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

