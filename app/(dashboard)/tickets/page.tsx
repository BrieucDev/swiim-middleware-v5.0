import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
import { formatCurrency, formatDate, formatReceiptId, maskEmail } from '@/lib/format'
import Link from 'next/link'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getReceipts(searchParams: { status?: string; store?: string; query?: string }) {
  try {
    const where: any = {}

    if (searchParams.status) {
      where.status = searchParams.status
    }

    if (searchParams.store && searchParams.store !== 'all') {
      where.storeId = searchParams.store
    }

    if (searchParams.query) {
      where.OR = [
        { id: { contains: searchParams.query, mode: 'insensitive' } },
        { customer: { email: { contains: searchParams.query, mode: 'insensitive' } } },
      ]
    }

    return await prisma.receipt.findMany({
      where,
      include: {
        store: true,
        pos: true,
        customer: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })
  } catch (error) {
    console.error('Error fetching receipts:', error)
    return []
  }
}

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: { status?: string; store?: string; query?: string }
}) {
  const receipts = await getReceipts(searchParams)
  
  let stores: Array<{ id: string; name: string }> = []
  try {
    stores = await prisma.store.findMany({ orderBy: { name: 'asc' } })
  } catch (error) {
    console.error('Error fetching stores:', error)
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Tickets</h1>
        <p className="text-sm text-gray-500 mt-2">
          Gestion et consultation des tickets de caisse
        </p>
      </div>

      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-base font-semibold text-gray-900">Filtres</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <form method="get" className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                name="query"
                placeholder="Rechercher par référence ou email..."
                defaultValue={searchParams.query}
                className="pl-10 rounded-full border-gray-200"
              />
            </div>
            <select
              name="status"
              defaultValue={searchParams.status || 'all'}
              className="h-10 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900"
            >
              <option value="all">Tous les statuts</option>
              <option value="EMIS">Émis</option>
              <option value="RECLAME">Réclamé</option>
              <option value="REMBOURSE">Remboursé</option>
              <option value="ANNULE">Annulé</option>
            </select>
            <select
              name="store"
              defaultValue={searchParams.store || 'all'}
              className="h-10 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900"
            >
              <option value="all">Tous les magasins</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="rounded-full bg-gray-900 text-white hover:bg-gray-800">Filtrer</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Liste des tickets</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Référence</TableHead>
                <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                <TableHead className="font-semibold text-gray-600">TPE</TableHead>
                <TableHead className="font-semibold text-gray-600">Client</TableHead>
                <TableHead className="font-semibold text-gray-600">Montant</TableHead>
                <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-gray-400 py-8">
                    Aucun ticket trouvé
                  </TableCell>
                </TableRow>
              ) : (
                receipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                    <TableCell className="font-mono font-medium text-gray-900 pl-6">
                      {formatReceiptId(receipt.id)}
                    </TableCell>
                    <TableCell className="text-gray-900">{receipt.store.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {receipt.pos.name}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {receipt.customer ? maskEmail(receipt.customer.email) : '-'}
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">
                      {formatCurrency(Number(receipt.totalAmount))}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={receipt.status} />
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(receipt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/tickets/${receipt.id}`}>
                        <Button variant="ghost" size="sm" className="rounded-full">Voir</Button>
                      </Link>
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

