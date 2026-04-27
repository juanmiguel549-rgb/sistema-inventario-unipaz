import React, { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Product } from '../types';
import './Products.css';

export function EquiposTemporales() {
  const [products, setProducts] = useState<Product[]>([]);

  const [formData, setFormData] = useState({
    productId: '', action: 'CHECKOUT' as 'CHECKOUT' | 'CHECKIN',
    quantity: 1, personName: '', personEmail: '', expectedReturnDate: '', notes: '', status: 'PENDING' as 'PENDING' | 'COMPLETED'
  });

  const [generatedLink, setGeneratedLink] = useState<{url: string, person: string, product: string, expected: string} | null>(null);

  const loadData = async () => {
    try {
      const prods = await dataService.getProducts();
      setProducts(prods);
    } catch (error) {
      console.error('Error loading temporary equipments data:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId) return alert('Selecciona un producto');

    // Verifications
    if (formData.action === 'CHECKOUT') {
      const p = products.find(prod => prod.id === formData.productId);
      if (p && p.stock < formData.quantity) return alert('No hay suficiente stock base para este préstamo temporal');
    }

    try {
      const savedEquip = await dataService.addTemporaryEquipment(formData);

      if (formData.action === 'CHECKOUT' && savedEquip) {
        const productName = getProductName(formData.productId);
        const confirmUrl = `${window.location.origin}?confirm_loan=${savedEquip.id}`;
        
        // Show modal instead of opening mail client
        setGeneratedLink({
          url: confirmUrl,
          person: formData.personName,
          product: productName,
          expected: formData.expectedReturnDate ? new Date(formData.expectedReturnDate).toLocaleDateString() : 'No especificada'
        });
      }

      setFormData({ productId: '', action: 'CHECKOUT', quantity: 1, personName: '', personEmail: '', expectedReturnDate: '', notes: '', status: 'PENDING' });
      await loadData();
    } catch (error) {
      console.error('Error saving temporary equipment:', error);
      alert('Hubo un error al guardar el préstamo temporal.');
    }
  };

  const getProductName = (id: string) => products.find(p => p.id === id)?.name || 'Desconocido';

  return (
    <div className="animate-fade-in" style={{ padding: '0 2rem', maxWidth: '600px', margin: '0 auto' }}>

      {/* Form Section */}
      <div className="dashboard-section" style={{ height: 'fit-content' }}>
        <h3 className="section-title" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowRightLeft size={20} className="text-primary" />
          Prestar / Entregar
        </h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Acción</label>
            <select className="form-control" value={formData.action} onChange={e => setFormData({ ...formData, action: e.target.value as any })} style={{ background: 'var(--color-bg-base)' }}>
              <option value="CHECKOUT">Préstamo (Salida a alguien)</option>
              <option value="CHECKIN">Ingreso Temporal (Equipo ajeno)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Material o Equipo</label>
            <select className="form-control" value={formData.productId} onChange={e => setFormData({ ...formData, productId: e.target.value })} required style={{ background: 'var(--color-bg-base)' }}>
              <option value="">Selecciona del catálogo...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name} (Disp: {p.stock})</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Cantidad (Uds/Kg/etc)</label>
              <input type="number" className="form-control" required min="1" value={formData.quantity} onChange={e => setFormData({ ...formData, quantity: parseInt(e.target.value) })} />
            </div>
            <div className="form-group">
              <label>Persona / Proveedor responsable</label>
              <input type="text" className="form-control" required value={formData.personName} onChange={e => setFormData({ ...formData, personName: e.target.value })} />
            </div>
            {formData.action === 'CHECKOUT' && (
              <div className="form-group">
                <label>Correo Electrónico (para confirmación)</label>
                <input type="email" className="form-control" value={formData.personEmail} onChange={e => setFormData({ ...formData, personEmail: e.target.value })} />
              </div>
            )}
            <div className="form-group">
              <label>Fecha Estimada de Devolución</label>
              <input type="date" className="form-control" value={formData.expectedReturnDate} onChange={e => setFormData({ ...formData, expectedReturnDate: e.target.value })} />
            </div>
          </div>

          <div className="form-group">
            <label>Nota / Estado de entrega</label>
            <textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
          </div>

          <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}>
            Registrar Préstamo / Equipo
          </button>
        </form>
      </div>

      {generatedLink && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="section-title text-success">Préstamo Registrado con Éxito</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                Se ha generado el enlace de confirmación para <strong>{generatedLink.person}</strong>. Puedes copiarlo y enviárselo por WhatsApp, correo u otro medio:
              </p>
              
              <div style={{ background: 'var(--color-bg-base)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <p><strong>Equipo:</strong> {generatedLink.product}</p>
                <p><strong>Devolución est.:</strong> {generatedLink.expected}</p>
              </div>

              <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {generatedLink.url}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink.url);
                    alert('¡Enlace copiado al portapapeles!');
                  }}
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Copiar Enlace
                </button>
                <button className="btn-secondary" onClick={() => setGeneratedLink(null)} style={{ flex: 1, justifyContent: 'center' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
