import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ItemEstruturado {
  termo_busca: string
  quantidade?: number
  marca?: string
  observacao?: string
}

interface ProcessListResponse {
  items: ItemEstruturado[]
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
    const { text } = await req.json()

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Texto é obrigatório' }),
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

    // Chamar OpenAI para processar o texto
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
            content: `Você é um assistente que extrai itens de listas de compras e os estrutura em JSON.

Sua tarefa é:
1. Identificar cada item da lista
2. Extrair informações estruturadas: termo de busca, quantidade, marca, observações
3. Normalizar o termo de busca para ser usado em APIs de supermercado

Regras:
- termo_busca: texto limpo e normalizado para buscar o produto (ex: "leite integral 1l")
- quantidade: número de unidades se mencionado
- marca: nome da marca se especificado
- observacao: qualquer detalhe adicional relevante

Retorne APENAS um JSON válido no formato:
{
  "items": [
    {
      "termo_busca": "string",
      "quantidade": number (opcional),
      "marca": "string" (opcional),
      "observacao": "string" (opcional)
    }
  ]
}`
          },
          {
            role: 'user',
            content: `Extraia os itens desta lista de compras:\n\n${text}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Erro na API OpenAI: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const parsed: ProcessListResponse = JSON.parse(content)

    // Validar estrutura
    if (!parsed.items || !Array.isArray(parsed.items)) {
      throw new Error('Resposta da IA não contém array de itens')
    }

    // Garantir que todos os itens tenham pelo menos termo_busca
    const validItems = parsed.items.filter(item => 
      item.termo_busca && item.termo_busca.trim().length > 0
    )

    return new Response(
      JSON.stringify({ items: validItems }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Erro ao processar lista:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao processar lista',
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

