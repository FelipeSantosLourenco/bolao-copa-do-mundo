import pool from '../api/db.js';
import { calculatePoints, recalculateUserScores } from '../api/_utils/scoring.js';

// Função auxiliar para analisar argumentos da linha de comando (CLI)
function getArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg.startsWith('--')) {
      const [key, value] = arg.split('=');
      args[key.slice(2)] = value;
    }
  });
  return args;
}

async function run() {
  const args = getArgs();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // CASO 1: Atualização Manual via Argumentos CLI (ex: node update-matches.js --matchId=4 --scoreA=2 --scoreB=1)
    if (args.matchId && args.scoreA !== undefined && args.scoreB !== undefined) {
      const matchId = parseInt(args.matchId, 10);
      const scoreA = parseInt(args.scoreA, 10);
      const scoreB = parseInt(args.scoreB, 10);

      console.log(`[MANUAL] Atualizando partida ID ${matchId} para placar: ${scoreA} x ${scoreB}...`);

      // Atualiza partida
      const updateResult = await client.query(
        `UPDATE matches SET real_score_a = $1, real_score_b = $2, status = 'finished' WHERE id = $3 RETURNING *`,
        [scoreA, scoreB, matchId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error(`Partida com ID ${matchId} não encontrada.`);
      }

      // Calcula pontos das apostas dessa partida
      const betsResult = await client.query('SELECT * FROM bets WHERE match_id = $1', [matchId]);
      console.log(`Calculando pontos para ${betsResult.rows.length} palpite(s)...`);

      for (const bet of betsResult.rows) {
        const points = calculatePoints(bet.bet_score_a, bet.bet_score_b, scoreA, scoreB);
        await client.query('UPDATE bets SET points_earned = $1 WHERE id = $2', [points, bet.id]);
      }

      console.log(`Partida ID ${matchId} finalizada!`);

    } else {
      // CASO 2: Atualização Automática (Busca partidas agendadas que já deveriam ter acontecido)
      console.log('Buscando partidas agendadas que já passaram do horário de início...');
      
      const now = new Date();
      // Seleciona partidas 'scheduled' com data anterior ou igual a agora
      const query = `
        SELECT * FROM matches 
        WHERE status = 'scheduled' AND match_date_time <= $1
      `;
      const matchesToUpdate = await client.query(query, [now]);

      if (matchesToUpdate.rows.length === 0) {
        console.log('Nenhuma partida agendada pendente de encerramento.');
      } else {
        console.log(`Encontrada(s) ${matchesToUpdate.rows.length} partida(s) para finalizar.`);

        for (const match of matchesToUpdate.rows) {
          // Simula placares aleatórios realistas para a Copa (ex: de 0 a 4 gols)
          const scoreA = Math.floor(Math.random() * 4);
          const scoreB = Math.floor(Math.random() * 4);

          console.log(`Finalizando jogo: ${match.team_a} ${scoreA} x ${scoreB} ${match.team_b} (ID: ${match.id})`);

          // Atualiza partida
          await client.query(
            `UPDATE matches SET real_score_a = $1, real_score_b = $2, status = 'finished' WHERE id = $3`,
            [scoreA, scoreB, match.id]
          );

          // Calcula pontos das apostas dessa partida
          const betsResult = await client.query('SELECT * FROM bets WHERE match_id = $1', [match.id]);
          for (const bet of betsResult.rows) {
            const points = calculatePoints(bet.bet_score_a, bet.bet_score_b, scoreA, scoreB);
            await client.query('UPDATE bets SET points_earned = $1 WHERE id = $2', [points, bet.id]);
          }
        }
      }
    }

    // Recalcula pontuações gerais dos usuários
    console.log('Recalculando ranking e estatísticas dos usuários...');
    await recalculateUserScores(client);

    await client.query('COMMIT');
    console.log('Atualização e recálculo concluídos com sucesso!');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao processar atualização das partidas:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

run();
