import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime, formatReceiptId } from '@/lib/format'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

async function getReceipt(id: string) {
  try {
    return await prisma.receipt.findUnique({
      where: { id },
      include: {
        store: true,
        lineItems: true,
      },
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return null
  }
}

export default async function TicketPrintPage({
  params,
}: {
  params: { id: string }
}) {
  const receipt = await getReceipt(params.id)

  if (!receipt) {
    notFound()
  }

  const subtotal = receipt.lineItems.reduce(
    (sum, item) => sum + Number(item.unitPrice) * item.quantity,
    0
  )
  const tva = subtotal * 0.2
  const total = subtotal + tva

  return (
    <div className="max-w-md mx-auto p-8 print:p-4">

      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-3xl font-bold">SWIIM</div>
          <div className="text-sm text-muted-foreground">
            Ticket stocké côté client via Swiim
          </div>
        </div>

        {/* Store Info */}
        <div className="border-t pt-4 space-y-1">
          <div className="font-medium text-lg">{receipt.store.name}</div>
          {receipt.store.address && (
            <div className="text-sm text-muted-foreground">{receipt.store.address}</div>
          )}
          {receipt.store.city && (
            <div className="text-sm text-muted-foreground">{receipt.store.city}</div>
          )}
        </div>

        {/* Line Items */}
        <div className="border-t pt-4 space-y-3">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Article</th>
                <th className="text-right pb-2">Qté</th>
                <th className="text-right pb-2">Prix unit.</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.lineItems.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">{item.category}</div>
                  </td>
                  <td className="text-right py-2">{item.quantity}</td>
                  <td className="text-right py-2">
                    {formatCurrency(Number(item.unitPrice))}
                  </td>
                  <td className="text-right py-2 font-medium">
                    {formatCurrency(Number(item.unitPrice) * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Sous-total HT</span>
            <span className="font-medium">{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">TVA (20%)</span>
            <span className="font-medium">{formatCurrency(tva)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-lg font-bold">
            <span>Total TTC</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 text-center text-sm text-muted-foreground">
          <div>Référence: {formatReceiptId(receipt.id)}</div>
          <div className="mt-1">{formatDateTime(receipt.createdAt)}</div>
        </div>
      </div>
    </div>
  )
}

