import pool from './db.js';
import { authenticate } from './_utils/auth.js';

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Utilize GET.' });
  }

  try {
    // Exige autenticação
    authenticate(req);

    // 1. Busca todas as partidas em ordem cronológica (crescente)
    const matchesResult = await pool.query('SELECT * FROM matches ORDER BY match_date_time ASC');
    const matches = matchesResult.rows;

    // 2. Busca todos os usuários
    const usersResult = await pool.query('SELECT id, name FROM users ORDER BY name ASC');
    const users = usersResult.rows;

    // 3. Busca todos os palpites
    const betsResult = await pool.query('SELECT user_id, match_id, bet_score_a, bet_score_b, points_earned FROM bets');
    const bets = betsResult.rows;

    const now = Date.now();

    // 4. Constrói o resultado estruturado filtrando os palpites protegidos
    const data = matches.map(match => {
      // Regra dos 30 minutos: palpite é bloqueado se o status for finalizado
      // ou se faltam menos de 30 minutos para o horário de início
      const matchTime = new Date(match.match_date_time).getTime();
      const limitTime = matchTime - (30 * 60 * 1000); // 30 min antes
      const isLocked = match.status === 'finished' || now >= limitTime;

      let matchBets = [];

      if (isLocked) {
        // Se está bloqueado, anexa os palpites de todos os usuários
        matchBets = users.map(user => {
          // Acha o palpite deste usuário para este jogo
          const userBet = bets.find(b => b.user_id === user.id && b.match_id === match.id);
          return {
            userId: user.id,
            userName: user.name,
            hasBet: !!userBet,
            betScoreA: userBet ? userBet.bet_score_a : null,
            betScoreB: userBet ? userBet.bet_score_b : null,
            pointsEarned: userBet ? userBet.points_earned : null
          };
        });
      }

      return {
        id: match.id,
        teamA: match.team_a,
        teamB: match.team_b,
        teamACrest: match.team_a_crest,
        teamBCrest: match.team_b_crest,
        matchDateTime: match.match_date_time,
        realScoreA: match.real_score_a,
        realScoreB: match.real_score_b,
        status: match.status,
        isLocked,
        bets: matchBets // Só conterá palpites se estiver bloqueado
      };
    });

    return res.status(200).json(data);

  } catch (error) {
    if (error.message.includes('Não autorizado')) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Erro ao buscar palpites gerais:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao carregar palpites dos participantes.' });
  }
}
