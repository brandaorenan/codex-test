import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ComparisonResponse } from '@/types/database'
import { ExternalLink } from 'lucide-react'

interface ComparisonTableProps {
  resultado: ComparisonResponse
}

export default function ComparisonTable({ resultado }: ComparisonTableProps) {
  const formatPrice = (price: number | undefined | null) => {
    if (price == null) return '-'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  // Função auxiliar para garantir que item seja sempre string
  const getItemName = (item: any): string => {
    if (typeof item === 'string') return item
    if (item?.termo_busca) return item.termo_busca
    return String(item)
  }

  return (
    <div className="space-y-6">
      {/* Card de Economia Total */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl">Economia Total Estimada</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">
            {formatPrice(resultado.economiaTotal)}
          </div>
          <p className="text-sm mt-2 text-green-100">
            Você pode economizar esse valor comprando nos melhores mercados!
          </p>
        </CardContent>
      </Card>

      {/* Tabela de Comparação */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Preços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Item</TableHead>
                  <TableHead>Atacadão</TableHead>
                  <TableHead>Tenda</TableHead>
                  <TableHead>Melhor Opção</TableHead>
                  <TableHead className="text-right">Economia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resultado.resultados.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">
                      {item.quantidade > 1 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                          {item.quantidade}x
                        </span>
                      )}
                      {getItemName(item.item)}
                    </TableCell>
                    
                    {/* Atacadão */}
                    <TableCell>
                      {item.atacadao ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {formatPrice(item.atacadao.preco)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.atacadao.nome}
                          </div>
                          {item.atacadao.marca && (
                            <div className="text-xs text-gray-500">
                              Marca: {item.atacadao.marca}
                            </div>
                          )}
                          {item.atacadao.link && (
                            <a
                              href={item.atacadao.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              Ver produto <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não encontrado</span>
                      )}
                    </TableCell>

                    {/* Tenda */}
                    <TableCell>
                      {item.tenda ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-sm">
                            {formatPrice(item.tenda.preco)}
                          </div>
                          <div className="text-xs text-gray-600">
                            {item.tenda.nome}
                          </div>
                          {item.tenda.marca && (
                            <div className="text-xs text-gray-500">
                              Marca: {item.tenda.marca}
                            </div>
                          )}
                          {item.tenda.link && (
                            <a
                              href={item.tenda.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              Ver produto <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Não encontrado</span>
                      )}
                    </TableCell>

                    {/* Melhor Opção */}
                    <TableCell>
                      {item.melhorOpcao ? (
                        <Badge
                          variant={item.melhorOpcao === 'atacadao' ? 'default' : 'secondary'}
                        >
                          {item.melhorOpcao === 'atacadao' ? 'Atacadão' : 'Tenda'}
                        </Badge>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>

                    {/* Economia */}
                    <TableCell className="text-right">
                      {item.economia > 0 ? (
                        <span className="font-semibold text-green-600">
                          {formatPrice(item.economia)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Mercado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Atacadão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Itens mais baratos:</span>
                <span className="font-semibold">
                  {resultado.resultados.filter(r => r.melhorOpcao === 'atacadao').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total se comprar tudo:</span>
                <span className="font-semibold">
                  {formatPrice(
                    resultado.resultados.reduce((sum, r) => 
                      sum + (r.atacadao?.preco || 0) * r.quantidade, 0
                    )
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tenda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Itens mais baratos:</span>
                <span className="font-semibold">
                  {resultado.resultados.filter(r => r.melhorOpcao === 'tenda').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total se comprar tudo:</span>
                <span className="font-semibold">
                  {formatPrice(
                    resultado.resultados.reduce((sum, r) => 
                      sum + (r.tenda?.preco || 0) * r.quantidade, 0
                    )
                  )}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

