import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ProductResult {
  nome: string
  preco: number
  marca: string | null
  link: string | null
}

interface FilterRequest {
  products: ProductResult[]
  termo_original: string
  produto_tipo: string
  produto_subtipo?: string
  caracteristicas: string[]
  palavras_excluir: string[]
}

interface FilteredProduct extends ProductResult {
  relevancia_score: number
  motivo_relevancia: string
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
    const { 
      products, 
      termo_original, 
      produto_tipo, 
      produto_subtipo,
      caracteristicas,
      palavras_excluir 
    }: FilterRequest = await req.json()

    if (!products || !termo_original) {
      return new Response(
        JSON.stringify({ error: 'Produtos e termo original são obrigatórios' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Se não há produtos, retornar lista vazia
    if (products.length === 0) {
      return new Response(
        JSON.stringify({ products: [] }),
        { 
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

    // Simplificar produtos para reduzir tokens
    const productsSimplified = products.map((p, i) => ({
      index: i,
      nome: p.nome,
      marca: p.marca,
      preco: p.preco
    }))

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Você é um especialista em filtrar produtos de supermercado.

Sua tarefa é analisar uma lista de produtos e identificar quais são RELEVANTES para o que o usuário está buscando.

Critérios de EXCLUSÃO (produtos IRRELEVANTES):
1. Produtos de categoria completamente diferente
2. Produtos que contêm palavras da lista de exclusão
3. Produtos muito processados quando se busca produto fresco (ex: hambúrguer quando busca picanha)
4. Temperos/caldos quando se busca o ingrediente real (ex: caldo de picanha quando busca picanha)
5. Produtos miniatura/amostra quando se busca produto normal
6. Produtos derivados quando se busca o produto base (ex: creme de leite quando busca leite)

Critérios de INCLUSÃO (produtos RELEVANTES):
1. Mesma categoria do produto buscado
2. Características compatíveis
3. Marca compatível (ou qualquer marca se não especificada)
4. Tipo de processamento compatível (fresco vs processado)
5. Peso/quantidade razoável para o tipo de produto

Para cada produto, retorne um score de relevância (0.0 a 1.0) e um motivo breve.

Retorne APENAS JSON válido.`
          },
          {
            role: 'user',
            content: `Busca original: "${termo_original}"
Tipo de produto: ${produto_tipo}
${produto_subtipo ? `Subtipo: ${produto_subtipo}` : ''}
Características desejadas: ${caracteristicas.join(', ') || 'nenhuma'}
Palavras para EXCLUIR: ${palavras_excluir.join(', ') || 'nenhuma'}

Produtos encontrados:
${JSON.stringify(productsSimplified, null, 2)}

Retorne JSON no formato:
{
  "filtered_products": [
    {
      "index": 0,
      "relevancia_score": 0.95,
      "motivo_relevancia": "Produto correto, marca compatível"
    }
  ]
}

Retorne APENAS produtos com score >= 0.6`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    // Reconstruir produtos filtrados com informações completas
    const filteredProducts: FilteredProduct[] = result.filtered_products
      .filter((fp: any) => fp.relevancia_score >= 0.6)
      .map((fp: any) => ({
        ...products[fp.index],
        relevancia_score: fp.relevancia_score,
        motivo_relevancia: fp.motivo_relevancia
      }))
      .sort((a: FilteredProduct, b: FilteredProduct) => b.relevancia_score - a.relevancia_score)

    console.log(`[Filtro] "${termo_original}": ${products.length} produtos → ${filteredProducts.length} relevantes`)
    if (filteredProducts.length > 0) {
      console.log(`[Filtro] Top produto: ${filteredProducts[0].nome} (score: ${filteredProducts[0].relevancia_score})`)
    }

    return new Response(
      JSON.stringify({ products: filteredProducts }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro ao filtrar produtos:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao filtrar produtos',
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

