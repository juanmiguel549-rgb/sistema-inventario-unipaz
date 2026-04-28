import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, Trash2, X, Download, FileUp } from 'lucide-react';
import { createPortal } from 'react-dom';
import { dataService } from '../services/dataService';
import type { Invoice, Product, Provider } from '../types';
import './Products.css';

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pdfViewerOpen, setPdfViewerOpen] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const [formData, setFormData] = useState<{
    title: string;
    notes: string;
    fileName: string;
    fileBase64: string;
    fileObject?: File;
    providerId: string;
    productId: string;
  }>({ title: '', notes: '', fileName: '', fileBase64: '', providerId: '', productId: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    try {
      const [dbInvoices, dbProducts, dbProviders] = await Promise.all([
        dataService.getInvoices(),
        dataService.getProducts(),
        dataService.getProviders()
      ]);
      setInvoices(dbInvoices);
      setProducts(dbProducts);
      setProviders(dbProviders);
    } catch (error) {
      console.error('Error loading invoices data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = () => {
    setProductSearch('');
    setFormData({ title: '', notes: '', fileName: '', fileBase64: '', fileObject: undefined, providerId: '', productId: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Solo se admiten documentos PDF.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB Limit
      alert('El PDF es demasiado grande. El límite es 50MB.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFormData(prev => ({
      ...prev,
      fileName: file.name,
      fileObject: file,
      fileBase64: '' // We no longer use base64 conversion
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fileObject && !formData.fileBase64) {
      alert('Debes adjuntar un archivo PDF.');
      return;
    }

    try {
      await dataService.addInvoice({
        title: formData.title,
        notes: formData.notes,
        fileName: formData.fileName,
        fileBase64: formData.fileBase64 || '',
        providerId: formData.providerId || undefined,
        productId: formData.productId || undefined
      }, formData.fileObject);
      
      await loadData();
      handleCloseModal();
    } catch (e: any) {
      alert('Error guardando la factura. Podría ser que superaste la cuota de almacenamiento: ' + e.message);
    }
  };

  const handleDelete = async (id: string, title: string, fileUrl: string) => {
    if (window.confirm(`¿Seguro que deseas borrar la factura ${title}? Se eliminará también el archivo PDF.`)) {
      try {
        await dataService.deleteInvoice(id, fileUrl);
        await loadData();
      } catch (error) {
        console.error('Error deleting invoice:', error);
        alert('Hubo un error al eliminar la factura.');
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Gestión de Facturas</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Anexa los comprobantes de adquisición en PDF (Max 50MB)</p>
        </div>

        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={18} />
          Subir Factura
        </button>
      </div>

      <div className="table-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', background: 'transparent', padding: 0, border: 'none' }}>
        {invoices.map(inv => (
          <div key={inv.id} style={{
            background: 'var(--color-bg-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            position: 'relative',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.75rem', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--color-primary)', borderRadius: 'var(--radius-md)' }}>
                <FileText size={24} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontWeight: 600, color: 'var(--color-text-primary)' }}>{inv.title}</h4>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                  {new Date(inv.uploadDate).toLocaleDateString()}
                </p>
              </div>
            </div>
            {inv.productId && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                💻 Equipo: {products.find(p => p.id === inv.productId)?.inventoryNumber || ''} - {products.find(p => p.id === inv.productId)?.name || 'Desconocido'}
              </div>
            )}
            {inv.providerId && (
              <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', background: 'rgba(56, 189, 248, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', width: 'fit-content' }}>
                🏢 Proveedor: {providers.find(p => p.id === inv.providerId)?.social_reason || 'Desconocido'}
              </div>
            )}
            {inv.notes && (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '0.5rem', borderRadius: '4px' }}>
                {inv.notes}
              </p>
            )}
            <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
              <button className="btn-primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem', justifyContent: 'center' }} onClick={() => setPdfViewerOpen(inv.fileBase64)}>
                Abrir PDF
              </button>
              <a href={inv.fileBase64} download={inv.fileName} className="btn-primary" style={{ padding: '0.5rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} title="Descargar">
                <Download size={16} />
              </a>
              <button className="btn-primary danger" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)' }} onClick={() => handleDelete(inv.id, inv.title, inv.fileBase64)} title="Eliminar">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {invoices.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
            <FileUp size={48} style={{ margin: '0 auto 1rem', color: 'var(--color-text-secondary)', opacity: 0.5 }} />
            <p style={{ color: 'var(--color-text-secondary)' }}>No hay facturas registradas en el sistema.</p>
          </div>
        )}
      </div>

      {isModalOpen && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3 className="section-title">Anexar Factura</h3>
              <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Título de Factura</label>
                  <input 
                    type="text"
                    className="form-control" 
                    required 
                    placeholder="Ej. Compra de Laptops 2024"
                    value={formData.title} 
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Equipo Vinculado</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input 
                      type="text" 
                      placeholder="Buscar por nombre o N° de inventario..." 
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      className="form-control"
                      style={{ padding: '0.5rem', background: 'var(--color-bg-base)', border: '1px solid var(--color-border)' }}
                    />
                    <div style={{ 
                      background: 'var(--color-bg-base)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 'var(--radius-md)', 
                      maxHeight: '180px', 
                      overflowY: 'auto',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      <div
                        onClick={() => setFormData({ ...formData, productId: '' })}
                        style={{
                          padding: '0.6rem 0.75rem',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          background: formData.productId === '' ? 'var(--color-primary)' : 'transparent',
                          color: formData.productId === '' ? 'white' : 'var(--color-text-primary)',
                          fontSize: '0.9rem',
                          border: '1px solid transparent'
                        }}
                      >
                        Ninguno / No asociado
                      </div>
                      {(() => {
                        let availableProducts = products;
                        if (productSearch.trim()) {
                          const searchLower = productSearch.toLowerCase();
                          availableProducts = availableProducts.filter(p => 
                            p.name.toLowerCase().includes(searchLower) || 
                            (p.inventoryNumber && p.inventoryNumber.toLowerCase().includes(searchLower)) ||
                            (p.serialNumber && p.serialNumber.toLowerCase().includes(searchLower))
                          );
                        }

                        if (availableProducts.length === 0) {
                           return <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No se encontraron equipos.</div>;
                        }

                        return availableProducts.map(p => {
                          const isSelected = formData.productId === p.id;
                          return (
                            <div 
                              key={p.id}
                              onClick={() => setFormData({ ...formData, productId: p.id })}
                              style={{
                                padding: '0.6rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--color-primary)' : 'transparent',
                                color: isSelected ? 'white' : 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                fontSize: '0.9rem'
                              }}
                            >
                              <span>{p.name} <span style={{opacity: 0.8, fontSize: '0.85em'}}>(Inv: {p.inventoryNumber || p.id.substring(0, 6)})</span></span>
                              {isSelected && <span style={{fontWeight: 'bold'}}>✓</span>}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <label>Proveedor</label>
                  <select 
                    className="form-control" 
                    value={formData.providerId} 
                    onChange={e => setFormData({ ...formData, providerId: e.target.value })}
                  >
                    <option value="">No asociado / Ninguno</option>
                    {providers.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.social_reason} (RFC: {p.rfc})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Documento PDF (Max 50MB)</label>
                  <input type="file" required accept="application/pdf" className="form-control" ref={fileInputRef} onChange={handleFileChange} style={{ padding: '6px' }} />
                </div>
                <div className="form-group">
                  <label>Notas Adicionales (Opcional)</label>
                  <textarea className="form-control" rows={3}
                    value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} />
                </div>
              </div>
              <div className="form-actions" style={{ marginTop: '2rem' }}>
                <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar Factura</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {pdfViewerOpen && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000, padding: '2rem' }}>
          <div style={{ width: '100%', height: '100%', background: '#333', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
            <div style={{ padding: '1rem', background: '#222', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: '1rem' }}>Visualizador de Documentos UNIPAZ</h3>
              <button className="icon-btn" style={{ color: '#fff' }} onClick={() => setPdfViewerOpen(null)}><X size={20} /></button>
            </div>
            <iframe src={pdfViewerOpen} style={{ width: '100%', flex: 1, border: 'none' }} title="PDF Viewer" />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
