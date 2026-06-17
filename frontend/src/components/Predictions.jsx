import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, Lock, Check, AlertCircle, Calendar } from 'lucide-react';

export default function Predictions() {
  const { authenticatedFetch } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Ref para controlar se o scroll inicial já foi realizado nesta sessão da tela
  const hasScrolledRef = useRef(false);

  const fetchPredictions = async () => {
    try {
      const response = await authenticatedFetch('/api/predictions');
      if (!response.ok) {
        throw new Error('Não foi possível carregar os palpites dos participantes.');
      }
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao carregar palpites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Executa o scroll automático para o ÚLTIMO jogo que já começou (ou está bloqueado)
  useEffect(() => {
    if (!loading && matches.length > 0 && !hasScrolledRef.current) {
      // Procura o último jogo que já começou/está bloqueado (de trás para frente)
      const reversedIndex = [...matches].reverse().findIndex(m => m.isLocked);

      const lastStartedIndex = reversedIndex !== -1 ? (matches.length - 1 - reversedIndex) : -1;

      if (lastStartedIndex !== -1) {
        hasScrolledRef.current = true;
        const targetMatch = matches[lastStartedIndex];
        // Timeout pequeno para dar tempo do DOM renderizar
        const timer = setTimeout(() => {
          const element = document.getElementById(`match-card-${targetMatch.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Adiciona uma classe de destaque temporária para chamar a atenção
            element.classList.add('highlighted-card');
            setTimeout(() => {
              element.classList.remove('highlighted-card');
            }, 2500);
          }
        }, 200);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, matches]);

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    });
    const timeStr = date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${dateStr} às ${timeStr}`;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Carregando palpites dos participantes...</p>
      </div>
    );
  }

  return (
    <div className="predictions-screen-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Palpites da Galera</h1>
        <p className="dashboard-subtitle">
          Veja o que cada participante apostou. Os palpites de jogos futuros são ocultados até 30 minutos antes do início para garantir uma disputa justa!
        </p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {matches.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Nenhum jogo cadastrado no momento.
        </div>
      ) : (
        <div className="predictions-list">
          {matches.map((match) => {
            const isStarted = new Date(match.matchDateTime).getTime() <= Date.now();
            let statusLabel = 'Aberto para Palpite';
            let statusClass = 'scheduled';

            if (match.status === 'finished') {
              statusLabel = 'Finalizado';
              statusClass = 'finished';
            } else if (match.isLocked) {
              statusLabel = 'Bloqueado / Em Andamento';
              statusClass = 'locked';
            }

            return (
              <div
                key={match.id}
                id={`match-card-${match.id}`}
                className={`glass-card prediction-match-card ${statusClass}`}
                style={{ scrollMargin: '100px', transition: 'all 0.5s ease' }}
              >
                {/* Cabeçalho do Card da Partida */}
                <div className="prediction-match-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="match-id-badge">#{match.id}</span>
                    <span className={`match-status-pill ${statusClass}`}>
                      {match.isLocked ? <Lock size={12} /> : <Clock size={12} />}
                      {statusLabel}
                    </span>
                  </div>
                  <span className="match-time" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <Calendar size={12} style={{ marginRight: '0.25rem' }} />
                    {formatDateTime(match.matchDateTime)}
                  </span>
                </div>

                {/* Confronto e Placar Real */}
                <div className="prediction-match-teams">
                  <div className="team-info">
                    <img
                      src={match.teamACrest || 'https://flagcdn.com/w80/un.png'}
                      alt={match.teamA}
                      className="team-flag-mock"
                      style={{ width: '2.5rem', height: '1.6rem', objectFit: 'cover' }}
                    />
                    <span className="team-name" style={{ fontSize: '1rem' }}>{match.teamA}</span>
                  </div>

                  <div className="match-center-score">
                    {match.status === 'finished' ? (
                      <span className="match-finished-score">
                        {match.realScoreA} x {match.realScoreB}
                      </span>
                    ) : (
                      <span className="match-vs-divider">VS</span>
                    )}
                  </div>

                  <div className="team-info">
                    <img
                      src={match.teamBCrest || 'https://flagcdn.com/w80/un.png'}
                      alt={match.teamB}
                      className="team-flag-mock"
                      style={{ width: '2.5rem', height: '1.6rem', objectFit: 'cover' }}
                    />
                    <span className="team-name" style={{ fontSize: '1rem' }}>{match.teamB}</span>
                  </div>
                </div>

                {/* Área de Palpites dos Participantes */}
                <div className="participants-bets-section">
                  <h4 className="participants-section-title">
                    <Users size={14} style={{ marginRight: '0.35rem' }} />
                    Palpites Registrados
                  </h4>

                  {match.isLocked ? (
                    <div className="participants-bets-grid">
                      {match.bets && match.bets.length > 0 ? (
                        match.bets.map((bet) => {
                          let pointsSticker = null;
                          let scoreColor = 'var(--text-primary)';

                          if (match.status === 'finished' && bet.hasBet) {
                            if (bet.pointsEarned === 6) {
                              pointsSticker = <span className="points-badge-small exact">+6 pts</span>;
                              scoreColor = 'var(--success)';
                            } else if (bet.pointsEarned === 3) {
                              pointsSticker = <span className="points-badge-small winner">+3 pts</span>;
                              scoreColor = 'var(--info)';
                            } else {
                              pointsSticker = <span className="points-badge-small zero">0 pts</span>;
                              scoreColor = 'var(--text-secondary)';
                            }
                          }

                          return (
                            <div key={bet.userId} className="participant-bet-row">
                              <span className="participant-name">{bet.userName}</span>
                              <div className="participant-score-wrapper">
                                {bet.hasBet ? (
                                  <>
                                    <span className="participant-bet-val" style={{ color: scoreColor, fontWeight: 'bold' }}>
                                      {bet.betScoreA} x {bet.betScoreB}
                                    </span>
                                    {pointsSticker}
                                  </>
                                ) : (
                                  <span className="participant-no-bet">Sem palpite</span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="no-bets-text">Nenhum palpite registrado para este jogo.</p>
                      )}
                    </div>
                  ) : (
                    <div className="bets-locked-overlay">
                      <Lock size={18} style={{ color: 'var(--text-muted)' }} />
                      <span>Palpites ocultados até 30 min antes do jogo iniciar.</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
