CREATE TABLE IF NOT EXISTS fcm_tokens (
  id SERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used TIMESTAMP NOT NULL DEFAULT NOW(),
  device TEXT,
  UNIQUE(user_id, token)
);
