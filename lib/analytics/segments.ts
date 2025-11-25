import { loadPrisma } from './utils'

export interface ClientSegment {
  name: string
  slug: string
  size: number
  avgBasket: number
  frequency: number // days between visits
  revenue: number
  identificationRate: number
}

/**
 * Get client segments based on behavioral analysis
 * Uses real Prisma queries when possible, otherwise deterministic demo data
 */
export async function getClientSegments(
  userId?: string,
  days: number = 90
): Promise<ClientSegment[]> {
  try {
    const prisma = await loadPrisma()
    if (!prisma) {
      return getDemoSegments()
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(userId ? { store: { userId } } : {}),
      },
      include: {
        customer: true,
        lineItems: true,
      },
    })

    // Group by customer
    const customerData = new Map<
      string,
      {
        receipts: typeof receipts
        totalSpend: number
        categories: Set<string>
        firstVisit: Date
        lastVisit: Date
      }
    >()

    receipts.forEach((r) => {
      if (!r.customerId) return

      const existing = customerData.get(r.customerId) || {
        receipts: [],
        totalSpend: 0,
        categories: new Set<string>(),
        firstVisit: r.createdAt,
        lastVisit: r.createdAt,
      }

      existing.receipts.push(r)
      existing.totalSpend += Number(r.totalAmount)
      r.lineItems.forEach((li) => existing.categories.add(li.category))
      if (r.createdAt < existing.firstVisit) existing.firstVisit = r.createdAt
      if (r.createdAt > existing.lastVisit) existing.lastVisit = r.createdAt

      customerData.set(r.customerId, existing)
    })

    // Calculate segments
    const segments: ClientSegment[] = []
    const customers = Array.from(customerData.entries())

    // Champions: high basket + high frequency
    const champions = customers.filter(([_, data]) => {
      const avgBasket = data.totalSpend / data.receipts.length
      const daysActive = Math.max(
        1,
        (data.lastVisit.getTime() - data.firstVisit.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const frequency = daysActive / data.receipts.length
      return avgBasket > 70 && frequency < 20 && data.receipts.length >= 5
    })

    if (champions.length > 0) {
      const totalRevenue = champions.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        champions.reduce((sum, [_, data]) => sum + data.receipts.length, 0)
      const avgFrequency =
        champions.reduce((sum, [_, data]) => {
          const daysActive = Math.max(
            1,
            (data.lastVisit.getTime() - data.firstVisit.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return sum + daysActive / data.receipts.length
        }, 0) / champions.length

      segments.push({
        name: 'Champions',
        slug: 'champions',
        size: champions.length,
        avgBasket,
        frequency: Math.round(avgFrequency),
        revenue: totalRevenue,
        identificationRate: 100, // All have customerId
      })
    }

    // Fidèles: regular, medium basket
    const fideles = customers.filter(([_, data]) => {
      const avgBasket = data.totalSpend / data.receipts.length
      const daysActive = Math.max(
        1,
        (data.lastVisit.getTime() - data.firstVisit.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const frequency = daysActive / data.receipts.length
      return (
        avgBasket >= 40 &&
        avgBasket <= 70 &&
        frequency < 30 &&
        data.receipts.length >= 3
      )
    })

    if (fideles.length > 0) {
      const totalRevenue = fideles.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        fideles.reduce((sum, [_, data]) => sum + data.receipts.length, 0)
      const avgFrequency =
        fideles.reduce((sum, [_, data]) => {
          const daysActive = Math.max(
            1,
            (data.lastVisit.getTime() - data.firstVisit.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return sum + daysActive / data.receipts.length
        }, 0) / fideles.length

      segments.push({
        name: 'Fidèles',
        slug: 'fideles',
        size: fideles.length,
        avgBasket,
        frequency: Math.round(avgFrequency),
        revenue: totalRevenue,
        identificationRate: 100,
      })
    }

    // Occasionnels: low frequency
    const occasionnels = customers.filter(([_, data]) => {
      const daysActive = Math.max(
        1,
        (data.lastVisit.getTime() - data.firstVisit.getTime()) /
          (1000 * 60 * 60 * 24)
      )
      const frequency = daysActive / data.receipts.length
      return frequency > 30 || data.receipts.length < 3
    })

    if (occasionnels.length > 0) {
      const totalRevenue = occasionnels.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        occasionnels.reduce((sum, [_, data]) => sum + data.receipts.length, 0)
      const avgFrequency =
        occasionnels.reduce((sum, [_, data]) => {
          const daysActive = Math.max(
            1,
            (data.lastVisit.getTime() - data.firstVisit.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return sum + daysActive / data.receipts.length
        }, 0) / occasionnels.length

      segments.push({
        name: 'Occasionnels',
        slug: 'occasionnels',
        size: occasionnels.length,
        avgBasket,
        frequency: Math.round(avgFrequency),
        revenue: totalRevenue,
        identificationRate: 100,
      })
    }

    // À risque: inactive for 40+ days
    const aRisque = customers.filter(([_, data]) => {
      const daysSinceLastVisit =
        (Date.now() - data.lastVisit.getTime()) / (1000 * 60 * 60 * 24)
      return daysSinceLastVisit > 40
    })

    if (aRisque.length > 0) {
      const totalRevenue = aRisque.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        aRisque.reduce((sum, [_, data]) => sum + data.receipts.length, 0)

      segments.push({
        name: 'À risque',
        slug: 'a-risque',
        size: aRisque.length,
        avgBasket,
        frequency: 0, // Inactive
        revenue: totalRevenue,
        identificationRate: 100,
      })
    }

    // Nouveaux: appeared in last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const nouveaux = customers.filter(([_, data]) => {
      return data.firstVisit >= thirtyDaysAgo
    })

    if (nouveaux.length > 0) {
      const totalRevenue = nouveaux.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        nouveaux.reduce((sum, [_, data]) => sum + data.receipts.length, 0)

      segments.push({
        name: 'Nouveaux clients',
        slug: 'nouveaux',
        size: nouveaux.length,
        avgBasket,
        frequency: 0, // Too new to calculate
        revenue: totalRevenue,
        identificationRate: 100,
      })
    }

    // Explorateurs: buy in 3+ categories
    const explorateurs = customers.filter(([_, data]) => {
      return data.categories.size >= 3
    })

    if (explorateurs.length > 0) {
      const totalRevenue = explorateurs.reduce(
        (sum, [_, data]) => sum + data.totalSpend,
        0
      )
      const avgBasket =
        totalRevenue /
        explorateurs.reduce((sum, [_, data]) => sum + data.receipts.length, 0)
      const avgFrequency =
        explorateurs.reduce((sum, [_, data]) => {
          const daysActive = Math.max(
            1,
            (data.lastVisit.getTime() - data.firstVisit.getTime()) /
              (1000 * 60 * 60 * 24)
          )
          return sum + daysActive / data.receipts.length
        }, 0) / explorateurs.length

      segments.push({
        name: 'Explorateurs multi-catégories',
        slug: 'explorateurs',
        size: explorateurs.length,
        avgBasket,
        frequency: Math.round(avgFrequency),
        revenue: totalRevenue,
        identificationRate: 100,
      })
    }

    // If no segments found, return demo data
    if (segments.length === 0) {
      return getDemoSegments()
    }

    return segments
  } catch (error) {
    console.error('Error fetching client segments:', error)
    return getDemoSegments()
  }
}

function getDemoSegments(): ClientSegment[] {
  return [
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
}

