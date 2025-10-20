import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface AnalysisResult {
  produto_tipo: string // Ex: "carne bovina", "bebida", "limpeza"
  produto_subtipo?: string // Ex: "picanha", "refrigerante", "sabão em pó"
  caracteristicas: string[] // Ex: ["angus", "premium", "orgânico"]
  marca_desejada?: string // Ex: "freeboi", "coca-cola"
  quantidade_info?: string // Ex: "10 unidades", "1kg"
  peso_unidade?: string // Ex: "400g", "1L"
  termos_busca: {
    principal: string // Termo otimizado principal
    alternativo: string // Termo sem marca específica
    generico: string // Termo super genérico para fallback
  }
  palavras_excluir: string[] // Palavras que indicam produto ERRADO
  confianca: number // 0-1: quão confiante a IA está na análise
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
        JSON.stringify({ error: 'Termo de busca é obrigatório' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY não configurada')
    }

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
            content: `Você é um especialista em análise de produtos de supermercado para donos de restaurantes e bares.

Sua tarefa é analisar um termo de busca e extrair informações estruturadas para otimizar a busca de produtos.

Categorias principais:
- Carnes: "carne bovina", "carne suína", "frango", "peixe"
- Laticínios: "leite", "queijo", "iogurte", "manteiga"
- Bebidas: "refrigerante", "água", "suco", "cerveja"
- Limpeza: "sabão", "detergente", "desinfetante"
- Alimentos processados: "hamburguer", "salsicha", "nuggets"
- Temperos: "tempero", "caldo", "condimento"
- Hortifruti: "verdura", "fruta", "legume"
- Grãos: "arroz", "feijão", "macarrão"
- Óleos: "óleo", "azeite"

IMPORTANTE: Identifique palavras que indicam produtos ERRADOS. Por exemplo:
- Se busca "picanha", EXCLUIR: "caldo", "tempero", "hamburguer", "processado", "moída", "burger"
- Se busca "leite", EXCLUIR: "condensado", "creme", "ninho em pó", "doce de leite"
- Se busca "arroz", EXCLUIR: "farinha de arroz", "biscoito de arroz", "creme de arroz"
- Se busca "carne fresca", EXCLUIR: "hamburguer", "processado", "empanado", "nuggets"
- Se busca "frango inteiro", EXCLUIR: "asa", "coxa", "peito", "filé"

Retorne APENAS JSON válido no formato especificado.`
          },
          {
            role: 'user',
            content: `Analise este termo de busca e retorne informações estruturadas:

"${term}"

Retorne JSON no formato:
{
  "produto_tipo": "string (categoria principal)",
  "produto_subtipo": "string (subcategoria específica)",
  "caracteristicas": ["array", "de", "características"],
  "marca_desejada": "string ou null",
  "quantidade_info": "string ou null",
  "peso_unidade": "string ou null",
  "termos_busca": {
    "principal": "termo otimizado completo",
    "alternativo": "termo sem marca",
    "generico": "termo super genérico"
  },
  "palavras_excluir": ["palavras", "que", "indicam", "produto", "errado"],
  "confianca": 0.95
}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const analysis: AnalysisResult = JSON.parse(data.choices[0].message.content)

    console.log(`[Análise] Termo: "${term}"`)
    console.log(`[Análise] Tipo: ${analysis.produto_tipo}${analysis.produto_subtipo ? ` / ${analysis.produto_subtipo}` : ''}`)
    console.log(`[Análise] Palavras para excluir: ${analysis.palavras_excluir.join(', ')}`)

    return new Response(
      JSON.stringify(analysis),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro ao analisar termo:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao analisar termo de busca',
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

