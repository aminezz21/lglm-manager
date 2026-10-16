export interface User {
  id: string;
  username: string;
  role: 'admin' | 'collaborator';
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  registration: string; // Immatriculation
  color: string;
  mileage: number; // Kilométrage actuel
  lastVidangeMileage?: number; // Kilométrage lors de la dernière vidange
  pricePerDay: number; // Prix par jour
  status: 'Disponible' | 'Louée';
  image?: string;
  transmission?: 'Manuelle' | 'Automatique';
}

export interface Client {
  id: string;
  fullName: string;
  idCard: string; // CIN / Passeport
  phone: string;
  address: string;
  email: string;
  nationality?: string; // Nationalité
  drivingLicense?: string; // Permis de conduire
  licenseIssueDate?: string; // Date de délivrance du permis
}

export interface Reservation {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientNationality?: string;
  clientDrivingLicense?: string;
  clientLicenseIssueDate?: string;
  secondDriverName?: string;
  secondDriverIdCard?: string;
  secondDriverPhone?: string;
  carId: string;
  carBrandModel: string;
  carRegistration: string;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  totalAmount: number;
  advancePaid: number;
  remainingAmount: number;
  deposit: number; // Caution
  startMileage?: number; // Kilométrage Aller (Départ)
  returnMileage?: number; // Kilométrage Retour
  status: 'Réservation En attente' | 'Réservation Confirmée' | 'Location En cours' | 'Terminée' | 'Annulée';
  createdAt: string;
  hasContract?: boolean;
  hasInvoice?: boolean;
}

export interface CollaboratorPayment {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  carId: string;
  carBrandModel: string;
  carRegistration: string;
  paymentDate: string;
  amount: number;
  month: string; // e.g., "Janvier"
  year: number;
  observations: string;
}

export interface Collaborator {
  id: string;
  fullName: string;
  phone: string;
  assignedCarId: string; // ID of the car they use
  assignedCarBrandModel: string;
  assignedCarRegistration: string;
  observations: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Carburant' | 'Entretien' | 'Assurance' | 'Impôts' | 'Salaire' | 'Autre';
}

export interface Invoice {
  id: string; // Auto-numbered, e.g. "FACT-2026-0001"
  reservationId: string;
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  carBrandModel: string;
  carRegistration: string;
  startDate: string;
  endDate: string;
  days: number;
  pricePerDay: number;
  hasTVA: boolean;
  tvaRate: number; // e.g. 20
  amountHT: number;
  amountTVA: number;
  amountTTC: number;
  createdAt: string;
  type?: 'Facture' | 'Devis';
  matriculeFiscal?: string;
  docDate?: string;
  description?: string;
  carType?: string;
}

export interface AppSettings {
  companyName: string;
  logoUrl?: string;
  address: string;
  phone: string;
  whatsApp: string;
  email: string;
  signatureText: string;
  tvaRate: number; // default percentage, e.g. 20
}

export interface RevenueRecord {
  id: string;
  date: string;
  amount: number;
  type: 'Location' | 'Autre';
  description: string;
}
