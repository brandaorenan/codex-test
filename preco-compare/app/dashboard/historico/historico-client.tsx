'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, TrendingDown } from 'lucide-react'

interface Comparison {
  id: string
  item: string
  preco_atacadao: number | null
  preco_tenda: number | null
  melhor_opcao: string | null
  economia: number | null
}

interface Query {
  id: string
  lista_texto: string | null
  ocr_image_url: string | null
  created_at: string
  comparisons: Comparison[]
}

interface HistoricoClientProps {
  queries: Query[]
}

export default function HistoricoClient({ queries }: HistoricoClientProps) {
  const router = useRouter()

  const formatPrice = (price: number | null) => {
    if (price == null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const getTotalEconomia = (comparisons: Comparison[]) => {
    return comparisons.reduce((sum, c) => sum + (c.economia || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Histórico de Comparações</h1>
              <p className="text-sm text-gray-600">Veja suas comparações anteriores</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {queries.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-gray-500 mb-4">
                Você ainda não fez nenhuma comparação.
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Fazer primeira comparação
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {queries.map((query) => {
              const totalEconomia = getTotalEconomia(query.comparisons)
              const itensComparados = query.comparisons.length

              return (
                <Card key={query.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          {query.lista_texto || 'Lista sem título'}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(query.created_at)}
                          </span>
                          <span>{itensComparados} itens comparados</span>
                        </CardDescription>
                      </div>
                      {totalEconomia > 0 && (
                        <Badge className="bg-green-500 hover:bg-green-600 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          Economia: {formatPrice(totalEconomia)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {query.comparisons.slice(0, 3).map((comparison) => (
                        <div
                          key={comparison.id}
                          className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded"
                        >
                          <span className="font-medium">{comparison.item}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600">
                              Atacadão: {formatPrice(comparison.preco_atacadao)}
                            </span>
                            <span className="text-gray-600">
                              Tenda: {formatPrice(comparison.preco_tenda)}
                            </span>
                            {comparison.melhor_opcao && (
                              <Badge variant="outline" className="text-xs">
                                {comparison.melhor_opcao === 'atacadao' ? 'Atacadão' : 'Tenda'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                      {query.comparisons.length > 3 && (
                        <p className="text-sm text-gray-500 text-center pt-2">
                          + {query.comparisons.length - 3} itens
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

