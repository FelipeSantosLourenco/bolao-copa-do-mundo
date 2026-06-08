import pool from './db.js';
import { authenticate } from './_utils/auth.js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido. Utilize POST.' });
  }

  try {
    // Valida autenticação
    const decodedUser = authenticate(req);
    const userId = decodedUser.id;

    const { matchId, betScoreA, betScoreB } = req.body || {};

    if (matchId === undefined || betScoreA === undefined || betScoreB === undefined) {
      return res.status(400).json({ error: 'Os campos matchId, betScoreA e betScoreB são obrigatórios.' });
    }

    const scoreA = parseInt(betScoreA, 10);
    const scoreB = parseInt(betScoreB, 10);

    if (isNaN(scoreA) || isNaN(scoreB) || scoreA < 0 || scoreB < 0) {
      return res.status(400).json({ error: 'Os placares devem ser números inteiros maiores ou iguais a 0.' });
    }

    // Busca a partida para verificar regras de tempo e status
    const matchResult = await pool.query('SELECT * FROM matches WHERE id = $1', [matchId]);
    if (matchResult.rows.length === 0) {
      return res.status(404).json({ error: 'Partida não encontrada.' });
    }

    const match = matchResult.rows[0];

    // Valida se a partida já foi encerrada
    if (match.status === 'finished') {
      return res.status(400).json({ error: 'Esta partida já foi encerrada. Palpites bloqueados.' });
    }

    // Valida regra dos 30 minutos antes do jogo
    const matchTime = new Date(match.match_date_time).getTime();
    const limitTime = matchTime - (30 * 60 * 1000); // 30 minutos em milissegundos
    const now = Date.now();

    if (now >= limitTime) {
      return res.status(400).json({
        error: 'Palpites bloqueados! Edições são permitidas apenas até 30 minutos antes do horário de início do jogo.'
      });
    }

    // Insere ou atualiza (UPSERT) o palpite
    const upsertQuery = `
      INSERT INTO bets (user_id, match_id, bet_score_a, bet_score_b)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET 
        bet_score_a = EXCLUDED.bet_score_a, 
        bet_score_b = EXCLUDED.bet_score_b
      RETURNING *
    `;

    const result = await pool.query(upsertQuery, [userId, matchId, scoreA, scoreB]);

    return res.status(200).json({
      message: 'Palpite salvo com sucesso!',
      bet: result.rows[0]
    });

  } catch (error) {
    if (error.message.includes('Não autorizado')) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Erro ao salvar palpite:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao salvar palpite.' });
  }
}
