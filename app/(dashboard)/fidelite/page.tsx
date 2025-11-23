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
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import { getLoyaltyStats } from '@/lib/analytics/loyalty'
import { LoyaltyProgramEditor } from '@/components/fidelite/LoyaltyProgramEditor'
import { CampaignCreator } from '@/components/fidelite/CampaignCreator'
import { ImpactSimulator } from '@/components/fidelite/ImpactSimulator'
import { Pencil } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getTopLoyalCustomers() {
  try {
    const accounts = await prisma.loyaltyAccount.findMany({
    include: {
      customer: {
        include: {
          receipts: {
            include: {
              lineItems: true,
            },
          },
        },
      },
      tier: true,
    },
    orderBy: {
      totalSpend: 'desc',
    },
    take: 10,
  })

  return accounts.map((account) => {
    const receipts = account.customer.receipts
    const visits = receipts.length

    // Calculate frequency
    const firstReceipt = receipts.length > 0 ? receipts[receipts.length - 1] : null
    const lastReceipt = receipts.length > 0 ? receipts[0] : null
    const daysDiff =
      firstReceipt && lastReceipt
        ? Math.ceil((lastReceipt.createdAt.getTime() - firstReceipt.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0
    const avgFrequency = visits > 1 && daysDiff > 0 ? daysDiff / (visits - 1) : 0

    // Top categories
    const categoryCounts = new Map<string, number>()
    receipts.forEach((r) => {
      r.lineItems.forEach((item) => {
        categoryCounts.set(item.category, (categoryCounts.get(item.category) || 0) + 1)
      })
    })
    const topCategories = Array.from(categoryCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    return {
      id: account.customer.id,
      name: `${account.customer.firstName} ${account.customer.lastName}`,
      email: account.customer.email,
      tier: account.tier?.name || 'Non classé',
      points: account.points,
      totalSpend: account.totalSpend,
      frequency: avgFrequency,
      topCategories,
    }
  })
  } catch (error) {
    console.error('Error fetching top loyal customers:', error)
    return []
  }
}

async function getCampaigns() {
  try {
    return await prisma.loyaltyCampaign.findMany({
    include: {
      program: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return []
  }
}

export default async function FidelitePage() {
  const stats = await getLoyaltyStats()
  const topCustomers = await getTopLoyalCustomers()
  const campaigns = await getCampaigns()

  if (!stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Fidélité</h1>
          <p className="text-muted-foreground mt-2">
            Aucun programme de fidélité configuré
          </p>
        </div>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'success' | 'warning'> = {
      TERMINEE: 'success',
      PROGRAMMEE: 'warning',
      BROUILLON: 'default',
    }
    return variants[status] || 'default'
  }

  const getChannelBadge = (channel: string) => {
    const variants: Record<string, 'default' | 'secondary'> = {
      EMAIL: 'default',
      PUSH: 'secondary',
      INAPP: 'secondary',
    }
    return variants[channel] || 'default'
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Fidélité</h1>
        <p className="text-sm text-gray-500 mt-2">
          Gestion du programme de fidélité et campagnes
        </p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Membres</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{stats.totalMembers.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-gray-400 mt-2">
              Membres actifs
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Points en circulation</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{stats.pointsInCirculation.toLocaleString('fr-FR')}</div>
            <p className="text-xs text-gray-400 mt-2">
              Points non utilisés
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">Taux d&apos;engagement</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{stats.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-gray-400 mt-2">
              Activité 60 derniers jours
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-6 pt-6">
            <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.14em]">CA généré (30j)</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="text-2xl md:text-3xl font-semibold text-gray-900">{formatCurrency(stats.loyaltyRevenue)}</div>
            <p className="text-xs text-gray-400 mt-2">
              Clients fidélisés
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
          <TabsTrigger value="program">Règles du programme</TabsTrigger>
          <TabsTrigger value="tiers">Niveaux de fidélité</TabsTrigger>
          <TabsTrigger value="customers">Top clients</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="simulator">Simulateur</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-base font-semibold text-gray-900">Distribution des niveaux</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="space-y-6">
                  {stats.tierDistribution.map((tier) => (
                    <div key={tier.tier} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-900">{tier.tier}</div>
                        <div className="text-sm text-gray-500">
                          {tier.count} membres
                        </div>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#C7FF06]"
                          style={{
                            width: `${(tier.count / stats.totalMembers) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-base font-semibold text-gray-900">Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Points totaux</span>
                  <span className="font-semibold text-gray-900">{stats.totalPoints.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Points utilisés</span>
                  <span className="font-semibold text-gray-900">{stats.pointsUsed.toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Total dépensé</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(stats.program.accounts.reduce((sum, a) => sum + a.totalSpend, 0))}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="program" className="space-y-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold text-gray-900">Règles du programme</CardTitle>
                  <CardDescription className="text-sm text-gray-500">{stats.program.name}</CardDescription>
                </div>
                <LoyaltyProgramEditor program={stats.program} />
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Points par euro</div>
                  <div className="text-2xl md:text-3xl font-semibold text-gray-900">{stats.program.pointsPerEuro} point</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Conversion</div>
                  <div className="text-2xl md:text-3xl font-semibold text-gray-900">
                    {stats.program.conversionRate} points = {formatCurrency(stats.program.conversionValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Bonus catégories</div>
                  <div>
                    {stats.program.bonusCategories ? (
                      Object.entries(stats.program.bonusCategories as Record<string, number>).map(([cat, mult]) => (
                        <Badge key={cat} variant="outline" className="mr-2 rounded-full border-gray-200">
                          {cat}: x{mult}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400">Aucun</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Expiration des points</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {stats.program.pointsExpiryDays ? `${stats.program.pointsExpiryDays / 30} mois` : 'Aucune'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tiers" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-3">
            {stats.tierDistribution.map((tierInfo) => {
              const tier = stats.program.tiers.find(t => t.name === tierInfo.tier)
              if (!tier) return null

              const benefits = tier.benefits as Record<string, any> || {}

              return (
                <Card key={tier.id} className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
                  <CardHeader className="px-6 pt-6">
                    <CardTitle className="text-base font-semibold text-gray-900">{tier.name}</CardTitle>
                    <CardDescription className="text-sm text-gray-500">
                      {formatCurrency(tier.minSpend)}
                      {tier.maxSpend && ` - ${formatCurrency(tier.maxSpend)}`}
                      {!tier.maxSpend && '+'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Membres</div>
                      <div className="text-2xl md:text-3xl font-semibold text-gray-900">{tierInfo.count}</div>
                    </div>
                    {Object.keys(benefits).length > 0 && (
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Avantages</div>
                        <ul className="text-sm space-y-1">
                          {Object.entries(benefits).map(([key, value]) => (
                            <li key={key} className="text-gray-600">
                              • {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Top clients fidèles</CardTitle>
              <CardDescription className="text-sm text-gray-500">Clients les plus engagés</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                    <TableHead className="font-semibold text-gray-600 pl-6">Client</TableHead>
                    <TableHead className="font-semibold text-gray-600">Email</TableHead>
                    <TableHead className="font-semibold text-gray-600">Niveau</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Points</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Total dépensé</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Fréquence</TableHead>
                    <TableHead className="font-semibold text-gray-600 pr-6">Catégories</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                      <TableCell className="font-semibold text-gray-900 pl-6">{customer.name}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {customer.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={customer.tier === 'Or' ? 'warning' : customer.tier === 'Argent' ? 'default' : 'secondary'} className="rounded-full">
                          {customer.tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {customer.points.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(customer.totalSpend)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-gray-600">
                        {customer.frequency > 0 ? `${customer.frequency.toFixed(0)} jours` : '-'}
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex flex-wrap gap-1">
                          {customer.topCategories.map((cat) => (
                            <Badge key={cat} variant="outline" className="text-xs rounded-full border-gray-200">
                              {cat}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">Campagnes</h2>
              <p className="text-sm text-gray-500 mt-2">
                Gestion des campagnes marketing et promotions
              </p>
            </div>
            <CampaignCreator programId={stats.program.id} />
          </div>

          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6 bg-gray-50/50 border-b border-gray-100">
              <CardTitle className="text-base font-semibold text-gray-900">Liste des campagnes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                    <TableHead className="font-semibold text-gray-600 pl-6">Nom</TableHead>
                    <TableHead className="font-semibold text-gray-600">Segment</TableHead>
                    <TableHead className="font-semibold text-gray-600">Canal</TableHead>
                    <TableHead className="font-semibold text-gray-600">Statut</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Ouverture</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600">Conversion</TableHead>
                    <TableHead className="text-right font-semibold text-gray-600 pr-6">CA généré</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {campaigns.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                        Aucune campagne
                      </TableCell>
                    </TableRow>
                  ) : (
                    campaigns.map((campaign) => {
                      const stats = campaign.stats as any || {}
                      const sent = stats.sent || 0
                      const opened = stats.opened || 0
                      const clicked = stats.clicked || 0
                      const conversions = stats.conversions || 0
                      const openRate = sent > 0 ? (opened / sent) * 100 : 0
                      const conversionRate = sent > 0 ? (conversions / sent) * 100 : 0

                      return (
                        <TableRow key={campaign.id} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                          <TableCell className="font-semibold text-gray-900 pl-6">{campaign.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="rounded-full border-gray-200">{campaign.targetSegment}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getChannelBadge(campaign.channel)} className="rounded-full">
                              {campaign.channel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={campaign.status} />
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {openRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right text-sm text-gray-600">
                            {conversionRate.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 pr-6">
                            {formatCurrency(stats.extraRevenue || 0)}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="simulator" className="space-y-4">
          <ImpactSimulator programId={stats.program.id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

