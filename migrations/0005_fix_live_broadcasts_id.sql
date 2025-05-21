-- Drop the existing table if exists
DROP TABLE IF EXISTS live_broadcasts;

-- Create the table with proper auto-increment id
CREATE TABLE live_broadcasts (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  socket_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
); 