'use client'

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency } from '@/lib/format'
import { useRouter } from 'next/navigation'
import { Database, TrendingUp, Users, ShoppingCart, Award, Target, BarChart3, Leaf } from 'lucide-react'

// Données de démonstration complètes
const DEMO_DATA = {
  // 1. Vue d'ensemble business
  overview: {
    tickets_total: 12450,
    tickets_numeriques: 8460,
    ca_total: 452300,
    panier_moyen: 36.3,
    clients_uniques: 2140,
    clients_actifs: 1890,
    taux_identification: 72.5,
    taux_reclamation: 68.0,
    freq_visite_moyenne: 2.8,
    duree_moyenne_entre_visites: 12.5,
  },
  trends: Array.from({ length: 30 }).map((_, index) => {
    const base = 320 + Math.sin(index / 4) * 35 + Math.random() * 20
    const revenue = base * (30 + (index % 5))
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    return {
      date: date.toISOString().split('T')[0],
      tickets: Math.round(base),
      revenue: Math.round(revenue),
    }
  }),
  stores: [
    { id: '1', name: 'Paris Bastille', tickets: 2800, revenue: 145000, averageBasket: 51.7, identificationRate: 78.4, reclamationRate: 72.3 },
    { id: '2', name: 'Lyon Part-Dieu', tickets: 2100, revenue: 112500, averageBasket: 53.5, identificationRate: 70.1, reclamationRate: 68.5 },
    { id: '3', name: 'Bordeaux Centre', tickets: 1300, revenue: 68500, averageBasket: 52.7, identificationRate: 74.2, reclamationRate: 71.2 },
    { id: '4', name: 'Marseille Vieux-Port', tickets: 1950, revenue: 98500, averageBasket: 50.5, identificationRate: 69.8, reclamationRate: 65.4 },
    { id: '5', name: 'Toulouse Capitole', tickets: 1650, revenue: 78200, averageBasket: 47.4, identificationRate: 71.3, reclamationRate: 69.1 },
  ],
  
  // 2. Données déverrouillées par Swiim
  swiimUnlocked: {
    clients_identifies_sans_carte: 1240,
    part_ca_clients_identifies: 68.2,
    panier_moyen_identifies: 44.2,
    panier_moyen_non_identifies: 28.1,
    freq_visite_identifies: 3.2,
    freq_visite_non_identifies: 1.8,
    taux_reclamation_par_magasin: [
      { magasin: 'Paris Bastille', taux: 72.3 },
      { magasin: 'Lyon Part-Dieu', taux: 68.5 },
      { magasin: 'Bordeaux Centre', taux: 71.2 },
      { magasin: 'Marseille Vieux-Port', taux: 65.4 },
      { magasin: 'Toulouse Capitole', taux: 69.1 },
    ],
    taux_identification_par_categorie: [
      { categorie: 'Hi-Tech', taux: 85.2 },
      { categorie: 'Gaming', taux: 82.1 },
      { categorie: 'Vinyles', taux: 78.5 },
      { categorie: 'Livres', taux: 71.3 },
      { categorie: 'Textile', taux: 68.9 },
      { categorie: 'Épicerie', taux: 65.2 },
    ],
  },
  
  // 3. Analyse comportementale par catégorie
  categories: [
    {
      name: 'Livres',
      ca_total: 125000,
      nb_tickets: 5200,
      panier_moyen: 24.0,
      jours_moyens_entre_visites: 18.5,
      nouveaux_clients_pct: 12.3,
      fidelises_pct: 45.2,
      ca_fidelises: 56400,
      ca_non_fidelises: 68600,
      taux_reclamation: 68.5,
      top_produits: [
        { nom: 'Roman bestseller', ventes: 320 },
        { nom: 'BD populaire', ventes: 285 },
        { nom: 'Guide pratique', ventes: 198 },
      ],
    },
    {
      name: 'Hi-Tech',
      ca_total: 145000,
      nb_tickets: 850,
      panier_moyen: 170.6,
      jours_moyens_entre_visites: 45.2,
      nouveaux_clients_pct: 8.5,
      fidelises_pct: 52.8,
      ca_fidelises: 76560,
      ca_non_fidelises: 68440,
      taux_reclamation: 85.2,
      top_produits: [
        { nom: 'Écouteurs premium', ventes: 125 },
        { nom: 'Chargeur sans fil', ventes: 98 },
        { nom: 'Housse protection', ventes: 87 },
      ],
    },
    {
      name: 'Gaming',
      ca_total: 98000,
      nb_tickets: 620,
      panier_moyen: 158.1,
      jours_moyens_entre_visites: 22.3,
      nouveaux_clients_pct: 15.2,
      fidelises_pct: 58.3,
      ca_fidelises: 57134,
      ca_non_fidelises: 40866,
      taux_reclamation: 82.1,
      top_produits: [
        { nom: 'Jeu AAA', ventes: 145 },
        { nom: 'Manette pro', ventes: 98 },
        { nom: 'Abonnement online', ventes: 76 },
      ],
    },
    {
      name: 'Vinyles',
      ca_total: 72000,
      nb_tickets: 1850,
      panier_moyen: 38.9,
      jours_moyens_entre_visites: 15.8,
      nouveaux_clients_pct: 18.5,
      fidelises_pct: 48.7,
      ca_fidelises: 35064,
      ca_non_fidelises: 36936,
      taux_reclamation: 78.5,
      top_produits: [
        { nom: 'Vinyle classique', ventes: 245 },
        { nom: 'Vinyle moderne', ventes: 198 },
        { nom: 'Réédition limitée', ventes: 156 },
      ],
    },
    {
      name: 'Textile',
      ca_total: 68000,
      nb_tickets: 1850,
      panier_moyen: 36.8,
      jours_moyens_entre_visites: 28.5,
      nouveaux_clients_pct: 14.2,
      fidelises_pct: 42.1,
      ca_fidelises: 28628,
      ca_non_fidelises: 39372,
      taux_reclamation: 68.9,
      top_produits: [
        { nom: 'T-shirt premium', ventes: 320 },
        { nom: 'Sweat à capuche', ventes: 245 },
        { nom: 'Accessoire mode', ventes: 198 },
      ],
    },
  ],
  
  // 4. Segments clients
  segments: [
    {
      nom: 'Champions',
      taille: 245,
      ca_segment: 125000,
      panier_moyen: 68.5,
      freq_moyenne: 4.8,
      duree_moyenne_entre_visites: 6.2,
      fidelises_pct: 92.3,
      revendications_pct: 88.5,
      categorie_principale: 'Hi-Tech',
    },
    {
      nom: 'Fidèles',
      taille: 680,
      ca_segment: 185000,
      panier_moyen: 42.3,
      freq_moyenne: 3.2,
      duree_moyenne_entre_visites: 9.5,
      fidelises_pct: 78.5,
      revendications_pct: 75.2,
      categorie_principale: 'Livres',
    },
    {
      nom: 'Occasionnels',
      taille: 920,
      ca_segment: 98000,
      panier_moyen: 28.5,
      freq_moyenne: 1.5,
      duree_moyenne_entre_visites: 25.8,
      fidelises_pct: 35.2,
      revendications_pct: 52.3,
      categorie_principale: 'Textile',
    },
    {
      nom: 'À risque',
      taille: 195,
      ca_segment: 12500,
      panier_moyen: 32.1,
      freq_moyenne: 0.8,
      duree_moyenne_entre_visites: 45.2,
      fidelises_pct: 28.5,
      revendications_pct: 42.1,
      categorie_principale: 'Vinyles',
    },
    {
      nom: 'Nouveaux',
      taille: 320,
      ca_segment: 45200,
      panier_moyen: 35.2,
      freq_moyenne: 1.2,
      duree_moyenne_entre_visites: 0,
      fidelises_pct: 15.8,
      revendications_pct: 68.5,
      categorie_principale: 'Gaming',
    },
    {
      nom: 'Explorateurs multi-catégories',
      taille: 185,
      ca_segment: 98500,
      panier_moyen: 58.2,
      freq_moyenne: 3.8,
      duree_moyenne_entre_visites: 8.5,
      fidelises_pct: 85.2,
      revendications_pct: 82.3,
      categorie_principale: 'Multi',
    },
  ],
  
  // 5. Fidélité & performance
  loyalty: {
    membres_total: 1850,
    membres_actifs: 1420,
    points_en_circulation: 245000,
    points_utilises: 125000,
    dette_points_estimee: 2450,
    ca_clients_fidelises: 312000,
    ca_clients_non_fidelises: 140300,
    panier_moyen_fidelises: 48.5,
    panier_moyen_non_fidelises: 28.2,
    freq_visite_fidelises: 3.5,
    freq_visite_non_fidelises: 1.8,
    niveaux: [
      { niveau: 'Bronze', nb_clients: 920, ca: 125000, panier_moyen: 35.2, points_moyens: 1250 },
      { niveau: 'Argent', nb_clients: 680, ca: 185000, panier_moyen: 52.3, points_moyens: 3850 },
      { niveau: 'Or', nb_clients: 250, ca: 102000, panier_moyen: 68.5, points_moyens: 9850 },
    ],
    taux_utilisation_points: 51.2,
    taux_monte_niveau: 12.5,
  },
  
  // 6. Campagnes & activations
  campaigns: [
    {
      nom: 'Bienvenue nouveaux clients',
      segment_cible: 'Nouveaux',
      canal: 'Notification',
      type_offre: 'Bonus points',
      date_debut: '2024-01-15',
      date_fin: '2024-02-15',
      clients_cibles: 320,
      messages_envoyes: 320,
      taux_ouverture: 78.5,
      taux_clic: 45.2,
      taux_conversion: 32.1,
      ca_genere: 12500,
      points_distribues: 32000,
      roi_campagne: 3.2,
    },
    {
      nom: 'Relance à risque',
      segment_cible: 'À risque',
      canal: 'Email',
      type_offre: 'Remise 15%',
      date_debut: '2024-01-20',
      date_fin: '2024-02-20',
      clients_cibles: 195,
      messages_envoyes: 195,
      taux_ouverture: 52.3,
      taux_clic: 28.5,
      taux_conversion: 18.2,
      ca_genere: 8500,
      points_distribues: 0,
      roi_campagne: 2.8,
    },
    {
      nom: 'Fidélisation Champions',
      segment_cible: 'Champions',
      canal: 'In-app',
      type_offre: 'Double points',
      date_debut: '2024-02-01',
      date_fin: '2024-02-28',
      clients_cibles: 245,
      messages_envoyes: 245,
      taux_ouverture: 92.5,
      taux_clic: 68.2,
      taux_conversion: 55.8,
      ca_genere: 18500,
      points_distribues: 49000,
      roi_campagne: 4.2,
    },
  ],
  
  // 7. Cohortes & rétention
  cohorts: [
    { cohorte: 'Semaine 1', nouveaux: 85, ca_semaine0: 12500, ca_semaine1: 9800, ca_semaine2: 7200, ca_semaine3: 5800, retention_semaine4: 68.2 },
    { cohorte: 'Semaine 2', nouveaux: 92, ca_semaine0: 13200, ca_semaine1: 10500, ca_semaine2: 8500, ca_semaine3: 0, retention_semaine4: 0 },
    { cohorte: 'Semaine 3', nouveaux: 78, ca_semaine0: 11800, ca_semaine1: 9200, ca_semaine2: 0, ca_semaine3: 0, retention_semaine4: 0 },
    { cohorte: 'Semaine 4', nouveaux: 105, ca_semaine0: 15200, ca_semaine1: 0, ca_semaine2: 0, ca_semaine3: 0, retention_semaine4: 0 },
  ],
  
  // 8. Qualité opérationnelle
  operational: {
    taux_reclamation_magasin: [
      { magasin: 'Paris Bastille', taux: 72.3 },
      { magasin: 'Lyon Part-Dieu', taux: 68.5 },
      { magasin: 'Bordeaux Centre', taux: 71.2 },
      { magasin: 'Marseille Vieux-Port', taux: 65.4 },
      { magasin: 'Toulouse Capitole', taux: 69.1 },
    ],
    magasin_top_adoption: 'Paris Bastille',
    magasin_en_retard: 'Marseille Vieux-Port',
    taux_tickets_avec_email: 78.5,
    taux_tickets_avec_tel: 82.3,
    taux_erreur_tickets: 1.2,
    repartition_paiement: [
      { mode: 'Carte bancaire', pct: 68.5 },
      { mode: 'Mobile payment', pct: 18.2 },
      { mode: 'Espèces', pct: 8.5 },
      { mode: 'Chèque', pct: 4.8 },
    ],
  },
  
  // 9. Impact environnemental
  environment: {
    tickets_numeriques_12m: 16200,
    papier_economise_kg: 48.5,
    co2_evite_kg: 38.4,
    arbres_equivalents: 4.8,
    papier_economise_par_magasin: [
      { magasin: 'Paris Bastille', kg: 12.5 },
      { magasin: 'Lyon Part-Dieu', kg: 9.8 },
      { magasin: 'Bordeaux Centre', kg: 8.2 },
      { magasin: 'Marseille Vieux-Port', kg: 10.5 },
      { magasin: 'Toulouse Capitole', kg: 7.5 },
    ],
    projection_papier_12m: 65.2,
  },
}

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

export default function AnalytiquePage() {
  const router = useRouter()
  const data = DEMO_DATA

  const ticketsChartData = data.trends.map((point) => ({
    date: toChartLabel(point.date),
    count: point.tickets,
    revenue: point.revenue,
  }))

  const revenueChartData = ticketsChartData

  const storeChartData = data.stores.map((store) => ({
    name: store.name,
    value: store.revenue,
  }))

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Analytique</h1>
            <Badge variant="outline" className="border-blue-300 text-blue-700 bg-blue-50">
              Mode démonstration
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Vue d'ensemble complète des performances business, fidélité et impact environnemental
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => router.push('/analytique/real')}
            className="bg-gray-900 text-white hover:bg-gray-800"
          >
            <Database className="mr-2 h-4 w-4" />
            Voir les vraies données
          </Button>
          <ExportButton />
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="swiim">Swiim Unlocked</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="segments">Segments</TabsTrigger>
          <TabsTrigger value="loyalty">Fidélité</TabsTrigger>
          <TabsTrigger value="campaigns">Campagnes</TabsTrigger>
          <TabsTrigger value="cohorts">Cohortes</TabsTrigger>
          <TabsTrigger value="operational">Opérationnel</TabsTrigger>
          <TabsTrigger value="environment">Environnement</TabsTrigger>
        </TabsList>

        {/* 1. Vue d'ensemble business */}
        <TabsContent value="overview" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Vue d'ensemble Business (30 derniers jours)</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <KpiCard title="Tickets total" value={data.overview.tickets_total.toLocaleString('fr-FR')} icon={ShoppingCart} />
              <KpiCard title="Tickets numériques" value={data.overview.tickets_numeriques.toLocaleString('fr-FR')} icon={ShoppingCart} />
              <KpiCard title="CA total" value={formatCurrency(data.overview.ca_total)} icon={TrendingUp} />
              <KpiCard title="Panier moyen" value={formatCurrency(data.overview.panier_moyen)} icon={ShoppingCart} />
              <KpiCard title="Clients uniques" value={data.overview.clients_uniques.toLocaleString('fr-FR')} icon={Users} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <KpiCard title="Clients actifs" value={data.overview.clients_actifs.toLocaleString('fr-FR')} icon={Users} />
              <KpiCard title="Taux identification" value={`${data.overview.taux_identification.toFixed(1)}%`} icon={Users} />
              <KpiCard title="Taux réclamation" value={`${data.overview.taux_reclamation.toFixed(1)}%`} icon={Award} />
              <KpiCard title="Fréq. visite moyenne" value={data.overview.freq_visite_moyenne.toFixed(1)} icon={TrendingUp} />
              <KpiCard title="Jours entre visites" value={data.overview.duree_moyenne_entre_visites.toFixed(1)} icon={TrendingUp} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Tendances</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <ChartCard title="Tickets par jour" description="Évolution quotidienne">
                <TicketsChart data={ticketsChartData} />
              </ChartCard>
              <ChartCard title="CA par jour" description="Chiffre d'affaires journalier">
                <RevenueChart data={revenueChartData} />
              </ChartCard>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Performance par magasin</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="CA par magasin">
                <BarChart data={storeChartData} dataKey="value" nameKey="name" formatValue={(v) => formatCurrency(Number(v))} height={320} />
              </ChartCard>
              <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-base font-semibold text-gray-900">Détails magasins</CardTitle>
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
                          <TableHead className="text-right">Taux ident.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.stores.map((store) => (
                          <TableRow key={store.id}>
                            <TableCell className="font-medium text-gray-900">{store.name}</TableCell>
                            <TableCell className="text-right text-gray-600">{store.tickets}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(store.revenue)}</TableCell>
                            <TableCell className="text-right text-gray-600">{formatCurrency(store.averageBasket)}</TableCell>
                            <TableCell className="text-right text-gray-600">{store.identificationRate.toFixed(1)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        {/* 2. Données déverrouillées par Swiim */}
        <TabsContent value="swiim" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Données déverrouillées par Swiim</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Clients identifiés sans carte" value={data.swiimUnlocked.clients_identifies_sans_carte.toLocaleString('fr-FR')} />
              <KpiCard title="Part CA clients identifiés" value={`${data.swiimUnlocked.part_ca_clients_identifies.toFixed(1)}%`} />
              <KpiCard title="Panier identifiés" value={formatCurrency(data.swiimUnlocked.panier_moyen_identifies)} />
              <KpiCard title="Panier non identifiés" value={formatCurrency(data.swiimUnlocked.panier_moyen_non_identifies)} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <KpiCard title="Fréq. visite identifiés" value={data.swiimUnlocked.freq_visite_identifies.toFixed(1)} />
              <KpiCard title="Fréq. visite non identifiés" value={data.swiimUnlocked.freq_visite_non_identifies.toFixed(1)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Taux de réclamation par magasin</h3>
            <ChartCard title="% Tickets numériques par magasin">
              <BarChart
                data={data.swiimUnlocked.taux_reclamation_par_magasin.map((s) => ({ name: s.magasin, value: s.taux }))}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${Number(v).toFixed(1)}%`}
                height={300}
              />
            </ChartCard>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Taux d'identification par catégorie</h3>
            <ChartCard title="% Clients identifiés par catégorie">
              <BarChart
                data={data.swiimUnlocked.taux_identification_par_categorie.map((c) => ({ name: c.categorie, value: c.taux }))}
                dataKey="value"
                nameKey="name"
                formatValue={(v) => `${Number(v).toFixed(1)}%`}
                height={300}
              />
            </ChartCard>
          </section>
        </TabsContent>

        {/* 3. Analyse comportementale par catégorie */}
        <TabsContent value="categories" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Analyse comportementale par catégorie</h2>
            </div>
            {data.categories.map((category) => (
              <Card key={category.name} className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6 space-y-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">CA total</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(category.ca_total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Nb tickets</p>
                      <p className="text-2xl font-semibold text-gray-900">{category.nb_tickets}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Panier moyen</p>
                      <p className="text-2xl font-semibold text-gray-900">{formatCurrency(category.panier_moyen)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Jours entre visites</p>
                      <p className="text-2xl font-semibold text-gray-900">{category.jours_moyens_entre_visites.toFixed(1)}</p>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">% Nouveaux clients</p>
                      <p className="text-xl font-semibold text-gray-900">{category.nouveaux_clients_pct.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">% Fidélisés</p>
                      <p className="text-xl font-semibold text-gray-900">{category.fidelises_pct.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taux réclamation</p>
                      <p className="text-xl font-semibold text-gray-900">{category.taux_reclamation.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CA fidélisés</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(category.ca_fidelises)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Top 3 produits</p>
                    <div className="space-y-2">
                      {category.top_produits.map((produit, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-900">{produit.nom}</span>
                          <span className="text-sm font-semibold text-gray-700">{produit.ventes} ventes</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        {/* 4. Segments clients */}
        <TabsContent value="segments" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Segments clients</h2>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {data.segments.map((segment) => (
                <Card key={segment.nom} className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                  <CardHeader className="px-6 pt-6 pb-4">
                    <CardTitle className="text-base font-semibold text-gray-900">{segment.nom}</CardTitle>
                  </CardHeader>
                  <CardContent className="px-6 pb-6 space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500">Taille</p>
                        <p className="font-semibold text-gray-900">{segment.taille}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">CA segment</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(segment.ca_segment)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Panier moyen</p>
                        <p className="font-semibold text-gray-900">{formatCurrency(segment.panier_moyen)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Fréq. moyenne</p>
                        <p className="font-semibold text-gray-900">{segment.freq_moyenne.toFixed(1)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">% Fidélisés</p>
                        <p className="font-semibold text-gray-900">{segment.fidelises_pct.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">% Réclamations</p>
                        <p className="font-semibold text-gray-900">{segment.revendications_pct.toFixed(1)}%</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs text-gray-500">Catégorie principale</p>
                      <p className="text-sm font-medium text-gray-900">{segment.categorie_principale}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </TabsContent>

        {/* 5. Fidélité & performance */}
        <TabsContent value="loyalty" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Fidélité & Performance du programme</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Membres total" value={data.loyalty.membres_total.toLocaleString('fr-FR')} />
              <KpiCard title="Membres actifs" value={data.loyalty.membres_actifs.toLocaleString('fr-FR')} />
              <KpiCard title="Points en circulation" value={data.loyalty.points_en_circulation.toLocaleString('fr-FR')} />
              <KpiCard title="Points utilisés" value={data.loyalty.points_utilises.toLocaleString('fr-FR')} />
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Dette points estimée" value={formatCurrency(data.loyalty.dette_points_estimee)} />
              <KpiCard title="Taux utilisation points" value={`${data.loyalty.taux_utilisation_points.toFixed(1)}%`} />
              <KpiCard title="Taux montée niveau" value={`${data.loyalty.taux_monte_niveau.toFixed(1)}%`} />
              <KpiCard title="CA fidélisés" value={formatCurrency(data.loyalty.ca_clients_fidelises)} />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Répartition par niveau</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Répartition clients par niveau">
                <PieChart
                  data={data.loyalty.niveaux.map((n) => ({ name: n.niveau, value: n.nb_clients }))}
                  formatValue={(v) => `${Number(v).toFixed(0)}`}
                  height={300}
                />
              </ChartCard>
              <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4">
                  <CardTitle className="text-base font-semibold text-gray-900">Détails par niveau</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/70">
                          <TableHead>Niveau</TableHead>
                          <TableHead className="text-right">Clients</TableHead>
                          <TableHead className="text-right">CA</TableHead>
                          <TableHead className="text-right">Panier moyen</TableHead>
                          <TableHead className="text-right">Points moyens</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.loyalty.niveaux.map((niveau) => (
                          <TableRow key={niveau.niveau}>
                            <TableCell className="font-medium text-gray-900">{niveau.niveau}</TableCell>
                            <TableCell className="text-right text-gray-600">{niveau.nb_clients}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(niveau.ca)}</TableCell>
                            <TableCell className="text-right text-gray-600">{formatCurrency(niveau.panier_moyen)}</TableCell>
                            <TableCell className="text-right text-gray-600">{niveau.points_moyens.toLocaleString('fr-FR')}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Comparaison fidélisés vs non-fidélisés</h3>
            <div className="grid gap-6 md:grid-cols-3">
              <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Panier moyen</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.loyalty.panier_moyen_fidelises)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Non fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.loyalty.panier_moyen_non_fidelises)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">Fréquence visite</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{data.loyalty.freq_visite_fidelises.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Non fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{data.loyalty.freq_visite_non_fidelises.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">CA total</CardTitle>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.loyalty.ca_clients_fidelises)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Non fidélisés</span>
                      <span className="text-lg font-semibold text-gray-900">{formatCurrency(data.loyalty.ca_clients_non_fidelises)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </TabsContent>

        {/* 6. Campagnes & activations */}
        <TabsContent value="campaigns" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Campagnes & Activations</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard title="CA total campagnes 30j" value={formatCurrency(data.campaigns.reduce((sum, c) => sum + c.ca_genere, 0))} />
              <KpiCard title="Campagnes actives" value={data.campaigns.length.toString()} />
              <KpiCard title="ROI moyen" value={`${(data.campaigns.reduce((sum, c) => sum + c.roi_campagne, 0) / data.campaigns.length).toFixed(1)}x`} />
            </div>
            {data.campaigns.map((campaign) => (
              <Card key={campaign.nom} className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
                <CardHeader className="px-6 pt-6 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-gray-900">{campaign.nom}</CardTitle>
                    <Badge variant="outline">{campaign.canal}</Badge>
                  </div>
                  <CardDescription className="mt-2">
                    {campaign.segment_cible} • {campaign.type_offre} • {campaign.date_debut} → {campaign.date_fin}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm text-gray-500">Clients cibles</p>
                      <p className="text-xl font-semibold text-gray-900">{campaign.clients_cibles}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taux ouverture</p>
                      <p className="text-xl font-semibold text-gray-900">{campaign.taux_ouverture.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Taux conversion</p>
                      <p className="text-xl font-semibold text-gray-900">{campaign.taux_conversion.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">CA généré</p>
                      <p className="text-xl font-semibold text-gray-900">{formatCurrency(campaign.ca_genere)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Points distribués</p>
                      <p className="text-xl font-semibold text-gray-900">{campaign.points_distribues.toLocaleString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">ROI campagne</p>
                      <p className="text-xl font-semibold text-emerald-600">{campaign.roi_campagne.toFixed(1)}x</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>
        </TabsContent>

        {/* 7. Cohortes & rétention */}
        <TabsContent value="cohorts" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Cohortes & Rétention</h2>
            </div>
            <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-sm">
              <CardHeader className="px-6 pt-6 pb-4">
                <CardTitle className="text-base font-semibold text-gray-900">Analyse par cohorte</CardTitle>
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/70">
                        <TableHead>Cohorte</TableHead>
                        <TableHead className="text-right">Nouveaux</TableHead>
                        <TableHead className="text-right">CA S0</TableHead>
                        <TableHead className="text-right">CA S1</TableHead>
                        <TableHead className="text-right">CA S2</TableHead>
                        <TableHead className="text-right">CA S3</TableHead>
                        <TableHead className="text-right">Rétention S4</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.cohorts.map((cohort) => (
                        <TableRow key={cohort.cohorte}>
                          <TableCell className="font-medium text-gray-900">{cohort.cohorte}</TableCell>
                          <TableCell className="text-right text-gray-600">{cohort.nouveaux}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(cohort.ca_semaine0)}</TableCell>
                          <TableCell className="text-right text-gray-600">{cohort.ca_semaine1 ? formatCurrency(cohort.ca_semaine1) : '-'}</TableCell>
                          <TableCell className="text-right text-gray-600">{cohort.ca_semaine2 ? formatCurrency(cohort.ca_semaine2) : '-'}</TableCell>
                          <TableCell className="text-right text-gray-600">{cohort.ca_semaine3 ? formatCurrency(cohort.ca_semaine3) : '-'}</TableCell>
                          <TableCell className="text-right text-gray-600">{cohort.retention_semaine4 ? `${cohort.retention_semaine4.toFixed(1)}%` : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>

        {/* 8. Qualité opérationnelle */}
        <TabsContent value="operational" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Qualité opérationnelle & Expérience</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Taux tickets avec email" value={`${data.operational.taux_tickets_avec_email.toFixed(1)}%`} />
              <KpiCard title="Taux tickets avec tel" value={`${data.operational.taux_tickets_avec_tel.toFixed(1)}%`} />
              <KpiCard title="Taux erreur tickets" value={`${data.operational.taux_erreur_tickets.toFixed(1)}%`} />
              <KpiCard title="Magasin top adoption" value={data.operational.magasin_top_adoption} />
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Taux de réclamation par magasin">
                <BarChart
                  data={data.operational.taux_reclamation_magasin.map((m) => ({ name: m.magasin, value: m.taux }))}
                  dataKey="value"
                  nameKey="name"
                  formatValue={(v) => `${Number(v).toFixed(1)}%`}
                  height={300}
                />
              </ChartCard>
              <ChartCard title="Répartition par mode de paiement">
                <PieChart
                  data={data.operational.repartition_paiement.map((p) => ({ name: p.mode, value: p.pct }))}
                  formatValue={(v) => `${Number(v).toFixed(1)}%`}
                  height={300}
                />
              </ChartCard>
            </div>
          </section>
        </TabsContent>

        {/* 9. Impact environnemental */}
        <TabsContent value="environment" className="space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-gray-900" />
              <h2 className="text-xl font-semibold text-gray-900">Impact environnemental</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <KpiCard title="Tickets numériques (12m)" value={data.environment.tickets_numeriques_12m.toLocaleString('fr-FR')} />
              <KpiCard title="Papier économisé" value={`${data.environment.papier_economise_kg.toFixed(1)} kg`} />
              <KpiCard title="CO₂ évité" value={`${data.environment.co2_evite_kg.toFixed(1)} kg`} />
              <KpiCard title="Équivalent arbres" value={data.environment.arbres_equivalents.toFixed(1)} />
            </div>
            <Card className="bg-gradient-to-br from-emerald-900 to-emerald-800 text-white rounded-2xl shadow-md border border-emerald-800/60">
              <CardHeader className="px-6 pt-6">
                <CardTitle className="text-white flex items-center gap-2 text-base font-semibold">
                  Impact environnemental détaillé
                </CardTitle>
                <CardDescription className="text-emerald-200 text-sm">
                  Bénéfices générés par la dématérialisation des tickets
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6 pb-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                  <EnvironmentStat label="Tickets numériques (12 mois)" value={data.environment.tickets_numeriques_12m} />
                  <EnvironmentStat label="Papier économisé" value={`${data.environment.papier_economise_kg.toFixed(1)} kg`} />
                  <EnvironmentStat label="CO₂ évité" value={`${data.environment.co2_evite_kg.toFixed(1)} kg`} />
                  <EnvironmentStat label="Équivalent arbres" value={data.environment.arbres_equivalents.toFixed(1)} />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-emerald-200 mb-3">Papier économisé par magasin</h4>
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
                    {data.environment.papier_economise_par_magasin.map((m) => (
                      <div key={m.magasin} className="p-3 rounded-lg bg-white/10 border border-white/10">
                        <p className="text-xs text-emerald-200 mb-1">{m.magasin}</p>
                        <p className="text-lg font-semibold text-white">{m.kg.toFixed(1)} kg</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-4 border-t border-emerald-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-emerald-200">Projection papier économisé (si +15% tickets numériques)</span>
                    <span className="text-xl font-semibold text-white">{data.environment.projection_papier_12m.toFixed(1)} kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
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
