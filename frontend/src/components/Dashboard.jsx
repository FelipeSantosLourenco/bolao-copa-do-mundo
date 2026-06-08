import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Trophy, Target, Award, RefreshCw, Star } from 'lucide-react';

export default function Dashboard() {
  const { user, authenticatedFetch } = useAuth();
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStats, setUserStats] = useState({
    total_points: 0,
    exact_matches_count: 0,
    winner_matches_count: 0,
    position: '-'
  });

  const fetchRanking = async () => {
    setLoading(true);
    setError('');
    try {
      // Endpoint público do ranking
      const response = await fetch('/api/ranking');
      if (!response.ok) {
        throw new Error('Não foi possível carregar o ranking.');
      }
      const data = await response.json();
      setRanking(data);

      // Localiza a pontuação do usuário logado se ele existir
      if (user) {
        const found = data.find(item => item.id === user.id);
        if (found) {
          setUserStats({
            total_points: found.total_points,
            exact_matches_count: found.exact_matches_count,
            winner_matches_count: found.winner_matches_count,
            position: found.position
          });
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao carregar o ranking geral.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, [user]);

  if (loading && ranking.length === 0) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Carregando classificação do bolão...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Tabela de Classificação</h1>
        <p className="dashboard-subtitle">Acompanhe a pontuação e veja quem está na liderança!</p>
      </div>

      {user && (
        <div className="stats-grid">
          <div className="glass-card stat-card">
            <div className="stat-icon-wrapper points">
              <Trophy size={28} />
            </div>
            <div>
              <p className="stat-label">Meus Pontos</p>
              <h3 className="stat-value">{userStats.total_points}</h3>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon-wrapper exact">
              <Target size={28} />
            </div>
            <div>
              <p className="stat-label">Placares Cravados</p>
              <h3 className="stat-value">{userStats.exact_matches_count}</h3>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon-wrapper winner">
              <Award size={28} />
            </div>
            <div>
              <p className="stat-label">Acertos de Vencedor</p>
              <h3 className="stat-value">{userStats.winner_matches_count}</h3>
            </div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-icon-wrapper" style={{ color: '#a7f3d0', background: 'rgba(255,255,255,0.03)' }}>
              <Star size={28} />
            </div>
            <div>
              <p className="stat-label">Minha Posição</p>
              <h3 className="stat-value">{userStats.position === '-' ? '-' : `#${userStats.position}`}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="glass-card ranking-section">
        <div className="ranking-title-wrapper">
          <Trophy size={22} style={{ color: '#fbbf24' }} />
          <h2>Ranking Geral</h2>
          <button 
            onClick={fetchRanking} 
            className="btn btn-secondary" 
            style={{ width: 'auto', padding: '0.4rem 0.8rem', marginLeft: 'auto', display: 'flex', gap: '0.25rem', fontSize: '0.8rem' }}
            title="Atualizar ranking"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <div className="table-responsive">
          <table className="ranking-table">
            <thead>
              <tr>
                <th style={{ width: '80px', textAlign: 'center' }}>Posição</th>
                <th>Usuário</th>
                <th style={{ textAlign: 'center' }}>Pontos Totais</th>
                <th style={{ textAlign: 'center' }}>Placares Cravados (+6)</th>
                <th style={{ textAlign: 'center' }}>Acertou Vencedor (+3)</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((row) => {
                const isCurrentUser = user && row.id === user.id;
                
                // Determina classe do badge de posição
                let rankBadgeClass = 'normal';
                if (row.position === 1) rankBadgeClass = 'gold';
                else if (row.position === 2) rankBadgeClass = 'silver';
                else if (row.position === 3) rankBadgeClass = 'bronze';

                // Determina classe da linha
                let rowClass = '';
                if (isCurrentUser) rowClass = 'current-user-row';
                else if (row.position <= 3) rowClass = `leader-${row.position}`;

                return (
                  <tr key={row.id} className={rowClass}>
                    <td style={{ textAlign: 'center' }}>
                      <span className={`rank-badge ${rankBadgeClass}`}>
                        {row.position}
                      </span>
                    </td>
                    <td>
                      <div className="user-name-cell">
                        <div className="user-avatar-placeholder">
                          {row.name.charAt(0).toUpperCase()}
                        </div>
                        <span>
                          {row.name} {isCurrentUser && <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>(Você)</span>}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.05rem' }}>
                      {row.total_points} pts
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--success)', fontWeight: '600' }}>
                      {row.exact_matches_count}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--info)', fontWeight: '600' }}>
                      {row.winner_matches_count}
                    </td>
                  </tr>
                );
              })}

              {ranking.length === 0 && !error && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Nenhum usuário cadastrado no bolão ainda. Seja o primeiro!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
