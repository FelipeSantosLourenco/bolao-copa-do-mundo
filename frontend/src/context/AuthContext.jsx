import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Carrega o token do localStorage ao inicializar
  useEffect(() => {
    const savedToken = localStorage.getItem('bolao_token');
    const savedUser = localStorage.getItem('bolao_user');
    
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao realizar login.');
      }

      localStorage.setItem('bolao_token', data.token);
      localStorage.setItem('bolao_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao registrar usuário.');
      }

      localStorage.setItem('bolao_token', data.token);
      localStorage.setItem('bolao_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    } catch (error) {
      console.error('Erro no cadastro:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('bolao_token');
    localStorage.removeItem('bolao_user');
    setToken(null);
    setUser(null);
  };

  // Helper para fazer requisições autenticadas
  const authenticatedFetch = async (url, options = {}) => {
    const activeToken = token || localStorage.getItem('bolao_token');
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(url, { ...options, headers });
    
    if (res.status === 401) {
      // Se receber 401 (Não autorizado), desloga o usuário
      logout();
      throw new Error('Sessão expirada. Faça login novamente.');
    }
    
    return res;
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    authenticatedFetch
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
