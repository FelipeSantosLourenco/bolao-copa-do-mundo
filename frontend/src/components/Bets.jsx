import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Calendar, Clock, Lock, Check, AlertCircle, Save, Copy } from 'lucide-react';

export default function Bets() {
  const { authenticatedFetch } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Mantém os placares editados pelo usuário localmente antes de salvar
  // Estrutura: { [matchId]: { scoreA: '2', scoreB: '1' } }
  const [editedBets, setEditedBets] = useState({});
  const [savingId, setSavingId] = useState(null); // ID do jogo sendo salvo
  const [successMessages, setSuccessMessages] = useState({}); // ID -> mensagem de sucesso temporária
  const [copiedDate, setCopiedDate] = useState(null); // Data atualmente copiada para clipboard

  const handleExportBets = (dateStr, matchesList) => {
    const lines = [];
    lines.push(`📅 Palpites para ${dateStr}:`);
    
    matchesList.forEach(match => {
      const currentBet = editedBets[match.id] || {};
      // Usa o que está na tela (digitado) ou o que está salvo no banco
      const scoreA = currentBet.scoreA !== '' ? currentBet.scoreA : (match.bet_score_a !== null ? match.bet_score_a : '_');
      const scoreB = currentBet.scoreB !== '' ? currentBet.scoreB : (match.bet_score_b !== null ? match.bet_score_b : '_');
      lines.push(`${match.team_a} ${scoreA} x ${scoreB} ${match.team_b}`);
    });
    
    const textToCopy = lines.join('\n');
    
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setCopiedDate(dateStr);
        setTimeout(() => setCopiedDate(null), 2000);
      })
      .catch(err => {
        console.error('Erro ao copiar palpites:', err);
        alert('Erro ao copiar os palpites para a área de transferência.');
      });
  };

  const fetchMatches = async () => {
    try {
      const response = await authenticatedFetch('/api/matches');
      if (!response.ok) {
        throw new Error('Erro ao carregar partidas.');
      }
      const data = await response.json();
      setMatches(data);
      
      // Inicializa os inputs com as apostas existentes
      const initialBets = {};
      data.forEach(match => {
        initialBets[match.id] = {
          scoreA: match.bet_score_a !== null ? String(match.bet_score_a) : '',
          scoreB: match.bet_score_b !== null ? String(match.bet_score_b) : ''
        };
      });
      setEditedBets(initialBets);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erro ao carregar os jogos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    if (!loading && matches.length > 0) {
      // Encontra a primeira partida que não está finalizada
      const firstUpcoming = matches.find(m => m.status === 'scheduled');
      if (firstUpcoming) {
        const date = new Date(firstUpcoming.match_date_time);
        const dateKey = date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        });
        const formattedDate = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
        
        // Timeout pequeno para garantir renderização do DOM
        const timer = setTimeout(() => {
          const element = document.getElementById(`date-group-${formattedDate}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, [loading, matches]);

  const handleInputChange = (matchId, team, value) => {
    // Apenas permite números
    if (value !== '' && !/^\d+$/.test(value)) return;
    
    setEditedBets(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [team]: value
      }
    }));
  };

  const handleSaveBet = async (matchId) => {
    setError('');
    const bet = editedBets[matchId];
    
    if (bet.scoreA === '' || bet.scoreB === '') {
      setError('Por favor, insira o placar para ambos os times antes de salvar.');
      return;
    }

    setSavingId(matchId);
    try {
      const response = await authenticatedFetch('/api/bets', {
        method: 'POST',
        body: JSON.stringify({
          matchId,
          betScoreA: bet.scoreA,
          betScoreB: bet.scoreB
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar palpite.');
      }

      // Atualiza a lista de partidas localmente com o novo palpite
      setMatches(prev => prev.map(m => {
        if (m.id === matchId) {
          return {
            ...m,
            bet_score_a: parseInt(bet.scoreA, 10),
            bet_score_b: parseInt(bet.scoreB, 10)
          };
        }
        return m;
      }));

      // Exibe mensagem de sucesso
      setSuccessMessages(prev => ({ ...prev, [matchId]: 'Salvo!' }));
      setTimeout(() => {
        setSuccessMessages(prev => ({ ...prev, [matchId]: null }));
      }, 3000);

    } catch (err) {
      setError(err.message || 'Erro ao salvar o palpite.');
    } finally {
      setSavingId(false);
    }
  };

  // Verifica se o jogo está trancado para palpites (menos de 30 minutos para começar ou finalizado)
  const getLockStatus = (match) => {
    if (match.status === 'finished') return { locked: true, label: 'Finalizado', class: 'finished' };
    
    const matchTime = new Date(match.match_date_time).getTime();
    const limitTime = matchTime - (30 * 60 * 1000); // 30 minutos em milissegundos
    const isPastLimit = Date.now() >= limitTime;
    
    if (isPastLimit) {
      return { locked: true, label: 'Bloqueado (Jogo Iniciando)', class: 'locked' };
    }
    
    return { locked: false, label: 'Aberto para Palpite', class: 'scheduled' };
  };

  // Formata o horário do jogo
  const formatTime = (isoString) => {
    return new Date(isoString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Agrupa os jogos por data
  const groupMatchesByDate = (matchesList) => {
    const groups = {};
    matchesList.forEach(match => {
      const date = new Date(match.match_date_time);
      const dateKey = date.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
      // Capitaliza
      const formattedDate = dateKey.charAt(0).toUpperCase() + dateKey.slice(1);
      if (!groups[formattedDate]) {
        groups[formattedDate] = [];
      }
      groups[formattedDate].push(match);
    });
    return groups;
  };

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Carregando jogos e palpites...</p>
      </div>
    );
  }

  const groupedMatches = groupMatchesByDate(matches);

  return (
    <div className="bets-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Meus Palpites</h1>
        <p className="dashboard-subtitle">Insira seus palpites. Edições são permitidas até 30 minutos antes do início de cada partida.</p>
      </div>

      {error && (
        <div className="alert alert-danger" style={{ maxWidth: '600px', margin: '0 auto 1.5rem auto' }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {Object.keys(groupedMatches).length === 0 ? (
        <div className="glass-card" style={{ textCenter: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Nenhum jogo cadastrado no momento.
        </div>
      ) : (
        Object.entries(groupedMatches).map(([dateStr, matchesList]) => (
          <div key={dateStr} id={`date-group-${dateStr}`} className="date-group">
            <h3 className="date-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={18} />
                {dateStr}
              </span>
              <button
                type="button"
                onClick={() => handleExportBets(dateStr, matchesList)}
                className="btn btn-secondary"
                style={{
                  width: 'auto',
                  height: 'auto',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: 0
                }}
                title="Copiar palpites deste dia"
              >
                {copiedDate === dateStr ? (
                  <>
                    <Check size={14} style={{ color: 'var(--success)' }} /> Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copiar Palpites
                  </>
                )}
              </button>
            </h3>
            
            <div className="matches-grid">
              {matchesList.map((match) => {
                const statusInfo = getLockStatus(match);
                const currentBet = editedBets[match.id] || { scoreA: '', scoreB: '' };
                const isSaving = savingId === match.id;
                const successMsg = successMessages[match.id];

                // Determina o texto de pontos ganhos caso o jogo tenha encerrado
                let pointsBadge = null;
                if (match.status === 'finished') {
                  const pts = match.points_earned;
                  if (pts === 6) {
                    pointsBadge = <div className="points-earned-sticker exact">🎉 Cravou! +6 pts</div>;
                  } else if (pts === 3) {
                    pointsBadge = <div className="points-earned-sticker winner">👍 Acertou Vencedor! +3 pts</div>;
                  } else {
                    pointsBadge = <div className="points-earned-sticker zero">❌ Errou! 0 pts</div>;
                  }
                }

                return (
                  <div key={match.id} className={`glass-card match-card ${statusInfo.class}`}>
                    <div className="match-info-top">
                      <span className={`match-status-pill ${statusInfo.class}`}>
                        {statusInfo.locked ? <Lock size={12} /> : <Clock size={12} />}
                        {statusInfo.label}
                      </span>
                      <span className="match-time">
                        <Clock size={12} />
                        Horário: {formatTime(match.match_date_time)}
                      </span>
                    </div>

                    <div className="match-teams-wrapper">
                      <div className="team-display">
                        <img 
                          src={match.team_a_crest || 'https://flagcdn.com/w80/un.png'} 
                          alt={match.team_a}
                          className="team-flag-mock" 
                          style={{ objectFit: 'cover', padding: 0 }}
                        />
                        <span className="team-name">{match.team_a}</span>
                      </div>
                      
                      <span className="match-vs">VS</span>
                      
                      <div className="team-display">
                        <img 
                          src={match.team_b_crest || 'https://flagcdn.com/w80/un.png'} 
                          alt={match.team_b}
                          className="team-flag-mock" 
                          style={{ objectFit: 'cover', padding: 0 }}
                        />
                        <span className="team-name">{match.team_b}</span>
                      </div>
                    </div>

                    {match.status === 'finished' && (
                      <div className="real-score-banner">
                        Placar Real: <strong>{match.real_score_a} x {match.real_score_b}</strong>
                      </div>
                    )}

                    <div className="bet-inputs-section">
                      <p className="bet-label-text">Seu Palpite</p>
                      
                      <div className="bet-inputs-row">
                        <input
                          type="text"
                          maxLength="2"
                          className="score-input"
                          disabled={statusInfo.locked || isSaving}
                          value={currentBet.scoreA}
                          onChange={(e) => handleInputChange(match.id, 'scoreA', e.target.value)}
                        />
                        <span className="bet-separator">x</span>
                        <input
                          type="text"
                          maxLength="2"
                          className="score-input"
                          disabled={statusInfo.locked || isSaving}
                          value={currentBet.scoreB}
                          onChange={(e) => handleInputChange(match.id, 'scoreB', e.target.value)}
                        />
                      </div>

                      {!statusInfo.locked && (
                        <button
                          type="button"
                          className="btn btn-primary btn-save-bet"
                          disabled={isSaving || currentBet.scoreA === '' || currentBet.scoreB === ''}
                          onClick={() => handleSaveBet(match.id)}
                        >
                          {isSaving ? (
                            'Salvando...'
                          ) : successMsg ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Check size={14} /> {successMsg}
                            </span>
                          ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Save size={14} /> Salvar Palpite
                            </span>
                          )}
                        </button>
                      )}

                      {pointsBadge}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
