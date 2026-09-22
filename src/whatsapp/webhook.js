const express = require("express");
const config = require("../config");
const { handleIncomingMessage } = require("../orchestrator");

const router = express.Router();

// Verificação do webhook (a Meta chama isso uma vez, ao configurar o endpoint)
router.get("/", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

// Mensagens recebidas
router.post("/", async (req, res) => {
  // Responde rápido pra Meta não reenviar o webhook por timeout;
  // o processamento de verdade acontece depois, fora do ciclo da resposta.
  res.sendStatus(200);

  try {
    const entry = req.body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message || message.type !== "text") return;

    const fromNumber = message.from;
    const text = message.text.body;

    await handleIncomingMessage(fromNumber, text);
  } catch (err) {
    console.error("[webhook] erro processando mensagem recebida:", err);
  }
});

module.exports = router;
