import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { loadPrisma } from '@/lib/analytics/utils'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let stores: Array<{ id: string; name: string }> = []

  try {
    const prisma = await loadPrisma()
    if (prisma) {
      stores = await prisma.store.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      })
    }
  } catch (error) {
    console.error('Error fetching stores:', error)
  }

  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">
      <Sidebar />
      <div className="ml-64 flex-1">
        <Header stores={stores} />
        <main className="p-8">{children}</main>
      </div>
    </div>
  )
}

