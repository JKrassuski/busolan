const Anthropic = require("@anthropic-ai/sdk");
const config = require("../config");
const { SYSTEM_PROMPT } = require("./systemPrompt");
const { toolDefinitions, runTool } = require("./tools");

const client = new Anthropic({ apiKey: config.anthropicApiKey });

// Roda um turno completo: manda a mensagem + histórico pro Claude, executa as tools que ele
// pedir, e devolve o texto final pra enviar ao cliente (mais um flag se rolou transbordo).
async function runTurn(conversationId, history, userMessage) {
  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user", content: userMessage },
  ];

  let replyText = null;
  let handoffTriggered = false;

  // Limite de segurança pra nunca ficar em loop infinito se o modelo insistir em chamar tools.
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create({
      model: config.anthropicModel,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      tools: toolDefinitions,
      messages,
    });

    const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");

    if (toolUseBlocks.length === 0) {
      const textBlocks = response.content.filter((b) => b.type === "text");
      replyText = textBlocks.map((b) => b.text).join("\n").trim();
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResultsContent = [];
    for (const block of toolUseBlocks) {
      const { toolResult, replyToUser, handoff } = await runTool(
        conversationId,
        block.name,
        block.input
      );
      toolResultsContent.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: toolResult,
      });
      if (replyToUser) replyText = replyToUser;
      if (handoff) handoffTriggered = true;
    }

    messages.push({ role: "user", content: toolResultsContent });

    if (handoffTriggered) break; // conversa já foi transferida, não precisa mais resposta da IA
  }

  return { replyText, handoffTriggered };
}

module.exports = { runTurn };
