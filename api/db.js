import pg from 'pg';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente de um arquivo .env se estiver rodando localmente
dotenv.config();

const { Pool } = pg;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error("ERRO: A variável de ambiente POSTGRES_URL ou DATABASE_URL não está configurada.");
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: connectionString ? { rejectUnauthorized: false } : false
});

export default pool;
