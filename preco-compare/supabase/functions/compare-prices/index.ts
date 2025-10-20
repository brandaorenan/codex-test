import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ProductResult {
  nome: string
  preco: number
  marca: string | null
  link: string | null
}

interface ItemEstruturado {
  termo_busca: string
  quantidade?: number
  marca?: string
  observacao?: string
}

interface ComparisonResult {
  item: string
  quantidade: number
  atacadao: ProductResult | null
  tenda: ProductResult | null
  melhorOpcao: 'atacadao' | 'tenda' | null
  economia: number
  matchConfianca?: number
}

// Função auxiliar para encontrar o produto mais barato
function encontrarMaisBarato(products: ProductResult[]): ProductResult | null {
  if (!products || products.length === 0) return null
  return products.reduce((menor, atual) => 
    atual.preco < menor.preco ? atual : menor
  )
}

// Função para fazer matching de produtos via LLM
async function matchProducts(
  atacadaoProducts: ProductResult[],
  tendaProducts: ProductResult[],
  supabaseUrl: string,
  supabaseKey: string
): Promise<{ atacadao_index: number; tenda_index: number; confianca: number } | null> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/match-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        atacadaoProducts,
        tendaProducts
      })
    })

    if (!response.ok) {
      console.error('Erro ao fazer matching:', await response.text())
      return null
    }

    const data = await response.json()
    return data.match
  } catch (error) {
    console.error('Erro ao chamar match-products:', error)
    return null
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { items, userId } = await req.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Lista de itens é obrigatória' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Normalizar items para garantir que temos ItemEstruturado[]
    const itemsEstruturados: ItemEstruturado[] = items.map(item => {
      // Se for string (retrocompatibilidade), converter
      if (typeof item === 'string') {
        return { termo_busca: item, quantidade: 1 }
      }
      // Se for objeto, garantir que tem quantidade
      return {
        ...item,
        quantidade: item.quantidade || 1
      }
    })

    // userId opcional para testes - não salvará no banco se não for fornecido
    const saveToDatabase = !!userId

    // Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Criar registro de query apenas se userId for fornecido
    let queryId: string | null = null
    
    if (saveToDatabase) {
      const { data: queryData, error: queryError } = await supabase
        .from('queries')
        .insert({
          user_id: userId,
          lista_texto: itemsEstruturados.map(i => `${i.quantidade || 1}x ${i.termo_busca}`).join(', ')
        })
        .select()
        .single()

      if (queryError) {
        throw new Error(`Erro ao criar query: ${queryError.message}`)
      }

      queryId = queryData.id
    }

    // Buscar preços em paralelo para cada item
    const resultados: ComparisonResult[] = []
    const allProducts: any[] = []
    const allComparisons: any[] = []

    for (const itemEstruturado of itemsEstruturados) {
      const item = itemEstruturado.termo_busca
      const quantidade = itemEstruturado.quantidade || 1
      // Buscar em ambas as APIs em paralelo
      const [atacadaoResponse, tendaResponse] = await Promise.all([
        fetch(`${supabaseUrl}/functions/v1/search-atacadao`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ term: item })
        }),
        fetch(`${supabaseUrl}/functions/v1/search-tenda`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`
          },
          body: JSON.stringify({ term: item })
        })
      ])

      const atacadaoData = atacadaoResponse.ok ? await atacadaoResponse.json() : { products: [] }
      const tendaData = tendaResponse.ok ? await tendaResponse.json() : { products: [] }

      // Pegar listas de produtos
      const atacadaoProducts = atacadaoData.products || []
      const tendaProducts = tendaData.products || []

      let atacadaoProduct: ProductResult | null = null
      let tendaProduct: ProductResult | null = null
      let matchConfianca: number | undefined = undefined

      // Tentar matching inteligente se ambos mercados têm produtos
      if (atacadaoProducts.length > 0 && tendaProducts.length > 0) {
        const match = await matchProducts(atacadaoProducts, tendaProducts, supabaseUrl, supabaseKey)
        
        if (match && match.confianca >= 0.7) {
          // Usar produtos matched
          atacadaoProduct = atacadaoProducts[match.atacadao_index]
          tendaProduct = tendaProducts[match.tenda_index]
          matchConfianca = match.confianca
          console.log(`Match encontrado para "${item}" com confiança ${match.confianca}`)
        }
      }

      // Fallback: se não houve match, pegar o mais barato de cada mercado
      if (!atacadaoProduct && atacadaoProducts.length > 0) {
        atacadaoProduct = encontrarMaisBarato(atacadaoProducts)
      }
      if (!tendaProduct && tendaProducts.length > 0) {
        tendaProduct = encontrarMaisBarato(tendaProducts)
      }

      // Determinar melhor opção e calcular economia considerando quantidade
      let melhorOpcao: 'atacadao' | 'tenda' | null = null
      let economiaUnitaria = 0
      let economiaTotal = 0

      if (atacadaoProduct && tendaProduct) {
        if (atacadaoProduct.preco < tendaProduct.preco) {
          melhorOpcao = 'atacadao'
          economiaUnitaria = tendaProduct.preco - atacadaoProduct.preco
        } else {
          melhorOpcao = 'tenda'
          economiaUnitaria = atacadaoProduct.preco - tendaProduct.preco
        }
        economiaTotal = economiaUnitaria * quantidade
      } else if (atacadaoProduct) {
        melhorOpcao = 'atacadao'
      } else if (tendaProduct) {
        melhorOpcao = 'tenda'
      }

      resultados.push({
        item,
        quantidade,
        atacadao: atacadaoProduct,
        tenda: tendaProduct,
        melhorOpcao,
        economia: economiaTotal,
        matchConfianca
      })

      // Preparar dados para inserção apenas se saveToDatabase for true
      if (saveToDatabase && queryId) {
        if (atacadaoProduct) {
          allProducts.push({
            nome: atacadaoProduct.nome,
            preco: atacadaoProduct.preco,
            mercado: 'atacadao',
            marca: atacadaoProduct.marca,
            link: atacadaoProduct.link,
            query_id: queryId
          })
        }

        if (tendaProduct) {
          allProducts.push({
            nome: tendaProduct.nome,
            preco: tendaProduct.preco,
            mercado: 'tenda',
            marca: tendaProduct.marca,
            link: tendaProduct.link,
            query_id: queryId
          })
        }

        allComparisons.push({
          query_id: queryId,
          item: `${quantidade}x ${item}`,
          preco_atacadao: atacadaoProduct?.preco || null,
          preco_tenda: tendaProduct?.preco || null,
          melhor_opcao: melhorOpcao,
          economia: economiaTotal
        })
      }
    }

    // Salvar produtos apenas se saveToDatabase for true
    if (saveToDatabase && allProducts.length > 0) {
      const { error: productsError } = await supabase
        .from('products')
        .insert(allProducts)

      if (productsError) {
        console.error('Erro ao salvar produtos:', productsError)
      }
    }

    // Salvar comparações apenas se saveToDatabase for true
    if (saveToDatabase && allComparisons.length > 0) {
      const { error: comparisonsError } = await supabase
        .from('comparisons')
        .insert(allComparisons)

      if (comparisonsError) {
        console.error('Erro ao salvar comparações:', comparisonsError)
      }
    }

    // Calcular economia total
    const economiaTotal = resultados.reduce((sum, r) => sum + r.economia, 0)

    return new Response(
      JSON.stringify({
        queryId,
        resultados,
        economiaTotal
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro na comparação:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao comparar preços',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})

