import React, { useState, useEffect } from 'react';
import { Truck, Edit2, Trash2, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { dataService } from '../services/dataService';
import type { Provider } from '../types';
import './Products.css';

export function Providers() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    rfc: '', social_reason: '', address: '', postal_code: ''
  });

  const loadData = async () => {
    try {
      const data = await dataService.getProviders();
      setProviders(data);
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (provider?: Provider) => {
    if (provider) {
      setEditingId(provider.id);
      setFormData({
        rfc: provider.rfc,
        social_reason: provider.social_reason,
        address: provider.address || '',
        postal_code: provider.postal_code || ''
      });
    } else {
      setEditingId(null);
      setFormData({ rfc: '', social_reason: '', address: '', postal_code: '' });
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
        await dataService.updateProvider(editingId, formData);
      } else {
        await dataService.addProvider(formData as Omit<Provider, 'id'>);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving provider:', error);
      alert('Hubo un error al guardar el proveedor.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este proveedor? Esto no se puede deshacer.')) {
      try {
        await dataService.deleteProvider(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting provider:', error);
        alert('Hubo un error al eliminar. Verifica que no tenga facturas asociadas.');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Proveedores</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Truck size={18} />
          Nuevo Proveedor
        </button>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>RFC</th>
              <th>Razón Social</th>
              <th>Dirección</th>
              <th>Código Postal</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {providers.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.rfc}</td>
                <td>{p.social_reason}</td>
                <td>{p.address || '-'}</td>
                <td>{p.postal_code || '-'}</td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => handleOpenModal(p)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(p.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {providers.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No hay proveedores registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <div className="modal-header">
              <h3 className="section-title">{editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>RFC</label>
                  <input type="text" className="form-control" required value={formData.rfc} onChange={e => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label>Razón Social / Nombre Completo</label>
                  <input type="text" className="form-control" required value={formData.social_reason} onChange={e => setFormData({ ...formData, social_reason: e.target.value.toUpperCase() })} />
                </div>
                <div className="form-group">
                  <label>Dirección</label>
                  <input type="text" className="form-control" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Código Postal</label>
                  <input type="text" className="form-control" value={formData.postal_code} onChange={e => setFormData({ ...formData, postal_code: e.target.value })} />
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
