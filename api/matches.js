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
    // Valida autenticação
    const decodedUser = authenticate(req);
    const userId = decodedUser.id;

    // Busca os jogos e faz um LEFT JOIN com os palpites do usuário logado
    const query = `
      SELECT 
        m.id,
        m.team_a,
        m.team_b,
        m.match_date_time,
        m.real_score_a,
        m.real_score_b,
        m.status,
        m.team_a_crest,
        m.team_b_crest,
        b.bet_score_a,
        b.bet_score_b,
        b.points_earned
      FROM matches m
      LEFT JOIN bets b ON m.id = b.match_id AND b.user_id = $1
      ORDER BY m.match_date_time ASC, m.id ASC
    `;

    const result = await pool.query(query, [userId]);

    return res.status(200).json(result.rows);

  } catch (error) {
    if (error.message.includes('Não autorizado')) {
      return res.status(401).json({ error: error.message });
    }
    console.error('Erro ao buscar partidas:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao buscar partidas.' });
  }
}
