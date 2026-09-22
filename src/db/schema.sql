CREATE TABLE IF NOT EXISTS conversations (
  id SERIAL PRIMARY KEY,
  whatsapp_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ai',        -- 'ai' | 'human'
  assumed_by TEXT,                           -- quem assumiu no painel (opcional)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL,                        -- 'user' | 'assistant'
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  produto TEXT,
  quantidade TEXT,
  cliente TEXT,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',   -- 'pendente' | 'confirmado' | 'cancelado'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS handoffs (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id),
  motivo TEXT NOT NULL,
  resumo TEXT NOT NULL,
  urgencia TEXT NOT NULL DEFAULT 'normal',   -- 'normal' | 'alta'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_orders_conversation ON orders(conversation_id);
CREATE INDEX IF NOT EXISTS idx_handoffs_conversation ON handoffs(conversation_id);
