import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dataService } from '../services/dataService';
import type { Product } from '../types';
import './Products.css';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    inventoryNumber: '', name: '', serialNumber: '', description: '',
    condition: 'Bueno', type: '', model: '', stock: 1
  });

  const loadProducts = async () => {
    try {
      const data = await dataService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        inventoryNumber: product.inventoryNumber || '',
        name: product.name || '',
        serialNumber: product.serialNumber || '',
        description: product.description || '',
        condition: product.condition || 'Bueno',
        type: product.type || '',
        model: product.model || '',
        stock: product.stock !== undefined ? product.stock : 1
      });
    } else {
      setEditingId(null);
      setFormData({
        inventoryNumber: '', name: '', serialNumber: '', description: '',
        condition: 'Nuevo', type: '', model: '', stock: 1
      });
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
        await dataService.updateProduct(editingId, formData);
      } else {
        await dataService.addProduct(formData);
      }
      await loadProducts();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Hubo un error al guardar el producto.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este equipo del inventario?')) {
      try {
        await dataService.deleteProduct(id);
        await loadProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Hubo un error al eliminar el producto.');
      }
    }
  };

  const handleImportExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
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

        let imported = 0;

        for (const row of data as any[]) {
          // Normalize keys to lowercase for flexible matching
          const getVal = (keys: string[]) => {
            for (let k of Object.keys(row)) {
              if (keys.includes(k.toLowerCase().trim())) return row[k];
            }
            return '';
          };

          const pInv = getVal(['no. inventario', 'inventario', 'num inventario', 'numero inventario']);
          const pName = getVal(['nombre del equipo', 'nombre', 'equipo', 'artículo', 'articulo']) || 'Equipo Desconocido';
          const pSerial = getVal(['no. serie', 'serie', 'numero de serie', 'num serie', 'sn']);
          const pDesc = getVal(['descripción', 'descripcion', 'detalles']);
          const pCond = getVal(['estado', 'condición', 'condicion']);
          const pType = getVal(['tipo', 'categoría', 'categoria']);
          const pModel = getVal(['modelo']);
          let pStock = parseInt(getVal(['cantidad', 'stock', 'existencia']) || '1', 10);
          if (isNaN(pStock)) pStock = 1;

          if (pName || pInv) {
            await dataService.addProduct({
              inventoryNumber: pInv ? String(pInv) : '',
              name: String(pName),
              serialNumber: pSerial ? String(pSerial) : '',
              description: pDesc ? String(pDesc) : '',
              condition: pCond ? String(pCond) : 'Bueno',
              type: pType ? String(pType) : '',
              model: pModel ? String(pModel) : '',
              stock: pStock
            });
            imported++;
          }
        }

        await loadProducts();
        alert(`Se han importado ${imported} equipos correctamente al inventario.`);
      } catch (error) {
        console.error("Error parsing excel", error);
        alert('Hubo un error al procesar el archivo Excel. Asegúrate de que tenga un formato correcto.');
      }

      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Inventario General</h2>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleImportExcel}
            style={{ display: 'none' }}
            id="excel-upload"
          />
          <button className="btn-primary" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={() => fileInputRef.current?.click()}>
            <Upload size={18} />
            Importar Excel
          </button>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <Plus size={18} />
            Nuevo Equipo
          </button>
        </div>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>No. Inventario</th>
              <th>Nombre del Equipo</th>
              <th>No. Serie</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Modelo</th>
              <th>Existencia</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{p.inventoryNumber || '-'}</td>
                <td>{p.name}</td>
                <td>{p.serialNumber || '-'}</td>
                <td>
                  <span className={`status-badge ${p.condition?.toLowerCase() === 'malo' || p.condition?.toLowerCase() === 'baja' ? 'out' : 'in'}`}>
                    {p.condition || 'No especificado'}
                  </span>
                </td>
                <td>{p.type || '-'}</td>
                <td>{p.model || '-'}</td>
                <td>{p.stock}</td>
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
            {products.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>No hay equipos registrados en el inventario.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '700px' }}>
            <div className="modal-header">
              <h3 className="section-title">{editingId ? 'Editar Equipo' : 'Nuevo Equipo'}</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>No. Inventario</label>
                  <input type="text" className="form-control"
                    value={formData.inventoryNumber} onChange={e => setFormData({ ...formData, inventoryNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Nombre del Equipo</label>
                  <input type="text" className="form-control" required
                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>No. Serie</label>
                  <input type="text" className="form-control"
                    value={formData.serialNumber} onChange={e => setFormData({ ...formData, serialNumber: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Estado (Condición)</label>
                  <input type="text" className="form-control" placeholder="Ej. Bueno, Regular, Malo" required
                    value={formData.condition} onChange={e => setFormData({ ...formData, condition: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Tipo</label>
                  <input type="text" className="form-control" placeholder="Ej. Cómputo, Mobiliario"
                    value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Modelo</label>
                  <input type="text" className="form-control"
                    value={formData.model} onChange={e => setFormData({ ...formData, model: e.target.value })} />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Descripción / Detalles</label>
                  <textarea className="form-control" rows={3}
                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                </div>

                <div className="form-group">
                  <label>Cantidad (Stock Físico Múltiple)</label>
                  <input type="number" className="form-control" required min="0" disabled={!!editingId}
                    value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
                  <small style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>Solo aplica si es un tipo de bien en lote. De lo contrario dejar en 1.</small>
                </div>
              </div>

              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingId ? 'Guardar Cambios' : 'Registrar Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
