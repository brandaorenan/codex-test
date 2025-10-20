import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ProductInfo {
  nome: string
  preco: number
  marca: string | null
}

interface ProductMatch {
  atacadao_index: number
  tenda_index: number
  confianca: number
}

interface MatchResponse {
  match: ProductMatch | null
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
    const { atacadaoProducts, tendaProducts } = await req.json()

    if (!atacadaoProducts || !tendaProducts) {
      return new Response(
        JSON.stringify({ error: 'Produtos de ambos mercados são obrigatórios' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Se qualquer lista estiver vazia, retornar sem match
    if (atacadaoProducts.length === 0 || tendaProducts.length === 0) {
      return new Response(
        JSON.stringify({ match: null }),
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

    // Preparar dados para a LLM (simplificar para reduzir tokens)
    const atacadaoSimplified = atacadaoProducts.map((p: ProductInfo, i: number) => ({
      index: i,
      nome: p.nome,
      marca: p.marca,
      preco: p.preco
    }))

    const tendaSimplified = tendaProducts.map((p: ProductInfo, i: number) => ({
      index: i,
      nome: p.nome,
      marca: p.marca,
      preco: p.preco
    }))

    // Chamar OpenAI para fazer matching
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
            content: `Você é um especialista em identificar produtos equivalentes em supermercados.

Sua tarefa é comparar produtos de dois mercados diferentes (Atacadão e Tenda) e encontrar o melhor par de produtos equivalentes.

Critérios OBRIGATÓRIOS para produtos equivalentes:
1. MESMA CATEGORIA - produtos devem ser exatamente do mesmo tipo
   ❌ NÃO match: picanha fresca com hambúrguer
   ❌ NÃO match: leite integral com leite condensado
   ❌ NÃO match: arroz com farinha de arroz
   ❌ NÃO match: carne fresca com caldo/tempero
   ✅ OK: picanha angus com picanha angus

2. MESMO NÍVEL DE PROCESSAMENTO
   ❌ NÃO match: carne fresca com carne processada
   ❌ NÃO match: produto natural com tempero/caldo
   ✅ OK: ambos frescos ou ambos processados similarmente

3. PESO/QUANTIDADE SIMILAR (tolerância de ±30%)
   ✅ OK: 400g com 500g
   ❌ NÃO match: 1kg com 100g

4. MARCA (preferencialmente mesma marca, ou marcas equivalentes)
   ✅ OK: mesma marca
   ✅ OK: marcas diferentes mas mesmo nível (ambas premium ou ambas econômicas)

SCORE DE CONFIANÇA:
- 0.9-1.0: Produto idêntico ou quase idêntico (mesma marca, peso similar)
- 0.7-0.89: Produtos equivalentes com pequenas diferenças (marcas diferentes mas categoria igual)
- 0.6-0.69: Produtos similares mas com diferenças notáveis
- <0.6: Produtos muito diferentes (NÃO retornar)

Retorne APENAS um JSON válido no formato:
{
  "match": {
    "atacadao_index": number,
    "tenda_index": number,
    "confianca": number
  }
}

Se NÃO houver nenhum par equivalente com confiança >= 0.6, retorne:
{
  "match": null
}

IMPORTANTE: Seja rigoroso na categoria. É melhor retornar null do que comparar produtos incompatíveis.`
          },
          {
            role: 'user',
            content: `Encontre o melhor par de produtos equivalentes:

ATACADÃO:
${JSON.stringify(atacadaoSimplified, null, 2)}

TENDA:
${JSON.stringify(tendaSimplified, null, 2)}`
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
    const content = data.choices[0].message.content
    const parsed: MatchResponse = JSON.parse(content)

    // Validar resposta
    if (parsed.match) {
      // Validar índices
      if (
        parsed.match.atacadao_index < 0 || 
        parsed.match.atacadao_index >= atacadaoProducts.length ||
        parsed.match.tenda_index < 0 || 
        parsed.match.tenda_index >= tendaProducts.length
      ) {
        console.error('Índices inválidos retornados pela LLM')
        return new Response(
          JSON.stringify({ match: null }),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }

      // Validar confiança
      if (parsed.match.confianca < 0.6) {
        return new Response(
          JSON.stringify({ match: null }),
          { 
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*'
            }
          }
        )
      }
    }

    return new Response(
      JSON.stringify(parsed),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro ao fazer matching:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao fazer matching de produtos',
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

