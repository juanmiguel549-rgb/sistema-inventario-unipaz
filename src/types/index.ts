export type Role = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email?: string;
  password?: string;
  name: string;
  role: Role;
  isActive: boolean;
}

export interface Product {
  id: string;
  inventoryNumber: string; // No. Inventario
  name: string; // Nombre del Equipo
  serialNumber: string; // No. Serie
  description: string; // Descripción
  condition: string; // Estado (Nuevo, Bueno, Malo, etc.)
  type: string; // Tipo
  model: string; // Modelo
  stock: number; // Cantidad disponible referencial (Por defecto puede ser 1)
  lastUpdated: string;
}

export interface Person {
  id: string;
  name: string;
  email: string;
}

export interface Invoice {
  id: string;
  title: string;
  uploadDate: string;
  fileName: string;
  fileBase64: string;
  notes?: string;
}

export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  productId: string;
  type: TransactionType;
  quantity: number;
  date: string;
  note?: string;
  assignedTo?: string;
}

export interface Resguardo {
  id: string;
  productIds: string[]; // Updated for multiple products
  productId?: string; // Legacy support
  assignedTo: string;
  assignedEmail?: string;
  department: string;
  location: string;
  assignmentDate: string;
  status: 'ACTIVO' | 'DEVUELTO';
  confirmationStatus?: 'PENDING' | 'CONFIRMED';
  notes?: string;
}

export type TemporaryAction = 'CHECKOUT' | 'CHECKIN';

export interface TemporaryEquipment {
  id: string;
  productId: string;
  action: 'CHECKOUT' | 'CHECKIN';
  quantity: number;
  personName: string;
  personEmail?: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  date: string;
  status: 'PENDING' | 'COMPLETED';
  loanStatus?: 'PENDING_CONFIRMATION' | 'CONFIRMED';
  notes?: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalResguardos: number;
  totalTransactions: number;
}

export interface Area {
  id: string;
  name: string;
  locations: string[];
}
