# Busolan — Atendimento no WhatsApp com IA + transbordo pra humano

Bot de WhatsApp que responde com Claude (tool use), registra pedidos, e transfere a conversa
pra um vendedor humano quando faz sentido — com um painel simples pra ele ver a fila e assumir.

Baseado no briefing:
1. WhatsApp Cloud API oficial (Meta) — não usa lib não-oficial (Baileys/whatsapp-web.js), que viola
   os termos da Meta e arrisca banimento.
2. Claude com tool use como "cérebro" — três ferramentas: `responder_duvida`, `registrar_pedido`,
   `chamar_vendedor`.
3. Estado da conversa em Postgres (`conversations`, `messages`, `orders`, `handoffs`).
4. Regras de transbordo: pedido fechado o suficiente, cliente pede humano, ou pergunta fora do
   escopo da IA — a IA para de responder aquele número assim que transborda.
5. Painel do vendedor em `/painel`: lista quem está esperando, com resumo gerado pela IA, e botão
   "assumir conversa".

## O que já está pronto e funcional

Todo o código deste repositório — webhook, integração com Claude, banco, regras de transbordo,
painel. É só configurar as credenciais (abaixo) e rodar.

## O que ainda falta — precisa de informação que eu não tinha

Isso **não dá pra deixar funcional sem você**, porque depende de dados da empresa/cliente:

- **`src/ai/systemPrompt.js`** — hoje é um placeholder genérico. Precisa do nome do negócio,
  catálogo de produtos/serviços com preço, tom de voz, e regras específicas de atendimento.
- **Credenciais reais** (`.env`, veja `.env.example`): conta no WhatsApp Business Cloud API (Meta
  for Developers), chave da Anthropic, e um Postgres rodando.
- **Assinatura do webhook**: pra produção, a Meta recomenda validar o header
  `X-Hub-Signature-256` nas requisições recebidas (confirma que quem chamou foi a Meta mesmo).
  Não implementei isso ainda porque precisa do App Secret do app configurado no Meta for
  Developers, que eu não tenho.
- **Regras de negócio específicas de transbordo** — o que fizemos é genérico (pedido fechado,
  pedido explícito, fora do escopo). Se o cliente tiver regras mais específicas (ex: valor mínimo,
  horário de atendimento humano), isso entra no `systemPrompt.js` e/ou em `src/ai/tools.js`.

## Como rodar

```bash
npm install
cp .env.example .env   # preenche com as credenciais reais
docker compose up -d   # sobe o Postgres local (ou aponte DATABASE_URL pra um Postgres existente)
npm run db:init        # cria as tabelas
npm run dev
```

Depois, configura o webhook no Meta for Developers apontando pra
`https://<seu-dominio>/webhook/whatsapp` (em desenvolvimento local, use ngrok ou similar pra expor
a porta), com o `WHATSAPP_VERIFY_TOKEN` que você escolheu no `.env`.

O painel do vendedor fica em `http://localhost:3000/painel`.

## Estrutura

```
src/
  server.js              entrypoint (Express)
  config.js               variáveis de ambiente
  db/                      Postgres: schema, pool, repositório de dados
  whatsapp/                cliente da Cloud API + rota do webhook
  ai/                      integração com Claude: tools, prompt de sistema, loop de tool use
  handoff/                 notificação do vendedor quando uma conversa transborda
  panel/                   API + página HTML da fila de atendimento
orchestrator.js            liga tudo: mensagem recebida -> IA -> resposta / transbordo
```

## Próximos passos sugeridos

- Preencher `systemPrompt.js` com dado real do negócio
- Validar assinatura do webhook (`X-Hub-Signature-256`)
- Trocar o painel HTML simples por algo mais completo se o volume justificar (hoje é só uma lista
  com polling a cada 10s — funciona, mas é o mínimo)
- Testes automatizados (hoje não tem nenhum)
