import { Bell, Search, LogOut } from 'lucide-react';
import type { User } from '../types';
import './Header.css';

interface HeaderProps {
  title: string;
  currentUser: User;
  onLogout: () => void;
}

export function Header({ title, currentUser, onLogout }: HeaderProps) {
  return (
    <header className="header">
      <h2 className="header-title">{title}</h2>
      
      <div className="header-actions">
        <button className="action-btn" aria-label="Buscar">
          <Search size={18} />
        </button>
        <button className="action-btn" aria-label="Notificaciones">
          <Bell size={18} />
        </button>
        <div className="user-profile">
          <div className="user-avatar">{currentUser.name.charAt(0).toUpperCase()}</div>
          <div className="user-info">
            <span className="user-name">{currentUser.name}</span>
            <span className="user-role">{currentUser.role === 'ADMIN' ? 'Administrador' : 'Inventario'}</span>
          </div>
        </div>
        <button className="action-btn danger" style={{ marginLeft: '1rem', color: 'var(--color-danger)' }} onClick={onLogout} title="Cerrar Sessión">
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
