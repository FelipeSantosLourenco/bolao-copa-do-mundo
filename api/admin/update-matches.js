import pool from '../db.js';
import { calculatePoints, recalculateUserScores } from '../_utils/scoring.js';

// Dicionário de tradução para os nomes dos times em português
const TEAM_TRANSLATIONS = {
  'Brazil': 'Brasil',
  'Serbia': 'Sérvia',
  'Switzerland': 'Suíça',
  'Cameroon': 'Camarões',
  'Argentina': 'Argentina',
  'Saudi Arabia': 'Arábia Saudita',
  'France': 'França',
  'Australia': 'Austrália',
  'Spain': 'Espanha',
  'Costa Rica': 'Costa Rica',
  'Germany': 'Alemanha',
  'Japan': 'Japão',
  'Portugal': 'Portugal',
  'Ghana': 'Gana',
  'Uruguay': 'Uruguai',
  'South Korea': 'Coreia do Sul',
  'Czechia': 'República Tcheca',
  'South Africa': 'África do Sul',
  'England': 'Inglaterra',
  'Iran': 'Irã',
  'Wales': 'País de Gales',
  'Senegal': 'Senegal',
  'Netherlands': 'Holanda',
  'Qatar': 'Catar',
  'Ecuador': 'Equador',
  'United States': 'EUA',
  'USA': 'EUA',
  'Scotland': 'Escócia',
  'Turkey': 'Turquia',
  'Ivory Coast': 'Costa do Marfim',
  'Cape Verde Islands': 'Ilhas de Cabo Verde',
  'Egypt': 'Egito',
  'New Zealand': 'Nova Zelândia',
  'Iraq': 'Iraque',
  'Norway': 'Noruega',
  'Uzbekistan': 'Uzbequistão',
  'Austria': 'Áustria',
  'Congo DR': 'RD Congo',
  'Algeria': 'Argélia',
  'Jordan': 'Jordânia',
  'Sweden': 'Suécia',
  'Croatia': 'Croácia',
  'Morocco': 'Marrocos',
  'Belgium': 'Bélgica',
  'Canada': 'Canadá',
  'Poland': 'Polônia',
  'Paraguay': 'Paraguai',
  'Mexico': 'México',
  'Denmark': 'Dinamarca',
  'Tunisia': 'Tunísia'
};

function translateTeam(name) {
  return TEAM_TRANSLATIONS[name] || name;
}

export default async function handler(req, res) {
  // Configuração de CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-Admin-Secret');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Permite GET e POST para suportar requisições automáticas do Vercel Cron
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido. Utilize GET ou POST.' });
  }

  // Validação da chave secreta admin para segurança
  const adminSecret = process.env.CRON_SECRET || 'bolao_admin_secret_998877';
  const receivedSecret = req.headers['x-admin-secret'] || req.query.secret;

  if (receivedSecret !== adminSecret) {
    return res.status(401).json({ error: 'Acesso negado. Chave de administração inválida.' });
  }

  const { updates } = req.body || {};
  const isSyncRequest = req.query.sync === 'true' || !updates || !Array.isArray(updates) || updates.length === 0;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // CASO 1: Sincronização Automática com API (ou mock de fallback)
    if (isSyncRequest) {
      console.log('Iniciando sincronização com API de futebol...');

      let apiMatches = [];
      const apiToken = process.env.FOOTBALL_API_TOKEN;

      if (!apiToken) {
        console.warn('Aviso: FOOTBALL_API_TOKEN não está configurado no .env. Usando mock realista da API.');
        // Mock de resposta da API do football-data.org para a Copa do Mundo
        apiMatches = [
          {
            id: 101,
            homeTeam: { name: 'Brazil', crest: 'https://flagcdn.com/w80/br.png' },
            awayTeam: { name: 'Serbia', crest: 'https://flagcdn.com/w80/rs.png' },
            utcDate: '2026-06-05T15:00:00Z',
            status: 'FINISHED',
            score: { fullTime: { home: 2, away: 0 } }
          },
          {
            id: 102,
            homeTeam: { name: 'Argentina', crest: 'https://flagcdn.com/w80/ar.png' },
            awayTeam: { name: 'Saudi Arabia', crest: 'https://flagcdn.com/w80/sa.png' },
            utcDate: '2026-06-06T10:00:00Z',
            status: 'FINISHED',
            score: { fullTime: { home: 1, away: 2 } }
          },
          {
            id: 103,
            homeTeam: { name: 'France', crest: 'https://flagcdn.com/w80/fr.png' },
            awayTeam: { name: 'Australia', crest: 'https://flagcdn.com/w80/au.png' },
            utcDate: '2026-06-07T19:00:00Z',
            status: 'FINISHED',
            score: { fullTime: { home: 4, away: 1 } }
          },
          {
            id: 104,
            homeTeam: { name: 'Spain', crest: 'https://flagcdn.com/w80/es.png' },
            awayTeam: { name: 'Costa Rica', crest: 'https://flagcdn.com/w80/cr.png' },
            utcDate: '2026-06-08T16:00:00Z',
            status: 'FINISHED', // Simulação: Jogo da Espanha terminou agora
            score: { fullTime: { home: 3, away: 0 } }
          },
          {
            id: 105,
            homeTeam: { name: 'Germany', crest: 'https://flagcdn.com/w80/de.png' },
            awayTeam: { name: 'Japan', crest: 'https://flagcdn.com/w80/jp.png' },
            utcDate: '2026-06-08T19:00:00Z',
            status: 'SCHEDULED',
            score: { fullTime: { home: null, away: null } }
          },
          {
            id: 106,
            homeTeam: { name: 'Portugal', crest: 'https://flagcdn.com/w80/pt.png' },
            awayTeam: { name: 'Ghana', crest: 'https://flagcdn.com/w80/gh.png' },
            utcDate: '2026-06-09T16:00:00Z',
            status: 'SCHEDULED',
            score: { fullTime: { home: null, away: null } }
          },
          {
            id: 107,
            homeTeam: { name: 'Brazil', crest: 'https://flagcdn.com/w80/br.png' },
            awayTeam: { name: 'Switzerland', crest: 'https://flagcdn.com/w80/ch.png' },
            utcDate: '2026-06-12T16:00:00Z',
            status: 'SCHEDULED',
            score: { fullTime: { home: null, away: null } }
          }
        ];
      } else {
        // Fetch real do football-data.org (usando HTTPS para evitar redirecionamento 301)
        const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
          headers: { 'X-Auth-Token': apiToken }
        });
        if (!response.ok) {
          throw new Error(`Erro ao consumir API externa: ${response.statusText}`);
        }
        const data = await response.json();
        apiMatches = data.matches || [];
      }

      console.log(`Lidas ${apiMatches.length} partidas da API. Atualizando banco...`);

      for (const apiMatch of apiMatches) {
        const externalId = apiMatch.id;

        // Evita erros caso os times do mata-mata ainda não tenham sido decididos (ex: Winner Group A)
        const rawTeamA = apiMatch.homeTeam?.name;
        const rawTeamB = apiMatch.awayTeam?.name;

        if (!rawTeamA || !rawTeamB) {
          console.log(`Pula jogo ID ${externalId} pois os times ainda não foram definidos.`);
          continue;
        }

        const teamA = translateTeam(rawTeamA);
        const teamB = translateTeam(rawTeamB);
        const matchDateTime = apiMatch.utcDate;

        const isFinished = apiMatch.status === 'FINISHED';
        const dbStatus = isFinished ? 'finished' : 'scheduled';

        let scoreA = null;
        let scoreB = null;

        if (isFinished) {
          const ft = apiMatch.score?.fullTime;
          scoreA = ft?.home;
          scoreB = ft?.away;
        }

        // Links de imagens das bandeiras oficiais retornados pela API
        const teamACrest = apiMatch.homeTeam?.crest || null;
        const teamBCrest = apiMatch.awayTeam?.crest || null;

        // Upsert do jogo baseado no external_id incluindo os escudos
        const upsertQuery = `
          INSERT INTO matches (external_id, team_a, team_b, match_date_time, real_score_a, real_score_b, status, team_a_crest, team_b_crest)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (external_id)
          DO UPDATE SET
            team_a = EXCLUDED.team_a,
            team_b = EXCLUDED.team_b,
            real_score_a = EXCLUDED.real_score_a,
            real_score_b = EXCLUDED.real_score_b,
            status = EXCLUDED.status,
            team_a_crest = EXCLUDED.team_a_crest,
            team_b_crest = EXCLUDED.team_b_crest
          RETURNING id, status, real_score_a, real_score_b
        `;

        const result = await client.query(upsertQuery, [
          externalId,
          teamA,
          teamB,
          matchDateTime,
          scoreA,
          scoreB,
          dbStatus,
          teamACrest,
          teamBCrest
        ]);

        const dbMatch = result.rows[0];

        // Se a partida foi finalizada, calcula os pontos dos palpites dela
        if (dbMatch.status === 'finished') {
          const betsResult = await client.query('SELECT * FROM bets WHERE match_id = $1', [dbMatch.id]);
          for (const bet of betsResult.rows) {
            const points = calculatePoints(
              bet.bet_score_a,
              bet.bet_score_b,
              dbMatch.real_score_a,
              dbMatch.real_score_b
            );
            await client.query('UPDATE bets SET points_earned = $1 WHERE id = $2', [points, bet.id]);
          }
        }
      }

    } else {
      // CASO 2: Atualização Manual (Corpo da Requisição JSON)
      console.log('Processando atualização manual de partidas...');
      for (const update of updates) {
        const { matchId, realScoreA, realScoreB, status } = update;

        if (matchId === undefined || realScoreA === undefined || realScoreB === undefined || !status) {
          throw new Error(`Campos incompletos na partida ID: ${matchId}`);
        }

        const scoreA = parseInt(realScoreA, 10);
        const scoreB = parseInt(realScoreB, 10);

        const updateMatchQuery = `
          UPDATE matches
          SET real_score_a = $1, real_score_b = $2, status = $3
          WHERE id = $4
          RETURNING *
        `;
        const matchResult = await client.query(updateMatchQuery, [scoreA, scoreB, status, matchId]);

        if (matchResult.rows.length === 0) {
          throw new Error(`Partida com ID ${matchId} não encontrada.`);
        }

        if (status === 'finished') {
          const betsResult = await client.query('SELECT * FROM bets WHERE match_id = $1', [matchId]);
          for (const bet of betsResult.rows) {
            const points = calculatePoints(bet.bet_score_a, bet.bet_score_b, scoreA, scoreB);
            await client.query('UPDATE bets SET points_earned = $1 WHERE id = $2', [points, bet.id]);
          }
        }
      }
    }

    // Recalcula o ranking de pontos consolidados para todos os usuários
    console.log('Recalculando ranking geral de pontuação...');
    await recalculateUserScores(client);

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Sincronização realizada e pontuações recalculadas com sucesso!',
      syncMode: isSyncRequest ? 'API/Mock' : 'Manual'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro na transação de sincronização de partidas:', error);
    return res.status(500).json({
      error: 'Erro interno ao sincronizar partidas.',
      details: error.message
    });
  } finally {
    client.release();
  }
}
