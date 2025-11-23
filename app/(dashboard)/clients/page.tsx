import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate, maskEmail } from '@/lib/format'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getCustomers(searchParams: { query?: string; tier?: string; activity?: string }) {
  try {
    const where: any = {}

    if (searchParams.query) {
      where.OR = [
        { firstName: { contains: searchParams.query, mode: 'insensitive' } },
        { lastName: { contains: searchParams.query, mode: 'insensitive' } },
        { email: { contains: searchParams.query, mode: 'insensitive' } },
      ]
    }

    const customers = await prisma.customer.findMany({
    where,
    include: {
      receipts: {
        include: {
          lineItems: true,
        },
      },
      loyaltyAccount: {
        include: {
          tier: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  return customers
    .map((customer) => {
      const receipts = customer.receipts
      const totalSpend = receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0)
      const lastReceipt = receipts.length > 0
        ? receipts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]
        : null
      const lastVisit = lastReceipt?.createdAt
      const isActive = lastVisit && lastVisit >= thirtyDaysAgo

      return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
        tier: customer.loyaltyAccount?.tier?.name || null,
        receiptCount: receipts.length,
        lastVisit,
        totalSpend,
        isActive,
      }
    })
    .filter((c) => {
      if (searchParams.tier && searchParams.tier !== 'all') {
        if (searchParams.tier === 'none' && c.tier) return false
        if (searchParams.tier !== 'none' && c.tier !== searchParams.tier) return false
      }
      if (searchParams.activity) {
        if (searchParams.activity === 'active' && !c.isActive) return false
        if (searchParams.activity === 'inactive' && c.isActive) return false
      }
      return true
    })
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: { query?: string; tier?: string; activity?: string }
}) {
  const customers = await getCustomers(searchParams)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Clients</h1>
        <p className="text-sm text-gray-500 mt-2">
          Gestion et suivi des clients
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
                placeholder="Rechercher par nom ou email..."
                defaultValue={searchParams.query}
                className="pl-10 rounded-full border-gray-200"
              />
            </div>
            <select
              name="tier"
              defaultValue={searchParams.tier || 'all'}
              className="h-10 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900"
            >
              <option value="all">Tous les niveaux</option>
              <option value="Or">Or</option>
              <option value="Argent">Argent</option>
              <option value="Bronze">Bronze</option>
              <option value="none">Aucun niveau</option>
            </select>
            <select
              name="activity"
              defaultValue={searchParams.activity || 'all'}
              className="h-10 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900"
            >
              <option value="all">Tous</option>
              <option value="active">Actifs (30 derniers jours)</option>
              <option value="inactive">Inactifs (&gt;30 jours)</option>
            </select>
            <Button type="submit" className="rounded-full bg-gray-900 text-white hover:bg-gray-800">Filtrer</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
        <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
          <CardTitle className="text-base font-semibold text-gray-900">Liste des clients</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Client</TableHead>
                <TableHead className="font-semibold text-gray-600">Email</TableHead>
                <TableHead className="font-semibold text-gray-600">Niveau fidélité</TableHead>
                <TableHead className="font-semibold text-gray-600">Nombre de tickets</TableHead>
                <TableHead className="font-semibold text-gray-600">Dernière visite</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Total dépensé</TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                    Aucun client trouvé
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                    <TableCell className="font-semibold text-gray-900 pl-6">
                      {customer.firstName} {customer.lastName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {maskEmail(customer.email)}
                    </TableCell>
                    <TableCell>
                      {customer.tier ? (
                        <Badge variant={customer.tier === 'Or' ? 'warning' : customer.tier === 'Argent' ? 'default' : 'secondary'} className="rounded-full">
                          {customer.tier}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{customer.receiptCount}</TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {customer.lastVisit ? formatDate(customer.lastVisit) : '-'}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(customer.totalSpend)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Link href={`/clients/${customer.id}`}>
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

