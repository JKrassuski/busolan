const repo = require("../db/conversationRepo");
const { notifySeller } = require("../handoff/notifier");

// Schemas no formato de tool use da Anthropic.
// https://docs.anthropic.com/claude/docs/tool-use
const toolDefinitions = [
  {
    name: "responder_duvida",
    description:
      "Responde uma dúvida do cliente com informação que a IA já tem no contexto da conversa. " +
      "Use pra perguntas simples que não mudam o estado do pedido (horário, produto, como funciona).",
    input_schema: {
      type: "object",
      properties: {
        resposta: { type: "string", description: "O texto a ser enviado pro cliente." },
      },
      required: ["resposta"],
    },
  },
  {
    name: "registrar_pedido",
    description:
      "Registra um pedido do cliente assim que você tiver produto, quantidade e um jeito de identificar o " +
      "cliente (nome ou o próprio número já serve). Chame isso sempre que o pedido estiver claro, mesmo que " +
      "incompleto - o vendedor confirma o resto depois.",
    input_schema: {
      type: "object",
      properties: {
        produto: { type: "string" },
        quantidade: { type: "string" },
        cliente: { type: "string", description: "Nome do cliente, se tiver. Senão, use o número." },
        observacoes: { type: "string", description: "Qualquer detalhe extra relevante pro vendedor." },
      },
      required: ["produto", "quantidade", "cliente"],
    },
  },
  {
    name: "chamar_vendedor",
    description:
      "Transfere a conversa pra um vendedor humano e PARA a IA de responder esse número a partir de agora. " +
      "Use quando: o pedido já está fechado o suficiente (produto + quantidade + contato confirmados), " +
      "o cliente pede explicitamente pra falar com uma pessoa, ou a pergunta foge do escopo da IA " +
      "(reclamação, negociação de preço, algo que exige julgamento humano).",
    input_schema: {
      type: "object",
      properties: {
        resumo: {
          type: "string",
          description: "Resumo curto e estruturado da conversa pro vendedor não precisar reler tudo.",
        },
        motivo: {
          type: "string",
          description: "Por que está transferindo: 'pedido_fechado' | 'pedido_explicito' | 'fora_do_escopo'.",
        },
        urgencia: { type: "string", description: "'normal' ou 'alta'." },
      },
      required: ["resumo", "motivo"],
    },
  },
];

// Executa a tool chamada pelo Claude e devolve o resultado (texto) que volta pro modelo.
// Também aplica os efeitos colaterais reais (gravar pedido, marcar handoff, notificar vendedor).
async function runTool(conversationId, toolName, toolInput) {
  switch (toolName) {
    case "responder_duvida": {
      return { toolResult: toolInput.resposta, replyToUser: toolInput.resposta, handoff: false };
    }

    case "registrar_pedido": {
      const order = await repo.createOrder(conversationId, toolInput);
      return {
        toolResult: `Pedido #${order.id} registrado.`,
        replyToUser: null, // o modelo decide a frase de confirmação na resposta seguinte
        handoff: false,
      };
    }

    case "chamar_vendedor": {
      await repo.createHandoff(conversationId, {
        motivo: toolInput.motivo,
        resumo: toolInput.resumo,
        urgencia: toolInput.urgencia,
      });
      await repo.setConversationStatus(conversationId, "human");
      await notifySeller({ conversationId, ...toolInput });
      return {
        toolResult: "Conversa transferida pro vendedor. A IA não responde mais esse número.",
        replyToUser:
          "Já te encaminhei pra um dos nossos atendentes, ele(a) continua daqui. Só um instante!",
        handoff: true,
      };
    }

    default:
      throw new Error(`Tool desconhecida: ${toolName}`);
  }
}

module.exports = { toolDefinitions, runTool };
