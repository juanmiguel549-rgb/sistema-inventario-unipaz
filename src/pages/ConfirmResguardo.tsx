import { useState, useEffect } from 'react';
import { Package, CheckCircle2, AlertCircle } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Resguardo, Product } from '../types';

export function ConfirmResguardo() {
  const [loading, setLoading] = useState(true);
  const [resguardo, setResguardo] = useState<Resguardo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const resguardoId = urlParams.get('confirm_resguardo');

    if (!resguardoId) {
      setError('Enlace inválido o incompleto.');
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const [allResguardos, allProducts] = await Promise.all([
          dataService.getResguardos(),
          dataService.getProducts()
        ]);
        
        const found = allResguardos.find(r => r.id === resguardoId);
        if (!found) {
          setError('No se encontró el resguardo solicitado.');
          setLoading(false);
          return;
        }

        if (found.confirmationStatus === 'CONFIRMED') {
          setSuccess(true);
        }

        setResguardo(found);
        
        // Find associated products
        const pIds = (found.productIds && found.productIds.length > 0) ? found.productIds : (found.productId ? [found.productId] : []);
        const associatedProducts = allProducts.filter(p => pIds.includes(p.id));
        setProducts(associatedProducts);

      } catch (err) {
        console.error('Error loading resguardo:', err);
        setError('Ocurrió un error al cargar la información del resguardo.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleConfirm = async () => {
    if (!resguardo) return;
    setConfirming(true);
    try {
      await dataService.confirmResguardo(resguardo.id);
      setSuccess(true);
    } catch (err) {
      console.error('Error confirming resguardo:', err);
      setError('Ocurrió un error al confirmar. Por favor, intenta de nuevo.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)' }}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Cargando información del resguardo...</p>
      </div>
    );
  }

  if (error && !resguardo) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)', padding: '1rem' }}>
        <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-primary)' }}>Error</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)', padding: '1.5rem' }}>
      <div style={{ background: 'var(--color-bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', maxWidth: '500px', width: '100%', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
        
        {/* Header */}
        <div style={{ background: 'var(--color-primary)', padding: '2rem', textAlign: 'center', color: 'white' }}>
          <Package size={48} style={{ margin: '0 auto 1rem', opacity: 0.9 }} />
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>Asignación de Resguardo</h1>
          <p style={{ margin: '0.5rem 0 0', opacity: 0.8, fontSize: '0.9rem' }}>Sistema Institucional de Inventarios</p>
        </div>

        {/* Content */}
        <div style={{ padding: '2rem' }}>
          {success ? (
            <div style={{ textAlign: 'center', padding: '1rem 0' }} className="animate-fade-in">
              <CheckCircle2 size={64} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
              <h2 style={{ color: 'var(--color-success)', marginBottom: '0.5rem' }}>¡Resguardo Confirmado!</h2>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
                Has aceptado la responsabilidad de los equipos asignados a tu nombre.
              </p>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', background: 'var(--color-bg-base)', padding: '1rem', borderRadius: '4px' }}>
                Ya puedes cerrar esta ventana.
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              <p style={{ marginBottom: '1.5rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                Hola <strong>{resguardo?.assignedTo}</strong>, se te ha asignado el resguardo físico permanente de los siguientes equipos:
              </p>

              <div style={{ background: 'var(--color-bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1.5rem' }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--color-text-primary)' }}>Equipos a resguardar:</h4>
                <ul style={{ margin: 0, paddingLeft: '1.5rem', color: 'var(--color-text-secondary)' }}>
                  {products.map(p => (
                    <li key={p.id} style={{ marginBottom: '0.5rem' }}>
                      <strong>{p.name}</strong>
                      <br />
                      <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>No. Inv: {p.inventoryNumber || p.id.substring(0, 8)} / Serie: {p.serialNumber || 'N/A'}</span>
                    </li>
                  ))}
                  {products.length === 0 && <li>Ningún equipo especificado.</li>}
                </ul>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
                <div>
                  <span style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '2px' }}>Departamento</span>
                  <strong>{resguardo?.department}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginBottom: '2px' }}>Ubicación</span>
                  <strong>{resguardo?.location}</strong>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', padding: '1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  {error}
                </div>
              )}

              <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-primary)' }}>
                <strong>Términos de Responsabilidad:</strong><br />
                Me comprometo al cuidado y buen uso de los equipos que se me han proporcionado, de su estado y guarda. En el caso de pérdida, daños o extravío, me responsabilizo a pagar los daños de forma íntegra.
              </div>

              <button 
                onClick={handleConfirm}
                disabled={confirming}
                className="btn-primary" 
                style={{ width: '100%', padding: '1rem', justifyContent: 'center', fontSize: '1rem', background: 'var(--color-success)' }}
              >
                {confirming ? 'Confirmando...' : 'Aceptar y Confirmar Resguardo'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
