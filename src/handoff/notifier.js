const config = require("../config");

// Notifica o vendedor que uma conversa foi transferida. Sempre loga no console (funciona sem
// nenhuma configuração extra); se SLACK_WEBHOOK_URL estiver setado, manda lá também.
async function notifySeller({ conversationId, resumo, motivo, urgencia }) {
  const linha = `[handoff] conversa #${conversationId} (${urgencia || "normal"}) - ${motivo}: ${resumo}`;
  console.log(linha);

  if (!config.slackWebhookUrl) return;

  try {
    await fetch(config.slackWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: linha }),
    });
  } catch (err) {
    console.error("[handoff] falha ao notificar Slack:", err);
  }
}

module.exports = { notifySeller };
