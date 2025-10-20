# Guia de Setup Completo - Compara Preço

## 📋 Índice

1. [Pré-requisitos](#-pré-requisitos)
2. [Instalação Local](#-instalação-local)
3. [Configuração do Supabase](#-configuração-do-supabase)
4. [Deploy das Edge Functions](#-deploy-das-edge-functions)
5. [Configuração do OpenAI](#-configuração-do-openai)
6. [Execução](#-execução)
7. [Troubleshooting](#-troubleshooting)

---

## ✅ Pré-requisitos

- **Node.js** 18+ e npm
- **Supabase CLI** ([instalação](https://supabase.com/docs/guides/cli))
- Conta no **Supabase** (gratuita)
- Conta no **OpenAI** com API Key

---

## 🔧 Instalação Local

### 1. Clone e instale dependências

```bash
cd preco-compare
npm install
```

### 2. Configure variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key

# OpenAI (para as 3 camadas de busca inteligente)
OPENAI_API_KEY=sk-...

# URLs (opcional, para desenvolvimento local)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## 🗄️ Configuração do Supabase

### 1. Criar Projeto

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Clique em **New Project**
3. Preencha os dados e aguarde a criação

### 2. Obter Credenciais

No dashboard do projeto:
- **Settings** → **API**
- Copie:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` (⚠️ NUNCA exponha no frontend) → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Executar Migrations

**Via SQL Editor no Dashboard:**

1. Vá para **SQL Editor**
2. Abra `supabase/migrations/20240101000000_initial_schema.sql`
3. Copie e execute o SQL
4. Faça o mesmo com `20240101000001_storage_setup.sql`

**OU via CLI:**

```bash
supabase db push
```

### 4. Verificar Tabelas

No dashboard, vá para **Database** → **Tables**. Você deve ver:
- ✅ `users`
- ✅ `queries`
- ✅ `products`
- ✅ `comparisons`

---

## 🚀 Deploy das Edge Functions

### 1. Login no Supabase CLI

```bash
supabase login
```

### 2. Link com o projeto

```bash
supabase link --project-ref seu-project-ref
```

**Como encontrar o project-ref:**
- URL do projeto: `https://[PROJECT-REF].supabase.co`
- Ou: Dashboard → Settings → General → Reference ID

### 3. Deploy das funções (v0.3 - Sistema de 3 Camadas)

```bash
# Camada 1: Análise do termo de busca
supabase functions deploy analyze-search-term

# Camada 2: Filtro de produtos irrelevantes
supabase functions deploy filter-products

# Camada 3: Matching entre mercados
supabase functions deploy match-products

# Funções auxiliares
supabase functions deploy search-atacadao
supabase functions deploy search-tenda
supabase functions deploy process-list

# Orquestrador principal
supabase functions deploy compare-prices
```

### 4. Verificar deploy

No dashboard: **Edge Functions** → Você deve ver 7 funções ativas.

---

## 🤖 Configuração do OpenAI

### 1. Obter API Key

1. Acesse [OpenAI Platform](https://platform.openai.com/api-keys)
2. Clique em **Create new secret key**
3. Copie a chave (começa com `sk-...`)

### 2. Adicionar Secret no Supabase

```bash
supabase secrets set OPENAI_API_KEY=sk-sua-chave-aqui
```

**OU via Dashboard:**
- Settings → Edge Functions → Secrets
- Adicione `OPENAI_API_KEY` com sua chave

### 3. Verificar custos

O sistema usa **GPT-4o-mini**, modelo econômico:
- ~$0.00025 por item comparado
- 100 comparações = ~$0.025 (~R$ 0,12)
- 1000 comparações = ~$0.25 (~R$ 1,25)

**Dica:** Configure billing limits na OpenAI para controlar gastos.

---

## ▶️ Execução

### Desenvolvimento Local

```bash
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

### Build de Produção

```bash
npm run build
npm start
```

### Deploy na Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Deploy
vercel

# Configurar env vars na Vercel:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# (service_role_key NÃO vai no frontend)
```

---

## 🧪 Testando o Sistema

### 1. Criar uma conta

1. Acesse `/login`
2. Clique em **Criar conta**
3. Preencha email e senha

### 2. Testar busca simples

No dashboard:
```
arroz tipo 1
óleo de soja
sabão em pó
```

### 3. Testar busca complexa (caso da picanha)

```
10x picanha angus freeboi
```

**Resultado esperado:**
- ❌ NÃO deve retornar "Caldo Sazón Picanha"
- ❌ NÃO deve retornar "Gran angus burger"
- ✅ DEVE retornar picanha bovina fresca
- ✅ Logs detalhados das 3 camadas no console do Supabase

### 4. Ver logs detalhados

No Supabase Dashboard:
- Edge Functions → compare-prices → Logs

Você verá:
```
🔍 Processando item: "picanha angus freeboi" (10x)
[Camada 1] 🧠 Analisando termo de busca...
[Camada 1] ✅ Termo otimizado: "picanha angus freeboi"
[Camada 2] 🔍 Filtrando produtos irrelevantes...
[Camada 2] ✅ Após filtro: Atacadão=2 produtos, Tenda=2 produtos
[Camada 3] 🤝 Fazendo matching inteligente...
[Camada 3] ✅ Match encontrado! Confiança: 85%
```

---

## 🔍 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"

**Solução:**
```bash
supabase secrets set OPENAI_API_KEY=sk-sua-chave
```

Verifique:
```bash
supabase secrets list
```

### Erro: "Failed to fetch" ao comparar

**Possíveis causas:**

1. **Edge Functions não deployadas:**
   ```bash
   supabase functions list
   ```
   
2. **Secrets não configurados:**
   ```bash
   supabase secrets list
   ```
   Deve mostrar: `OPENAI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`

3. **CORS:**
   - Verifique se o CORS está habilitado nas Edge Functions
   - Headers já estão configurados no código

### Erro: "Invalid JWT" ou problemas de autenticação

**Solução:**
```bash
# Limpar cache do navegador
# OU fazer logout e login novamente
```

### Busca retorna poucos produtos

**Normal!** O sistema de 3 camadas filtra produtos irrelevantes. 

**Exemplos:**
- Busca "picanha" → 15 produtos → Filtro → 2 produtos relevantes
- Se nenhum produto passar no filtro, é porque realmente não há produtos relevantes

### Performance lenta (>10s por item)

**Causas:**
- 3 chamadas à OpenAI por item
- APIs externas lentas

**Otimizações futuras:**
- Cache de análises comuns (Redis)
- Batch processing
- Pré-análise de termos populares

### Custo da OpenAI alto

**Verificar:**
```bash
# Ver usage no OpenAI Dashboard
# https://platform.openai.com/usage
```

**Reduzir custos:**
- Implementar cache para termos repetidos
- Limitar número de produtos analisados (top 10 por mercado)
- Usar análise apenas quando necessário

---

## 📚 Documentação Adicional

- **[README.md](./README.md)** - Visão geral do projeto
- **[BUSCA-INTELIGENTE-v0.3.md](./BUSCA-INTELIGENTE-v0.3.md)** - Detalhes do sistema de 3 camadas
- **[MELHORIAS-v0.2.md](./MELHORIAS-v0.2.md)** - Histórico de melhorias
- **[PROXIMAS-FASES.md](./PROXIMAS-FASES.md)** - Roadmap futuro
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Problemas comuns

---

## ✅ Checklist de Setup

- [ ] Node.js 18+ instalado
- [ ] Supabase CLI instalado e logado
- [ ] Projeto Supabase criado
- [ ] `.env.local` configurado
- [ ] Migrations executadas
- [ ] Edge Functions deployadas (7 funções)
- [ ] OPENAI_API_KEY configurada como secret
- [ ] App rodando localmente (`npm run dev`)
- [ ] Conta de teste criada
- [ ] Primeira busca funcionando
- [ ] Logs das 3 camadas visíveis

---

**Última atualização:** 20 de Outubro de 2025  
**Versão:** 0.3.0
