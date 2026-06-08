import pool from '../api/db.js';

async function clear() {
  console.log('Limpando dados do banco de dados (tabelas users, matches, bets)...');
  try {
    // Truncate limpa todas as tabelas. 
    // CASCADE garante que as chaves estrangeiras vinculadas também sejam tratadas.
    // RESTART IDENTITY reseta as sequências do ID autoincremento para iniciar em 1.
    await pool.query('TRUNCATE TABLE bets, matches, users RESTART IDENTITY CASCADE;');
    console.log('Banco de dados limpo com sucesso! Todas as tabelas foram limpas e os contadores de ID foram reiniciados.');
  } catch (error) {
    console.error('Erro ao limpar o banco de dados:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

clear();
