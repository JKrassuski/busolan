require("dotenv").config();

function required(name, fallback = "") {
  return process.env[name] || fallback;
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: required("DATABASE_URL"),
  anthropicApiKey: required("ANTHROPIC_API_KEY"),
  anthropicModel: required("ANTHROPIC_MODEL", "claude-sonnet-5"),
  whatsapp: {
    token: required("WHATSAPP_TOKEN"),
    phoneNumberId: required("WHATSAPP_PHONE_NUMBER_ID"),
    verifyToken: required("WHATSAPP_VERIFY_TOKEN"),
    apiVersion: "v20.0",
  },
  slackWebhookUrl: required("SLACK_WEBHOOK_URL"),
};
