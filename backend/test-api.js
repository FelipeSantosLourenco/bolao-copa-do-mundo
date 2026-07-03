async function test() {
  const token = '0092e84426ef45a2ad69f9a40db5a8d8';
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': token }
    });
    const data = await response.json();
    const matches = data.matches || [];
    
    const target = matches.find(m => 
      (m.homeTeam?.name?.includes('Australia') || m.awayTeam?.name?.includes('Australia')) &&
      (m.homeTeam?.name?.includes('Egypt') || m.awayTeam?.name?.includes('Egypt'))
    );
    
    if (target) {
      console.log('PARTIDA ENCONTRADA:');
      console.log(JSON.stringify(target, null, 2));
    } else {
      console.log('Partida Austrália x Egito não encontrada nos dados retornados.');
      console.log('Primeiras 3 partidas:', JSON.stringify(matches.slice(0, 3), null, 2));
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

test();
