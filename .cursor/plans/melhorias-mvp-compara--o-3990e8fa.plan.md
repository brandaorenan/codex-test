<!-- 3990e8fa-657f-42a1-ac7d-3da4ec70776b 7fb634d7-4a62-4422-a4c1-8af845335625 -->
# Melhorias MVP - Busca Inteligente e LLM

## 1. Corrigir Busca para Pegar o Mais Barato

**Arquivo**: `supabase/functions/compare-prices/index.ts`

Substituir linhas 101-103 que pegam apenas o primeiro produto:

```typescript
// ANTES (linha 102-103):
const atacadaoProduct = atacadaoData.products?.[0] || null
const tendaProduct = tendaData.products?.[0] || null

// DEPOIS:
const atacadaoProduct = encontrarMaisBarato(atacadaoData.products)
const tendaProduct = encontrarMaisBarato(tendaData.products)
```

Adicionar função auxiliar após interface `ComparisonResult` (linha ~17):

```typescript
function encontrarMaisBarato(products: any[]): ProductResult | null {
  if (!products || products.length === 0) return null;
  return products.reduce((menor, atual) => 
    atual.preco < menor.preco ? atual : menor
  );
}
```

## 2. Criar Edge Function para Processar Lista com LLM

**Arquivo**: `supabase/functions/process-list/index.ts` (NOVO)

Função que recebe texto livre e retorna JSON estruturado:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

interface ItemEstruturado {
  termo_busca: string
  quantidade?: number
  marca?: string
  observacao?: string
}

serve(async (req) => {
  const { text } = await req.json()
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'system',
        content: 'Você extrai itens de lista de compras e retorna JSON estruturado...'
      }, {
        role: 'user',
        content: text
      }],
      response_format: { type: 'json_object' }
    })
  })
  
  // Processar e retornar itens estruturados
})
```

## 3. Implementar Matching Inteligente com LLM

**Arquivo**: `supabase/functions/match-products/index.ts` (NOVO)

Função que recebe produtos de ambos mercados e retorna os melhores pares:

```typescript
// Usa GPT-4o-mini para identificar produtos equivalentes
// Input: lista de produtos do Atacadão + lista do Tenda
// Output: pares de produtos que são o "mesmo produto"

async function matchProducts(atacadaoProducts, tendaProducts) {
  const prompt = `Compare estes produtos e retorne pares equivalentes:
  
  Atacadão: ${JSON.stringify(atacadaoProducts)}
  Tenda: ${JSON.stringify(tendaProducts)}
  
  Retorne JSON com pares: [{ atacadao_index, tenda_index, confianca }]`
  
  // Chamar OpenAI com response_format: json_object
  // Retornar mapeamento
}
```

## 4. Refatorar compare-prices para Usar Matching

**Arquivo**: `supabase/functions/compare-prices/index.ts`

Atualizar lógica para:

1. Buscar TODOS os produtos (não só 1)
2. Chamar função de matching
3. Comparar produtos equivalentes
4. Se não houver match, pegar o mais barato mesmo
```typescript
// Para cada item da lista
const atacadaoProducts = atacadaoData.products || []
const tendaProducts = tendaData.products || []

// Tentar matching inteligente
const match = await matchProducts(atacadaoProducts, tendaProducts)

if (match && match.confianca > 0.7) {
  // Usar produtos matched
  atacadaoProduct = atacadaoProducts[match.atacadao_index]
  tendaProduct = tendaProducts[match.tenda_index]
} else {
  // Fallback: pegar o mais barato
  atacadaoProduct = encontrarMaisBarato(atacadaoProducts)
  tendaProduct = encontrarMaisBarato(tendaProducts)
}
```


## 5. Atualizar Dashboard para Usar LLM

**Arquivo**: `app/dashboard/dashboard-client.tsx`

Modificar `handleSubmit` (linha ~25):

```typescript
// 1. Primeiro processar texto com LLM
const { data: processedData } = await supabase.functions.invoke('process-list', {
  body: { text: listaTexto }
})

const items = processedData.items.map(item => item.termo_busca)

// 2. Depois chamar compare-prices com itens estruturados
const { data, error } = await supabase.functions.invoke('compare-prices', {
  body: { items, userId: user.id }
})
```

## 6. Adicionar Variável de Ambiente

**Arquivo**: `.env.local` e README-ENV.md

Adicionar:

```
OPENAI_API_KEY=sk-...
```

Configurar secret no Supabase:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
```

## 7. Melhorar Tipos e Interface

**Arquivo**: `types/database.ts`

Adicionar novos tipos:

```typescript
export interface ItemEstruturado {
  termo_busca: string
  quantidade?: number
  marca?: string
  observacao?: string
}

export interface ProductMatch {
  atacadao_index: number
  tenda_index: number
  confianca: number
}

export interface ComparisonResult {
  item: string
  atacadao: ProductNormalized | null
  tenda: ProductNormalized | null
  melhorOpcao: 'atacadao' | 'tenda' | null
  economia: number
  matchConfianca?: number  // NOVO
}
```

## 8. Preparar Base para Próximas Fases

Estrutura preparada para:

- **Fase 4 (Chat)**: Já temos integração OpenAI, basta adicionar interface de chat
- **Fase 5 (OCR)**: Usar gpt-4o-mini com vision para processar imagens

**Próximos componentes**:

- `components/chat-interface.tsx` (Fase 4)
- `components/image-upload.tsx` (Fase 5)
- `supabase/functions/process-ocr/index.ts` (Fase 5)

## Testes Necessários

1. Testar busca genérica ("sabão em pó") - deve pegar o mais barato
2. Testar busca específica ("sabão omo") - deve pegar produto correto
3. Testar matching com produtos similares mas nomes diferentes
4. Testar processamento de texto com LLM
5. Verificar custos da OpenAI com gpt-4o-mini

## Observações Técnicas

- **Custo**: gpt-4o-mini é ~60x mais barato que GPT-4
- **Latência**: Adiciona ~1-2s por chamada LLM (aceitável)
- **Precisão**: Matching com LLM > Regex para produtos similares
- **Escalabilidade**: Cache de resultados estruturados (futuro)

### To-dos

- [ ] Corrigir função compare-prices para buscar produto mais barato ao invés do primeiro
- [ ] Criar Edge Function process-list para estruturar texto com GPT-4o-mini
- [ ] Criar Edge Function match-products para matching inteligente com LLM
- [ ] Refatorar compare-prices para usar matching inteligente antes de fallback
- [ ] Atualizar dashboard-client para chamar process-list antes de compare-prices
- [ ] Adicionar OPENAI_API_KEY nas variáveis de ambiente e documentação
- [ ] Atualizar types/database.ts com novos tipos para matching e itens estruturados
- [ ] Testar busca genérica, específica, matching e processamento LLM