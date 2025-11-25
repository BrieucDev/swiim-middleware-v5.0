import { retryWithFreshClient } from '@/lib/prisma'
import { PrismaClient } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, formatReceiptId, maskEmail } from '@/lib/format'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function getStore(id: string) {
  try {
  const store = await retryWithFreshClient(async (prisma: PrismaClient) => {
    return await prisma.store.findUnique({
    where: { id },
    include: {
      pos: {
        orderBy: { name: 'asc' },
      },
      receipts: {
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          customer: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20,
      },
    },
  })
  })

  if (!store) return null

  const receipts = store.receipts
  const revenue = receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0)
  const count = receipts.length
  const averageBasket = count > 0 ? revenue / count : 0

  // Top category
    let allReceipts: Array<{
      id: string
      storeId: string
      createdAt: Date
      lineItems: Array<{
        id: string
        category: string
        productName: string
        quantity: number
        unitPrice: any
      }>
    }> = []
    try {
      allReceipts = await retryWithFreshClient(async (prisma: PrismaClient) => {
        return await prisma.receipt.findMany({
    where: {
      storeId: store.id,
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    },
    include: {
      lineItems: true,
    },
  })
      })
    } catch (error) {
      console.error('Error fetching receipts for category analysis:', error)
    }

  const categoryCounts = new Map<string, number>()
  allReceipts.forEach((r) => {
    r.lineItems.forEach((item) => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
    })
  })

  const topCategory =
    categoryCounts.size > 0
      ? Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null

  return {
    ...store,
    stats: {
      revenue,
      count,
      averageBasket,
      topCategory,
    },
    }
  } catch (error) {
    console.error('Error fetching store:', error)
    return null
  }
}

export default async function MagasinDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const store = await getStore(params.id)

  if (!store) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{store.name}</h1>
        <p className="text-muted-foreground mt-2">
          Détails et performance du magasin
        </p>
      </div>

      {/* Store Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {store.address && (
              <div>
                <div className="text-sm text-muted-foreground">Adresse</div>
                <div className="font-medium">{store.address}</div>
              </div>
            )}
            {store.city && (
              <div>
                <div className="text-sm text-muted-foreground">Ville</div>
                <div className="font-medium">{store.city}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(store.stats.revenue)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets (30j)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.stats.count}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Panier moyen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(store.stats.averageBasket)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégorie principale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{store.stats.topCategory || '-'}</div>
          </CardContent>
        </Card>
      </div>

      {/* TPE */}
      <Card>
        <CardHeader>
          <CardTitle>TPE associés</CardTitle>
          <CardDescription>Terminaux de paiement du magasin</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Identifiant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière activité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.pos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Aucun TPE associé
                  </TableCell>
                </TableRow>
              ) : (
                store.pos.map((pos) => (
                  <TableRow key={pos.id}>
                    <TableCell className="font-medium">{pos.name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      {pos.identifier}
                    </TableCell>
                    <TableCell>
                      <Badge variant={pos.status === 'ACTIF' ? 'success' : 'default'}>
                        {pos.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {pos.lastSeenAt ? formatDate(pos.lastSeenAt) : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Receipts */}
      <Card>
        <CardHeader>
          <CardTitle>Derniers tickets</CardTitle>
          <CardDescription>20 derniers tickets du magasin</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Référence</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {store.receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    Aucun ticket récent
                  </TableCell>
                </TableRow>
              ) : (
                store.receipts.map((receipt) => (
                  <TableRow key={receipt.id}>
                    <TableCell className="font-mono font-medium">
                      {formatReceiptId(receipt.id)}
                    </TableCell>
                    <TableCell>
                      {receipt.customer ? maskEmail(receipt.customer.email) : '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(receipt.totalAmount))}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(receipt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/tickets/${receipt.id}`}>
                        <Button variant="ghost" size="sm">
                          Voir
                        </Button>
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

