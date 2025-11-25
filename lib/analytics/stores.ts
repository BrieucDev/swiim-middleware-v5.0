import { loadPrisma } from './utils'

export interface StorePerformance {
  id: string
  name: string
  tickets: number
  revenue: number
  avgBasket: number
  identificationRate: number
  digitalTicketsRate: number
}

/**
 * Get store performance metrics
 * Uses real Prisma queries when possible, otherwise deterministic demo data
 */
export async function getStorePerformance(
  userId?: string,
  days: number = 30
): Promise<StorePerformance[]> {
  try {
    const prisma = await loadPrisma()
    if (!prisma) {
      return getDemoStorePerformance()
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(userId ? { store: { userId } } : {}),
      },
      include: {
        store: true,
      },
    })

    // Group by store
    const storeData = new Map<
      string,
      {
        name: string
        receipts: typeof receipts
        identified: number
        digital: number
      }
    >()

    receipts.forEach((r) => {
      const existing = storeData.get(r.storeId) || {
        name: r.store.name,
        receipts: [],
        identified: 0,
        digital: 0,
      }

      existing.receipts.push(r)
      if (r.customerId) existing.identified++
      if (r.status === 'RECLAME') existing.digital++

      storeData.set(r.storeId, existing)
    })

    const performance: StorePerformance[] = []

    storeData.forEach((data, storeId) => {
      const tickets = data.receipts.length
      const revenue = data.receipts.reduce(
        (sum, r) => sum + Number(r.totalAmount),
        0
      )
      const avgBasket = tickets > 0 ? revenue / tickets : 0
      const identificationRate =
        tickets > 0 ? (data.identified / tickets) * 100 : 0
      const digitalTicketsRate =
        tickets > 0 ? (data.digital / tickets) * 100 : 0

      performance.push({
        id: storeId,
        name: data.name,
        tickets,
        revenue,
        avgBasket,
        identificationRate: Math.round(identificationRate * 10) / 10,
        digitalTicketsRate: Math.round(digitalTicketsRate * 10) / 10,
      })
    })

    // Sort by revenue descending
    performance.sort((a, b) => b.revenue - a.revenue)

    // If no data, return demo
    if (performance.length === 0) {
      return getDemoStorePerformance()
    }

    return performance
  } catch (error) {
    console.error('Error fetching store performance:', error)
    return getDemoStorePerformance()
  }
}

function getDemoStorePerformance(): StorePerformance[] {
  return [
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
}

