import { useState, useEffect } from 'react';
import { Clock, Download } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { TemporaryEquipment, Product } from '../types';
import './Products.css'; // Reusing styles

export function PrestamosActivos() {
  const [equipments, setEquipments] = useState<TemporaryEquipment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const loadData = async () => {
    try {
      const [equivs, prods] = await Promise.all([
        dataService.getTemporaryEquipments(),
        dataService.getProducts()
      ]);
      setEquipments(equivs);
      setProducts(prods);
    } catch (error) {
      console.error('Error loading temporary equipments data:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleReturn = async (id: string) => {
    if (window.confirm('¿Confirmar que el equipo/material ha sido devuelto íntegramente al inventario?')) {
      try {
        await dataService.returnTemporaryEquipment(id);
        await loadData();
      } catch (error) {
        console.error('Error returning equipment:', error);
        alert('Hubo un error al devolver el equipo.');
      }
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Desconocido';

  return (
    <div className="animate-fade-in" style={{ padding: '0 2rem' }}>
      <div className="table-container" style={{ margin: 0 }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} /> Historial de Préstamos Temporales
          </h3>
        </div>
        <table className="crud-table">
          <thead>
            <tr>
              <th>Acción</th>
              <th>Equipo/Producto</th>
              <th>Resp.</th>
              <th>Fecha Est.</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {equipments.map(t => (
              <tr key={t.id}>
                <td>
                  <span className={`status-badge ${t.action === 'CHECKIN' ? 'in' : 'out'}`}>
                    {t.action === 'CHECKIN' ? 'NOS PRESTARON' : 'PRESTADO'}
                  </span>
                </td>
                <td style={{ fontWeight: 500 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span>{getProductName(t.productId)}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t.quantity} Uds</span>
                    {t.action === 'CHECKOUT' && t.status === 'PENDING' && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        width: 'fit-content',
                        background: t.loanStatus === 'CONFIRMED' ? 'var(--color-success)' : 'var(--color-warning)',
                        color: t.loanStatus === 'CONFIRMED' ? 'white' : 'black',
                        fontWeight: 'bold'
                      }}>
                        {t.loanStatus === 'CONFIRMED' ? '✓ PRESTADO' : 'POR CONFIRMAR'}
                      </span>
                    )}
                  </div>
                </td>
                <td>{t.personName}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {t.expectedReturnDate ? new Date(t.expectedReturnDate).toLocaleDateString() : '-'}
                </td>
                <td>
                  {t.status === 'PENDING' ? (
                    <button className="btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', background: 'var(--color-success)', height: 'auto' }} onClick={() => handleReturn(t.id)}>
                      <Download size={14} style={{ marginRight: '0.25rem' }} /> Devolver
                    </button>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
                      Entregado {t.actualReturnDate && new Date(t.actualReturnDate).toLocaleDateString()}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {equipments.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '3rem' }}>No hay registros de préstamos temporales activos.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
