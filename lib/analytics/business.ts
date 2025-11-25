import { loadPrisma } from './utils'

export interface BusinessOverview {
  totalReceipts: number
  totalRevenue: number
  averageBasket: number
  activeCustomers: number
  identificationRate: number
  averageFrequency: number
  // Trends vs previous period
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

/**
 * Get business overview KPIs for the last 30 days
 * Uses real Prisma queries when possible, otherwise deterministic demo data
 */
export async function getBusinessOverview(
  userId?: string,
  days: number = 30
): Promise<BusinessOverview> {
  try {
    const prisma = await loadPrisma()
    if (!prisma) {
      return getDemoBusinessOverview()
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    const previousStartDate = new Date()
    previousStartDate.setDate(previousStartDate.getDate() - days * 2)

    // Current period
    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(userId ? { store: { userId } } : {}),
      },
      include: { customer: true },
    })

    // Previous period
    const previousReceipts = await prisma.receipt.findMany({
      where: {
        createdAt: {
          gte: previousStartDate,
          lt: startDate,
        },
        ...(userId ? { store: { userId } } : {}),
      },
      include: { customer: true },
    })

    const totalReceipts = receipts.length
    const totalRevenue = receipts.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0
    )
    const averageBasket = totalReceipts > 0 ? totalRevenue / totalReceipts : 0

    const uniqueCustomers = new Set(
      receipts.filter((r) => r.customerId).map((r) => r.customerId!)
    )
    const activeCustomers = uniqueCustomers.size

    const identifiedReceipts = receipts.filter((r) => r.customerId).length
    const identificationRate =
      totalReceipts > 0 ? (identifiedReceipts / totalReceipts) * 100 : 0

    // Calculate frequency
    const customerVisits = new Map<string, number>()
    receipts.forEach((r) => {
      if (r.customerId) {
        customerVisits.set(
          r.customerId,
          (customerVisits.get(r.customerId) || 0) + 1
        )
      }
    })
    const frequencies = Array.from(customerVisits.values())
    const averageFrequency =
      frequencies.length > 0
        ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
        : 0

    // Previous period stats
    const prevTotalReceipts = previousReceipts.length
    const prevTotalRevenue = previousReceipts.reduce(
      (sum, r) => sum + Number(r.totalAmount),
      0
    )
    const prevAverageBasket =
      prevTotalReceipts > 0 ? prevTotalRevenue / prevTotalReceipts : 0
    const prevUniqueCustomers = new Set(
      previousReceipts
        .filter((r) => r.customerId)
        .map((r) => r.customerId!)
    ).size
    const prevIdentifiedReceipts = previousReceipts.filter(
      (r) => r.customerId
    ).length
    const prevIdentificationRate =
      prevTotalReceipts > 0
        ? (prevIdentifiedReceipts / prevTotalReceipts) * 100
        : 0

    const prevCustomerVisits = new Map<string, number>()
    previousReceipts.forEach((r) => {
      if (r.customerId) {
        prevCustomerVisits.set(
          r.customerId,
          (prevCustomerVisits.get(r.customerId) || 0) + 1
        )
      }
    })
    const prevFrequencies = Array.from(prevCustomerVisits.values())
    const prevAverageFrequency =
      prevFrequencies.length > 0
        ? prevFrequencies.reduce((a, b) => a + b, 0) / prevFrequencies.length
        : 0

    // Calculate trends
    const receiptsTrend =
      prevTotalReceipts > 0
        ? ((totalReceipts - prevTotalReceipts) / prevTotalReceipts) * 100
        : 0
    const revenueTrend =
      prevTotalRevenue > 0
        ? ((totalRevenue - prevTotalRevenue) / prevTotalRevenue) * 100
        : 0
    const basketTrend =
      prevAverageBasket > 0
        ? ((averageBasket - prevAverageBasket) / prevAverageBasket) * 100
        : 0
    const customersTrend =
      prevUniqueCustomers > 0
        ? ((activeCustomers - prevUniqueCustomers) / prevUniqueCustomers) * 100
        : 0
    const identificationTrend =
      prevIdentificationRate > 0
        ? identificationRate - prevIdentificationRate
        : 0
    const frequencyTrend =
      prevAverageFrequency > 0
        ? ((averageFrequency - prevAverageFrequency) / prevAverageFrequency) * 100
        : 0

    return {
      totalReceipts,
      totalRevenue,
      averageBasket,
      activeCustomers,
      identificationRate,
      averageFrequency,
      receiptsTrend,
      revenueTrend,
      basketTrend,
      customersTrend,
      identificationTrend,
      frequencyTrend,
    }
  } catch (error) {
    console.error('Error fetching business overview:', error)
    // Return deterministic demo data
    return getDemoBusinessOverview()
  }
}

/**
 * Get data unlocked by Swiim (deterministic demo data)
 */
export function getUnlockedData(userId?: string): UnlockedData {
  // Deterministic demo data based on a seed
  const seed = userId ? userId.length : 42
  const base = seed % 100

  return {
    identifiedWithoutCard: 1250 + base * 10,
    identifiedRevenueShare: 68.5 + (base % 10) * 0.5,
    identifiedBasketAvg: 42.5 + (base % 5),
    unidentifiedBasketAvg: 28.3 + (base % 3),
    identifiedFrequency: 3.2 + (base % 5) * 0.1,
    unidentifiedFrequency: 1.1 + (base % 3) * 0.1,
    identificationByStore: [
      { storeName: 'Paris Bastille', rate: 75.2 + (base % 5) },
      { storeName: 'Lyon Part-Dieu', rate: 68.5 + (base % 4) },
      { storeName: 'Bordeaux Centre', rate: 72.1 + (base % 3) },
      { storeName: 'Nantes Commerce', rate: 65.8 + (base % 4) },
    ],
    identificationByCategory: [
      { category: 'Fruits & Légumes', rate: 85.4 + (base % 3) },
      { category: 'Épicerie', rate: 78.5 + (base % 4) },
      { category: 'Frais', rate: 81.2 + (base % 2) },
      { category: 'Boissons', rate: 72.4 + (base % 3) },
      { category: 'Hi-Tech', rate: 65.8 + (base % 4) },
      { category: 'Livres', rate: 88.2 + (base % 2) },
      { category: 'Vinyles', rate: 79.5 + (base % 3) },
    ],
  }
}

/**
 * Get time series data for trends
 */
export async function getTimeSeriesData(
  userId?: string,
  days: number = 30
): Promise<Array<{ date: string; tickets: number; revenue: number; identificationRate: number }>> {
  try {
    const prisma = await loadPrisma()
    if (!prisma) {
      return getDemoTimeSeriesData(days)
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: { gte: startDate },
        ...(userId ? { store: { userId } } : {}),
      },
      select: {
        createdAt: true,
        totalAmount: true,
        customerId: true,
      },
    })

    const byDay = new Map<
      string,
      { count: number; revenue: number; identified: number }
    >()

    receipts.forEach((r) => {
      const date = new Date(r.createdAt)
      const day = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })

      const current = byDay.get(day) || {
        count: 0,
        revenue: 0,
        identified: 0,
      }
      byDay.set(day, {
        count: current.count + 1,
        revenue: current.revenue + Number(r.totalAmount),
        identified: current.identified + (r.customerId ? 1 : 0),
      })
    })

    return Array.from(byDay.entries())
      .map(([date, data]) => ({
        date,
        tickets: data.count,
        revenue: data.revenue,
        identificationRate:
          data.count > 0 ? (data.identified / data.count) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching time series data:', error)
    return getDemoTimeSeriesData(days)
  }
}

// Demo data fallbacks (deterministic)
function getDemoBusinessOverview(): BusinessOverview {
  return {
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
}

function getDemoTimeSeriesData(
  days: number
): Array<{ date: string; tickets: number; revenue: number; identificationRate: number }> {
  const data: Array<{
    date: string
    tickets: number
    revenue: number
    identificationRate: number
  }> = []

  const base = 300
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dayStr = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' })
    const variation = Math.sin((i / days) * Math.PI * 2) * 50
    const tickets = Math.round(base + variation + (i % 7) * 10)
    const revenue = tickets * (35 + (i % 5))
    const identificationRate = 70 + (i % 10) + variation * 0.1

    data.push({
      date: dayStr,
      tickets,
      revenue,
      identificationRate: Math.max(60, Math.min(85, identificationRate)),
    })
  }

  return data
}

