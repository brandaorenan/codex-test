# Guia de Setup Rápido

Este guia te ajudará a configurar o projeto passo a passo.

## ✅ Checklist de Setup

### 1. Instalação Inicial

```bash
# Instalar dependências
npm install
```

### 2. Configurar Supabase

#### Opção A: Usar Supabase Cloud (Recomendado)

1. **Criar projeto no Supabase**
   - Acesse: https://supabase.com/dashboard
   - Clique em "New Project"
   - Escolha um nome, senha do banco e região
   - Aguarde a criação (leva ~2 minutos)

2. **Copiar credenciais**
   - Vá em Settings > API
   - Copie:
     - Project URL
     - anon public key
     - service_role key (Settings > API > Project API keys > service_role)

3. **Criar arquivo `.env.local`**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
   SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
   OPENAI_API_KEY=sua-chave-openai
   ```

4. **Executar migrations**
   - No dashboard do Supabase, vá em SQL Editor
   - Abra e execute `supabase/migrations/20240101000000_initial_schema.sql`
   - Depois execute `supabase/migrations/20240101000001_storage_setup.sql`

5. **Deploy das Edge Functions**
   ```bash
   # Instalar CLI do Supabase
   npm install -g supabase
   
   # Fazer login
   supabase login
   
   # Linkar com seu projeto (substitua pelo ID do seu projeto)
   supabase link --project-ref seu-projeto-id
   
   # Deploy das functions
   supabase functions deploy search-atacadao
   supabase functions deploy search-tenda
   supabase functions deploy compare-prices
   supabase functions deploy process-list
   supabase functions deploy match-products
   ```

6. **Configurar secrets das Edge Functions**
   - No dashboard do Supabase: Settings > Edge Functions > Secrets
   - Adicione:
     ```
     SUPABASE_URL=https://seu-projeto.supabase.co
     SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
     OPENAI_API_KEY=sk-sua-chave-openai
     ```
   
   Ou via CLI:
   ```bash
   supabase secrets set OPENAI_API_KEY=sk-sua-chave-openai
   ```

#### Opção B: Usar Supabase Local (Para desenvolvimento)

```bash
# Instalar Docker Desktop (necessário)
# Download: https://www.docker.com/products/docker-desktop/

# Iniciar Supabase local
supabase init
supabase start

# As credenciais serão exibidas no terminal
# Copie-as para o .env.local
```

### 3. Executar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

### 4. Testar

1. **Criar conta**
   - Clique em "Criar Conta"
   - Preencha nome, email e senha
   - Faça login

2. **Fazer primeira comparação**
   - Digite uma lista de produtos:
   ```
   leite
   arroz
   feijão
   óleo de soja
   ```
   - Clique em "Comparar Preços"
   - Aguarde os resultados

3. **Ver histórico**
   - Clique em "Histórico"
   - Veja suas comparações

## 🚨 Problemas Comuns

### Erro: "Invalid API key"
- Verifique se copiou as chaves corretas do Supabase
- Certifique-se que o arquivo `.env.local` está na raiz do projeto
- Reinicie o servidor (`npm run dev`)

### Erro: "Edge function não encontrada"
- Verifique se fez o deploy das functions
- No dashboard: Edge Functions (deve listar as 3 funções)
- Verifique os logs em Edge Functions > Logs

### Erro: "Row Level Security"
- Verifique se executou as migrations
- No SQL Editor, execute: `SELECT * FROM auth.users` (deve retornar sem erro)

### API retorna erro 400/500
- Verifique os logs das Edge Functions no dashboard
- As APIs do Atacadão/Tenda podem estar indisponíveis
- Teste direto no navegador:
  ```
  https://www.atacadao.com.br
  https://www.tendaatacado.com.br
  ```

## 🔍 Verificar se está funcionando

### Testar Edge Functions diretamente

```bash
# Testar search-atacadao
curl -X POST https://seu-projeto.supabase.co/functions/v1/search-atacadao \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"term":"leite"}'

# Testar search-tenda
curl -X POST https://seu-projeto.supabase.co/functions/v1/search-tenda \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"term":"leite"}'
```

## 📚 Próximos Passos

Após o setup básico funcionar:

1. [ ] Implementar interface conversacional (Fase 4)
2. [ ] Adicionar OCR para fotos (Fase 5)
3. [ ] Implementar sugestões de alternativas (Fase 6)
4. [ ] Deploy na Vercel (Fase 7)

## 💡 Dicas

- Use o Supabase Studio (localhost:54323 se local) para visualizar os dados
- Monitore os logs das Edge Functions em tempo real
- Teste com diferentes produtos para ver os resultados
- O histórico ajuda a acompanhar a economia ao longo do tempo

## 🎯 Status do MVP

Funcionalidades implementadas:
- ✅ Autenticação (login/signup)
- ✅ Busca de produtos no Atacadão
- ✅ Busca de produtos no Tenda
- ✅ Comparação de preços
- ✅ Exibição de resultados
- ✅ Histórico de comparações
- ✅ Cálculo de economia

Próximas fases:
- ⏳ Interface conversacional
- ⏳ OCR de imagens
- ⏳ Sugestões de alternativas
- ⏳ Analytics

