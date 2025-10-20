'use client'

import { useState } from 'react'
import { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import ComparisonTable from '@/components/comparison-table'
import { ComparisonResponse } from '@/types/database'
import { useRouter } from 'next/navigation'

interface DashboardClientProps {
  user: User
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [listaTexto, setListaTexto] = useState('')
  const [loading, setLoading] = useState(false)
  const [resultado, setResultado] = useState<ComparisonResponse | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!listaTexto.trim()) {
      toast.error('Por favor, insira uma lista de compras')
      return
    }

    setLoading(true)
    setResultado(null)

    try {
      // Primeiro: processar texto com LLM para estruturar itens
      toast.info('Processando lista com IA...')
      
      const { data: processedData, error: processError } = await supabase.functions.invoke('process-list', {
        body: { text: listaTexto }
      })

      if (processError) throw processError

      if (!processedData?.items || processedData.items.length === 0) {
        toast.error('Nenhum item válido encontrado na lista')
        return
      }

      // Passar itens estruturados completos (com quantidade)
      const items = processedData.items

      toast.info(`${items.length} itens identificados. Comparando preços...`)

      // Segundo: chamar Edge Function de comparação
      const { data, error } = await supabase.functions.invoke('compare-prices', {
        body: { items, userId: user.id }
      })

      if (error) throw error

      // Debug: verificar estrutura dos dados
      console.log('Dados recebidos:', data)
      
      setResultado(data)
      toast.success(`Comparação concluída! ${items.length} itens analisados.`)
    } catch (error) {
      console.error('Erro ao comparar preços:', error)
      toast.error((error as Error).message || 'Erro ao comparar preços')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Compara Preço</h1>
            <p className="text-sm text-gray-600">Bem-vindo, {user.email}</p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/historico')}
            >
              Histórico
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Nova Comparação de Preços</CardTitle>
            <CardDescription>
              Digite sua lista de compras separando os itens por vírgula ou quebra de linha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="lista">Lista de Compras</Label>
                <textarea
                  id="lista"
                  className="w-full min-h-[150px] px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Exemplo:&#10;10 caixas de leite&#10;5 pacotes de arroz&#10;3 sabões em pó"
                  value={listaTexto}
                  onChange={(e) => setListaTexto(e.target.value)}
                  disabled={loading}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Comparando preços...' : 'Comparar Preços'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Resultados */}
        {resultado && <ComparisonTable resultado={resultado} />}
      </main>
    </div>
  )
}

