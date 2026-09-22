const config = require("../config");

async function sendMessage(toNumber, text) {
  const { token, phoneNumberId, apiVersion } = config.whatsapp;
  if (!token || !phoneNumberId) {
    console.warn(
      `[whatsapp] WHATSAPP_TOKEN/WHATSAPP_PHONE_NUMBER_ID não configurados. ` +
        `Mensagem NÃO enviada pra ${toNumber}: ${text}`
    );
    return;
  }

  const url = `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: toNumber,
      type: "text",
      text: { body: text },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Falha ao enviar mensagem via WhatsApp Cloud API: ${res.status} ${body}`);
  }

  return res.json();
}

module.exports = { sendMessage };
