import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const { login, register } = useAuth();
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // UI States
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email || !password || (activeTab === 'register' && !name)) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      setLoading(false);
      return;
    }

    try {
      if (activeTab === 'login') {
        await login(email, password);
        setSuccess('Login realizado com sucesso! Redirecionando...');
      } else {
        await register(name, email, password);
        setSuccess('Conta criada com sucesso! Redirecionando...');
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro ao processar sua solicitação.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTab = (tab) => {
    setActiveTab(tab);
    setError('');
    setSuccess('');
    // Preserva email mas limpa outros campos
    setName('');
    setPassword('');
  };

  return (
    <div className="auth-page">
      <div className="glass-card auth-card">
        <div className="auth-header">
          <span className="auth-logo" role="img" aria-label="troféu">🏆</span>
          <h1 className="auth-title">Bolão Copa 2026</h1>
          <p className="dashboard-subtitle">Palpite nos jogos e dispute a liderança do ranking!</p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === 'login' ? 'active' : ''}`}
            onClick={() => toggleTab('login')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => toggleTab('register')}
          >
            Cadastrar
          </button>
        </div>

        {error && (
          <div className="alert alert-danger">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            <span>✅</span>
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {activeTab === 'register' && (
            <div className="form-group">
              <label className="form-label" htmlFor="register-name">Nome Completo</label>
              <div className="form-input-wrapper">
                <User className="form-input-icon" size={18} />
                <input
                  id="register-name"
                  type="text"
                  className="form-input"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="auth-email">E-mail</label>
            <div className="form-input-wrapper">
              <Mail className="form-input-icon" size={18} />
              <input
                id="auth-email"
                type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="auth-password">Senha</label>
            <div className="form-input-wrapper">
              <Lock className="form-input-icon" size={18} />
              <input
                id="auth-password"
                type="password"
                className="form-input"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              'Processando...'
            ) : activeTab === 'login' ? (
              <>
                <LogIn size={20} /> Entrar no Bolão
              </>
            ) : (
              <>
                <UserPlus size={20} /> Criar Minha Conta
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
