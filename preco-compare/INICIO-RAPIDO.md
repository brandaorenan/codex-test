# 🚀 Início Rápido - Compara Preço

Siga estes passos para ter a aplicação rodando em **menos de 15 minutos**.

---

## ⚡ Setup em 5 Passos

### 1️⃣ Criar Projeto no Supabase (3 min)

1. Acesse: **https://supabase.com/dashboard**
2. Clique em **"New Project"**
3. Preencha:
   - **Nome**: preco-compare (ou seu nome preferido)
   - **Database Password**: Crie uma senha forte
   - **Region**: São Paulo (ou mais próximo)
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos

---

### 2️⃣ Copiar Credenciais (1 min)

1. No projeto criado, vá em **Settings** > **API**
2. Copie:
   - **Project URL** (https://xxx.supabase.co)
   - **anon public** key (começa com eyJhbGc...)
   - **service_role** key (em "Project API keys", revelar)

---

### 3️⃣ Configurar Ambiente (1 min)

Crie o arquivo `.env.local` na **raiz do projeto**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
OPENAI_API_KEY=sk-... (opcional por enquanto)
```

💡 **Dica**: Use os valores que você copiou no passo 2

---

### 4️⃣ Executar Migrations (2 min)

1. No Supabase Dashboard, vá em **SQL Editor**
2. Clique em **"New query"**
3. Copie e cole o conteúdo de `supabase/migrations/20240101000000_initial_schema.sql`
4. Clique em **"Run"**
5. Repita com `supabase/migrations/20240101000001_storage_setup.sql`

✅ Deve aparecer "Success" nas duas queries

---

### 5️⃣ Deploy Edge Functions (5 min)

```bash
# Instalar CLI do Supabase (se não tiver)
npm install -g supabase

# Fazer login
supabase login

# Linkar com seu projeto
supabase link --project-ref xxx
# (o xxx está na URL do seu projeto: https://xxx.supabase.co)

# Deploy das funções
supabase functions deploy search-atacadao
supabase functions deploy search-tenda
supabase functions deploy compare-prices
```

**Configurar secrets** (importante!):
1. No Dashboard: **Settings** > **Edge Functions** > **Secrets**
2. Adicione:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

---

## 🎉 Iniciar Aplicação

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## ✅ Testar Funcionamento

### 1. Criar Conta
- Clique em "Criar Conta"
- Preencha: Nome, Email, Senha
- Clique em "Criar Conta"

### 2. Fazer Login
- Entre com email e senha
- Deve redirecionar para /dashboard

### 3. Primeira Comparação
Digite na textarea:
```
leite
arroz
feijão
óleo
```
Clique em **"Comparar Preços"**

### 4. Ver Resultados
- ✅ Tabela com preços de Atacadão e Tenda
- ✅ Card verde com economia total
- ✅ Links para os produtos

### 5. Ver Histórico
- Clique em **"Histórico"**
- Veja sua comparação salva

---

## ❓ Problemas?

### Erro: "Invalid API key"
- ✅ Verifique se o `.env.local` existe
- ✅ Verifique se as chaves estão corretas
- ✅ Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

### Erro: "Edge function not found"
- ✅ Verifique se fez o deploy das funções
- ✅ No Dashboard, vá em **Edge Functions** (deve listar 3 funções)

### Comparação não retorna resultados
- ✅ Tente produtos mais comuns: leite, arroz, feijão
- ✅ Verifique logs das Edge Functions no Dashboard
- ✅ APIs externas podem estar indisponíveis

### Mais problemas?
Consulte **TROUBLESHOOTING.md**

---

## 📚 Próximos Passos

Após tudo funcionar:

1. ✅ Ler **README.md** para entender o projeto
2. ✅ Consultar **PROXIMAS-FASES.md** para ver o roadmap
3. ✅ Ver **STATUS.md** para status atual
4. ✅ Começar Fase 4: Interface Conversacional

---

## 🎯 Comandos Úteis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor
npm run build            # Build de produção
npm run type-check       # Verificar TypeScript

# Supabase
npm run supabase:start   # Iniciar local (requer Docker)
npm run supabase:stop    # Parar local
npm run supabase:status  # Ver status
npm run supabase:deploy  # Deploy todas as functions

# Verificar ambiente
supabase status          # Ver URLs e keys locais
```

---

## 💡 Dicas

1. 🔑 **Nunca commite o `.env.local`** (já está no .gitignore)
2. 🔄 **Reinicie o servidor** após mudar variáveis de ambiente
3. 🌐 **Teste em modo incógnito** para evitar cache
4. 📊 **Use o Dashboard do Supabase** para debug
5. 🐛 **Console do navegador (F12)** mostra erros úteis

---

## ⏱️ Tempo Total: ~15 minutos

- Setup Supabase: 3 min
- Copiar credenciais: 1 min
- Configurar .env: 1 min
- Migrations: 2 min
- Edge Functions: 5 min
- Testes: 3 min

---

## 🆘 Ajuda Rápida

| Problema | Arquivo para Consultar |
|----------|----------------------|
| Setup não funciona | SETUP.md |
| Erro específico | TROUBLESHOOTING.md |
| Entender projeto | README.md |
| Ver o que falta | PROXIMAS-FASES.md |
| Status atual | STATUS.md |

---

**Boa sorte! 🚀**

Se tudo deu certo, você agora tem um comparador de preços funcional!

