import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit2, Trash2, X, Plus, Mail, Upload } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Person } from '../types';
import * as XLSX from 'xlsx';
import './Products.css';

export function Personnel() {
  const [persons, setPersons] = useState<Person[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '', email: ''
  });

  const loadData = async () => {
    try {
      const data = await dataService.getPersons();
      setPersons(data);
    } catch (error) {
      console.error('Error loading personnel:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (person?: Person) => {
    if (person) {
      setEditingId(person.id);
      setFormData({
        name: person.name, email: person.email
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '' });
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
        await dataService.updatePerson(editingId, formData);
      } else {
        await dataService.addPerson(formData);
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving person:', error);
      alert('Hubo un error al guardar la información del empleado.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`¿Seguro que deseas eliminar a ${name} de los registros?`)) {
      try {
        await dataService.deletePerson(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting person:', error);
        alert('Hubo un error al eliminar a la persona.');
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let importedCount = 0;

        // Loop sequencial porque estamos haciendo promesas a BD
        for (const row of data as any[]) {
          // Buscamos columnas que parezcan de nombre y correo
          const nameLine = row['Nombre'] || row['NOMBRE'] || row['Name'] || row['Empleado'];
          const emailLine = row['Correo'] || row['CORREO'] || row['Email'] || row['Email Institucional'];

          if (nameLine) {
            await dataService.addPerson({
              name: String(nameLine),
              email: emailLine ? String(emailLine).toLowerCase().trim() : ''
            });
            importedCount++;
          }
        }

        alert(`Se importaron ${importedCount} registros exitosamente.`);
        await loadData();
      } catch (error) {
        console.error("Error importando Excel:", error);
        alert('Hubo un error al leer el archivo Excel. Asegúrate de que el formato sea correcto.');
      }
    };
    reader.readAsBinaryString(file);
    // Reset the input so the same file could be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Personal / Trabajadores</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label className="btn-primary" style={{ cursor: 'pointer', background: 'var(--color-success)', borderColor: 'var(--color-success)' }}>
            <Upload size={18} />
            Importar Excel
            <input type="file" accept=".xlsx, .xls" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nuevo Empleado
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Nombre Completo</th>
              <th>Correo Electrónico</th>
              <th style={{ width: '120px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {persons.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500 }}>{p.name}</td>
                <td>
                  <a href={`mailto:${p.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={14} />
                    {p.email}
                  </a>
                </td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => handleOpenModal(p)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(p.id, p.name)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {persons.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '3rem' }}>No hay personal registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="section-title">{editingId ? 'Editar Personal' : 'Nuevo Personal'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Nombre Completo</label>
                  <input type="text" className="form-control" required autoFocus
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Correo Electrónico Institucional</label>
                  <input type="email" className="form-control" required
                    value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value.toLowerCase().trim() })} />
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">{editingId ? 'Guardar Cambios' : 'Añadir'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
