# Guia de Teste - v0.2

Este guia ajuda a testar as novas funcionalidades implementadas na versão 0.2.

## 🔧 Pré-requisitos

Antes de testar, certifique-se que:

1. ✅ Variável `OPENAI_API_KEY` está configurada no `.env.local`
2. ✅ Secret `OPENAI_API_KEY` está configurado no Supabase
3. ✅ Edge Functions foram deployadas:
   ```bash
   supabase functions deploy process-list
   supabase functions deploy match-products
   ```
4. ✅ Servidor está rodando: `npm run dev`

## 🧪 Testes a Realizar

### 1. Teste de Processamento LLM de Texto

**Objetivo**: Verificar se o texto livre é estruturado corretamente

**Ações**:
1. Acesse o dashboard
2. Digite no campo de texto:
   ```
   10 leite parmalat integral 1 litro
   5 pacotes de arroz camil tipo 1
   sabão em pó omo 1kg
   óleo de soja liza 900ml
   ```
3. Clique em "Comparar Preços"

**Resultado Esperado**:
- ✅ Toast: "Processando lista com IA..."
- ✅ Toast: "4 itens identificados. Comparando preços..."
- ✅ Toast: "Comparação concluída! 4 itens analisados."
- ✅ Tabela mostra 4 linhas com produtos

**Verificação**:
- Abra o Console do navegador (F12)
- Veja se não há erros
- Os termos de busca foram normalizados

---

### 2. Teste de Busca Genérica (Mais Barato)

**Objetivo**: Verificar se retorna o produto mais barato, não o primeiro

**Ações**:
1. Digite apenas: `sabão em pó`
2. Clique em "Comparar Preços"
3. Observe os resultados

**Resultado Esperado**:
- ✅ Em cada mercado, mostra o sabão mais barato disponível
- ✅ Não necessariamente é da mesma marca nos dois mercados
- ✅ Preços são os menores possíveis

**Como Validar**:
- Acesse manualmente os sites:
  - https://www.atacadao.com.br (busque "sabão em pó")
  - https://www.tendaatacado.com.br (busque "sabão em pó")
- Compare se o preço no app é de fato o mais barato

---

### 3. Teste de Matching Inteligente

**Objetivo**: Verificar se produtos equivalentes são identificados corretamente

**Ações**:
1. Digite: `leite parmalat integral 1 litro`
2. Clique em "Comparar Preços"
3. Observe os produtos retornados

**Resultado Esperado**:
- ✅ Atacadão: "Leite Longa Vida Parmalat Integral TP com 1L" (ou similar)
- ✅ Tenda: "Leite Parmalat Integral 1L" (ou similar)
- ✅ Ambos são da mesma marca (Parmalat)
- ✅ Ambos são integrais
- ✅ Ambos são 1 litro

**Verificação no Console**:
- Procure por log: `Match encontrado para "leite parmalat..." com confiança 0.XX`
- Confiança deve ser >= 0.7

---

### 4. Teste de Fallback (Produtos Diferentes)

**Objetivo**: Verificar que o sistema usa fallback quando não há match

**Ações**:
1. Digite apenas: `leite`
2. Clique em "Comparar Preços"
3. Observe os produtos

**Resultado Esperado**:
- ✅ Pode retornar produtos diferentes:
  - Atacadão: "Leite Integral Marca X"
  - Tenda: "Creme de Leite Marca Y"
- ✅ Em cada mercado, deve ser o mais barato com "leite" no nome
- ✅ Sistema não tenta forçar um match ruim

**Verificação no Console**:
- NÃO deve ter log de "Match encontrado" (ou confiança < 0.7)
- Sistema usou fallback: pegou mais barato de cada

---

### 5. Teste de Busca Específica com Marca

**Objetivo**: Verificar matching preciso com marca específica

**Ações**:
1. Digite: `arroz camil tipo 1 5kg`
2. Clique em "Comparar Preços"

**Resultado Esperado**:
- ✅ Ambos mercados mostram arroz Camil (se disponível)
- ✅ Ambos são tipo 1
- ✅ Peso similar (5kg)
- ✅ Match com alta confiança (>= 0.8)

---

### 6. Teste de Lista Múltipla

**Objetivo**: Processar vários itens de uma vez

**Ações**:
1. Digite uma lista completa:
   ```
   leite parmalat
   arroz tipo 1
   feijão preto
   óleo de soja
   café 500g
   açúcar cristal 1kg
   ```
2. Clique em "Comparar Preços"

**Resultado Esperado**:
- ✅ Processamento sequencial (pode demorar ~10-15s)
- ✅ Toast de progresso é exibido
- ✅ Tabela mostra todos os 6 itens
- ✅ Economia total é calculada corretamente

---

### 7. Teste de Erros

#### 7.1 Texto Vazio
**Ação**: Clique em "Comparar Preços" com campo vazio
**Esperado**: ❌ "Por favor, insira uma lista de compras"

#### 7.2 API OpenAI indisponível
**Ação**: Configurar OPENAI_API_KEY inválida
**Esperado**: ❌ Erro explicativo sobre API Key

#### 7.3 Edge Function não deployada
**Ação**: Não fazer deploy de process-list
**Esperado**: ❌ Erro ao processar lista

---

## 📊 Verificações nos Logs

### Console do Navegador (F12)
```javascript
// Buscar por:
✅ "Processando lista com IA..."
✅ "X itens identificados"
✅ "Match encontrado para..." (quando houver match)
❌ Não deve ter erros em vermelho
```

### Logs das Edge Functions (Supabase Dashboard)

1. Acesse: Dashboard > Edge Functions > Logs
2. Verifique logs de:
   - `process-list` - Deve mostrar chamadas à OpenAI
   - `match-products` - Deve mostrar tentativas de matching
   - `compare-prices` - Deve mostrar fluxo completo

**Logs esperados**:
```
[process-list] Processando texto: "leite parmalat..."
[match-products] Tentando match entre 5 produtos Atacadão e 8 produtos Tenda
[compare-prices] Match encontrado com confiança 0.85
```

---

## 🐛 Problemas Comuns

### "OPENAI_API_KEY não configurada"
**Solução**:
```bash
# No terminal
supabase secrets set OPENAI_API_KEY=sk-sua-chave

# Verificar
supabase secrets list
```

### "Erro ao processar lista"
**Causas possíveis**:
- API Key inválida
- Cota da OpenAI excedida
- Rate limit atingido

**Solução**: Verificar dashboard da OpenAI

### Matching não está funcionando
**Verificar**:
1. Edge Function `match-products` está deployada?
2. Logs mostram erro na chamada?
3. Threshold de 0.7 está muito alto? (ajustar em compare-prices)

### Produtos errados sendo comparados
**Diagnóstico**:
1. Veja os logs de matching
2. Verifique a confiança retornada
3. Se confiança < 0.7, sistema usa fallback (correto)

---

## ✅ Checklist de Validação

Marque conforme testa:

- [ ] Processamento LLM funciona
- [ ] Busca genérica retorna mais barato
- [ ] Matching identifica produtos equivalentes
- [ ] Fallback funciona quando não há match
- [ ] Busca específica com marca é precisa
- [ ] Lista múltipla processa todos itens
- [ ] Erros são tratados adequadamente
- [ ] Logs estão corretos
- [ ] Performance é aceitável (~1-2s por item)
- [ ] Economia total calculada corretamente

---

## 📈 Métricas de Sucesso

### Antes (v0.1)
- ❌ Comparava produtos diferentes
- ❌ Pegava primeiro produto (relevância, não preço)
- ⚠️ Parsing simples (split por vírgula)

### Depois (v0.2)
- ✅ Matching inteligente (confiança >= 0.7)
- ✅ Busca pelo mais barato
- ✅ Processamento LLM estruturado
- ✅ Extração de quantidade/marca
- ✅ Feedback de progresso na UI

---

## 🎯 Próximo Passo

Se todos os testes passarem:
- ✅ Sistema está funcionando corretamente
- ✅ Pronto para uso em produção
- ✅ Base está pronta para Fase 4 (Chat) e Fase 5 (OCR)

Se houver problemas:
- 🔍 Consulte `TROUBLESHOOTING.md`
- 📝 Veja logs detalhados no Supabase
- 💬 Documente o erro para correção

---

**Boa sorte com os testes! 🚀**

