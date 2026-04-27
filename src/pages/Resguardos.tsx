import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ShieldPlus, Edit2, Trash2, X, FileText, Mail, CheckCircle2 } from 'lucide-react';
import { dataService } from '../services/dataService';
import type { Product, Resguardo, Area } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import emailjs from '@emailjs/browser';
import { EMAIL_CONFIG } from '../lib/emailConfig';
import './Products.css';

export function Resguardos() {
  const [resguardos, setResguardos] = useState<Resguardo[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<{url: string, person: string, email?: string, products: string} | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const [formData, setFormData] = useState({
    productIds: [] as string[], assignedTo: '', assignedEmail: '', department: '', location: '', status: 'ACTIVO' as 'ACTIVO' | 'DEVUELTO', notes: ''
  });
  const [persons, setPersons] = useState<import('../types').Person[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);

  const loadData = async () => {
    try {
      const [resg, prods, pers, areasData] = await Promise.all([
        dataService.getResguardos(),
        dataService.getProducts(),
        dataService.getPersons(),
        dataService.getAreas()
      ]);
      setResguardos(resg);
      setProducts(prods);
      setPersons(pers);
      setAreas(areasData);
    } catch (error) {
      console.error('Error loading resguardos data:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleOpenModal = (resguardo?: Resguardo) => {
    if (resguardo) {
      setEditingId(resguardo.id);
      setFormData({
        productIds: resguardo.productIds && resguardo.productIds.length > 0 ? resguardo.productIds : (resguardo.productId ? [resguardo.productId] : []),
        assignedTo: resguardo.assignedTo,
        assignedEmail: resguardo.assignedEmail || '', department: resguardo.department,
        location: resguardo.location, status: resguardo.status, notes: resguardo.notes || ''
      });
    } else {
      setEditingId(null);
      setFormData({ productIds: [], assignedTo: '', assignedEmail: '', department: '', location: '', status: 'ACTIVO', notes: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.productIds.length === 0) {
      alert('Por favor selecciona al menos un equipo.');
      return;
    }

    try {
      if (editingId) {
        // For editing, we only edit one at a time so we take the first selected product
        await dataService.updateResguardo(editingId, { ...formData, productId: formData.productIds[0] });
      } else {
        // Create a single resguardo containing multiple product IDs
        await dataService.addResguardo({ ...formData, productIds: formData.productIds, productId: formData.productIds[0] });
      }
      await loadData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving resguardo:', error);
      alert('Hubo un error al guardar el resguardo.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar este resguardo?')) {
      try {
        await dataService.deleteResguardo(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting resguardo:', error);
        alert('Hubo un error al eliminar el resguardo.');
      }
    }
  };

  const getProductName = (id: string | undefined) => {
    if (!id) return 'Desconocido';
    return products.find(p => p.id === id)?.name || 'Desconocido';
  };

  const getProductDetails = (id: string | undefined) => {
    if (!id) return null;
    return products.find(p => p.id === id);
  };

  const generatePDF = async (r: Resguardo) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;

    // Si productIds no existe (datos viejos), usamos productId
    const activeProductIds = (r.productIds && r.productIds.length > 0) ? r.productIds : (r.productId ? [r.productId] : []);

    // Funciones Helper para centrar texto
    const centerText = (text: string, y: number, size = 10, align: 'center' | 'left' | 'right' = 'center') => {
      doc.setFontSize(size);
      doc.text(text, pageWidth / 2, y, { align });
    };

    // Borde de la página principal
    doc.setDrawColor(0, 43, 94); // Azul oscuro
    doc.setLineWidth(0.5);
    doc.rect(margin - 5, margin - 5, pageWidth - (margin * 2) + 10, pageHeight - (margin * 2) + 10);

    // Intentar cargar logo
    try {
      const imgData = await new Promise<string>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = '/logo7.png';
      });
      doc.addImage(imgData, 'PNG', margin, margin, 25, 25);
    } catch (error) {
      console.warn('No se pudo cargar el logo de UNIPAZ. Mostrando sin logo.', error);
    }

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 43, 94);
    centerText('UNIVERSIDAD INTERNACIONAL DE LA PAZ', margin + 5, 12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    centerText('Dirección General de Sistemas', margin + 12, 11);
    centerText('Sistema Institucional de Inventarios', margin + 18, 11);

    // Título del documento
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, margin + 28, pageWidth - (margin * 2), 8, 'F');
    centerText('FORMATO DE RESGUARDO DE EQUIPO', margin + 34, 12);

    // Folio y fecha a la derecha (debajo del título)
    const sorted = [...resguardos].sort((a, b) => new Date(a.assignmentDate).getTime() - new Date(b.assignmentDate).getTime());
    const rIndex = sorted.findIndex(item => item.id === r.id);
    const folioNumber = `DGS/R-${String(rIndex !== -1 ? rIndex + 1 : 1).padStart(3, '0')}`;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Folio:`, pageWidth - margin - 40, margin + 45);
    doc.setFont("helvetica", "bold");
    doc.text(folioNumber, pageWidth - margin - 25, margin + 45);

    doc.setFont("helvetica", "normal");
    doc.text(`Fecha:`, pageWidth - margin - 40, margin + 51);
    doc.setFont("helvetica", "bold");
    doc.text(new Date(r.assignmentDate).toLocaleDateString(), pageWidth - margin - 25, margin + 51);

    // Datos del Usuario
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('DATOS DEL RESPONSABLE', margin, margin + 60);
    doc.line(margin, margin + 62, pageWidth - margin, margin + 62);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre:`, margin, margin + 70);
    doc.setFont("helvetica", "bold");
    const splitName = doc.splitTextToSize(r.assignedTo, (pageWidth / 2) - margin - 20);
    doc.text(splitName, margin + 18, margin + 70);

    doc.setFont("helvetica", "normal");
    doc.text(`Depto/Área:`, margin, margin + 80);
    doc.setFont("helvetica", "bold");
    const splitDeptHeader = doc.splitTextToSize(r.department, (pageWidth / 2) - margin - 25);
    doc.text(splitDeptHeader, margin + 23, margin + 80);

    doc.setFont("helvetica", "normal");
    doc.text(`Ubicación:`, pageWidth / 2, margin + 70);
    doc.setFont("helvetica", "bold");
    const splitLoc = doc.splitTextToSize(r.location, (pageWidth / 2) - margin - 25);
    doc.text(splitLoc, (pageWidth / 2) + 18, margin + 70);

    doc.setFont("helvetica", "normal");
    doc.text(`Email:`, pageWidth / 2, margin + 80);
    doc.setFont("helvetica", "bold");
    const splitEmail = doc.splitTextToSize(r.assignedEmail || 'No registrado', (pageWidth / 2) - margin - 15);
    doc.text(splitEmail, (pageWidth / 2) + 12, margin + 80);

    // Datos de los equipos
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text('EQUIPOS ASIGNADOS EN RESGUARDO', margin, margin + 94);
    doc.line(margin, margin + 96, pageWidth - margin, margin + 96);

    // Tabla con los equipos resguardados
    const tableData = activeProductIds.map(id => {
      const prod = getProductDetails(id);
      return [
        prod?.inventoryNumber || '-',
        prod?.name || 'Desconocido',
        prod?.serialNumber || '-',
        prod?.description || '-'
      ];
    });

    autoTable(doc, {
      startY: margin + 100,
      head: [['No. Inv', 'Equipo', 'Serie', 'Descripción']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 43, 94], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: margin, right: margin }
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Estado actual: ${r.status}`, margin, currentY);
    currentY += 10;

    if (r.notes) {
      doc.setFont("helvetica", "bold");
      doc.text('Notas adicionales:', margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const splitNotes = doc.splitTextToSize(r.notes, pageWidth - (margin * 2));
      doc.text(splitNotes, margin, currentY + 6);
      currentY += (splitNotes.length * 5) + 12;
    } else {
      currentY += 5;
    }

    // Leyenda de compromiso
    const disclaimer = "ME COMPROMETO AL CUIDADO Y BUEN USO DE LOS EQUIPOS QUE SE ME HAN PROPORCIONADO, DE SU ESTADO Y GUARDA, DURANTE EL PERIODO QUE ESTÉN A MI RESGUARDO. EN EL CASO DE PÉRDIDA, DAÑOS O EXTRAVÍO, ME RESPONSABILIZO A PAGAR LOS DAÑOS QUE ESTO GENERE DE FORMA ÍNTEGRA.";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);

    const splitDisclaimer = doc.splitTextToSize(disclaimer, pageWidth - (margin * 2) - 10);
    const disclaimerHeight = splitDisclaimer.length * 4;

    // Espacio requerido: leyenda + márgenes + firmas = ~70 unidades
    const spaceNeeded = disclaimerHeight + 15 + 40;

    // Si no cabe, nueva página
    if (currentY + spaceNeeded > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      currentY = margin + 10;
    } else {
      currentY += 10; // Simply add a fixed margin before the disclaimer instead of pushing it to the bottom
    }

    // Caja de la leyenda
    doc.setFillColor(245, 245, 245);
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, currentY, pageWidth - (margin * 2), disclaimerHeight + 10, 'FD');
    doc.setTextColor(50, 50, 50);
    doc.text(splitDisclaimer, margin + 5, currentY + 7);

    currentY += disclaimerHeight + 25;

    // FIRMAS
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);

    const signatureWidth = 60;
    const centerLeft = margin + (signatureWidth / 2);
    const centerRight = pageWidth - margin - (signatureWidth / 2);

    doc.setDrawColor(0, 0, 0);
    // Linea Recibe
    doc.line(margin, currentY, margin + signatureWidth, currentY);
    // Linea Entrega
    doc.line(pageWidth - margin - signatureWidth, currentY, pageWidth - margin, currentY);

    doc.setFont("helvetica", "bold");
    doc.text('RECIBE (Responsable)', centerLeft, currentY + 6, { align: 'center' });
    doc.text('ENTREGA (DGS)', centerRight, currentY + 6, { align: 'center' });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    // Recibe data
    doc.text(r.assignedTo, centerLeft, currentY + 12, { align: 'center' });
    const splitDept = doc.splitTextToSize(r.department, signatureWidth);
    doc.text(splitDept, centerLeft, currentY + 16, { align: 'center' });

    // Entrega data
    doc.text('Ing. Guillermo Vladimir Alvarez Ramirez', centerRight, currentY + 12, { align: 'center' });
    doc.text('Director General de Sistemas', centerRight, currentY + 16, { align: 'center' });

    const firstProductName = activeProductIds.length > 0 ? getProductName(activeProductIds[0]) : '';
    doc.save(`Resguardo_${r.assignedTo.replace(/\s+/g, '_')}_${firstProductName.replace(/\s+/g, '_')}${activeProductIds.length > 1 ? '_y_mas' : ''}.pdf`);
  };

  const generateLink = (r: Resguardo) => {
    const activeProductIds = (r.productIds && r.productIds.length > 0) ? r.productIds : (r.productId ? [r.productId] : []);
    const productNames = activeProductIds.map(id => getProductName(id)).join(', ');
    const confirmUrl = `${window.location.origin}?confirm_resguardo=${r.id}`;

    setGeneratedLink({
      url: confirmUrl,
      person: r.assignedTo,
      email: r.assignedEmail,
      products: productNames
    });
  };

  const handleSendEmail = async () => {
    if (!generatedLink || !generatedLink.email) return;
    
    if (!EMAIL_CONFIG.SERVICE_ID || !EMAIL_CONFIG.TEMPLATE_ID || !EMAIL_CONFIG.PUBLIC_KEY) {
      alert("Faltan las claves de configuración de EmailJS. Por favor, añádelas en src/lib/emailConfig.ts");
      return;
    }

    setIsSendingEmail(true);
    try {
      const templateParams = {
        to_email: generatedLink.email,
        to_name: generatedLink.person,
        equipos: generatedLink.products,
        link_confirmacion: generatedLink.url
      };

      await emailjs.send(
        EMAIL_CONFIG.SERVICE_ID,
        EMAIL_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAIL_CONFIG.PUBLIC_KEY
      );

      alert("¡Correo enviado exitosamente de forma automática!");
    } catch (error) {
      console.error("Error enviando correo:", error);
      alert("Hubo un error al enviar el correo. Revisa la consola para más detalles.");
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h2 className="page-title">Resguardos Fijos</h2>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          <ShieldPlus size={18} />
          Nuevo Resguardo
        </button>
      </div>

      <div className="table-container">
        <table className="crud-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Responsable</th>
              <th>Departamento</th>
              <th>Ubicación</th>
              <th>Fecha Asignación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {resguardos.map(r => (
              <tr key={r.id}>
                <td style={{ fontWeight: 500 }}>
                  {((r.productIds && r.productIds.length > 0) ? r.productIds : (r.productId ? [r.productId] : [])).map(id => getProductName(id)).join(', ')}
                </td>
                <td>{r.assignedTo}</td>
                <td>{r.department}</td>
                <td>{r.location}</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>
                  {new Date(r.assignmentDate).toLocaleDateString()}
                </td>
                <td>
                  <span className={`status-badge ${r.status === 'ACTIVO' ? 'in' : 'warning'}`} style={{ marginBottom: '4px', display: 'inline-block' }}>
                    {r.status}
                  </span>
                  {r.status === 'ACTIVO' && (
                    <div style={{ 
                      fontSize: '0.65rem', 
                      padding: '2px 6px', 
                      borderRadius: '10px', 
                      width: 'fit-content',
                      background: r.confirmationStatus === 'CONFIRMED' ? 'var(--color-success)' : 'var(--color-warning)',
                      color: r.confirmationStatus === 'CONFIRMED' ? 'white' : 'black',
                      fontWeight: 'bold',
                      marginTop: '4px'
                    }}>
                      {r.confirmationStatus === 'CONFIRMED' ? '✓ CONFIRMADO' : 'POR CONFIRMAR'}
                    </div>
                  )}
                </td>
                <td>
                  <div className="td-actions">
                    <button className="icon-btn edit" onClick={() => generatePDF(r)} title="Descargar PDF" style={{ color: 'var(--color-primary)' }}>
                      <FileText size={16} />
                    </button>
                    <button className="icon-btn" onClick={() => generateLink(r)} title="Generar Link de Confirmación">
                      <Mail size={16} />
                    </button>
                    <button className="icon-btn edit" onClick={() => handleOpenModal(r)} title="Editar">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-btn danger" onClick={() => handleDelete(r.id)} title="Eliminar">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {resguardos.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>No hay resguardos fijos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {
        isModalOpen && createPortal(
          <div className="modal-overlay">
            <div className="modal-content animate-fade-in">
              <div className="modal-header">
                <h3 className="section-title">{editingId ? 'Editar Resguardo' : 'Nuevo Resguardo'}</h3>
                <button className="icon-btn" onClick={handleCloseModal}><X size={20} /></button>
              </div>
              <form onSubmit={handleSave}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Equipo(s) a Resguardar {editingId ? '' : '(Haz clic para seleccionar o deseleccionar varios)'}</label>
                    <div style={{ 
                      background: 'var(--color-bg-base)', 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 'var(--radius-md)', 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      padding: '0.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.25rem'
                    }}>
                      {(() => {
                        const availableProducts = products.filter(p => {
                          if (editingId && formData.productIds.includes(p.id)) return true;
                          const isAssigned = resguardos.some(r => 
                            r.status === 'ACTIVO' && 
                            ((r.productIds && r.productIds.includes(p.id)) || r.productId === p.id) &&
                            r.id !== editingId
                          );
                          return !isAssigned;
                        });

                        if (availableProducts.length === 0) {
                           return <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>No hay equipos disponibles.</div>;
                        }

                        return availableProducts.map(p => {
                          const isSelected = formData.productIds.includes(p.id);
                          return (
                            <div 
                              key={p.id}
                              onClick={() => {
                                if (editingId) {
                                  setFormData({ ...formData, productIds: [p.id] });
                                } else {
                                  if (isSelected) {
                                    setFormData({ ...formData, productIds: formData.productIds.filter(id => id !== p.id) });
                                  } else {
                                    setFormData({ ...formData, productIds: [...formData.productIds, p.id] });
                                  }
                                }
                              }}
                              style={{
                                padding: '0.6rem 0.75rem',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                background: isSelected ? 'var(--color-primary)' : 'transparent',
                                color: isSelected ? 'white' : 'var(--color-text-primary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.2s',
                                border: '1px solid',
                                borderColor: isSelected ? 'var(--color-primary)' : 'transparent',
                                fontSize: '0.9rem'
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <span>{p.name} <span style={{opacity: 0.8, fontSize: '0.85em'}}>(Inv: {p.inventoryNumber || p.id.substring(0, 6)})</span></span>
                              {isSelected && <CheckCircle2 size={16} />}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Responsable</label>
                      <select
                        className="form-control"
                        required
                        value={formData.assignedTo}
                        onChange={e => {
                          const selectedPerson = persons.find(p => p.name === e.target.value);
                          if (selectedPerson) {
                            setFormData({
                              ...formData,
                              assignedTo: selectedPerson.name,
                              assignedEmail: selectedPerson.email || ''
                            });
                          } else {
                            setFormData({ ...formData, assignedTo: e.target.value });
                          }
                        }}
                        style={{ background: 'var(--color-bg-base)' }}
                      >
                        <option value="">Selecciona una persona...</option>
                        {persons.map(p => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Correo Electrónico</label>
                      <input type="email" className="form-control" value={formData.assignedEmail} onChange={e => setFormData({ ...formData, assignedEmail: e.target.value })} placeholder="Para confirmaciones" />
                    </div>
                    <div className="form-group">
                      <label>Departamento / Área</label>
                      <select
                        className="form-control"
                        required
                        value={formData.department}
                        onChange={e => {
                          // Al cambiar el departamento, resetear la ubicación
                          setFormData({ ...formData, department: e.target.value, location: '' });
                        }}
                        style={{ background: 'var(--color-bg-base)' }}
                      >
                        <option value="">Selecciona un departamento...</option>
                        {areas.map(a => (
                          <option key={a.id} value={a.name}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ubicación / Cubículo</label>
                      <select
                        className="form-control"
                        required
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        style={{ background: 'var(--color-bg-base)' }}
                        disabled={!formData.department}
                      >
                        <option value="">Selecciona una ubicación...</option>
                        {(() => {
                          const currentArea = areas.find(a => a.name === formData.department);
                          const currentLocations = currentArea?.locations || [];
                          // Allow keeping previously saved locations even if they don't exist in the new list, or display them
                          const allAvailable = new Set(currentLocations);
                          if (formData.location && !allAvailable.has(formData.location)) {
                            return (
                              <>
                                <option value={formData.location}>{formData.location} (Actual)</option>
                                {currentLocations.map((loc, idx) => (
                                  <option key={idx} value={loc}>{loc}</option>
                                ))}
                              </>
                            );
                          }

                          return currentLocations.map((loc, idx) => (
                            <option key={idx} value={loc}>{loc}</option>
                          ));
                        })()}
                      </select>
                    </div>
                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                      <label>Estado</label>
                      <select className="form-control" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as 'ACTIVO' | 'DEVUELTO' })} style={{ background: 'var(--color-bg-base)' }}>
                        <option value="ACTIVO">ACTIVO</option>
                        <option value="DEVUELTO">DEVUELTO</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notas adicionales</label>
                    <textarea className="form-control" rows={2} value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })}></textarea>
                  </div>
                </div>
                <div className="form-actions" style={{ marginTop: '2rem' }}>
                  <button type="button" className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} onClick={handleCloseModal}>Cancelar</button>
                  <button type="submit" className="btn-primary">{editingId ? 'Guardar Cambios' : 'Asignar Resguardo'}</button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      }

      {generatedLink && createPortal(
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in" style={{ maxWidth: '500px' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--color-border)' }}>
              <h3 className="section-title text-success">Generar Enlace de Aceptación</h3>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <p style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                Se ha generado el enlace de confirmación para <strong>{generatedLink.person}</strong>. Puedes copiarlo y enviárselo por WhatsApp, correo u otro medio:
              </p>
              
              <div style={{ background: 'var(--color-bg-base)', padding: '1rem', borderRadius: '4px', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem' }}><strong>Equipos Asignados:</strong> {generatedLink.products}</p>
              </div>

              <div style={{ background: 'var(--color-bg-base)', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--color-border)', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                {generatedLink.url}
              </div>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button 
                  className="btn-primary" 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedLink.url);
                    alert('¡Enlace copiado al portapapeles!');
                  }}
                  style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}
                >
                  Copiar Enlace
                </button>
                {generatedLink.email && (
                  <button 
                    className="btn-primary" 
                    onClick={handleSendEmail}
                    disabled={isSendingEmail}
                    style={{ flex: 1, minWidth: '150px', justifyContent: 'center', background: 'var(--color-success)', opacity: isSendingEmail ? 0.7 : 1 }}
                  >
                    <Mail size={18} style={{ marginRight: '8px' }} />
                    {isSendingEmail ? 'Enviando...' : 'Enviar a Firma Automático'}
                  </button>
                )}
                <button className="btn-secondary" onClick={() => setGeneratedLink(null)} style={{ flex: 1, minWidth: '150px', justifyContent: 'center' }}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div >
  );
}
