# Guia de Troubleshooting

Este guia ajuda a resolver problemas comuns durante o desenvolvimento e uso da aplicação.

## 🔍 Problemas Comuns

### 1. Erro ao fazer login: "Invalid login credentials"

**Causa**: Credenciais incorretas ou usuário não existe.

**Solução**:
- Verifique se você criou uma conta primeiro
- Confirme que o email e senha estão corretos
- Tente criar uma nova conta
- Verifique se o Supabase Auth está habilitado:
  - Dashboard > Authentication > Providers > Email deve estar habilitado

---

### 2. Erro: "Invalid API key" ou "supabase is not defined"

**Causa**: Variáveis de ambiente não configuradas ou incorretas.

**Solução**:
1. Verifique se o arquivo `.env.local` existe na raiz do projeto
2. Confirme que as variáveis estão corretas:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```
3. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e execute novamente:
   npm run dev
   ```
4. Limpe o cache do Next.js:
   ```bash
   rm -rf .next
   npm run dev
   ```

---

### 3. Edge Functions retornam erro 404

**Causa**: Edge Functions não foram deployadas ou não existem.

**Solução**:
1. Verifique se as funções existem:
   ```bash
   ls supabase/functions/
   # Deve listar: search-atacadao, search-tenda, compare-prices
   ```

2. Deploy as funções:
   ```bash
   supabase functions deploy search-atacadao
   supabase functions deploy search-tenda
   supabase functions deploy compare-prices
   ```

3. Verifique no Dashboard do Supabase:
   - Vá em **Edge Functions**
   - As 3 funções devem estar listadas
   - Status deve ser "Active"

4. Verifique os logs:
   - Dashboard > Edge Functions > [nome-da-funcao] > Logs

---

### 4. Edge Functions retornam erro 500

**Causa**: Erro interno na Edge Function (código, API externa, etc).

**Solução**:
1. **Verifique os logs**:
   - Dashboard do Supabase > Edge Functions > Logs
   - Procure por erros e stack traces

2. **Teste a API externa diretamente**:
   ```bash
   # Teste Atacadão
   curl 'https://www.atacadao.com.br/api/graphql?operationName=ProductsQuery'
   
   # Teste Tenda
   curl 'https://api.tendaatacado.com.br/api/public/store/search?query=leite&page=1'
   ```

3. **Verifique as variáveis de ambiente das Edge Functions**:
   - Dashboard > Settings > Edge Functions > Secrets
   - Deve ter: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`

4. **Teste a função localmente** (se usando Supabase local):
   ```bash
   supabase functions serve search-atacadao
   
   # Em outro terminal:
   curl -X POST http://localhost:54321/functions/v1/search-atacadao \
     -H "Content-Type: application/json" \
     -d '{"term":"leite"}'
   ```

---

### 5. Comparação não retorna resultados

**Causa**: APIs não encontraram produtos ou erro na busca.

**Solução**:
1. **Tente com produtos comuns**:
   - leite
   - arroz
   - feijão
   - óleo

2. **Verifique se as APIs estão respondendo**:
   - Acesse https://www.atacadao.com.br
   - Acesse https://www.tendaatacado.com.br
   - Se os sites estiverem fora do ar, as APIs também estarão

3. **Verifique os logs das Edge Functions**

4. **Teste produtos mais específicos**:
   - Em vez de "sabão", tente "sabão em pó"
   - Em vez de "leite", tente "leite integral"

---

### 6. Erro: "Row Level Security policy violation"

**Causa**: RLS (Row Level Security) está bloqueando a operação.

**Solução**:
1. Verifique se você está autenticado
2. Confirme que as migrations foram executadas:
   ```sql
   -- No SQL Editor do Supabase, execute:
   SELECT tablename FROM pg_tables WHERE schemaname = 'public';
   -- Deve retornar: users, queries, products, comparisons
   ```

3. Verifique as policies RLS:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'public';
   ```

4. Se necessário, recrie as tabelas executando as migrations novamente

---

### 7. Histórico não mostra comparações

**Causa**: Query SQL incorreta ou dados não foram salvos.

**Solução**:
1. Verifique se há dados no banco:
   ```sql
   SELECT * FROM queries WHERE user_id = 'seu-user-id' LIMIT 5;
   SELECT * FROM comparisons LIMIT 5;
   ```

2. Se não há dados, faça uma nova comparação

3. Verifique se o relacionamento está correto:
   ```sql
   SELECT q.*, c.*
   FROM queries q
   LEFT JOIN comparisons c ON c.query_id = q.id
   WHERE q.user_id = 'seu-user-id';
   ```

---

### 8. Build falha: "Type error" ou "Module not found"

**Causa**: Erro de TypeScript ou import incorreto.

**Solução**:
1. Verifique os tipos:
   ```bash
   npm run type-check
   ```

2. Instale dependências faltantes:
   ```bash
   npm install
   ```

3. Limpe e reconstrua:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

---

### 9. Middleware redirecionando incorretamente

**Causa**: Lógica do middleware ou sessão expirada.

**Solução**:
1. Limpe os cookies do navegador
2. Faça login novamente
3. Verifique o arquivo `middleware.ts`:
   - Lógica de redirecionamento
   - Paths corretos no config.matcher

---

### 10. Supabase Local não inicia

**Causa**: Docker não está rodando ou porta em uso.

**Solução**:
1. **Verifique se o Docker está rodando**:
   ```bash
   docker ps
   ```

2. **Pare todos os containers**:
   ```bash
   supabase stop
   docker stop $(docker ps -aq)
   ```

3. **Reinicie o Docker Desktop**

4. **Tente iniciar novamente**:
   ```bash
   supabase start
   ```

5. **Verifique portas em uso**:
   ```bash
   # macOS/Linux
   lsof -i :54321
   lsof -i :54322
   
   # Mate o processo se necessário
   kill -9 [PID]
   ```

---

## 🔧 Comandos Úteis para Debug

### Verificar status do Supabase
```bash
supabase status
```

### Ver logs do Next.js
```bash
npm run dev
# Logs aparecem no terminal
```

### Verificar variáveis de ambiente
```bash
# No terminal do projeto:
echo $NEXT_PUBLIC_SUPABASE_URL
```

### Limpar cache do Next.js
```bash
rm -rf .next
```

### Limpar cache do npm
```bash
npm cache clean --force
```

### Verificar versão do Node
```bash
node -v
# Deve ser 18+
```

### Testar Edge Function diretamente
```bash
# Substitua pelos seus valores
curl -X POST https://seu-projeto.supabase.co/functions/v1/search-atacadao \
  -H "Authorization: Bearer sua-anon-key" \
  -H "Content-Type: application/json" \
  -d '{"term":"leite"}'
```

---

## 🐛 Como Reportar um Bug

Se encontrou um bug que não está listado aqui:

1. **Colete informações**:
   - Mensagem de erro completa
   - Stack trace (se houver)
   - Passos para reproduzir
   - Navegador e versão
   - Sistema operacional

2. **Verifique os logs**:
   - Console do navegador (F12 > Console)
   - Terminal do Next.js
   - Logs das Edge Functions (Dashboard Supabase)

3. **Tente isolar o problema**:
   - Funciona em outro navegador?
   - Funciona com outro usuário?
   - Funciona com outros produtos?

4. **Crie um issue** (se aplicável):
   - Descreva o problema
   - Adicione capturas de tela
   - Inclua os logs relevantes

---

## 📚 Recursos Adicionais

- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Supabase](https://supabase.com/docs)
- [Documentação shadcn/ui](https://ui.shadcn.com)
- [Documentação OpenAI](https://platform.openai.com/docs)

---

## 💡 Dicas de Desenvolvimento

1. **Sempre verifique os logs primeiro**
2. **Use o console do navegador** (F12)
3. **Teste em modo incógnito** para evitar cache
4. **Mantenha o Supabase Dashboard aberto** para monitorar
5. **Commit frequentemente** para poder reverter mudanças
6. **Teste as APIs externas** antes de culpar seu código
7. **Use TypeScript** para pegar erros antes do runtime
8. **Leia as mensagens de erro com atenção**

---

## 🆘 Precisa de Ajuda?

Se nenhuma solução funcionou:

1. ✅ Revisar SETUP.md
2. ✅ Verificar README-ENV.md
3. ✅ Consultar PROXIMAS-FASES.md
4. ✅ Verificar este TROUBLESHOOTING.md
5. 🔍 Pesquisar o erro no Google
6. 📚 Consultar documentação oficial
7. 💬 Perguntar na comunidade (Discord do Supabase, Stack Overflow)

