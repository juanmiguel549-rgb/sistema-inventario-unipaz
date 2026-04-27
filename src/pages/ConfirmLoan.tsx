import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { TemporaryEquipment, Product } from '../types';

interface ConfirmLoanProps {
  loanId: string;
}

export function ConfirmLoan({ loanId }: ConfirmLoanProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loan, setLoan] = useState<TemporaryEquipment | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchLoanData = async () => {
      try {
        const equipments = await dataService.getTemporaryEquipments();
        const foundLoan = equipments.find(e => e.id === loanId);
        
        if (!foundLoan) {
          setError('No se encontró el préstamo solicitado o el enlace es inválido.');
          setLoading(false);
          return;
        }

        setLoan(foundLoan);

        const products = await dataService.getProducts();
        const foundProduct = products.find(p => p.id === foundLoan.productId);
        setProduct(foundProduct || null);

      } catch (err) {
        console.error('Error fetching loan:', err);
        setError('Ocurrió un error de conexión al buscar la información del préstamo.');
      } finally {
        setLoading(false);
      }
    };

    fetchLoanData();
  }, [loanId]);

  const handleConfirm = async () => {
    if (!loan) return;
    setConfirming(true);
    try {
      await dataService.confirmTemporaryLoan(loan.id);
      setSuccess(true);
      // Update local state to reflect UI change
      setLoan({ ...loan, loanStatus: 'CONFIRMED' });
    } catch (err) {
      console.error('Error confirming loan:', err);
      alert('Ocurrió un error al intentar confirmar el préstamo. Por favor, intente nuevamente.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)' }}>
        <p>Cargando información del préstamo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)', padding: '1rem' }}>
        <div style={{ background: 'white', padding: '2rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', textAlign: 'center', maxWidth: '400px' }}>
          <AlertCircle size={48} style={{ color: 'var(--color-danger)', margin: '0 auto 1rem' }} />
          <h2 style={{ marginBottom: '1rem', color: 'var(--color-text-base)' }}>Error</h2>
          <p style={{ color: 'var(--color-text-muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!loan) return null;

  const isConfirmed = loan.loanStatus === 'CONFIRMED' || success;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-base)', padding: '1rem', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ background: 'var(--color-bg-elevated)', padding: '2.5rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)', maxWidth: '500px', width: '100%' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="https://unipaz.edu.mx/imagen/logo7.png" alt="UNIPAZ Logo" style={{ height: '60px', marginBottom: '1rem' }} />
          <h1 style={{ fontSize: '1.5rem', color: 'var(--color-text-base)', margin: 0 }}>Confirmación de Recepción</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>Sistema Institucional de Inventarios</p>
        </div>

        <div style={{ background: 'var(--color-bg-base)', padding: '1.5rem', borderRadius: 'var(--radius-md)', marginBottom: '2rem', border: '1px solid var(--color-border)' }}>
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Detalles del Préstamo
          </h3>
          
          <div style={{ display: 'grid', gap: '0.75rem', fontSize: '0.95rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Responsable:</span>
              <span style={{ fontWeight: 600 }}>{loan.personName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Equipo:</span>
              <span style={{ fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{product?.name || 'Equipo no encontrado'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Cantidad:</span>
              <span style={{ fontWeight: 600 }}>{loan.quantity}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--color-text-muted)' }}>Fecha Estimada de Devolución:</span>
              <span style={{ fontWeight: 600 }}>{loan.expectedReturnDate ? new Date(loan.expectedReturnDate).toLocaleDateString() : 'No especificada'}</span>
            </div>
          </div>
        </div>

        {isConfirmed ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34, 197, 94, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-success)' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-success)', margin: '0 auto 1rem' }} />
            <h2 style={{ color: 'var(--color-success)', fontSize: '1.25rem', marginBottom: '0.5rem' }}>¡Recepción Confirmada!</h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>El estado del equipo ha sido actualizado a "Prestado". Ya puede cerrar esta ventana.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Al hacer clic en el botón de abajo, usted confirma que ha recibido el equipo descrito anteriormente en las condiciones en las que se entregó.
            </p>
            <button 
              onClick={handleConfirm} 
              disabled={confirming}
              style={{ 
                background: 'var(--color-primary)', 
                color: 'white', 
                border: 'none', 
                padding: '1rem 2rem', 
                fontSize: '1rem', 
                fontWeight: 600, 
                borderRadius: 'var(--radius-md)', 
                cursor: confirming ? 'not-allowed' : 'pointer',
                opacity: confirming ? 0.7 : 1,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                transition: 'background 0.2s'
              }}
            >
              {confirming ? 'Confirmando...' : 'Sí, confirmo de recibido'}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
