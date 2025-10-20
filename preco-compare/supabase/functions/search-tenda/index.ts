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

    // Busca na API do Tenda conforme cURL especificado
    const response = await fetch(
      `https://api.tendaatacado.com.br/api/public/store/search?query=${encodeURIComponent(term)}&page=1&order=relevance&cartId=12345678`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'Authorization': 'Bearer 3a54db9bd9182d9f7c291c6fe23b107a',
          'Origin': 'https://www.tendaatacado.com.br',
          'Referer': 'https://www.tendaatacado.com.br/',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      }
    )

    if (!response.ok) {
      throw new Error(`Erro na API do Tenda: ${response.status}`)
    }

    const data = await response.json()
    
    // Normalizar resposta
    const products: ProductResult[] = []
    
    if (data?.products && Array.isArray(data.products)) {
      for (const product of data.products) {
        // Verificar se tem preço válido
        const price = product.price
        
        if (price && price > 0) {
          products.push({
            nome: product.name || 'Produto sem nome',
            preco: price,
            marca: product.brand || null,
            link: product.url || null
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
    console.error('Erro na busca do Tenda:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao buscar produtos no Tenda',
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

