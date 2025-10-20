# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

## [0.2.0] - 2025-10-20

### 🎯 Melhorias Críticas

#### Adicionado
- **Processamento LLM de texto** (`process-list` Edge Function)
  - Estrutura texto livre em JSON usando GPT-4o-mini
  - Extrai quantidade, marca e observações
  - Normaliza termos de busca automaticamente
  
- **Matching inteligente de produtos** (`match-products` Edge Function)
  - Identifica produtos equivalentes entre mercados usando LLM
  - Score de confiança (0.0 a 1.0)
  - Threshold mínimo de 0.7 para considerar match válido
  
- **Busca pelo produto mais barato**
  - Função `encontrarMaisBarato()` em `compare-prices`
  - Fallback quando não há match com confiança suficiente
  - Resolve problema de pegar apenas primeiro produto (por relevância)

- **Novos tipos TypeScript**
  - `ItemEstruturado` - item processado pelo LLM
  - `ProductMatch` - resultado do matching
  - `matchConfianca` opcional em `ComparisonResult`

#### Modificado
- **`compare-prices` Edge Function**
  - Implementa lógica de matching antes do fallback
  - Usa `encontrarMaisBarato()` ao invés de `[0]`
  - Adiciona `matchConfianca` aos resultados
  - Logging de matches encontrados

- **`dashboard-client.tsx`**
  - Chama `process-list` antes de `compare-prices`
  - Toast notifications para feedback de progresso
  - Melhor tratamento de itens estruturados

- **Documentação**
  - `README.md` - Atualizado com novas Edge Functions
  - `SETUP.md` - Instruções para deploy e secrets
  - `README-ENV.md` - Já incluía OPENAI_API_KEY
  - Novo: `MELHORIAS-v0.2.md` - Documentação detalhada

#### Configuração
- **Variável de ambiente necessária**: `OPENAI_API_KEY`
- **Novos secrets no Supabase**: OPENAI_API_KEY
- **Deploy de 2 novas Edge Functions**: process-list, match-products

### 🐛 Correções
- ✅ Produtos diferentes não são mais comparados diretamente
- ✅ Busca genérica agora retorna o mais barato, não o mais relevante
- ✅ Processamento de texto mais robusto

### 🔄 Fluxo Atualizado
```
Input do usuário
  → process-list (LLM)
  → compare-prices
    → search-atacadao + search-tenda (paralelo)
    → match-products (LLM)
    → encontrarMaisBarato (fallback)
  → Resultados
```

### 💰 Custos
- GPT-4o-mini: ~$0.00015 por requisição
- Latência adicional: ~1-2s por item
- Trade-off: Custo baixo vs Precisão alta

### 📊 Métricas
- **Precisão de matching**: Alta (ajustável via threshold)
- **Economia detectada**: Mais precisa
- **UX**: Melhor com feedback de progresso

---

## [0.1.0] - 2025-10-19

### 🎉 Lançamento Inicial do MVP

#### Adicionado
- **Infraestrutura completa**
  - Next.js 14 com App Router
  - TypeScript
  - Tailwind CSS 4
  - shadcn/ui

- **Autenticação**
  - Login/Signup com Supabase Auth
  - Middleware de proteção de rotas
  - Gestão de sessão

- **Backend**
  - 3 Edge Functions (search-atacadao, search-tenda, compare-prices)
  - Integração GraphQL (Atacadão)
  - Integração REST API (Tenda)
  - Normalização de dados

- **Database**
  - Schema completo (4 tabelas)
  - RLS policies
  - Migrations SQL
  - Storage bucket

- **Frontend**
  - Dashboard principal
  - Formulário de busca
  - Tabela de comparação
  - Página de histórico
  - Loading states
  - Toast notifications

- **Documentação**
  - README.md
  - SETUP.md
  - TROUBLESHOOTING.md
  - PROXIMAS-FASES.md
  - STATUS.md
  - RESUMO-EXECUTIVO.md

#### Funcionalidades
- ✅ Criar conta
- ✅ Fazer login
- ✅ Comparar preços entre Atacadão e Tenda
- ✅ Ver resultados em tabela
- ✅ Calcular economia total
- ✅ Consultar histórico
- ✅ Links diretos para produtos

---

## Formato

Este changelog segue o formato de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

### Tipos de mudanças
- **Adicionado** para novas funcionalidades
- **Modificado** para mudanças em funcionalidades existentes
- **Depreciado** para funcionalidades que serão removidas
- **Removido** para funcionalidades removidas
- **Corrigido** para correções de bugs
- **Segurança** para vulnerabilidades corrigidas

