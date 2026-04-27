import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import type { User } from '../types';

interface LayoutProps {
  children: ReactNode;
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User;
  onLogout: () => void;
}

export function Layout({ children, currentPath, onNavigate, currentUser, onLogout }: LayoutProps) {
  // Determine header title based on path
  const getTitle = () => {
    switch (currentPath) {
      case '/': return 'Panel General';
      case '/products': return 'Inventario General de Equipos';
      case '/transactions': return 'Registro de Movimientos';
      case '/resguardos': return 'Resguardos Fijos';
      case '/temporal': return 'Entrada/Salida Temporal';
      case '/invoices': return 'Archivo de Facturas';
      case '/personnel': return 'Directorio de Personal';
      case '/areas': return 'Departamentos y Áreas';
      case '/users': return 'Administración de Usuarios';
      default: return 'Sistema Institucional de Inventarios UNIPAZ';
    }
  };

  return (
    <div className="app-container">
      <Sidebar currentPath={currentPath} onNavigate={onNavigate} currentUser={currentUser} />
      <div className="main-content">
        <Header title={getTitle()} currentUser={currentUser} onLogout={onLogout} />
        <main style={{ padding: '2rem 0', flex: 1, animation: 'fadeIn var(--transition-normal)' }}>
          {children}
        </main>
      </div>
    </div>
  );
}
