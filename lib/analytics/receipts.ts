import { prisma } from '@/lib/prisma'
import { Decimal } from '@prisma/client/runtime/library'

const buildStoreFilter = (userId?: string) =>
  userId ? { store: { userId } } : {}

export async function getReceiptStats(userId?: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        ...buildStoreFilter(userId),
      },
      include: {
        customer: true,
        store: true,
      },
    })

    const totalAmount = receipts.reduce((sum, r) => sum.plus(r.totalAmount), new Decimal(0))
    const totalCount = receipts.length
    const claimedCount = receipts.filter(r => r.status === 'RECLAME').length
    const claimedRate = totalCount > 0 ? (claimedCount / totalCount) * 100 : 0
    const averageBasket = totalCount > 0 ? totalAmount.div(totalCount).toNumber() : 0

    const uniqueCustomers = new Set(receipts.filter(r => r.customerId).map(r => r.customerId))
    const activeCustomers = uniqueCustomers.size

    // Frequency: average visits per customer
    const customerReceipts = new Map<string, number>()
    receipts.forEach(r => {
      if (r.customerId) {
        customerReceipts.set(r.customerId, (customerReceipts.get(r.customerId) || 0) + 1)
      }
    })
    const frequencies = Array.from(customerReceipts.values())
    const averageFrequency = frequencies.length > 0
      ? frequencies.reduce((a, b) => a + b, 0) / frequencies.length
      : 0

    return {
      totalReceipts: totalCount,
      totalRevenue: totalAmount.toNumber(),
      claimedRate,
      activeCustomers,
      averageBasket,
      averageFrequency,
    }
  } catch (error) {
    console.error('Error fetching receipt stats:', error)
    return {
      totalReceipts: 0,
      totalRevenue: 0,
      claimedRate: 0,
      activeCustomers: 0,
      averageBasket: 0,
      averageFrequency: 0,
    }
  }
}

export async function getReceiptsByDay(userId?: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        ...buildStoreFilter(userId),
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    })

    const byDay = new Map<string, { count: number; revenue: Decimal }>()

    receipts.forEach(r => {
      // Use Europe/Paris timezone for grouping
      const date = new Date(r.createdAt)
      const day = date.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) // YYYY-MM-DD format

      const current = byDay.get(day) || { count: 0, revenue: new Decimal(0) }
      byDay.set(day, {
        count: current.count + 1,
        revenue: current.revenue.plus(r.totalAmount),
      })
    })

    return Array.from(byDay.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        revenue: data.revenue.toNumber(),
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  } catch (error) {
    console.error('Error fetching receipts by day:', error)
    return []
  }
}

export async function getStorePerformance(userId?: string, days: number = 30) {
  try {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const receipts = await prisma.receipt.findMany({
      where: {
        createdAt: {
          gte: startDate,
        },
        ...buildStoreFilter(userId),
      },
      include: {
        store: true,
      },
    })

    const storeMap = new Map<string, {
      id: string
      name: string
      revenue: Decimal
      count: number
      claimed: number
    }>()

    receipts.forEach(r => {
      const storeId = r.storeId
      const current = storeMap.get(storeId) || {
        id: storeId,
        name: r.store.name,
        revenue: new Decimal(0),
        count: 0,
        claimed: 0,
      }
      storeMap.set(storeId, {
        ...current,
        revenue: current.revenue.plus(r.totalAmount),
        count: current.count + 1,
        claimed: current.claimed + (r.status === 'RECLAME' ? 1 : 0),
      })
    })

    return Array.from(storeMap.values())
      .map(store => ({
        ...store,
        revenue: store.revenue.toNumber(),
        claimedRate: store.count > 0 ? (store.claimed / store.count) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  } catch (error) {
    console.error('Error fetching store performance:', error)
    return []
  }
}


