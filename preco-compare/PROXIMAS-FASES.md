# Próximas Fases do Projeto

## ✅ Status Atual

**MVP Básico Implementado (Fases 1-3)**
- ✅ Infraestrutura completa (Next.js + Supabase)
- ✅ Autenticação funcional
- ✅ Integração com APIs (Atacadão e Tenda)
- ✅ Interface de busca por texto
- ✅ Tabela de comparação de preços
- ✅ Histórico de comparações
- ✅ Cálculo de economia

---

## 🚀 Fase 4: Interface Conversacional

### Objetivo
Adicionar um chat interativo onde o usuário pode fazer perguntas e receber sugestões da IA.

### Tarefas

#### 4.1 Integração com OpenAI

**Arquivo**: `lib/openai.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function chat(messages: any[], context: any) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: `Você é um assistente que ajuda usuários a economizar na compra de insumos.
        Contexto da última comparação: ${JSON.stringify(context)}`
      },
      ...messages
    ],
    functions: [
      {
        name: 'refazer_busca',
        description: 'Refaz a busca com filtros específicos',
        parameters: {
          type: 'object',
          properties: {
            mercado: { type: 'string', enum: ['atacadao', 'tenda', 'ambos'] },
            items: { type: 'array', items: { type: 'string' } }
          }
        }
      },
      {
        name: 'buscar_alternativas',
        description: 'Busca produtos similares mais baratos',
        parameters: {
          type: 'object',
          properties: {
            item: { type: 'string' }
          }
        }
      }
    ]
  })
  
  return response
}
```

#### 4.2 Chat Interface

**Arquivo**: `components/chat-interface.tsx`

- Design inspirado em interfaces de chat modernas
- Input com auto-resize
- Histórico de mensagens
- Botões de ações rápidas
- Renderização de markdown

**Features**:
- Perguntas como: "Mostre opções mais baratas de arroz"
- "Refaça só com produtos do Tenda"
- "Substitua o sabão Omo por similar"

#### 4.3 Edge Function: Chat Handler

**Arquivo**: `supabase/functions/chat/index.ts`

- Recebe mensagem do usuário
- Busca contexto da última comparação
- Processa com OpenAI Function Calling
- Executa ações (buscar alternativas, refazer busca)
- Retorna resposta + dados atualizados

### Estimativa
**Tempo**: 2-3 dias de desenvolvimento

---

## 📸 Fase 5: OCR e Upload de Imagens

### Objetivo
Permitir que o usuário tire foto da lista de compras e o sistema extraia os itens automaticamente.

### Tarefas

#### 5.1 Upload de Imagem

**Atualizar**: `app/dashboard/dashboard-client.tsx`

- Adicionar componente de upload drag-and-drop
- Preview da imagem antes de processar
- Upload para Supabase Storage (`lista-compras` bucket)
- Loading state durante OCR

**Componente sugerido**: `react-dropzone`

```bash
npm install react-dropzone
```

#### 5.2 Processamento OCR

**Arquivo**: `supabase/functions/process-ocr/index.ts`

```typescript
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
})

async function processOCR(imageUrl: string) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extraia os itens desta lista de compras. Retorne apenas os nomes dos produtos, um por linha.'
          },
          {
            type: 'image_url',
            image_url: { url: imageUrl }
          }
        ]
      }
    ]
  })
  
  const items = response.choices[0].message.content
    .split('\n')
    .map(item => item.trim())
    .filter(item => item.length > 0)
  
  return items
}
```

#### 5.3 Fluxo Unificado

- Toggle entre input de texto e upload de imagem
- Processar OCR → extrair itens → chamar compare-prices
- Salvar URL da imagem no banco

### Estimativa
**Tempo**: 2-3 dias de desenvolvimento

---

## 🎯 Fase 6: Features Avançadas

### 6.1 Sugestões de Alternativas

**Funcionalidade**: Quando o usuário clicar em um produto, mostrar alternativas mais baratas.

**Implementação**:
- Modal/Drawer com produtos similares
- Busca por categoria/palavras-chave
- Botão "Substituir" que recalcula a comparação

**Arquivo**: `components/alternative-products-modal.tsx`

### 6.2 Analytics e Dashboard de Economia

**Nova página**: `app/dashboard/economia/page.tsx`

**Features**:
- Gráfico de economia ao longo do tempo
- Total economizado
- Mercado favorito
- Produtos mais comprados
- Comparativo mensal

**Biblioteca sugerida**: `recharts`

```bash
npm install recharts
```

**Query SQL**:
```sql
-- Economia total do usuário
SELECT 
  SUM(c.economia) as total_economizado,
  COUNT(DISTINCT q.id) as total_comparacoes,
  COUNT(c.id) as total_itens
FROM comparisons c
JOIN queries q ON q.id = c.query_id
WHERE q.user_id = 'user-id'
```

### 6.3 Otimizações

#### Cache de Resultados
- Implementar cache com Upstash Redis
- Cachear resultados de busca por 1 hora
- Reduzir chamadas às APIs externas

```bash
npm install @upstash/redis
```

#### Debounce
- Adicionar debounce em buscas
- Melhorar performance da UI

#### Lazy Loading
- Paginar histórico (já limitado a 20)
- Scroll infinito

### Estimativa
**Tempo**: 3-4 dias de desenvolvimento

---

## 🎨 Fase 7: Polimento e Deploy

### 7.1 Melhorias de UX

#### Loading States
- Usar Skeleton components
- Loading spinners personalizados
- Progress indicators

#### Error Boundaries
```typescript
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div>
      <h2>Algo deu errado!</h2>
      <button onClick={() => reset()}>Tentar novamente</button>
    </div>
  )
}
```

#### Estados Vazios
- Ilustrações para quando não há resultados
- Mensagens amigáveis
- CTAs para ações

#### Toast Notifications
- Já implementado com Sonner
- Adicionar mais feedbacks visuais

### 7.2 Testes

#### Testes Unitários
```bash
npm install -D @testing-library/react @testing-library/jest-dom jest
```

**Testar**:
- Funções de formatação (preço, data)
- Cálculos de economia
- Normalização de dados das APIs

#### Testes de Integração
- Testar fluxo completo de login
- Testar criação de comparação
- Testar histórico

#### Testes E2E (Opcional)
```bash
npm install -D @playwright/test
```

### 7.3 Deploy

#### Vercel (Frontend)
1. Push para GitHub
2. Importar projeto na Vercel
3. Configurar env vars
4. Deploy automático

#### Supabase (Backend)
- Já está deployado (se usando Supabase Cloud)
- Verificar Edge Functions estão ativas
- Configurar domínio customizado (opcional)

#### Configurações
- **Analytics**: Vercel Analytics
- **Monitoring**: Sentry (opcional)
- **Domínio**: Configurar DNS

```bash
# Deploy na Vercel via CLI
npm install -g vercel
vercel
```

### 7.4 Documentação Final
- [ ] Atualizar README com todas as features
- [ ] Criar CHANGELOG.md
- [ ] Documentar APIs
- [ ] Criar guia de contribuição

### Estimativa
**Tempo**: 2-3 dias

---

## 📊 Resumo de Estimativas

| Fase | Descrição | Tempo Estimado |
|------|-----------|----------------|
| ✅ 1-3 | MVP Básico | ✅ Concluído |
| 4 | Interface Conversacional | 2-3 dias |
| 5 | OCR e Imagens | 2-3 dias |
| 6 | Features Avançadas | 3-4 dias |
| 7 | Polimento e Deploy | 2-3 dias |

**Total Restante**: ~10-15 dias de desenvolvimento

---

## 🎯 Priorização Sugerida

### Se tiver tempo limitado, priorize:

1. **Fase 5** (OCR) - Diferencial importante
2. **Fase 6.2** (Analytics) - Valor para o usuário
3. **Fase 7.3** (Deploy) - Colocar em produção
4. **Fase 4** (Chat) - Nice to have

### Para um produto completo:

1. Fase 4 → 5 → 6 → 7 (sequencial)

---

## 💡 Ideias Futuras (Pós-MVP)

- 🚚 Integração com delivery/logística
- 📱 App mobile (React Native / PWA)
- 🤝 Sistema de indicações
- 📧 Alertas de preço (email quando produto fica mais barato)
- 📊 Relatórios em PDF
- 🏪 Adicionar mais supermercados (Extra, Assaí, etc)
- 💰 Sistema de cashback/recompensas
- 👥 Funcionalidade para equipes (múltiplos usuários)

