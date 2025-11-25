import { loadPrisma } from './utils'

export interface CategoryAnalytics {
  category: string
  revenue: number
  avgBasket: number
  tickets: number
  daysBetweenVisits: number
  newCustomersRate: number
  loyaltyRate: number // High-level: % of customers with loyalty account
  digitalTicketsRate: number
}

/**
 * Get category analytics
 * Uses real Prisma queries when possible, otherwise deterministic demo data
 */
export async function getCategoryAnalytics(
  userId?: string,
  days: number = 30
): Promise<CategoryAnalytics[]> {
  try {
    const prisma = await loadPrisma()
    if (!prisma) {
      return getDemoCategoryAnalytics()
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(userId ? { store: { userId } } : {}),
      },
      include: {
        lineItems: true,
        customer: {
          include: {
            loyaltyAccount: true,
          },
        },
      },
    })

    // Group by category
    const categoryData = new Map<
      string,
      {
        receipts: typeof receipts
        lineItems: Array<{ category: string; unitPrice: number; quantity: number }>
        customers: Set<string>
        newCustomers: Set<string>
        loyaltyCustomers: Set<string>
        customerVisits: Map<string, Date[]>
      }
    >()

    receipts.forEach((r) => {
      r.lineItems.forEach((li) => {
        const existing = categoryData.get(li.category) || {
          receipts: [],
          lineItems: [],
          customers: new Set<string>(),
          newCustomers: new Set<string>(),
          loyaltyCustomers: new Set<string>(),
          customerVisits: new Map<string, Date[]>(),
        }

        existing.receipts.push(r)
        existing.lineItems.push({
          ...li,
          unitPrice: Number(li.unitPrice),
        })
        if (r.customerId) {
          existing.customers.add(r.customerId)
          if (r.customer?.loyaltyAccount) {
            existing.loyaltyCustomers.add(r.customerId)
          }

          // Track visits for frequency
          const visits = existing.customerVisits.get(r.customerId) || []
          visits.push(r.createdAt)
          existing.customerVisits.set(r.customerId, visits)

          // Check if new customer (first visit in period)
          const firstVisit = visits[0]
          if (firstVisit && firstVisit >= startDate) {
            existing.newCustomers.add(r.customerId)
          }
        }

        categoryData.set(li.category, existing)
      })
    })

    // Calculate metrics per category
    const analytics: CategoryAnalytics[] = []

    categoryData.forEach((data, category) => {
      const revenue = data.lineItems.reduce(
        (sum, li) => sum + li.unitPrice * li.quantity,
        0
      )
      const tickets = new Set(data.receipts.map((r) => r.id)).size
      const avgBasket = tickets > 0 ? revenue / tickets : 0

      // Calculate average days between visits
      let totalDaysBetween = 0
      let visitPairs = 0
      data.customerVisits.forEach((visits) => {
        const sorted = [...visits].sort((a, b) => a.getTime() - b.getTime())
        for (let i = 1; i < sorted.length; i++) {
          const days =
            (sorted[i].getTime() - sorted[i - 1].getTime()) /
            (1000 * 60 * 60 * 24)
          totalDaysBetween += days
          visitPairs++
        }
      })
      const daysBetweenVisits =
        visitPairs > 0 ? totalDaysBetween / visitPairs : 0

      const newCustomersRate =
        data.customers.size > 0
          ? (data.newCustomers.size / data.customers.size) * 100
          : 0

      const loyaltyRate =
        data.customers.size > 0
          ? (data.loyaltyCustomers.size / data.customers.size) * 100
          : 0

      // Digital tickets rate (simplified: assume all are digital if claimed)
      const digitalTickets = data.receipts.filter(
        (r) => r.status === 'RECLAME'
      ).length
      const digitalTicketsRate =
        tickets > 0 ? (digitalTickets / tickets) * 100 : 0

      analytics.push({
        category,
        revenue,
        avgBasket,
        tickets,
        daysBetweenVisits: Math.round(daysBetweenVisits * 10) / 10,
        newCustomersRate: Math.round(newCustomersRate * 10) / 10,
        loyaltyRate: Math.round(loyaltyRate * 10) / 10,
        digitalTicketsRate: Math.round(digitalTicketsRate * 10) / 10,
      })
    })

    // Sort by revenue descending
    analytics.sort((a, b) => b.revenue - a.revenue)

    // If no data, return demo
    if (analytics.length === 0) {
      return getDemoCategoryAnalytics()
    }

    return analytics
  } catch (error) {
    console.error('Error fetching category analytics:', error)
    return getDemoCategoryAnalytics()
  }
}

function getDemoCategoryAnalytics(): CategoryAnalytics[] {
  return [
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
}

