import pool from '../db.js';

/**
 * Calcula os pontos ganhos para um palpite com base no placar real.
 */
export function calculatePoints(betScoreA, betScoreB, realScoreA, realScoreB) {
  if (realScoreA === null || realScoreB === null || realScoreA === undefined || realScoreB === undefined) {
    return null;
  }

  // Placar cravado (exato) -> 6 pontos
  if (betScoreA === realScoreA && betScoreB === realScoreB) {
    return 6;
  }

  // Acertou o vencedor ou empate, mas errou o placar -> 3 pontos
  const realDiff = realScoreA - realScoreB;
  const betDiff = betScoreA - betScoreB;

  const realOutcome = realDiff > 0 ? 1 : (realDiff < 0 ? -1 : 0);
  const betOutcome = betDiff > 0 ? 1 : (betDiff < 0 ? -1 : 0);

  if (realOutcome === betOutcome) {
    return 3;
  }

  // Errou tudo -> 0 pontos
  return 0;
}

/**
 * Recalcula a pontuação total e contadores de todos os usuários a partir de seus palpites.
 * @param {import('pg').PoolClient} [client] - Cliente do banco (opcional, para transações)
 */
export async function recalculateUserScores(client) {
  const db = client || pool;
  
  const query = `
    UPDATE users u
    SET
      total_points = COALESCE((
        SELECT SUM(points_earned) 
        FROM bets b 
        JOIN matches m ON b.match_id = m.id
        WHERE b.user_id = u.id AND m.status = 'finished'
      ), 0),
      exact_matches_count = COALESCE((
        SELECT COUNT(*) 
        FROM bets b 
        JOIN matches m ON b.match_id = m.id
        WHERE b.user_id = u.id AND m.status = 'finished' AND b.points_earned = 6
      ), 0),
      winner_matches_count = COALESCE((
        SELECT COUNT(*) 
        FROM bets b 
        JOIN matches m ON b.match_id = m.id
        WHERE b.user_id = u.id AND m.status = 'finished' AND b.points_earned = 3
      ), 0);
  `;
  
  await db.query(query);
}
