import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

async function getStoresWithStats() {
  try {
    const stores = await prisma.store.findMany({
    include: {
      receipts: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
      },
      _count: {
        select: {
          pos: true,
        },
      },
    },
    orderBy: {
      name: 'asc',
    },
  })

  return stores.map((store) => {
    const receipts = store.receipts
    const revenue = receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0)
    const count = receipts.length
    const claimed = receipts.filter((r) => r.status === 'RECLAME').length
    const claimedRate = count > 0 ? (claimed / count) * 100 : 0

    return {
      id: store.id,
      name: store.name,
      city: store.city,
      address: store.address,
      revenue,
      receiptCount: count,
      claimedRate,
      terminalCount: store._count.pos,
    }
  })
  } catch (error) {
    console.error('Error fetching stores:', error)
    return []
  }
}

export default async function MagasinsPage() {
  const stores = await getStoresWithStats()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Magasins</h1>
        <p className="text-sm text-gray-500 mt-2">
          Gestion et performance des magasins
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Card key={store.id} className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-semibold text-gray-900">{store.name}</CardTitle>
              <CardDescription className="text-sm text-gray-500">{store.city || 'Non spécifié'}</CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">CA (30j)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(store.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tickets (30j)</span>
                  <span className="font-semibold text-gray-900">{store.receiptCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Taux de réclamation</span>
                  <span className="font-semibold text-gray-900">{store.claimedRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">TPE actifs</span>
                  <span className="font-semibold text-gray-900">{store.terminalCount}</span>
                </div>
              </div>
              <Link href={`/magasins/${store.id}`}>
                <Button variant="outline" className="w-full rounded-full border-gray-200">Voir les détails</Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Vue d&apos;ensemble</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Magasin</TableHead>
                <TableHead className="font-semibold text-gray-600">Ville</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">CA (30j)</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Tickets (30j)</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Taux de réclamation</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">TPE</TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stores.map((store) => (
                <TableRow key={store.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                  <TableCell className="font-semibold text-gray-900 pl-6">{store.name}</TableCell>
                  <TableCell className="text-gray-600">{store.city || '-'}</TableCell>
                  <TableCell className="text-right font-semibold text-gray-900">
                    {formatCurrency(store.revenue)}
                  </TableCell>
                  <TableCell className="text-right text-gray-600">{store.receiptCount}</TableCell>
                  <TableCell className="text-right text-gray-600">{store.claimedRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-gray-600">{store.terminalCount}</TableCell>
                  <TableCell className="text-right pr-6">
                    <Link href={`/magasins/${store.id}`}>
                      <Button variant="ghost" size="sm" className="rounded-full">Voir</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

