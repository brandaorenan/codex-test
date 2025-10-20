# Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=your-openai-api-key
```

## Como obter as credenciais:

### Supabase
1. Acesse https://supabase.com/dashboard
2. Crie um novo projeto
3. Vá em Settings > API
4. Copie a URL do projeto e as chaves

### OpenAI
1. Acesse https://platform.openai.com/api-keys
2. Crie uma nova API key
3. Copie a chave

