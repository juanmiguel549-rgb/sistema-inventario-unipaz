import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users as UsersIcon, Edit2, Trash2, X, Shield } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { User, Role } from '../types';
import './Products.css';

export function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '', password: '', name: '', role: 'USER' as Role, isActive: true
  });

  const loadData = async () => {
    try {
      const data = await dataService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  useEffect(() => {
    const initAndLoad = async () => {
      // Asegurarse de que el admin default exista si entran aquí
      await dataService.initDefaultAdmin();
      await loadData();
    };
    initAndLoad();
  }, []);

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        email: user.email || '', password: user.password || '',
        name: user.name, role: user.role, isActive: user.isActive
      });
    } else {
      setEditingId(null);
      setFormData({ email: '', password: '', name: '', role: 'USER', isActive: true });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dataService.updateUser(editingId, formData);
      } else {
        if (!formData.password) return alert('La contraseña es requerida para usuarios nuevos');
        await dataService.addUser(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const handleDelete = async (id: string, email?: string) => {
    if (email === 'admin@unipaz.edu.co') {
      alert('El usuario administrador principal no puede ser eliminado.');
      return;
    }

    // Prevent self delete
    const current = await dataService.getCurrentUser();
    if (current && current.id === id) {
      alert('No puedes eliminar tu propia cuenta mientras estás en sesión.');
      return;
    }

    if (window.confirm(`¿Seguro que deseas eliminar al usuario ${email}?`)) {
      try {
        await dataService.deleteUser(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Hubo un error al eliminar el usuario.');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Gestión de Usuarios</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <UsersIcon size={18} />
          Nuevo Usuario
        </button>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Correo Electrónico</th>
              <th>Nombre Completo</th>
              <th>Rol / Privilegios</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500 }}>{u.email}</td>
                <td>{u.name}</td>
                <td>
                  <span className={`status-badge ${u.role === 'ADMIN' ? 'in' : 'warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {u.role === 'ADMIN' && <Shield size={12} />}
                    {u.role === 'ADMIN' ? 'Administrador' : 'Estándar'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${u.isActive ? 'in' : 'out'}`}>
                    {u.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => handleOpenModal(u)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    {u.email !== 'admin@unipaz.edu.co' && (
                      <button className="icon-btn danger" onClick={() => handleDelete(u.id, u.email)} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3 className="section-title">{editingId ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Correo Electrónico (Login)</label>
                    <input type="email" className="form-control" required value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })}
                      disabled={editingId !== null && formData.email === 'admin@unipaz.edu.co'} />
                  </div>
                  <div className="form-group">
                    <label>Contraseña {editingId && '(Dejar en blanco para no cambiar)'}</label>
                    <input type="password" className="form-control" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                      required={!editingId} />
                  </div>
                </div>

                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Rol del Sistema</label>
                    <select className="form-control" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as Role })} style={{ background: 'var(--color-bg-base)' }}
                      disabled={editingId !== null && formData.email === 'admin@unipaz.edu.co'}>
                      <option value="USER">Usuario Estándar (Sin acceso a Usuarios)</option>
                      <option value="ADMIN">Administrador VIP (Control Total)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Estado de la Cuenta</label>
                    <select className="form-control" value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} style={{ background: 'var(--color-bg-base)' }}
                      disabled={editingId !== null && formData.email === 'admin@unipaz.edu.co'}>
                      <option value="true">Activa</option>
                      <option value="false">Desactivada (Suspendido)</option>
                    </select>
                  </div>
                </div>

              </div>
              <div className="form-actions">
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)' }}>{editingId ? 'Guardar Cambios' : 'Crear Usuario'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
