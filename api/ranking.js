import pool from './db.js';

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
    // Busca todos os usuários ordenados pela pontuação e critérios de desempate
    // Critérios: 1. Total de Pontos, 2. Placar Cravado (6 pts), 3. Vencedor Acertado (3 pts), 4. Nome
    const query = `
      SELECT 
        id,
        name,
        total_points,
        exact_matches_count,
        winner_matches_count
      FROM users
      ORDER BY 
        total_points DESC, 
        exact_matches_count DESC, 
        winner_matches_count DESC, 
        name ASC
    `;

    const result = await pool.query(query);

    // Adiciona o campo de posição (ranking) dinamicamente
    const ranking = result.rows.map((user, index) => ({
      position: index + 1,
      ...user
    }));

    return res.status(200).json(ranking);

  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return res.status(500).json({ error: 'Erro interno do servidor ao buscar ranking.' });
  }
}
