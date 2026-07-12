async function test() {
  const token = '0092e84426ef45a2ad69f9a40db5a8d8';
  try {
    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': token }
    });
    const data = await response.json();
    const matches = data.matches || [];
    
    const target = matches.find(m => m.id === 537378);
    
    if (target) {
      console.log('PARTIDA NA API:');
      console.log(JSON.stringify(target, null, 2));
    } else {
      console.log('Partida externa 537378 não encontrada nos dados retornados.');
    }
  } catch (err) {
    console.error('Erro:', err);
  }
}

test();
