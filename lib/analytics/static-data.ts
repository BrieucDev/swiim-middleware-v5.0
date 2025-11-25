export interface BusinessOverview {
  totalReceipts: number
  totalRevenue: number
  averageBasket: number
  activeCustomers: number
  identificationRate: number
  averageFrequency: number
  receiptsTrend: number
  revenueTrend: number
  basketTrend: number
  customersTrend: number
  identificationTrend: number
  frequencyTrend: number
}

export interface UnlockedData {
  identifiedWithoutCard: number
  identifiedRevenueShare: number
  identifiedBasketAvg: number
  unidentifiedBasketAvg: number
  identifiedFrequency: number
  unidentifiedFrequency: number
  identificationByStore: Array<{ storeName: string; rate: number }>
  identificationByCategory: Array<{ category: string; rate: number }>
}

export interface ClientSegment {
  name: string
  slug: string
  size: number
  avgBasket: number
  frequency: number
  revenue: number
  identificationRate: number
}

export interface CategoryAnalytics {
  category: string
  revenue: number
  avgBasket: number
  tickets: number
  daysBetweenVisits: number
  newCustomersRate: number
  loyaltyRate: number
  digitalTicketsRate: number
}

export interface StorePerformance {
  id: string
  name: string
  tickets: number
  revenue: number
  avgBasket: number
  identificationRate: number
  digitalTicketsRate: number
}

export interface TimeSeriesPoint {
  date: string
  tickets: number
  revenue: number
  identificationRate: number
}

export interface CohortRow {
  cohort: string
  newCustomers: number
  revenueWeek0: number
  revenueWeek4: number
  revenueWeek8: number
  retentionWeek4: number
  retentionWeek8: number
}

export interface EnvironmentalImpact {
  digitalTickets12Months: number
  paperSavedKg: number
  co2AvoidedKg: number
  treesEquivalent: number
  paperSavedByStore: Array<{ storeName: string; kg: number }>
  projection12Months: {
    scenario: string
    digitalRateIncrease: number
    additionalPaperSaved: number
    additionalCo2Avoided: number
  }
}

export interface OperationalQuality {
  digitalTicketsByStore: Array<{ storeName: string; rate: number }>
  validEmailRate: number
  validPhoneRate: number
  cancelledRate: number
  errorRate: number
}

const businessOverviewData: BusinessOverview = {
  totalReceipts: 12543,
  totalRevenue: 452310.5,
  averageBasket: 36.06,
  activeCustomers: 8432,
  identificationRate: 72.4,
  averageFrequency: 2.4,
  receiptsTrend: 8.2,
  revenueTrend: 12.5,
  basketTrend: -1.4,
  customersTrend: 5.8,
  identificationTrend: 3.2,
  frequencyTrend: 2.1,
}

const unlockedData: UnlockedData = {
  identifiedWithoutCard: 1730,
  identifiedRevenueShare: 69.5,
  identifiedBasketAvg: 42.8,
  unidentifiedBasketAvg: 28.1,
  identifiedFrequency: 3.4,
  unidentifiedFrequency: 1.2,
  identificationByStore: [
    { storeName: 'Paris Bastille', rate: 78.2 },
    { storeName: 'Lyon Part-Dieu', rate: 69.1 },
    { storeName: 'Bordeaux Centre', rate: 73.4 },
    { storeName: 'Nantes Commerce', rate: 65.9 },
  ],
  identificationByCategory: [
    { category: 'Fruits & Légumes', rate: 85.4 },
    { category: 'Épicerie', rate: 78.5 },
    { category: 'Frais', rate: 81.2 },
    { category: 'Boissons', rate: 72.4 },
    { category: 'Hi-Tech', rate: 65.8 },
    { category: 'Livres', rate: 88.2 },
    { category: 'Vinyles', rate: 79.5 },
  ],
}

const segments: ClientSegment[] = [
  {
    name: 'Champions',
    slug: 'champions',
    size: 450,
    avgBasket: 85.4,
    frequency: 7,
    revenue: 125000,
    identificationRate: 100,
  },
  {
    name: 'Fidèles',
    slug: 'fideles',
    size: 1250,
    avgBasket: 54.2,
    frequency: 14,
    revenue: 185000,
    identificationRate: 100,
  },
  {
    name: 'Occasionnels',
    slug: 'occasionnels',
    size: 3500,
    avgBasket: 32.5,
    frequency: 45,
    revenue: 95000,
    identificationRate: 85,
  },
  {
    name: 'À risque',
    slug: 'a-risque',
    size: 850,
    avgBasket: 28.4,
    frequency: 0,
    revenue: 25000,
    identificationRate: 100,
  },
  {
    name: 'Nouveaux clients',
    slug: 'nouveaux',
    size: 620,
    avgBasket: 35.2,
    frequency: 0,
    revenue: 45000,
    identificationRate: 92,
  },
  {
    name: 'Explorateurs multi-catégories',
    slug: 'explorateurs',
    size: 320,
    avgBasket: 68.5,
    frequency: 12,
    revenue: 78000,
    identificationRate: 100,
  },
]

const categoryAnalytics: CategoryAnalytics[] = [
  {
    category: 'Fruits & Légumes',
    revenue: 85400,
    avgBasket: 12.5,
    tickets: 6800,
    daysBetweenVisits: 4.2,
    newCustomersRate: 12.5,
    loyaltyRate: 85.4,
    digitalTicketsRate: 88.2,
  },
  {
    category: 'Épicerie',
    revenue: 124500,
    avgBasket: 24.8,
    tickets: 5020,
    daysBetweenVisits: 10.5,
    newCustomersRate: 15.2,
    loyaltyRate: 78.5,
    digitalTicketsRate: 75.4,
  },
  {
    category: 'Frais',
    revenue: 98200,
    avgBasket: 18.4,
    tickets: 5340,
    daysBetweenVisits: 7.1,
    newCustomersRate: 14.8,
    loyaltyRate: 81.2,
    digitalTicketsRate: 82.5,
  },
  {
    category: 'Boissons',
    revenue: 45600,
    avgBasket: 15.2,
    tickets: 3000,
    daysBetweenVisits: 12.3,
    newCustomersRate: 18.5,
    loyaltyRate: 72.4,
    digitalTicketsRate: 68.5,
  },
  {
    category: 'Hi-Tech',
    revenue: 125800,
    avgBasket: 125.5,
    tickets: 1002,
    daysBetweenVisits: 45.2,
    newCustomersRate: 25.4,
    loyaltyRate: 65.8,
    digitalTicketsRate: 92.5,
  },
  {
    category: 'Livres',
    revenue: 68200,
    avgBasket: 22.8,
    tickets: 2991,
    daysBetweenVisits: 18.5,
    newCustomersRate: 22.1,
    loyaltyRate: 88.2,
    digitalTicketsRate: 85.4,
  },
  {
    category: 'Vinyles',
    revenue: 45200,
    avgBasket: 35.6,
    tickets: 1270,
    daysBetweenVisits: 28.4,
    newCustomersRate: 19.8,
    loyaltyRate: 79.5,
    digitalTicketsRate: 78.2,
  },
  {
    category: 'Hygiène',
    revenue: 32400,
    avgBasket: 28.5,
    tickets: 1140,
    daysBetweenVisits: 25.3,
    newCustomersRate: 22.4,
    loyaltyRate: 65.8,
    digitalTicketsRate: 72.1,
  },
]

const storePerformance: StorePerformance[] = [
  {
    id: '1',
    name: 'Paris Bastille',
    tickets: 4250,
    revenue: 154230,
    avgBasket: 36.3,
    identificationRate: 75.2,
    digitalTicketsRate: 88.5,
  },
  {
    id: '2',
    name: 'Lyon Part-Dieu',
    tickets: 3890,
    revenue: 138450,
    avgBasket: 35.6,
    identificationRate: 68.5,
    digitalTicketsRate: 82.4,
  },
  {
    id: '3',
    name: 'Bordeaux Centre',
    tickets: 2450,
    revenue: 89450,
    avgBasket: 36.5,
    identificationRate: 72.1,
    digitalTicketsRate: 85.2,
  },
  {
    id: '4',
    name: 'Nantes Commerce',
    tickets: 1953,
    revenue: 70180,
    avgBasket: 35.9,
    identificationRate: 65.8,
    digitalTicketsRate: 78.5,
  },
]

const timeSeries: TimeSeriesPoint[] = Array.from({ length: 30 }).map(
  (_, index) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - index))
    const tickets = 320 + Math.round(Math.sin(index / 4) * 35)
    const revenue = tickets * (32 + (index % 5))
    const identificationRate = 70 + (index % 6) * 1.5

    return {
      date: date.toISOString().split('T')[0],
      tickets,
      revenue,
      identificationRate: Math.min(85, Math.max(62, identificationRate)),
    }
  }
)

const cohorts: CohortRow[] = [
  { cohort: 'Semaine 45', newCustomers: 82, revenueWeek0: 31200, revenueWeek4: 22800, revenueWeek8: 15600, retentionWeek4: 73, retentionWeek8: 55 },
  { cohort: 'Semaine 46', newCustomers: 75, revenueWeek0: 29800, revenueWeek4: 21400, revenueWeek8: 14800, retentionWeek4: 72, retentionWeek8: 53 },
  { cohort: 'Semaine 47', newCustomers: 68, revenueWeek0: 28500, revenueWeek4: 20500, revenueWeek8: 14200, retentionWeek4: 70, retentionWeek8: 50 },
  { cohort: 'Semaine 48', newCustomers: 80, revenueWeek0: 32600, revenueWeek4: 23600, revenueWeek8: 16800, retentionWeek4: 74, retentionWeek8: 57 },
  { cohort: 'Semaine 49', newCustomers: 92, revenueWeek0: 35400, revenueWeek4: 24400, revenueWeek8: 17600, retentionWeek4: 69, retentionWeek8: 52 },
  { cohort: 'Semaine 50', newCustomers: 88, revenueWeek0: 34800, revenueWeek4: 23800, revenueWeek8: 17000, retentionWeek4: 68, retentionWeek8: 51 },
]

const environmentalImpact: EnvironmentalImpact = {
  digitalTickets12Months: 15234,
  paperSavedKg: 45.7,
  co2AvoidedKg: 36.56,
  treesEquivalent: 4.57,
  paperSavedByStore: [
    { storeName: 'Paris Bastille', kg: 12.75 },
    { storeName: 'Lyon Part-Dieu', kg: 11.67 },
    { storeName: 'Bordeaux Centre', kg: 7.35 },
    { storeName: 'Nantes Commerce', kg: 5.86 },
  ],
  projection12Months: {
    scenario: 'Si le taux de tickets numériques passe à 95%',
    digitalRateIncrease: 10,
    additionalPaperSaved: 4.57,
    additionalCo2Avoided: 3.66,
  },
}

const operationalQuality: OperationalQuality = {
  digitalTicketsByStore: storePerformance.map((store) => ({
    storeName: store.name,
    rate: store.digitalTicketsRate,
  })),
  validEmailRate: 72.5,
  validPhoneRate: 68.2,
  cancelledRate: 2.1,
  errorRate: 0.8,
}

const paymentMethods = [
  { name: 'Carte bancaire', value: 45230 },
  { name: 'Espèces', value: 12540 },
  { name: 'Mobile', value: 8540 },
  { name: 'Chèque', value: 1200 },
]

export async function getBusinessOverviewDemo(): Promise<BusinessOverview> {
  return businessOverviewData
}

export async function getUnlockedDataDemo(): Promise<UnlockedData> {
  return unlockedData
}

export async function getClientSegmentsDemo(): Promise<ClientSegment[]> {
  return segments
}

export async function getCategoryAnalyticsDemo(): Promise<CategoryAnalytics[]> {
  return categoryAnalytics
}

export async function getStorePerformanceDemo(): Promise<StorePerformance[]> {
  return storePerformance
}

export async function getTimeSeriesDataDemo(): Promise<TimeSeriesPoint[]> {
  return timeSeries
}

export async function getCohortDataDemo(): Promise<CohortRow[]> {
  return cohorts
}

export async function getEnvironmentalImpactDemo(): Promise<EnvironmentalImpact> {
  return environmentalImpact
}

export async function getOperationalQualityDemo(): Promise<OperationalQuality> {
  return operationalQuality
}

export async function getPaymentMethodsDemo() {
  return paymentMethods
}

