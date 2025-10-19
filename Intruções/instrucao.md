🎯 Objetivo do Produto

Criar um agente de IA conversacional, em formato web app, que ajude donos de bares, cafés e restaurantes a economizar tempo e dinheiro na compra de insumos.

O agente deve permitir que o usuário envie uma lista de compras (digitada ou via foto) e receba:
	1.	Sugestões automáticas de onde comprar cada item mais barato (comparando preços entre supermercados atacadistas como Atacadão e Tenda Atacado).
	2.	Valor total da economia obtida.
	3.	Opções alternativas de produtos/marcas mais baratas, se o usuário desejar.

⸻

🧩 Stack Técnica
	•	Frontend: Next.js 14 (App Router)
	•	UI Library: shadcn/ui
	•	Backend e DB: Supabase
	•	Integrações Externas: APIs do Atacadão e Tenda Atacado
	•	Modelo de IA: Codex / Lovable / OpenAI Function Calling (para parsing e raciocínio dos itens)
	•	Infraestrutura:
	•	Edge Functions (Supabase ou Vercel)
	•	Database: products, queries, price_comparisons, users
	•	Armazenamento de imagens no Supabase Storage

⸻

🧠 Fluxo do Usuário
	1.	Entrada da lista de compras
	•	Usuário digita ou envia foto da lista.
	•	IA faz OCR (ex: via gpt-4o-mini com visão) → extrai texto e itens estruturados.
	2.	Busca de preços
	•	O backend envia cada item para as APIs do Atacadão e Tenda.
	•	Recebe preços, marcas e disponibilidade.
	3.	Cálculo da economia
	•	O agente compara os preços e retorna:
	•	Melhor mercado por item
	•	Preço total por mercado
	•	Economia potencial total
	4.	Apresentação dos resultados
	•	UI amigável mostra:
	•	Lista comparativa (Atacadão vs Tenda)
	•	Destaques de economia
	•	Sugestões de marcas mais baratas (on demand)
	5.	Interação conversacional
	•	Usuário pode pedir:
	•	“Mostre opções mais baratas.”
	•	“Substitua o sabão Omo por similar.”
	•	“Refaça só com produtos do Tenda.”

⸻

🧰 Integrações — cURL das APIs

🛒 Atacadão

curl --location --globoff --request GET 'https://www.atacadao.com.br/api/graphql?operationName=ProductsQuery&variables={%0A%20%20%20%20%22first%22%3A20%2C%0A%20%20%20%20%22after%22%3A%220%22%2C%0A%20%20%20%20%22sort%22%3A%22score_desc%22%2C%0A%20%20%20%20%22term%22%3A%22sab%C3%A3o%22%2C%0A%20%20%20%20%22selectedFacets%22%3A[%0A%20%20%20%20%20%20{%0A%20%20%20%20%20%20%20%20%22key%22%3A%22channel%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%22{%5C%22salesChannel%5C%22%3A%5C%221%5C%22%2C%5C%22seller%5C%22%3A%5C%22atacadaobr340%5C%22%2C%5C%22regionId%5C%22%3A%5C%22U1cjYXRhY2FkYW9icjM0MA%3D%3D%5C%22}%22%0A%20%20%20%20%20%20}%2C%0A%20%20%20%20%20%20{%0A%20%20%20%20%20%20%20%20%22key%22%3A%22locale%22%2C%0A%20%20%20%20%20%20%20%20%22value%22%3A%22pt-BR%22%0A%20%20%20%20%20%20}%0A%20%20%20%20]%0A%20%20}' \
--header 'Accept: application/json' \
--header 'Origin: https://www.atacadao.com.br' \
--header 'Referer: https://www.atacadao.com.br/' \
--header 'User-Agent: PostmanRuntime/7.41.1' \
--header 'Cookie: regionalization={"salesChannel":"1","postalCode":"03157-201","seller":"atacadaobr340"}' \
--header 'Content-Type: application/x-www-form-urlencoded'


⸻

🛍️ Tenda Atacado

curl --location 'https://api.tendaatacado.com.br/api/public/store/search?query=agua&page=1&order=relevance&cartId=12345678' \
--header 'accept: application/json, text/plain, */*' \
--header 'authorization: Bearer 3a54db9bd9182d9f7c291c6fe23b107a' \
--header 'origin: https://www.tendaatacado.com.br' \
--header 'referer: https://www.tendaatacado.com.br/' \
--header 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36'


⸻

🧮 Estrutura de Dados (Supabase)

Tabelas Principais

Tabela	Campos	Descrição
users	id, nome, email, created_at	Donos dos estabelecimentos
queries	id, user_id, lista_texto, ocr_image_url, created_at	Histórico de interações
products	id, nome, preco, mercado, marca, link, query_id	Itens retornados pelas APIs
comparisons	id, query_id, item, preco_atacadao, preco_tenda, melhor_opcao, economia	Resultado da comparação


⸻

💬 Exemplo de Interação com o Agente

Usuário:

“Preciso comprar 10 caixas de leite, 5 pacotes de arroz e 3 sabões Omo.”

IA:

“Certo! Aqui está a comparação:
	•	Leite (Itambé): R$4,50 no Tenda (R$0,30 mais barato)
	•	Arroz (Camil): R$22,00 no Atacadão
	•	Sabão Omo: R$10,00 no Tenda (R$1,20 mais barato)
💰 Economia total estimada: R$7,50.”

Usuário:

“Mostre opções mais baratas do sabão.”

IA:

“Encontrei o Sabão Tixan Ypê por R$8,50 no Atacadão. Quer substituir?”

⸻

🧱 Arquitetura (Simplificada)

Frontend (Next.js + shadcn)
│
├── OCR Upload (Imagem da lista)
│
├── Supabase Edge Function: /process-list
│   ├─ Extrai texto via IA (GPT-4o)
│   ├─ Chama APIs do Atacadão e Tenda
│   ├─ Compara preços e salva no DB
│
└── UI Conversacional
    ├─ Histórico de conversas (Supabase)
    ├─ Renderização de tabelas de comparação
    └─ Comandos naturais via IA


⸻

🚀 MVP Roadmap

Fase	Entregas
Fase 1	OCR → Busca nas APIs → Comparação básica de preços
Fase 2	UI Conversacional + histórico
Fase 3	Recomendação de marcas alternativas
Fase 4	Painel de economia acumulada + analytics
Fase 5	Integração com delivery/logística (futuro)


⸻

⚙️ Exemplo de Função Supabase Edge (Pseudo)

import { createClient } from '@supabase/supabase-js'

export async function processList(list: string) {
  const atacadao = await fetchAtacadao(list)
  const tenda = await fetchTenda(list)
  return comparePrices(atacadao, tenda)
}

async function fetchAtacadao(term: string) {
  const res = await fetch(`https://www.atacadao.com.br/api/graphql?...term=${term}`)
  return res.json()
}

async function fetchTenda(term: string) {
  const res = await fetch(`https://api.tendaatacado.com.br/api/public/store/search?query=${term}&page=1&order=relevance`, {
    headers: { authorization: `Bearer 3a54db9bd9182d9f7c291c6fe23b107a` }
  })
  return res.json()
}

function comparePrices(a, t) {
  // retorna mercado mais barato e economia
}


⸻

🧑‍💻 Prompt Sugerido para Codex / Lovable

Você é um engenheiro de software fullstack.
Sua tarefa é implementar um agente conversacional em Next.js + Supabase + shadcn, que ajude donos de restaurantes a comparar preços de insumos entre Atacadão e Tenda Atacado.
O usuário pode digitar ou enviar uma foto com a lista de compras.
O sistema deve:
	1.	Extrair texto da imagem (OCR);
	2.	Buscar preços via APIs fornecidas;
	3.	Calcular o mercado mais barato e a economia total;
	4.	Exibir os resultados em UI interativa (shadcn);
	5.	Permitir perguntas e substituições via chat.

Use Supabase para persistência, Edge Functions para processamento e siga as boas práticas de arquitetura modular.
Utilize os exemplos de cURL fornecidos acima como referência para implementar as chamadas às APIs.