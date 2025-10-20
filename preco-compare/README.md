# Compara Preço - Agente IA para Comparação de Preços

Uma aplicação web que ajuda donos de bares, cafés e restaurantes a economizar tempo e dinheiro na compra de insumos, comparando preços automaticamente entre Atacadão e Tenda Atacado.

## 🚀 Tecnologias

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **UI**: shadcn/ui + Tailwind CSS
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **IA**: OpenAI GPT-4o-mini (processamento de texto e matching de produtos)

## 📋 Pré-requisitos

- Node.js 18+ e npm
- Conta no Supabase
- Conta no OpenAI (para fases futuras)

## 🔧 Instalação

### 1. Clone o repositório

```bash
cd preco-compare
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o Supabase

#### 3.1 Crie um projeto no Supabase

1. Acesse [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crie um novo projeto
3. Anote a URL e as chaves de API

#### 3.2 Configure as variáveis de ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua-url-do-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# OpenAI (para processamento LLM)
OPENAI_API_KEY=sua-chave-openai
```

#### 3.3 Execute as migrations

No dashboard do Supabase:

1. Vá em **SQL Editor**
2. Execute o conteúdo do arquivo `supabase/migrations/20240101000000_initial_schema.sql`
3. Execute o conteúdo do arquivo `supabase/migrations/20240101000001_storage_setup.sql`

#### 3.4 Deploy das Edge Functions

Instale a CLI do Supabase:

```bash
npm install -g supabase
```

Faça login:

```bash
supabase login
```

Faça o deploy das funções:

```bash
supabase functions deploy search-atacadao
supabase functions deploy search-tenda
supabase functions deploy compare-prices
supabase functions deploy process-list
supabase functions deploy match-products
```

Configure as variáveis de ambiente das Edge Functions no dashboard do Supabase (Settings > Edge Functions):

```
SUPABASE_URL=sua-url-do-supabase
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
OPENAI_API_KEY=sua-chave-openai
```

Ou via CLI:
```bash
supabase secrets set OPENAI_API_KEY=sk-sua-chave
```

### 4. Execute o projeto

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## 📱 Como usar

### 1. Crie uma conta

- Acesse a aplicação e clique em "Criar Conta"
- Preencha seus dados e faça login

### 2. Faça uma comparação

- Na página principal, digite sua lista de compras
- Separe os itens por vírgula ou quebra de linha
- Clique em "Comparar Preços"

### 3. Veja os resultados

- A aplicação mostrará uma tabela comparativa
- Veja qual mercado tem o melhor preço para cada item
- Veja a economia total estimada
- Links diretos para os produtos em cada mercado

### 4. Consulte o histórico

- Clique em "Histórico" no menu superior
- Veja todas as suas comparações anteriores
- Acompanhe a economia acumulada

## 🎯 Roadmap MVP

- [x] **Fase 1**: Setup e Infraestrutura Base
  - [x] Projeto Next.js 14 configurado
  - [x] Supabase configurado com Auth e Database
  - [x] Migrations criadas
  - [x] Autenticação implementada

- [x] **Fase 2**: Integração com APIs
  - [x] Edge Function para busca no Atacadão
  - [x] Edge Function para busca no Tenda
  - [x] Edge Function para comparação de preços

- [x] **Fase 3**: Interface MVP
  - [x] Página principal de busca
  - [x] Componente de resultados (tabela de comparação)
  - [x] Página de histórico
  - [x] **v0.2**: Processamento LLM de texto
  - [x] **v0.2**: Matching inteligente de produtos
  - [x] **v0.2**: Busca pelo produto mais barato

- [ ] **Fase 4**: Interface Conversacional
  - [ ] Integração com OpenAI
  - [ ] Chat interface
  - [ ] Function Calling para ações

- [ ] **Fase 5**: OCR e Upload de Imagens
  - [ ] Upload de imagem
  - [ ] Processamento OCR com GPT-4o
  - [ ] Fluxo unificado

- [ ] **Fase 6**: Features Avançadas
  - [ ] Sugestões de alternativas
  - [ ] Analytics e dashboard de economia
  - [ ] Otimizações (cache, etc)

- [ ] **Fase 7**: Polimento e Deploy
  - [ ] Melhorias de UX
  - [ ] Testes
  - [ ] Deploy na Vercel

## 🏗️ Estrutura do Projeto

```
preco-compare/
├── app/
│   ├── (auth)/
│   │   └── login/          # Página de login/signup
│   ├── dashboard/          # Dashboard principal
│   │   ├── historico/      # Histórico de comparações
│   │   └── page.tsx        # Página principal de busca
│   ├── layout.tsx          # Layout raiz
│   └── page.tsx            # Página inicial (redireciona)
├── components/
│   ├── ui/                 # Componentes shadcn/ui
│   └── comparison-table.tsx # Tabela de comparação
├── lib/
│   └── supabase/           # Clientes Supabase
├── supabase/
│   ├── functions/          # Edge Functions
│   │   ├── search-atacadao/
│   │   ├── search-tenda/
│   │   ├── compare-prices/
│   │   ├── process-list/   # v0.2: Processamento LLM
│   │   └── match-products/ # v0.2: Matching inteligente
│   └── migrations/         # Migrations do banco
├── types/
│   └── database.ts         # Tipos TypeScript
└── middleware.ts           # Middleware de autenticação
```

## 🤝 Contribuindo

Este projeto foi desenvolvido como parte de um teste técnico. Sugestões e melhorias são bem-vindas!

## 📄 Licença

MIT

## 📞 Suporte

Para questões ou problemas, abra uma issue no repositório.
