import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../api/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seed() {
  console.log('Iniciando configuração do banco de dados...');

  try {
    // 1. Ler e executar o schema.sql para garantir que as tabelas existam
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executando schema.sql...');
    await pool.query(schemaSql);
    
    // Adiciona a migração caso o banco já tenha sido criado antes
    console.log('Executando migração de external_id...');
    await pool.query('ALTER TABLE matches ADD COLUMN IF NOT EXISTS external_id INT UNIQUE DEFAULT NULL;');
    
    console.log('Tabelas criadas/verificadas com sucesso!');

    // 2. Verificar se já existem partidas cadastradas para evitar duplicação
    const checkMatches = await pool.query('SELECT COUNT(*) FROM matches');
    const matchCount = parseInt(checkMatches.rows[0].count, 10);

    if (matchCount > 0) {
      console.log(`Banco de dados já contém ${matchCount} partidas. Pulando inserção de seed.`);
      process.exit(0);
    }

    console.log('Inserindo partidas iniciais de demonstração (Copa do Mundo)...');

    // Jogos fictícios/reais da Copa do Mundo de 2026 (ou baseados nas datas locais da simulação)
    // O localTime do sistema é 2026-06-07 23:42.
    // Vamos configurar algumas partidas passadas (finalizadas) e algumas futuras (agendadas).
    const sampleMatches = [
      {
        external_id: 101,
        team_a: 'Brasil',
        team_b: 'Sérvia',
        match_date_time: '2026-06-05T15:00:00Z', // Passado
        real_score_a: 2,
        real_score_b: 0,
        status: 'finished'
      },
      {
        external_id: 102,
        team_a: 'Argentina',
        team_b: 'Arábia Saudita',
        match_date_time: '2026-06-06T10:00:00Z', // Passado
        real_score_a: 1,
        real_score_b: 2,
        status: 'finished'
      },
      {
        external_id: 103,
        team_a: 'França',
        team_b: 'Austrália',
        match_date_time: '2026-06-07T19:00:00Z', // Passado
        real_score_a: 4,
        real_score_b: 1,
        status: 'finished'
      },
      {
        external_id: 104,
        team_a: 'Espanha',
        team_b: 'Costa Rica',
        match_date_time: '2026-06-08T16:00:00Z', // Futuro (Amanhã)
        real_score_a: null,
        real_score_b: null,
        status: 'scheduled'
      },
      {
        external_id: 105,
        team_a: 'Alemanha',
        team_b: 'Japão',
        match_date_time: '2026-06-08T19:00:00Z', // Futuro (Amanhã)
        real_score_a: null,
        real_score_b: null,
        status: 'scheduled'
      },
      {
        external_id: 106,
        team_a: 'Portugal',
        team_b: 'Gana',
        match_date_time: '2026-06-09T16:00:00Z', // Futuro
        real_score_a: null,
        real_score_b: null,
        status: 'scheduled'
      },
      {
        external_id: 107,
        team_a: 'Brasil',
        team_b: 'Suíça',
        match_date_time: '2026-06-12T16:00:00Z', // Futuro
        real_score_a: null,
        real_score_b: null,
        status: 'scheduled'
      }
    ];

    const insertQuery = `
      INSERT INTO matches (external_id, team_a, team_b, match_date_time, real_score_a, real_score_b, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    for (const match of sampleMatches) {
      await pool.query(insertQuery, [
        match.external_id,
        match.team_a,
        match.team_b,
        match.match_date_time,
        match.real_score_a,
        match.real_score_b,
        match.status
      ]);
      console.log(`Partida inserida: ${match.team_a} x ${match.team_b}`);
    }

    console.log('Carga inicial concluída com sucesso!');
    process.exit(0);

  } catch (error) {
    console.error('Erro ao popular banco de dados:', error);
    process.exit(1);
  }
}

seed();
