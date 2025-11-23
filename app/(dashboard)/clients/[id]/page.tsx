import { prisma } from '@/lib/prisma'
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
import { formatCurrency, formatDate, formatDateTime, maskEmail, formatReceiptId } from '@/lib/format'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

async function getCustomer(id: string) {
  try {
    const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      receipts: {
        include: {
          store: true,
          lineItems: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
      loyaltyAccount: {
        include: {
          tier: true,
          program: true,
        },
      },
    },
  })

  if (!customer) return null

  const receipts = customer.receipts
  const totalSpend = receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0)

  // Top categories
  const categoryCounts = new Map<string, number>()
  receipts.forEach((r) => {
    r.lineItems.forEach((item) => {
      categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
    })
  })
  const topCategories = Array.from(categoryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category]) => category)

  // Main store (most visited)
  const storeCounts = new Map<string, number>()
  receipts.forEach((r) => {
    storeCounts.set(r.storeId, (storeCounts.get(r.storeId) || 0) + 1)
  })
  const mainStoreId =
    storeCounts.size > 0
      ? Array.from(storeCounts.entries()).sort((a, b) => b[1] - a[1])[0][0]
      : null
  let mainStore = null
  if (mainStoreId) {
    try {
      mainStore = await prisma.store.findUnique({ where: { id: mainStoreId } })
    } catch (error) {
      console.error('Error fetching main store:', error)
    }
  }

  // Frequency
  const visits = receipts.length
  const firstReceipt = receipts.length > 0 ? receipts[receipts.length - 1] : null
  const lastReceipt = receipts.length > 0 ? receipts[0] : null
  const daysDiff =
    firstReceipt && lastReceipt
      ? Math.ceil((lastReceipt.createdAt.getTime() - firstReceipt.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      : 0
  const avgDaysBetweenVisits = visits > 1 && daysDiff > 0 ? daysDiff / (visits - 1) : 0

  // Segments
  const segments: string[] = []
  if (avgDaysBetweenVisits < 30 && visits >= 3) segments.push('Petits paniers récurrents')
  if (totalSpend > 500 && visits < 5) segments.push('Gros paniers occasionnels')
  if (lastReceipt) {
    const daysSinceLastVisit = Math.ceil(
      (Date.now() - lastReceipt.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysSinceLastVisit > 40) segments.push('Inactifs 40j+')
  }
  if (topCategories.length >= 3) segments.push('Explorateurs multi-catégories')

  return {
    ...customer,
    stats: {
      totalSpend,
      visits,
      topCategories,
      mainStore: mainStore?.name || null,
      avgDaysBetweenVisits,
      segments,
    },
  }
}

export default async function ClientDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
          {customer.firstName} {customer.lastName}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          Profil et historique du client
        </p>
      </div>

      {/* Hero Card */}
      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardContent className="px-6 pt-6 pb-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="h-20 w-20 rounded-full bg-gray-900 flex items-center justify-center text-white text-2xl font-semibold">
                {customer.firstName[0]}{customer.lastName[0]}
              </div>
            </div>
            <div className="flex-1 grid gap-6 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Nom</div>
                <div className="font-semibold text-gray-900 text-lg">
                  {customer.firstName} {customer.lastName}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Email</div>
                <div className="font-semibold text-gray-900">{maskEmail(customer.email)}</div>
              </div>
              {customer.stats.mainStore && (
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Magasin principal</div>
                  <div className="font-semibold text-gray-900">{customer.stats.mainStore}</div>
                </div>
              )}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Membre depuis</div>
                <div className="font-semibold text-gray-900">{formatDate(customer.createdAt)}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Account */}
      {customer.loyaltyAccount && (
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base font-semibold text-gray-900">Fidélité</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Niveau</div>
                <Badge
                  variant={
                    customer.loyaltyAccount.tier?.name === 'Or'
                      ? 'warning'
                      : customer.loyaltyAccount.tier?.name === 'Argent'
                      ? 'default'
                      : 'secondary'
                  }
                  className="rounded-full"
                >
                  {customer.loyaltyAccount.tier?.name || 'Non classé'}
                </Badge>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Points</div>
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">{customer.loyaltyAccount.points}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Total dépensé</div>
                <div className="text-2xl md:text-3xl font-semibold text-gray-900">
                  {formatCurrency(customer.loyaltyAccount.totalSpend)}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Dernière activité</div>
                <div className="font-semibold text-gray-900">
                  {customer.loyaltyAccount.lastActivity
                    ? formatDate(customer.loyaltyAccount.lastActivity)
                    : '-'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Total dépensé</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{formatCurrency(customer.stats.totalSpend)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Nombre de visites</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{customer.stats.visits}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Fréquence moyenne</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">
              {customer.stats.avgDaysBetweenVisits > 0
                ? `${customer.stats.avgDaysBetweenVisits.toFixed(0)} jours`
                : '-'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Panier moyen</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">
              {customer.stats.visits > 0
                ? formatCurrency(customer.stats.totalSpend / customer.stats.visits)
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Segments */}
      {customer.stats.segments.length > 0 && (
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base font-semibold text-gray-900">Segments</CardTitle>
            <CardDescription className="text-sm text-gray-500">Classification du client</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {customer.stats.segments.map((segment) => (
                <Badge key={segment} variant="outline" className="rounded-full border-gray-200">
                  {segment}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Categories */}
      {customer.stats.topCategories.length > 0 && (
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base font-semibold text-gray-900">Catégories principales</CardTitle>
            <CardDescription className="text-sm text-gray-500">Catégories les plus achetées</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-wrap gap-2">
              {customer.stats.topCategories.map((category) => (
                <Badge key={category} variant="secondary" className="rounded-full">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Receipts Timeline */}
      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Historique des tickets</CardTitle>
          <CardDescription className="text-sm text-gray-500">Derniers tickets du client</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Référence</TableHead>
                <TableHead className="font-semibold text-gray-600">Magasin</TableHead>
                <TableHead className="font-semibold text-gray-600">Date</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Montant</TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customer.receipts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-400 py-8">
                    Aucun ticket
                  </TableCell>
                </TableRow>
              ) : (
                customer.receipts.map((receipt) => (
                  <TableRow key={receipt.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                    <TableCell className="font-mono font-semibold text-gray-900 pl-6">
                      {formatReceiptId(receipt.id)}
                    </TableCell>
                    <TableCell className="text-gray-600">{receipt.store.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDateTime(receipt.createdAt)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(Number(receipt.totalAmount))}
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

