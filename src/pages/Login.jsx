import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        // Se der sucesso no signUp, geralmente precisa confirmar o email, mas o Supabase as vezes loga direto se não tiver confirmação ativada.
        // Vamos mostrar uma mensagem se for o caso.
        alert('Cadastro realizado! Se necessário, verifique seu email para confirmar a conta antes de fazer o login.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '1rem',
      background: 'radial-gradient(circle at top right, rgba(99, 102, 241, 0.15), transparent 400px), var(--bg-primary)'
    }}>
      
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ 
            display: 'inline-flex', 
            padding: '12px', 
            borderRadius: '16px', 
            background: 'var(--accent-primary)',
            marginBottom: '1rem',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <LogIn size={28} color="white" />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
            {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
          </h2>
          <p>Gerencie suas contas a pagar de forma visual e inteligente.</p>
        </div>

        {error && (
          <div style={{ 
            display: 'flex', gap: '8px', alignItems: 'center', 
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-danger)',
            color: '#fca5a5', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem',
            fontSize: '0.9rem'
          }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label" htmlFor="email">E-mail</label>
            <input 
              id="email"
              type="email" 
              required
              className="input-field" 
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="password">Senha</label>
            <input 
              id="password"
              type="password" 
              required
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Entrar no Sistema' : 'Criar Conta')}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button 
            className="btn btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', border: 'none' }}
            onClick={() => setIsLogin(!isLogin)}
            type="button"
          >
            {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
          </button>
        </div>

      </div>
    </div>
  );
}
