import { LayoutDashboard, Package, ShieldCheck, Clock, Users, Contact, FileText, MapPin, List, Truck } from 'lucide-react';
import type { User } from '../types';
import './Sidebar.css';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  currentUser: User;
}

export function Sidebar({ currentPath, onNavigate, currentUser }: SidebarProps) {
  const navItems = [
    { path: '/', label: 'Panel', icon: LayoutDashboard },
    { path: '/products', label: 'Inventario General', icon: Package },
    { path: '/resguardos', label: 'Resguardos Fijos', icon: ShieldCheck },
    { path: '/temporal', label: 'Equipos Temporales', icon: Clock },
    { path: '/active-loans', label: 'Historial de Prestamos Temp.', icon: List },
    { path: '/invoices', label: 'Facturas PDF', icon: FileText },
    { path: '/providers', label: 'Proveedores', icon: Truck },
    { path: '/personnel', label: 'Personal Institucional', icon: Contact },
    { path: '/areas', label: 'Áreas', icon: MapPin },
  ];

  if (currentUser.role === 'ADMIN') {
    navItems.push({ path: '/users', label: 'Usuarios', icon: Users });
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo" style={{ background: 'transparent', padding: 0 }}>
          <img src="https://unipaz.edu.mx/imagen/logo7.png" alt="Logo UNIPAZ" style={{ width: '48px', height: '48px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 className="sidebar-title" style={{ fontSize: '1rem', lineHeight: '1.2' }}>Sistema Institucional</h1>
          <h1 className="sidebar-title" style={{ fontSize: '1.2rem', color: 'var(--color-primary)' }}>de Inventarios</h1>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          return (
            <button
              key={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => onNavigate(item.path)}
              style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', borderLeft: isActive ? '3px solid var(--color-primary)' : '3px solid transparent' }}
            >
              <Icon className="nav-icon" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
