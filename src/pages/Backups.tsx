import { useState } from 'react';
import { DatabaseBackup, Download, Package, ShieldCheck } from 'lucide-react';
import * as XLSX from 'xlsx';
import { dataService } from '../services/dataService';

export function Backups() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = (data: any[], filename: string, sheetName: string = 'Datos') => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportProducts = async () => {
    setIsExporting(true);
    try {
      const products = await dataService.getProducts();
      const exportData = products.map(p => ({
        'No. Inventario': p.inventoryNumber,
        'Nombre': p.name,
        'No. Serie': p.serialNumber,
        'Descripción': p.description,
        'Condición': p.condition,
        'Tipo': p.type,
        'Modelo': p.model,
        'Cantidad': p.stock
      }));
      exportToExcel(exportData, 'Inventario_Equipos', 'Equipos');
    } catch (e) {
      alert("Error al exportar");
    }
    setIsExporting(false);
  };

  const handleExportResguardos = async () => {
    setIsExporting(true);
    try {
      const [resguardos, products] = await Promise.all([
        dataService.getResguardos(),
        dataService.getProducts()
      ]);
      const exportData = resguardos.map(r => {
        const productNames = r.productIds && r.productIds.length > 0 
          ? r.productIds.map(id => products.find(p => p.id === id)?.name || 'Desconocido').join(', ')
          : (r.productId ? (products.find(p => p.id === r.productId)?.name || 'Desconocido') : 'Sin equipo');
        
        return {
          'Responsable': r.assignedTo,
          'Departamento': r.department,
          'Ubicación': r.location,
          'Equipos': productNames,
          'Estado': r.status,
          'Firma Electrónica': r.confirmationStatus === 'CONFIRMED' ? 'Confirmado' : 'Pendiente',
          'Fecha Asignación': new Date(r.assignmentDate).toLocaleDateString(),
          'Notas': r.notes || ''
        };
      });
      exportToExcel(exportData, 'Historial_Resguardos', 'Resguardos');
    } catch (e) {
      alert("Error al exportar");
    }
    setIsExporting(false);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      const [products, resguardos, persons, providers] = await Promise.all([
        dataService.getProducts(),
        dataService.getResguardos(),
        dataService.getPersons(),
        dataService.getProviders()
      ]);

      const workbook = XLSX.utils.book_new();

      // Sheet 1: Equipos
      const prodSheet = XLSX.utils.json_to_sheet(products.map(p => ({
        'No. Inventario': p.inventoryNumber,
        'Nombre': p.name,
        'No. Serie': p.serialNumber,
        'Descripción': p.description,
        'Condición': p.condition,
        'Modelo': p.model
      })));
      XLSX.utils.book_append_sheet(workbook, prodSheet, 'Equipos');

      // Sheet 2: Resguardos
      const resgSheet = XLSX.utils.json_to_sheet(resguardos.map(r => ({
        'Responsable': r.assignedTo,
        'Departamento': r.department,
        'Estado': r.status,
        'Fecha': new Date(r.assignmentDate).toLocaleDateString()
      })));
      XLSX.utils.book_append_sheet(workbook, resgSheet, 'Resguardos');

      // Sheet 3: Personal
      const persSheet = XLSX.utils.json_to_sheet(persons.map(p => ({
        'Nombre': p.name,
        'Correo': p.email
      })));
      XLSX.utils.book_append_sheet(workbook, persSheet, 'Personal');

      // Sheet 4: Proveedores
      const provSheet = XLSX.utils.json_to_sheet(providers.map(p => ({
        'RFC': p.rfc,
        'Razón Social': p.social_reason,
        'Dirección': p.address,
        'C.P.': p.postal_code
      })));
      XLSX.utils.book_append_sheet(workbook, provSheet, 'Proveedores');

      XLSX.writeFile(workbook, `Backup_Completo_UNIPAZ_${new Date().toISOString().split('T')[0]}.xlsx`);

    } catch (e) {
      alert("Error al exportar todo");
    }
    setIsExporting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 className="page-title">Respaldos y Exportación</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>Genera reportes en formato Excel (XLSX) para análisis o copias de seguridad.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Exportar Todo */}
        <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ background: 'var(--color-primary)', color: 'white', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <DatabaseBackup size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Respaldo Completo</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>Descarga toda la base de datos (Equipos, Resguardos, Personal y Proveedores) en un solo archivo con múltiples hojas.</p>
          <button className="btn-primary" onClick={handleExportAll} disabled={isExporting} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={18} style={{ marginRight: '8px' }} />
            {isExporting ? 'Generando...' : 'Descargar Excel'}
          </button>
        </div>

        {/* Exportar Inventario */}
        <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <Package size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Solo Equipos</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>Exporta únicamente la tabla de inventario general de equipos con todos sus detalles.</p>
          <button className="btn-secondary" onClick={handleExportProducts} disabled={isExporting} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={18} style={{ marginRight: '8px' }} />
            Descargar
          </button>
        </div>

        {/* Exportar Resguardos */}
        <div style={{ background: 'var(--color-bg-surface)', padding: '2rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '1rem', borderRadius: '50%', marginBottom: '1rem' }}>
            <ShieldCheck size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Solo Resguardos</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>Exporta el historial de resguardos fijos, activos y devueltos, incluyendo quién los tiene asignados.</p>
          <button className="btn-secondary" onClick={handleExportResguardos} disabled={isExporting} style={{ width: '100%', justifyContent: 'center' }}>
            <Download size={18} style={{ marginRight: '8px' }} />
            Descargar
          </button>
        </div>

      </div>
    </div>
  );
}
