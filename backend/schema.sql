-- Script de criação das tabelas para o Vercel Postgres / Neon

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  total_points INT DEFAULT 0,
  exact_matches_count INT DEFAULT 0,
  winner_matches_count INT DEFAULT 0
);

-- Tabela de Partidas/Jogos
CREATE TABLE IF NOT EXISTS matches (
  id SERIAL PRIMARY KEY,
  external_id INT UNIQUE DEFAULT NULL, -- ID oficial da API externa
  team_a VARCHAR(100) NOT NULL,
  team_b VARCHAR(100) NOT NULL,
  match_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  real_score_a INT DEFAULT NULL,
  real_score_b INT DEFAULT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'finished'))
);

-- Tabela de Palpites
CREATE TABLE IF NOT EXISTS bets (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  match_id INT REFERENCES matches(id) ON DELETE CASCADE,
  bet_score_a INT NOT NULL,
  bet_score_b INT NOT NULL,
  points_earned INT DEFAULT NULL,
  CONSTRAINT unique_user_match UNIQUE (user_id, match_id)
);

-- Criação de Índices para Otimização
CREATE INDEX IF NOT EXISTS idx_bets_user_id ON bets(user_id);
CREATE INDEX IF NOT EXISTS idx_bets_match_id ON bets(match_id);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(total_points DESC, exact_matches_count DESC, winner_matches_count DESC);
