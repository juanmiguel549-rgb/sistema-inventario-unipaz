import React, { useState } from 'react';
import { LogIn } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // Check default admin
      await dataService.initDefaultAdmin();

      const user = await dataService.login(email, password);
      if (user) {
        onLogin(user);
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido al iniciar sesión');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg-base)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        padding: '3rem 2rem',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        width: '100%',
        maxWidth: '400px',
        border: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.5rem',
          color: 'white'
        }}>
          <img src="https://unipaz.edu.mx/imagen/logo7.png" alt="UNIPAZ" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        </div>

        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          marginBottom: '0.5rem',
          textAlign: 'center'
        }}>
          Bienvenido
        </h1>
        <p style={{
          color: 'var(--color-text-secondary)',
          fontSize: '0.9rem',
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          Sistema Institucional de Inventarios UNIPAZ
        </p>

        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label>Contraseña</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--color-danger)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.875rem',
              textAlign: 'center',
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.2)'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.875rem' }}
          >
            <LogIn size={20} />
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  );
}
