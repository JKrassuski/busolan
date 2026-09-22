const express = require("express");
const config = require("./config");
const whatsappWebhook = require("./whatsapp/webhook");
const panelRoutes = require("./panel/routes");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/webhook/whatsapp", whatsappWebhook);
app.use("/painel", panelRoutes);

app.listen(config.port, () => {
  console.log(`Busolan rodando em http://localhost:${config.port}`);
  console.log(`Webhook do WhatsApp: http://localhost:${config.port}/webhook/whatsapp`);
  console.log(`Painel do vendedor:  http://localhost:${config.port}/painel`);
});
