const pool = require("./pool");

async function getOrCreateConversation(whatsappNumber) {
  const existing = await pool.query(
    "SELECT * FROM conversations WHERE whatsapp_number = $1",
    [whatsappNumber]
  );
  if (existing.rows[0]) return existing.rows[0];

  const created = await pool.query(
    "INSERT INTO conversations (whatsapp_number) VALUES ($1) RETURNING *",
    [whatsappNumber]
  );
  return created.rows[0];
}

async function getConversation(id) {
  const result = await pool.query("SELECT * FROM conversations WHERE id = $1", [id]);
  return result.rows[0];
}

async function setConversationStatus(id, status) {
  await pool.query(
    "UPDATE conversations SET status = $2, updated_at = now() WHERE id = $1",
    [id, status]
  );
}

async function assumeConversation(id, assumedBy) {
  await pool.query(
    "UPDATE conversations SET status = 'human', assumed_by = $2, updated_at = now() WHERE id = $1",
    [id, assumedBy]
  );
}

async function addMessage(conversationId, role, content) {
  await pool.query(
    "INSERT INTO messages (conversation_id, role, content) VALUES ($1, $2, $3)",
    [conversationId, role, content]
  );
}

async function getHistory(conversationId, limit = 30) {
  const result = await pool.query(
    `SELECT role, content FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at ASC
     LIMIT $2`,
    [conversationId, limit]
  );
  return result.rows;
}

async function createOrder(conversationId, { produto, quantidade, cliente, observacoes }) {
  const result = await pool.query(
    `INSERT INTO orders (conversation_id, produto, quantidade, cliente, observacoes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [conversationId, produto, quantidade, cliente, observacoes]
  );
  return result.rows[0];
}

async function createHandoff(conversationId, { motivo, resumo, urgencia }) {
  const result = await pool.query(
    `INSERT INTO handoffs (conversation_id, motivo, resumo, urgencia)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [conversationId, motivo, resumo, urgencia || "normal"]
  );
  return result.rows[0];
}

async function listQueue() {
  const result = await pool.query(
    `SELECT c.id, c.whatsapp_number, c.status, c.assumed_by, c.updated_at,
            h.motivo, h.resumo, h.urgencia, h.created_at AS handoff_at
     FROM conversations c
     JOIN LATERAL (
       SELECT * FROM handoffs WHERE conversation_id = c.id
       ORDER BY created_at DESC LIMIT 1
     ) h ON true
     WHERE c.status = 'human' AND c.assumed_by IS NULL
     ORDER BY h.urgencia DESC, h.created_at ASC`
  );
  return result.rows;
}

module.exports = {
  getOrCreateConversation,
  getConversation,
  setConversationStatus,
  assumeConversation,
  addMessage,
  getHistory,
  createOrder,
  createHandoff,
  listQueue,
};
