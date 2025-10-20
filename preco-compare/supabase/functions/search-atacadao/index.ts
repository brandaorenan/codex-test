import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ProductResult {
  nome: string
  preco: number
  marca: string | null
  link: string | null
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
    const { term } = await req.json()

    if (!term) {
      return new Response(
        JSON.stringify({ error: 'O termo de busca é obrigatório' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Montar as variáveis para a query string
    const variables = {
      first: 20,
      after: "0",
      sort: "score_desc",
      term: term,
      selectedFacets: [
        {
          key: "channel",
          value: '{"salesChannel":"1","seller":"atacadaobr340","regionId":"U1cjYXRhY2FkYW9icjM0MA=="}'
        },
        {
          key: "locale",
          value: "pt-BR"
        }
      ]
    }

    // Construir a URL com variables na query string
    const variablesParam = encodeURIComponent(JSON.stringify(variables))
    const url = `https://www.atacadao.com.br/api/graphql?operationName=ProductsQuery&variables=${variablesParam}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Origin': 'https://www.atacadao.com.br',
        'Referer': 'https://www.atacadao.com.br/',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Cookie': 'regionalization={"salesChannel":"1","postalCode":"03157-201","seller":"atacadaobr340"}'
      }
    })

    if (!response.ok) {
      throw new Error(`Erro na API do Atacadão: ${response.status}`)
    }

    const data = await response.json()
    
    // Normalizar resposta
    const products: ProductResult[] = []
    
    if (data?.data?.search?.products?.edges) {
      for (const edge of data.data.search.products.edges) {
        const product = edge.node
        
        // Pegar o menor preço (lowPrice) ou o primeiro preço disponível
        const price = product.offers?.lowPrice || product.offers?.offers?.[0]?.price

        if (price && price > 0) {
          // Construir link do produto
          const productLink = product.slug ? `https://www.atacadao.com.br/${product.slug}/p` : null

          products.push({
            nome: product.name || 'Produto sem nome',
            preco: price,
            marca: product.brand?.brandName || product.brand?.name || null,
            link: productLink
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ products }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro na busca do Atacadão:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar produtos no Atacadão',
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

