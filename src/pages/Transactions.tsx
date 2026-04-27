import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Product, Transaction } from '../types';
// Reusing some styles from Products.css for consistency
import './Products.css';

export function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [persons, setPersons] = useState<import('../types').Person[]>([]);

  const [formData, setFormData] = useState({
    productId: '',
    type: 'IN' as 'IN' | 'OUT',
    quantity: 1,
    note: '',
    assignedTo: ''
  });

  const loadData = async () => {
    try {
      const [txs, prods, pers] = await Promise.all([
        dataService.getTransactions(),
        dataService.getProducts(),
        dataService.getPersons()
      ]);
      setTransactions(txs);
      setProducts(prods);
      setPersons(pers);
    } catch (error) {
      console.error('Error loading transactions data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) {
      alert('Por favor selecciona un producto');
      return;
    }

    // Verify stock if outgoing
    if (formData.type === 'OUT') {
      const p = products.find(prod => prod.id === formData.productId);
      if (p && p.stock < formData.quantity) {
        alert('No hay suficiente stock para realizar esta salida.');
        return;
      }
    }

    // Require person if OUT
    if (formData.type === 'OUT' && !formData.assignedTo) {
      alert('Por favor selecciona a quién se le prestó el equipo.');
      return;
    }

    try {
      await dataService.addTransaction(formData);
      setFormData({ productId: '', type: 'IN', quantity: 1, note: '', assignedTo: '' });
      await loadData();
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Hubo un error al guardar el movimiento.');
    }
  };

  const getProductName = (id: string) => {
    return products.find(p => p.id === id)?.name || 'Producto Desconocido';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 400px) 1fr', gap: '2rem', padding: '0 2rem' }}>

      {/* Form Section */}
      <div className="dashboard-section" style={{ height: 'fit-content' }}>
        <h3 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={20} className="text-primary" />
          Registrar Movimiento
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo de Movimiento</label>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1, background: formData.type === 'IN' ? 'var(--color-success-bg)' : 'transparent', borderColor: formData.type === 'IN' ? 'var(--color-success)' : 'var(--color-border)' }}>
                <input type="radio" name="type" value="IN" checked={formData.type === 'IN'} onChange={() => setFormData({ ...formData, type: 'IN' })} style={{ display: 'none' }} />
                <ArrowUpRight size={18} style={{ color: 'var(--color-success)' }} />
                <span style={{ color: formData.type === 'IN' ? 'var(--color-success)' : 'var(--color-text-primary)' }}>Entrada</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', flex: 1, background: formData.type === 'OUT' ? 'var(--color-danger-bg)' : 'transparent', borderColor: formData.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-border)' }}>
                <input type="radio" name="type" value="OUT" checked={formData.type === 'OUT'} onChange={() => setFormData({ ...formData, type: 'OUT' })} style={{ display: 'none' }} />
                <ArrowDownRight size={18} style={{ color: 'var(--color-danger)' }} />
                <span style={{ color: formData.type === 'OUT' ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>Salida</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Producto</label>
            <select className="form-control" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} required style={{ background: 'var(--color-bg-base)' }}>
              <option value="">Selecciona un producto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Cantidad</label>
            <input type="number" className="form-control" required min="1"
              value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
          </div>

          {formData.type === 'OUT' && (
            <div className="form-group">
              <label>¿A quién se le prestó?</label>
              <select className="form-control" value={formData.assignedTo} onChange={e => setFormData({ ...formData, assignedTo: e.target.value })} style={{ background: 'var(--color-bg-base)' }} required={formData.type === 'OUT'}>
                <option value="">Selecciona una persona...</option>
                {persons.map(p => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Nota / Razón (Opcional)</label>
            <textarea className="form-control" rows={3}
              value={formData.note} onChange={e => setFormData({ ...formData, note: e.target.value })}></textarea>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Registrar Movimiento
          </button>
        </form>
      </div>

      {/* History Section */}
      <div className="table-container" style={{ margin: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="section-title">Historial de Movimientos</h3>
        </div>
        <table className="crud-table">
          <thead>
            <tr>
              <th>Tipo</th>
              <th>Producto</th>
              <th>Destino / Origen</th>
              <th>Cant.</th>
              <th>Fecha</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(t => (
              <tr key={t.id}>
                <td>
                  <span className={`status-badge ${t.type.toLowerCase()}`}>
                    {t.type === 'IN' ? 'ENTRADA' : 'SALIDA'}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>{getProductName(t.productId)}</td>
                <td>{t.type === 'OUT' ? (t.assignedTo || '-') : 'Almacén'}</td>
                <td>{t.quantity}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(t.date).toLocaleDateString()} {new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </td>
                <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{t.note || '-'}</td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem' }}>No hay movimientos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
