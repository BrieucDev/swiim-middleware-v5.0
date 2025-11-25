import { KpiCard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { ExportButton } from '@/components/export-button'
import { BarChart } from '@/components/dashboard/bar-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { TicketsChart } from '@/components/dashboard/tickets-chart'
import { StackedBarChart } from '@/components/dashboard/stacked-bar-chart'
import { PieChart } from '@/components/dashboard/pie-chart'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/format'
import { getAnalyticsOverview } from '@/lib/analytics/overview'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

function toChartLabel(isoDate: string): string {
  try {
    if (!isoDate) return ''
    const date = new Date(isoDate)
    if (isNaN(date.getTime())) return isoDate
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
    })
  } catch {
    return isoDate || ''
  }
}

// Safe data structure with defaults
function getSafeData(data: any) {
  return {
    hasData: Boolean(data?.hasData),
    overview: {
      totalReceipts: Number(data?.overview?.totalReceipts) || 0,
      totalRevenue: Number(data?.overview?.totalRevenue) || 0,
      averageBasket: Number(data?.overview?.averageBasket) || 0,
      activeCustomers: Number(data?.overview?.activeCustomers) || 0,
      identificationRate: Number(data?.overview?.identificationRate) || 0,
      digitalRate: Number(data?.overview?.digitalRate) || 0,
    },
    trends: Array.isArray(data?.trends) ? data.trends : [],
    stores: Array.isArray(data?.stores) ? data.stores : [],
    categories: Array.isArray(data?.categories) ? data.categories : [],
    identification: {
      identifiedRevenueShare: Number(data?.identification?.identifiedRevenueShare) || 0,
      identifiedAverageBasket: Number(data?.identification?.identifiedAverageBasket) || 0,
      unidentifiedAverageBasket: Number(data?.identification?.unidentifiedAverageBasket) || 0,
      identifiedFrequency: Number(data?.identification?.identifiedFrequency) || 0,
    },
    environment: {
      digitalTicketsYear: Number(data?.environment?.digitalTicketsYear) || 0,
      paperSavedKg: Number(data?.environment?.paperSavedKg) || 0,
      co2SavedKg: Number(data?.environment?.co2SavedKg) || 0,
      treesEquivalent: Number(data?.environment?.treesEquivalent) || 0,
    },
  }
}

export default async function RealAnalytiquePage() {
  let rawData: any = null
  
  try {
    rawData = await getAnalyticsOverview()
  } catch (error) {
    console.error('[Analytics Page] Error fetching analytics:', error)
    rawData = null
  }

  const data = getSafeData(rawData)

  const ticketsChartData = data.trends.map((point: any) => ({
    date: toChartLabel(point?.date || ''),
    count: Number(point?.tickets) || 0,
    revenue: Number(point?.revenue) || 0,
  }))

  const revenueChartData = ticketsChartData

  const storeChartData = data.stores.map((store: any) => ({
    name: String(store?.name || 'Magasin inconnu'),
    value: Number(store?.revenue) || 0,
  }))

  const loyaltyShare = data.identification.identifiedRevenueShare

  return (
    <div className="space-y-10 pb-10">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Analytique - Données réelles</h1>
            {!data.hasData && (
              <Badge variant="outline" className="border-yellow-300 text-yellow-700 bg-yellow-50">
                Aucune donnée
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Vue d'ensemble des tickets numériques, de l'identification clients et de l'impact environnemental
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/analytique">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour à la démo
            </Button>
          </Link>
          <ExportButton />
        </div>
      </div>

      {!data.hasData && data.stores.length === 0 && data.trends.length === 0 && (
        <Card className="bg-yellow-50 border-yellow-200 rounded-2xl shadow-sm">
          <CardContent className="px-6 py-8">
            <div className="text-center">
              <p className="text-lg font-semibold text-yellow-900 mb-2">Aucune donnée disponible</p>
              <p className="text-sm text-yellow-700 mb-4">
                Les analytiques nécessitent des tickets dans la base de données. Créez des magasins et générez des tickets de démonstration pour voir les statistiques.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Vue d'ensemble (30 derniers jours)</h2>
          <p className="text-sm text-gray-500">Principaux indicateurs business sur la période</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard title="Tickets émis" value={data.overview.totalReceipts.toLocaleString('fr-FR')} />
          <KpiCard title="Chiffre d'affaires" value={formatCurrency(data.overview.totalRevenue)} />
          <KpiCard title="Panier moyen" value={formatCurrency(data.overview.averageBasket)} />
          <KpiCard title="Clients actifs" value={data.overview.activeCustomers.toLocaleString('fr-FR')} />
          <KpiCard title="Taux d'identification" value={`${data.overview.identificationRate.toFixed(1)}%`} />
          <KpiCard title="Tickets numériques" value={`${data.overview.digitalRate.toFixed(1)}%`} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Tendances</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ChartCard title="Tickets par jour" description="Évolution quotidienne des tickets émis">
            {ticketsChartData.length > 0 ? (
              <TicketsChart data={ticketsChartData} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </ChartCard>
          <ChartCard title="Chiffre d'affaires par jour" description="CA journalier sur 30 jours">
            {revenueChartData.length > 0 ? (
              <RevenueChart data={revenueChartData} />
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </ChartCard>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Performance par magasin</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="CA par magasin">
            {storeChartData.length > 0 ? (
              <BarChart
                data={storeChartData}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => formatCurrency(Number(v))}
                height={320}
              />
            ) : (
              <p className="text-sm text-gray-500 text-center py-8">Aucune donnée disponible</p>
            )}
          </ChartCard>
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
            <CardHeader className="px-6 pt-6 pb-4">
              <CardTitle className="text-base font-semibold text-gray-900">Détails (30 derniers jours)</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70">
                      <TableHead>Magasin</TableHead>
                      <TableHead className="text-right">Tickets</TableHead>
                      <TableHead className="text-right">CA</TableHead>
                      <TableHead className="text-right">Panier moyen</TableHead>
                      <TableHead className="text-right">Taux d'ident.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.stores.length > 0 ? (
                      data.stores.map((store: any) => (
                        <TableRow key={store?.id || Math.random()}>
                          <TableCell className="font-medium text-gray-900">{String(store?.name || 'Magasin inconnu')}</TableCell>
                          <TableCell className="text-right text-gray-600">{Number(store?.tickets) || 0}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(Number(store?.revenue) || 0)}</TableCell>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(Number(store?.averageBasket) || 0)}
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {(Number(store?.identificationRate) || 0).toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-6">
                          Aucun ticket enregistré sur la période.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Analyse par catégorie</h2>
        <ChartCard title="Répartition du CA (jusqu'à 6 catégories)">
          {data.categories.length > 0 ? (
            <StackedBarChart
              data={data.categories.map((category: any) => ({
                name: String(category?.name || 'Divers'),
                fidelises: (Number(category?.revenue) || 0) * (loyaltyShare / 100),
                nonFidelises: (Number(category?.revenue) || 0) * (1 - loyaltyShare / 100),
              }))}
              height={320}
            />
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">Aucune catégorie détectée sur les tickets récents.</p>
          )}
        </ChartCard>
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
          <CardContent className="px-6 pb-6 pt-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70">
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-right">CA total</TableHead>
                    <TableHead className="text-right">Tickets</TableHead>
                    <TableHead className="text-right">Panier moyen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.categories.length > 0 ? (
                    data.categories.map((category: any) => (
                      <TableRow key={String(category?.name || 'Divers')}>
                        <TableCell className="font-medium text-gray-900">{String(category?.name || 'Divers')}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(Number(category?.revenue) || 0)}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">{Number(category?.tickets) || 0}</TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatCurrency(Number(category?.averageBasket) || 0)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-6">
                        Ajoutez des tickets avec des catégories pour activer cette vue.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">Identification & tickets numériques</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.12em]">
                Part du CA clients identifiés
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-semibold text-gray-900">
                {data.identification.identifiedRevenueShare.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.12em]">
                Panier moyen identifiés
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-semibold text-gray-900">
                {formatCurrency(data.identification.identifiedAverageBasket)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                vs {formatCurrency(data.identification.unidentifiedAverageBasket)} (non identifiés)
              </p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.12em]">
                Fréquence clients identifiés
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <p className="text-3xl font-semibold text-gray-900">
                {data.identification.identifiedFrequency.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500">visites / client sur 30 jours</p>
            </CardContent>
          </Card>
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
            <CardHeader className="px-6 pt-6 pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 uppercase tracking-[0.12em]">
                Répartition du CA
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <PieChart
                data={[
                  { name: 'Identifiés', value: data.identification.identifiedRevenueShare },
                  { name: 'Non identifiés', value: Math.max(0, 100 - data.identification.identifiedRevenueShare) },
                ]}
                formatValue={(value) => `${Number(value).toFixed(1)}%`}
                height={240}
              />
            </CardContent>
          </Card>
        </div>
      </section>

      <section>
        <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl shadow-md border border-emerald-800/60">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
              Impact environnemental
            </CardTitle>
            <CardDescription className="text-emerald-200 text-sm">
              Bénéfices générés par la dématérialisation des tickets
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <EnvironmentStat label="Tickets numériques (12 mois)" value={data.environment.digitalTicketsYear} />
              <EnvironmentStat label="Papier économisé" value={`${data.environment.paperSavedKg.toFixed(1)} kg`} />
              <EnvironmentStat label="CO₂ évité" value={`${data.environment.co2SavedKg.toFixed(1)} kg`} />
              <EnvironmentStat label="Équivalent arbres" value={data.environment.treesEquivalent.toFixed(1)} />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

function EnvironmentStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 rounded-xl bg-white/10 border border-white/10">
      <p className="text-xs uppercase tracking-[0.14em] text-emerald-200 mb-2">{label}</p>
      <p className="text-3xl font-semibold text-white">{value}</p>
    </div>
  )
}

