import { auth } from '@/auth'
import { formatCurrency } from '@/lib/format'
import { getReceiptStats, getReceiptsByDay, getStorePerformance } from '@/lib/analytics/receipts'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ChartCard } from '@/components/dashboard/chart-card'
import { SectionHeader } from '@/components/dashboard/section-header'
import { TicketsChart } from '@/components/dashboard/tickets-chart'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { StoresChart } from '@/components/dashboard/stores-chart'

export const dynamic = 'force-dynamic'

export default async function AccueilPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [stats, receiptsByDay, storePerformance] = await Promise.all([
    getReceiptStats(userId),
    getReceiptsByDay(userId),
    getStorePerformance(userId),
  ])

  const resolvedStats = stats ?? {
    totalReceipts: 0,
    totalRevenue: 0,
    claimedRate: 0,
    activeCustomers: 0,
    averageBasket: 0,
    averageFrequency: 0,
  }

  const chartSource = receiptsByDay ?? []
  const storePerf = storePerformance ?? []

  const chartData = chartSource.map(({ date, count, revenue }) => ({
    date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
    count,
    revenue,
  }))

  const topStores = storePerf.slice(0, 3)
  const bottomStores = storePerf.slice(-3).reverse()

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Accueil</h1>
        <p className="text-sm text-gray-500 mt-2">
          Vue d&apos;ensemble de vos opérations
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Tickets émis"
          value={resolvedStats.totalReceipts.toLocaleString('fr-FR')}
          description="Sur les 30 derniers jours"
        />
        <KpiCard
          title="Chiffre d'affaires"
          value={formatCurrency(resolvedStats.totalRevenue)}
          description="Sur les 30 derniers jours"
        />
        <KpiCard
          title="Taux de réclamation"
          value={`${resolvedStats.claimedRate.toFixed(1)}%`}
          description="Tickets réclamés numériquement"
        />
        <KpiCard
          title="Clients actifs"
          value={resolvedStats.activeCustomers.toLocaleString('fr-FR')}
          description="Clients identifiés sur la période"
        />
        <KpiCard
          title="Panier moyen"
          value={formatCurrency(resolvedStats.averageBasket)}
          description="Par transaction"
        />
        <KpiCard
          title="Fréquence moyenne"
          value={resolvedStats.averageFrequency.toFixed(1)}
          description="Visites par client"
        />
      </div>

      {/* Tendances */}
      <SectionHeader title="Tendances" />
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Tickets par jour" description="Évolution sur 30 jours">
          <TicketsChart data={chartData} />
        </ChartCard>

        <ChartCard title="CA par jour" description="Évolution sur 30 jours">
          <RevenueChart data={chartData} />
        </ChartCard>
      </div>

      {/* Performance magasins */}
      <SectionHeader title="Performance magasins" />
      <ChartCard title="Répartition par magasin" description="Chiffre d&apos;affaires sur 30 jours">
        <StoresChart data={storePerformance} />
      </ChartCard>

      {/* Top et bottom stores */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title="Top magasins" description="Par chiffre d&apos;affaires">
          <div className="space-y-6">
              {topStores.map((store, idx) => (
                <div key={store.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-900 text-white font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                    <div className="font-semibold text-gray-900">{store.name}</div>
                    <div className="text-xs text-gray-400">
                        {store.count} tickets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(store.revenue)}</div>
                  <div className="text-xs text-gray-400">
                      {store.claimedRate.toFixed(1)}% réclamés
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </ChartCard>

        <ChartCard title="À surveiller" description="Croissance potentielle">
          <div className="space-y-6">
              {bottomStores.map((store, idx) => (
                <div key={store.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 font-semibold text-sm">
                      {idx + 1}
                    </div>
                    <div>
                    <div className="font-semibold text-gray-900">{store.name}</div>
                    <div className="text-xs text-gray-400">
                        {store.count} tickets
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(store.revenue)}</div>
                  <div className="text-xs text-gray-400">
                      {store.claimedRate.toFixed(1)}% réclamés
                    </div>
                  </div>
                </div>
              ))}
            </div>
        </ChartCard>
      </div>
    </div>
  )
}

