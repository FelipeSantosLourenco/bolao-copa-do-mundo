import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Bets from './components/Bets';
import Predictions from './components/Predictions';
import { Trophy, Calendar, LogOut, User, Users } from 'lucide-react';
import './App.css';

// Componente para renderizar a Navbar apenas se o usuário estiver logado
function Navigation() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <span>⚽ Bolão Copa 2026</span>
      </div>
      <div className="nav-menu">
        <Link 
          to="/dashboard" 
          className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
        >
          <Trophy size={16} /> Ranking
        </Link>
        <Link 
          to="/palpites" 
          className={`nav-link ${location.pathname === '/palpites' ? 'active' : ''}`}
        >
          <Calendar size={16} /> Meus Palpites
        </Link>
        <Link 
          to="/todos-palpites" 
          className={`nav-link ${location.pathname === '/todos-palpites' ? 'active' : ''}`}
        >
          <Users size={16} /> Palpites da Galera
        </Link>
      </div>
      <div className="nav-user">
        <span className="user-tag">
          <User size={14} /> {user.name}
        </span>
        <button 
          onClick={logout} 
          className="nav-link" 
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: '0.5rem' }}
          title="Sair"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}

// Handler de conteúdo principal com controle de rotas privadas
function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="spinner-container">
        <div className="spinner"></div>
        <p className="text-secondary">Carregando bolão da copa...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navigation />
      <main className="main-content">
        <Routes>
          {/* Rota pública/Login */}
          <Route 
            path="/login" 
            element={!user ? <Login /> : <Navigate to="/dashboard" replace />} 
          />
          
          {/* Rotas Protegidas */}
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/palpites" 
            element={user ? <Bets /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/todos-palpites" 
            element={user ? <Predictions /> : <Navigate to="/login" replace />} 
          />

          {/* Fallback de rotas */}
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
