import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { ExportButton } from '@/components/export-button'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TicketsChart } from '@/components/dashboard/tickets-chart'
import { BarChart } from '@/components/dashboard/bar-chart'
import { PieChart } from '@/components/dashboard/pie-chart'
import { StackedBarChart } from '@/components/dashboard/stacked-bar-chart'
import { formatCurrency } from '@/lib/format'
import {
  getBusinessOverviewDemo,
  getUnlockedDataDemo,
  getTimeSeriesDataDemo,
  getClientSegmentsDemo,
  getCategoryAnalyticsDemo,
  getStorePerformanceDemo,
  getCohortDataDemo,
  getEnvironmentalImpactDemo,
  getOperationalQualityDemo,
  getPaymentMethodsDemo,
} from '@/lib/analytics/static-data'
import {
  ShoppingBag,
  CreditCard,
  TrendingUp,
  Users,
  Leaf,
  TreeDeciduous,
  Scale,
  FileText,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default async function AnalytiquePage() {
  // Fetch all analytics data
  const businessOverview = await getBusinessOverviewDemo()
  const unlockedData = await getUnlockedDataDemo()
  const segments = await getClientSegmentsDemo()
  const categoryAnalytics = await getCategoryAnalyticsDemo()
  const storePerformance = await getStorePerformanceDemo()
  const timeSeriesData = await getTimeSeriesDataDemo()
  const cohortData = await getCohortDataDemo()
  const environmentalImpact = await getEnvironmentalImpactDemo()
  const operationalQuality = await getOperationalQualityDemo()
  const paymentMethods = await getPaymentMethodsDemo()

  // Prepare chart data
  const categoryRevenueChart = categoryAnalytics.map((cat) => ({
    name: cat.category,
    value: cat.revenue,
  }))

  const categoryLoyaltyChart = categoryAnalytics.map((cat) => ({
    name: cat.category,
    fidelises: cat.revenue * (cat.loyaltyRate / 100),
    nonFidelises: cat.revenue * (1 - cat.loyaltyRate / 100),
  }))

  const storeRevenueChart = storePerformance.map((store) => ({
    name: store.name,
    revenue: store.revenue,
  }))

  const identificationByStoreChart = unlockedData.identificationByStore.map(
    (item) => ({
      name: item.storeName,
      value: item.rate,
    })
  )

  const identificationByCategoryChart =
    unlockedData.identificationByCategory.map((item) => ({
      name: item.category,
      value: item.rate,
    }))

  // Find best and worst performing stores
  const bestStore = storePerformance[0]
  const worstStore = storePerformance[storePerformance.length - 1]

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">
            Analytique
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Analyses et insights business
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Section A – Vue d'ensemble business */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Vue d'ensemble business
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Indicateurs clés sur les 30 derniers jours
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            title="Tickets (30j)"
            value={businessOverview.totalReceipts.toLocaleString('fr-FR')}
            trend={businessOverview.receiptsTrend}
            icon={ShoppingBag}
          />
          <KpiCard
            title="Chiffre d'affaires (30j)"
            value={formatCurrency(businessOverview.totalRevenue)}
            trend={businessOverview.revenueTrend}
            icon={CreditCard}
          />
          <KpiCard
            title="Panier moyen"
            value={formatCurrency(businessOverview.averageBasket)}
            trend={businessOverview.basketTrend}
            icon={TrendingUp}
          />
          <KpiCard
            title="Clients actifs"
            value={businessOverview.activeCustomers.toLocaleString('fr-FR')}
            trend={businessOverview.customersTrend}
            icon={Users}
          />
          <KpiCard
            title="Taux d'identification"
            value={`${businessOverview.identificationRate.toFixed(1)}%`}
            trend={businessOverview.identificationTrend}
            icon={CheckCircle2}
          />
          <KpiCard
            title="Fréquence moyenne"
            value={`${businessOverview.averageFrequency.toFixed(1)}`}
            trend={businessOverview.frequencyTrend}
            icon={Calendar}
          />
        </div>
      </div>

      {/* Section B – Données déverrouillées par Swiim */}
      <ChartCard
        title="Données débloquées par Swiim"
        description="Ce que l'enseigne ne pouvait pas mesurer sans ticket numérique"
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Clients identifiés sans carte
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {unlockedData.identifiedWithoutCard.toLocaleString('fr-FR')}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Part du CA clients identifiés
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {unlockedData.identifiedRevenueShare.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Panier moyen identifiés
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatCurrency(unlockedData.identifiedBasketAvg)}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Panier moyen non identifiés
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {formatCurrency(unlockedData.unidentifiedBasketAvg)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Fréquence clients identifiés
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {unlockedData.identifiedFrequency.toFixed(1)} visites/mois
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Fréquence clients non identifiés
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {unlockedData.unidentifiedFrequency.toFixed(1)} visites/mois
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Taux d'identification par magasin
              </h3>
              <BarChart
                data={identificationByStoreChart}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${v.toFixed(1)}%`}
                height={250}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Taux d'identification par catégorie
              </h3>
              <BarChart
                data={identificationByCategoryChart}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${v.toFixed(1)}%`}
                height={250}
              />
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Section C – Segments de clients */}
      <ChartCard
        title="Segments de clients (vue comportementale)"
        description="Classification des clients selon leur comportement d'achat"
      >
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {segments.map((segment) => (
            <div
              key={segment.slug}
              className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="text-lg font-semibold text-gray-900">
                  {segment.name}
                </div>
                <Link href={`/clients?segment=${segment.slug}`}>
                  <Button variant="ghost" size="sm" className="text-xs">
                    Voir →
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">
                    Taille du segment
                  </div>
                  <div className="text-2xl font-semibold text-gray-900">
                    {segment.size.toLocaleString('fr-FR')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Panier moyen</div>
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(segment.avgBasket)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Fréquence</div>
                    <div className="font-semibold text-gray-900">
                      {segment.frequency > 0 ? `${segment.frequency}j` : '-'}
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-xs text-gray-500 mb-1">CA du segment</div>
                  <div className="font-semibold text-gray-900">
                    {formatCurrency(segment.revenue)}
                  </div>
                </div>
                <div className="pt-2">
                  <div className="text-xs text-gray-500 mb-1">
                    % clients identifiés
                  </div>
                  <div className="font-semibold text-gray-900">
                    {segment.identificationRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>

      {/* Section D – Analyse comportementale par catégorie */}
      <ChartCard
        title="Analyse comportementale par catégorie"
        description="Performances et tendances par catégorie de produits"
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                CA total par catégorie
              </h3>
              <BarChart
                data={categoryRevenueChart}
                dataKey="value"
                nameKey="name"
                height={300}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                CA clients fidélisés vs non fidélisés
              </h3>
              <StackedBarChart data={categoryLoyaltyChart} height={300} />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="font-semibold text-gray-600 pl-6">
                    Catégorie
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    CA total
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Panier moyen
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Nb tickets
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Jours moyens entre visites
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    % nouveaux clients
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    % clients fidélisés
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600 pr-6">
                    % tickets numériques
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryAnalytics.map((cat) => (
                  <TableRow
                    key={cat.category}
                    className="hover:bg-gray-50/50 border-gray-50 transition-colors"
                  >
                    <TableCell className="font-semibold text-gray-900 pl-6">
                      {cat.category}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(cat.revenue)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(cat.avgBasket)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {cat.tickets.toLocaleString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {cat.daysBetweenVisits.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {cat.newCustomersRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {cat.loyaltyRate.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right text-gray-600 pr-6">
                      {cat.digitalTicketsRate.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </ChartCard>

      {/* Section E – Performance par magasin */}
      <ChartCard
        title="Performance magasins"
        description="Analyse comparative des performances par point de vente"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              CA par magasin
            </h3>
            <BarChart
              data={storeRevenueChart}
              dataKey="revenue"
              nameKey="name"
              height={300}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Détails par magasin
            </h3>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                  <TableHead className="font-semibold text-gray-600 pl-6">
                    Magasin
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Tickets (30j)
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    CA (30j)
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Panier moyen
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600">
                    Taux identification
                  </TableHead>
                  <TableHead className="text-right font-semibold text-gray-600 pr-6">
                    % tickets numériques
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {storePerformance.map((store) => {
                  const isBest = store.id === bestStore?.id
                  const isWorst = store.id === worstStore?.id
                  return (
                    <TableRow
                      key={store.id}
                      className="hover:bg-gray-50/50 border-gray-50 transition-colors"
                    >
                      <TableCell className="font-semibold text-gray-900 pl-6">
                        <div className="flex items-center gap-2">
                          {store.name}
                          {isBest && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                              Top
                            </Badge>
                          )}
                          {isWorst && (
                            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                              À surveiller
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {store.tickets.toLocaleString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(store.revenue)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(store.avgBasket)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {store.identificationRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right text-gray-600 pr-6">
                        {store.digitalTicketsRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </ChartCard>

      {/* Section F – Tendances & séries temporelles */}
      <ChartCard
        title="Tendances dans le temps"
        description="Évolution des tickets et du chiffre d'affaires sur les 30 derniers jours"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              Tickets par jour
            </h3>
            <TicketsChart
              data={timeSeriesData.map((d) => ({
                date: d.date,
                count: d.tickets,
                revenue: d.revenue,
              }))}
            />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4">
              CA par jour
            </h3>
            <RevenueChart
              data={timeSeriesData.map((d) => ({
                date: d.date,
                count: d.tickets,
                revenue: d.revenue,
              }))}
            />
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">
            Taux d'identification par jour
          </h3>
          <BarChart
            data={timeSeriesData.map((d) => ({
              name: d.date,
              value: d.identificationRate,
            }))}
            dataKey="value"
            nameKey="name"
            formatValue={(v) => `${v.toFixed(1)}%`}
            height={250}
          />
        </div>
      </ChartCard>

      {/* Section G – Cohortes & rétention */}
      <ChartCard
        title="Cohortes clients & rétention"
        description="Analyse de la rétention par cohorte d'acquisition"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">
                  Cohorte
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  Nouveaux clients
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  CA semaine 0
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  CA semaine 4
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  CA semaine 8
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600">
                  Rétention 4 sem.
                </TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">
                  Rétention 8 sem.
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cohortData.map((cohort, idx) => {
                const retention4Color =
                  cohort.retentionWeek4 >= 70
                    ? 'bg-emerald-50 text-emerald-700'
                    : cohort.retentionWeek4 >= 50
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'
                const retention8Color =
                  cohort.retentionWeek8 >= 70
                    ? 'bg-emerald-50 text-emerald-700'
                    : cohort.retentionWeek8 >= 50
                      ? 'bg-amber-50 text-amber-700'
                      : 'bg-rose-50 text-rose-700'

                return (
                  <TableRow
                    key={cohort.cohort}
                    className="hover:bg-gray-50/50 border-gray-50 transition-colors"
                  >
                    <TableCell className="font-semibold text-gray-900 pl-6">
                      {cohort.cohort}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {cohort.newCustomers}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-gray-900">
                      {formatCurrency(cohort.revenueWeek0)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(cohort.revenueWeek4)}
                    </TableCell>
                    <TableCell className="text-right text-gray-600">
                      {formatCurrency(cohort.revenueWeek8)}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${retention4Color}`}
                      >
                        {cohort.retentionWeek4}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${retention8Color}`}
                      >
                        {cohort.retentionWeek8}%
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </ChartCard>

      {/* Section H – Qualité opérationnelle */}
      <ChartCard
        title="Qualité opérationnelle & expérience"
        description="Métriques de qualité et d'expérience client"
      >
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Taux tickets numériques
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {(
                  operationalQuality.digitalTicketsByStore.reduce(
                    (sum, s) => sum + s.rate,
                    0
                  ) / operationalQuality.digitalTicketsByStore.length
                ).toFixed(1)}
                %
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Taux email valide
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {operationalQuality.validEmailRate.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Taux téléphone valide
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {operationalQuality.validPhoneRate.toFixed(1)}%
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">
                Taux annulés / erreur
              </div>
              <div className="text-2xl font-semibold text-gray-900">
                {(operationalQuality.cancelledRate + operationalQuality.errorRate).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Taux de tickets numériques par magasin
              </h3>
              <BarChart
                data={operationalQuality.digitalTicketsByStore.map((s) => ({
                  name: s.storeName,
                  value: s.rate,
                }))}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${v.toFixed(1)}%`}
                height={250}
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Répartition par moyen de paiement
              </h3>
              <PieChart
                data={paymentMethods}
                formatValue={(v) => formatCurrency(v)}
                height={250}
              />
            </div>
          </div>
        </div>
      </ChartCard>

      {/* Section I – Impact environnemental */}
      <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)] border border-emerald-800">
        <CardHeader className="px-6 pt-6">
          <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
            <Leaf className="h-5 w-5 text-emerald-400" />
            Impact environnemental
          </CardTitle>
          <CardDescription className="text-emerald-200 text-sm">
            Économies générées par les tickets numériques
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-xs uppercase tracking-[0.14em] mb-2">
                <FileText className="h-4 w-4" />
                Tickets numériques
              </div>
              <div className="text-3xl font-semibold">
                {environmentalImpact.digitalTickets12Months.toLocaleString(
                  'fr-FR'
                )}
              </div>
              <div className="text-xs text-emerald-300 mt-1">Sur 12 mois</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-xs uppercase tracking-[0.14em] mb-2">
                <Scale className="h-4 w-4" />
                Papier économisé
              </div>
              <div className="text-3xl font-semibold">
                {environmentalImpact.paperSavedKg.toFixed(2)} kg
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-xs uppercase tracking-[0.14em] mb-2">
                <Leaf className="h-4 w-4" />
                CO₂ évité
              </div>
              <div className="text-3xl font-semibold">
                {environmentalImpact.co2AvoidedKg.toFixed(2)} kg
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-xs uppercase tracking-[0.14em] mb-2">
                <TreeDeciduous className="h-4 w-4" />
                Arbres équivalents
              </div>
              <div className="text-3xl font-semibold">
                {environmentalImpact.treesEquivalent.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-emerald-100 mb-4">
                Papier économisé par magasin
              </h3>
              <BarChart
                data={environmentalImpact.paperSavedByStore.map((s) => ({
                  name: s.storeName,
                  value: s.kg,
                }))}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${v.toFixed(2)} kg`}
                height={200}
                color="#10B981"
              />
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <h3 className="text-sm font-semibold text-emerald-100 mb-4">
                Projection sur 12 mois
              </h3>
              <p className="text-sm text-emerald-200 mb-4">
                {environmentalImpact.projection12Months.scenario}
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-200">Papier économisé</span>
                  <span className="font-semibold">
                    +{environmentalImpact.projection12Months.additionalPaperSaved.toFixed(
                      2
                    )}{' '}
                    kg
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-200">CO₂ évité</span>
                  <span className="font-semibold">
                    +{environmentalImpact.projection12Months.additionalCo2Avoided.toFixed(
                      2
                    )}{' '}
                    kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
