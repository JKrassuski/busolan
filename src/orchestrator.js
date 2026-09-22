const repo = require("./db/conversationRepo");
const { runTurn } = require("./ai/claude");
const { sendMessage } = require("./whatsapp/client");

// Ponto de entrada de toda mensagem recebida do cliente no WhatsApp.
async function handleIncomingMessage(whatsappNumber, text) {
  const conversation = await repo.getOrCreateConversation(whatsappNumber);
  await repo.addMessage(conversation.id, "user", text);

  if (conversation.status === "human") {
    // Vendedor já assumiu essa conversa - a IA não responde mais, só guarda o histórico
    // pro painel mostrar.
    return;
  }

  const history = await repo.getHistory(conversation.id);
  // O próprio runTurn já marca a conversa como 'human' (via tool chamar_vendedor) quando
  // dispara o transbordo - não precisa repetir isso aqui.
  const { replyText } = await runTurn(conversation.id, history, text);

  if (replyText) {
    await repo.addMessage(conversation.id, "assistant", replyText);
    await sendMessage(whatsappNumber, replyText);
  }
}

module.exports = { handleIncomingMessage };
