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
import { KpiCard } from '@/components/dashboard/kpi-card'
import { Users, Coins, TrendingUp, Euro } from 'lucide-react'
import { initializeLoyaltyProgram } from '@/app/actions/loyalty'
import { InitializeProgramButton } from '@/components/fidelite/InitializeProgramButton'

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
  let stats
  let error: string | null = null
  
  try {
    stats = await getLoyaltyStats()
  } catch (err) {
    console.error('[FidelitePage] Error fetching loyalty stats:', err)
    error = err instanceof Error ? err.message : 'Erreur inconnue'
  }
  
  const topCustomers = await getTopLoyalCustomers()
  const campaigns = await getCampaigns()

  if (!stats) {
    return (
      <div className="space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fidélité</h1>
          <p className="text-gray-500 mt-2">
            Aucun programme de fidélité configuré
          </p>
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Erreur:</strong> {error}
              </p>
              <p className="text-xs text-red-600 mt-2">
                Vérifiez que les tables LoyaltyProgram et LoyaltyTier existent dans votre base de données Supabase.
              </p>
            </div>
          )}
          <div className="mt-6">
            <InitializeProgramButton />
          </div>
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
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">Fidélité</h1>
        <p className="text-base text-gray-500">
          Gestion complète de votre programme de fidélité et campagnes marketing
        </p>
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Membres inscrits"
          value={stats.totalMembers.toLocaleString('fr-FR')}
          description="Membres actifs"
          icon={Users}
        />
        <KpiCard
          title="Points en circulation"
          value={stats.pointsInCirculation.toLocaleString('fr-FR')}
          description="Points non utilisés"
          icon={Coins}
        />
        <KpiCard
          title="Taux d'engagement"
          value={`${stats.engagementRate.toFixed(1)}%`}
          description="Activité 60 derniers jours"
          icon={TrendingUp}
        />
        <KpiCard
          title="CA généré (30j)"
          value={formatCurrency(stats.loyaltyRevenue)}
          description="Clients fidélisés"
          icon={Euro}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-white/90 border border-gray-100 rounded-2xl p-1.5 shadow-sm">
          <TabsTrigger 
            value="overview"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Vue d&apos;ensemble
          </TabsTrigger>
          <TabsTrigger 
            value="program"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Règles du programme
          </TabsTrigger>
          <TabsTrigger 
            value="tiers"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Niveaux de fidélité
          </TabsTrigger>
          <TabsTrigger 
            value="customers"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Top clients
          </TabsTrigger>
          <TabsTrigger 
            value="campaigns"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Campagnes
          </TabsTrigger>
          <TabsTrigger 
            value="simulator"
            className="rounded-xl data-[state=active]:bg-[#C7FF06] data-[state=active]:text-gray-900 data-[state=active]:font-semibold"
          >
            Simulateur
          </TabsTrigger>
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
                      <div className="h-3 bg-gray-100/80 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full bg-gradient-to-r from-[#C7FF06] to-[#B8E600] rounded-full transition-all duration-500 shadow-sm"
                          style={{
                            width: `${stats.totalMembers > 0 ? (tier.count / stats.totalMembers) * 100 : 0}%`,
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

        <TabsContent value="program" className="space-y-6">
          <Card className="bg-white/90 border border-gray-100/70 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)] hover:shadow-[0_10px_40px_rgba(15,23,42,0.08)] transition-shadow">
            <CardHeader className="px-6 pt-6 pb-4 border-b border-gray-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-gray-900">Règles du programme</CardTitle>
                  <CardDescription className="text-sm text-gray-500 mt-1">{stats.program.name}</CardDescription>
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
                  <div className="flex flex-wrap gap-2">
                    {stats.program.bonusCategories ? (
                      Object.entries(stats.program.bonusCategories as Record<string, number>).map(([cat, mult]) => (
                        <Badge 
                          key={cat} 
                          variant="outline" 
                          className="rounded-full border-[#C7FF06]/30 bg-[#C7FF06]/10 text-gray-900 font-medium px-3 py-1"
                        >
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
              const tier = stats.program.tiers.find((t: { name: string }) => t.name === tierInfo.tier)
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

