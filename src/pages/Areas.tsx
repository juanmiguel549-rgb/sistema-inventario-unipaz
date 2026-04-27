import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Edit2, Trash2, X, Plus } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Area } from '../types';
import './Products.css'; // Reuse styles

export function Areas() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{name: string, locations: string[]}>({ name: '', locations: [] });
  const [newLocationInput, setNewLocationInput] = useState('');

  const loadData = async () => {
    try {
      const data = await dataService.getAreas();
      setAreas(data);
    } catch (error) {
      console.error('Error loading areas:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (area?: Area) => {
    if (area) {
      setEditingId(area.id);
      setFormData({ name: area.name, locations: [...(area.locations || [])] });
    } else {
      setEditingId(null);
      setFormData({ name: '', locations: [] });
    }
    setNewLocationInput('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddLocation = () => {
    if (newLocationInput.trim() && !formData.locations.includes(newLocationInput.trim())) {
      setFormData({
        ...formData,
        locations: [...formData.locations, newLocationInput.trim()]
      });
      setNewLocationInput('');
    }
  };

  const handleRemoveLocation = (loc: string) => {
    setFormData({
      ...formData,
      locations: formData.locations.filter(l => l !== loc)
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await dataService.updateArea(editingId, formData);
      } else {
        await dataService.addArea(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      console.error('Error saving area:', error);
      alert('Error al guardar el área. Asegúrate de que el nombre no esté duplicado.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar esta área?')) {
      try {
        await dataService.deleteArea(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting area:', error);
        alert('Hubo un error al eliminar. Verifica tu conexión.');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Departamentos / Áreas</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <MapPin size={18} />
          Nueva Área
        </button>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Nombre del Área</th>
              <th>Ubicaciones / Cubículos Registrados</th>
              <th style={{ width: '100px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {areas.map(a => (
              <tr key={a.id}>
                <td style={{ fontWeight: 500 }}>{a.name}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {(a.locations || []).map((loc, idx) => (
                      <span key={idx} style={{ background: 'var(--color-bg-base)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', border: '1px solid var(--color-border)' }}>
                        {loc}
                      </span>
                    ))}
                    {(!a.locations || a.locations.length === 0) && <span style={{ color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>Sin ubicaciones fijas</span>}
                  </div>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => handleOpenModal(a)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(a.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {areas.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>No hay áreas registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="section-title">{editingId ? 'Editar Área' : 'Nueva Área'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div className="form-group">
                  <label>Nombre del Departamento / Área</label>
                  <input type="text" className="form-control" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ej. Dirección General de Sistemas" />
                </div>
                
                <div className="form-group">
                  <label>Ubicaciones / Cubículos</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newLocationInput} 
                      onChange={e => setNewLocationInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddLocation();
                        }
                      }}
                      placeholder="Ej. Laboratorio 1" 
                    />
                    <button type="button" className="btn-primary" onClick={handleAddLocation} style={{ padding: '0.5rem' }}>
                      <Plus size={18} />
                    </button>
                  </div>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', background: 'var(--color-bg-base)', padding: '1rem', borderRadius: '4px', minHeight: '60px', border: '1px dashed var(--color-border)' }}>
                    {formData.locations.length === 0 && <span style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>Agrega ubicaciones arriba.</span>}
                    {formData.locations.map((loc, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'white', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid var(--color-border)' }}>
                        {loc}
                        <button type="button" onClick={() => handleRemoveLocation(loc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
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
