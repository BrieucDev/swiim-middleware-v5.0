import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/dashboard/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatCurrency, formatDate, formatDateTime, formatReceiptId, maskEmail } from '@/lib/format'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Printer, RefreshCw } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getReceipt(id: string) {
  try {
    return await prisma.receipt.findUnique({
      where: { id },
      include: {
        store: true,
        pos: true,
        customer: true,
        lineItems: true,
      },
    })
  } catch (error) {
    console.error('Error fetching receipt:', error)
    return null
  }
}

export default async function TicketDetailPage({
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900">Ticket {formatReceiptId(receipt.id)}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Détail et informations du ticket de caisse
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/tickets/${receipt.id}/print`} target="_blank">
            <Button className="rounded-full bg-gray-900 text-white hover:bg-gray-800">
              <Printer className="mr-2 h-4 w-4" />
              Imprimer la version client
            </Button>
          </Link>
          <Button variant="outline" className="rounded-full border-gray-200">
            <RefreshCw className="mr-2 h-4 w-4" />
            Régénérer le lien
          </Button>
        </div>
      </div>

      {/* Main Info Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardHeader className="px-6 pt-6">
            <CardTitle className="text-base font-semibold text-gray-900">Ticket / Info client / Contexte</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Magasin</div>
                <div className="font-semibold text-gray-900">{receipt.store.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">TPE</div>
                <div className="font-semibold text-gray-900">{receipt.pos.name}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Date</div>
                <div className="font-semibold text-gray-900">{formatDateTime(receipt.createdAt)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Statut</div>
                <StatusBadge status={receipt.status} />
              </div>
            </div>
            {receipt.customer && (
              <div className="pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Client</div>
                <div className="font-semibold text-gray-900">{receipt.customer.firstName} {receipt.customer.lastName}</div>
                <div className="text-sm text-gray-500 mt-1">{maskEmail(receipt.customer.email)}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Side Cards */}
        <div className="space-y-6">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardContent className="px-6 pt-6 pb-6">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Montant total</div>
              <div className="text-3xl font-semibold text-gray-900">{formatCurrency(Number(receipt.totalAmount))}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardContent className="px-6 pt-6 pb-6">
              <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-2">Statut</div>
              <StatusBadge status={receipt.status} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue="ticket" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ticket">Ticket</TabsTrigger>
          <TabsTrigger value="transaction">Transaction</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="ticket" className="space-y-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-semibold text-gray-900">Ticket de caisse numérique</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-6">
                {/* Header */}
                <div className="text-center space-y-2 pb-6 border-b border-gray-100">
                  <div className="text-2xl font-bold text-gray-900">SWIIM</div>
                  <div className="text-sm text-gray-500">
                    Ticket stocké côté client via Swiim
                  </div>
                </div>

                {/* Store Info */}
                <div className="pt-4 space-y-1">
                  <div className="font-semibold text-gray-900">{receipt.store.name}</div>
                  {receipt.store.address && (
                    <div className="text-sm text-gray-500">{receipt.store.address}</div>
                  )}
                  {receipt.store.city && (
                    <div className="text-sm text-gray-500">{receipt.store.city}</div>
                  )}
                </div>

                {/* Line Items */}
                <div className="pt-4 space-y-3">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                        <TableHead className="font-semibold text-gray-600">Article</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Qté</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Prix unit.</TableHead>
                        <TableHead className="text-right font-semibold text-gray-600">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receipt.lineItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-gray-50/50 border-gray-50">
                          <TableCell>
                            <div className="font-medium text-gray-900">{item.productName}</div>
                            <div className="text-sm text-gray-500">{item.category}</div>
                          </TableCell>
                          <TableCell className="text-right text-gray-900">{item.quantity}</TableCell>
                          <TableCell className="text-right text-gray-900 font-mono">
                            {formatCurrency(Number(item.unitPrice))}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 font-mono">
                            {formatCurrency(Number(item.unitPrice) * item.quantity)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Totals */}
                <div className="pt-4 space-y-2 border-t border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Sous-total HT</span>
                    <span className="font-medium font-mono">{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>TVA (20%)</span>
                    <span className="font-medium font-mono">{formatCurrency(tva)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-2 text-lg font-semibold text-gray-900">
                    <span>Total TTC</span>
                    <span className="font-mono">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
                  <div>Référence: {formatReceiptId(receipt.id)}</div>
                  <div className="mt-1">{formatDateTime(receipt.createdAt)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transaction" className="space-y-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-semibold text-gray-900">Informations transaction</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Méthode de paiement</div>
                  <div className="font-semibold text-gray-900">Carte bancaire</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Terminal</div>
                  <div className="font-semibold text-gray-900">{receipt.pos.identifier}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Autorisation</div>
                  <div className="font-semibold text-gray-900 font-mono">AUT-****-****-{receipt.id.slice(-4)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-[0.14em] mb-1">Montant</div>
                  <div className="font-semibold text-gray-900 font-mono">{formatCurrency(Number(receipt.totalAmount))}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
            <CardHeader className="px-6 pt-6">
              <CardTitle className="text-base font-semibold text-gray-900">Historique</CardTitle>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-2 w-2 rounded-full bg-[#C7FF06] mt-2" />
                  </div>
                  <div className="flex-1 pb-4 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">Ticket créé</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {formatDateTime(receipt.createdAt)}
                    </div>
                  </div>
                </div>
                {receipt.status === 'RECLAME' && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
                    </div>
                    <div className="flex-1 pb-4 border-b border-gray-100">
                      <div className="font-semibold text-gray-900">Ticket réclamé par le client</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Stocké dans l&apos;application mobile
                      </div>
                    </div>
                  </div>
                )}
                {receipt.status === 'REMBOURSE' && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="h-2 w-2 rounded-full bg-amber-500 mt-2" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">Ticket remboursé</div>
                      <div className="text-sm text-gray-500 mt-1">
                        Remboursement effectué
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {receipt.status !== 'REMBOURSE' && receipt.status !== 'ANNULE' && (
        <Card className="bg-white/90 border border-gray-100 rounded-2xl shadow-[0_10px_40px_rgba(15,23,42,0.04)]">
          <CardContent className="px-6 pt-6 pb-6">
            <Button variant="outline" className="rounded-full border-gray-200">Marquer comme remboursé</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

