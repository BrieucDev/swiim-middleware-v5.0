import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { ExportButton } from '@/components/export-button'
import { formatCurrency } from '@/lib/format'
import { stats, segments, categoryAnalytics } from '@/lib/mock-data'
import { ShoppingBag, CreditCard, TrendingUp, Users, Leaf, TreeDeciduous, Scale, FileText } from 'lucide-react'

export default function AnalytiquePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Analytique</h1>
          <p className="text-gray-500 mt-2 text-lg">
            Analyses et insights business
          </p>
        </div>
        <ExportButton />
      </div>

      {/* Overview KPIs */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Tickets (30j)"
          value={stats.totalReceipts.toLocaleString('fr-FR')}
          trend={8.2}
          icon={ShoppingBag}
        />
        <KpiCard
          title="Chiffre d'affaires"
          value={formatCurrency(stats.totalRevenue)}
          trend={12.5}
          icon={CreditCard}
        />
        <KpiCard
          title="Panier moyen"
          value={formatCurrency(stats.averageBasket)}
          trend={-1.4}
          icon={TrendingUp}
        />
        <KpiCard
          title="Taux d'identification"
          value={`${stats.identificationRate.toFixed(1)}%`}
          trend={3.2}
          icon={Users}
        />
      </div>

      {/* Segments */}
      <Card className="border-none shadow-premium">
        <CardHeader>
          <CardTitle>Segments de clients</CardTitle>
          <CardDescription>Classification et analyse comportementale</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {segments.map((segment) => (
              <div key={segment.name} className="p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-lg font-bold text-gray-900 mb-4">{segment.name}</div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Taille du segment</div>
                    <div className="text-2xl font-bold text-gray-900">{segment.size}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Panier moyen</div>
                      <div className="font-semibold text-gray-900">{formatCurrency(segment.avgBasket)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Fréquence</div>
                      <div className="font-semibold text-gray-900">
                        {segment.frequency > 0 ? `${segment.frequency}j` : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Category Analytics */}
      <Card className="border-none shadow-premium">
        <CardHeader>
          <CardTitle>Analyse comportementale par catégorie</CardTitle>
          <CardDescription>Performances et tendances par catégorie</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                <TableHead className="font-semibold text-gray-600 pl-6">Catégorie</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">CA total</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Panier moyen</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Nb tickets</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">Jours entre visites</TableHead>
                <TableHead className="text-right font-semibold text-gray-600">% nouveaux</TableHead>
                <TableHead className="text-right font-semibold text-gray-600 pr-6">% fidélisés</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryAnalytics.map((cat) => (
                <TableRow key={cat.name} className="hover:bg-gray-50/50 border-gray-50 transition-colors">
                  <TableCell className="font-medium text-gray-900 pl-6">{cat.name}</TableCell>
                  <TableCell className="text-right font-bold text-gray-900">{formatCurrency(cat.revenue)}</TableCell>
                  <TableCell className="text-right text-gray-600">{formatCurrency(cat.avgBasket)}</TableCell>
                  <TableCell className="text-right text-gray-600">{cat.tickets}</TableCell>
                  <TableCell className="text-right text-gray-600">{cat.daysBetween}</TableCell>
                  <TableCell className="text-right text-gray-600">{cat.newRate.toFixed(1)}%</TableCell>
                  <TableCell className="text-right text-gray-600 pr-6">{cat.loyaltyRate.toFixed(1)}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Environmental Impact */}
      <Card className="border-none shadow-premium bg-gradient-to-br from-emerald-900 to-emerald-800 text-white">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Leaf className="h-5 w-5 text-emerald-400" />
            Impact environnemental
          </CardTitle>
          <CardDescription className="text-emerald-200">
            Économies générées par les tickets numériques
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
                <FileText className="h-4 w-4" />
                Tickets numériques
              </div>
              <div className="text-3xl font-bold">15,234</div>
              <div className="text-xs text-emerald-300 mt-1">Sur 12 mois</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
                <Scale className="h-4 w-4" />
                Papier économisé
              </div>
              <div className="text-3xl font-bold">45.70 kg</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
                <Leaf className="h-4 w-4" />
                CO₂ évité
              </div>
              <div className="text-3xl font-bold">36.56 kg</div>
            </div>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-emerald-200 text-sm mb-2">
                <TreeDeciduous className="h-4 w-4" />
                Arbres équivalents
              </div>
              <div className="text-3xl font-bold">4.57</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
