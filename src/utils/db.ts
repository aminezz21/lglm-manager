import { Car, Client, Reservation, Invoice, Collaborator, CollaboratorPayment, Expense, AppSettings, RevenueRecord } from '../types';
import { validateImportedDatabase, logSecurityEvent } from './security';

// Pre-populated default state to prevent empty app locks
const DEFAULT_SETTINGS: AppSettings = {
  companyName: "LGLM Rent A Car",
  address: "Casablanca, Maroc",
  phone: "+212 600-000000",
  whatsApp: "+212 600-000000",
  email: "contact@lglm-rentacar.com",
  signatureText: "LGLM Rent A Car - S.A.R.L",
  tvaRate: 20,
};

const DEFAULT_CARS: Car[] = [];
const DEFAULT_CLIENTS: Client[] = [];
const DEFAULT_RESERVATIONS: Reservation[] = [];
const DEFAULT_INVOICES: Invoice[] = [];
const DEFAULT_COLLABORATORS: Collaborator[] = [];
const DEFAULT_PAYMENTS: CollaboratorPayment[] = [];
const DEFAULT_EXPENSES: Expense[] = [];
const DEFAULT_REVENUES: RevenueRecord[] = [];

// Sync state to Electron disk storage if available
function persistToDisk(): void {
  if (typeof window !== 'undefined' && (window as any).electronAPI?.writeDb) {
    try {
      const data = {
        settings: DBManager.getSettings(),
        cars: DBManager.getCars(),
        clients: DBManager.getClients(),
        reservations: DBManager.getReservations(),
        invoices: DBManager.getInvoices(),
        collaborators: DBManager.getCollaborators(),
        payments: DBManager.getPayments(),
        expenses: DBManager.getExpenses(),
        revenues: DBManager.getRevenues()
      };
      (window as any).electronAPI.writeDb(data);
    } catch (e) {
      console.error("Failed writing DB to electron disk storage:", e);
    }
  }
}

// Helper to initialize local storage tables safely
function getTable<T>(key: string, defaultVal: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing table ${key}`, e);
    return defaultVal;
  }
}

function saveTable<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
  persistToDisk();
}

export class DBManager {
  // Initialize storage from Electron disk if available on startup
  static async initAsync(): Promise<void> {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.readDb) {
      try {
        const diskData = await (window as any).electronAPI.readDb();
        if (diskData) {
          if (diskData.settings) localStorage.setItem('lglm_settings', JSON.stringify(diskData.settings));
          if (diskData.cars) localStorage.setItem('lglm_cars', JSON.stringify(diskData.cars));
          if (diskData.clients) localStorage.setItem('lglm_clients', JSON.stringify(diskData.clients));
          if (diskData.reservations) localStorage.setItem('lglm_reservations', JSON.stringify(diskData.reservations));
          if (diskData.invoices) localStorage.setItem('lglm_invoices', JSON.stringify(diskData.invoices));
          if (diskData.collaborators) localStorage.setItem('lglm_collaborators', JSON.stringify(diskData.collaborators));
          if (diskData.payments) localStorage.setItem('lglm_payments', JSON.stringify(diskData.payments));
          if (diskData.expenses) localStorage.setItem('lglm_expenses', JSON.stringify(diskData.expenses));
          if (diskData.revenues) localStorage.setItem('lglm_revenues', JSON.stringify(diskData.revenues));
        }
      } catch (e) {
        console.error("Error loading disk storage in Electron:", e);
      }
    }
  }

  // Read operations
  static getSettings(): AppSettings {
    const data = localStorage.getItem('lglm_settings');
    if (!data) {
      localStorage.setItem('lglm_settings', JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: AppSettings): void {
    localStorage.setItem('lglm_settings', JSON.stringify(settings));
    persistToDisk();
  }

  static getCars(): Car[] {
    return getTable<Car>('lglm_cars', DEFAULT_CARS);
  }

  static saveCars(cars: Car[]): void {
    saveTable<Car>('lglm_cars', cars);
  }

  static getClients(): Client[] {
    return getTable<Client>('lglm_clients', DEFAULT_CLIENTS);
  }

  static saveClients(clients: Client[]): void {
    saveTable<Client>('lglm_clients', clients);
  }

  static getReservations(): Reservation[] {
    return getTable<Reservation>('lglm_reservations', DEFAULT_RESERVATIONS);
  }

  static saveReservations(reservations: Reservation[]): void {
    saveTable<Reservation>('lglm_reservations', reservations);
  }

  static getInvoices(): Invoice[] {
    return getTable<Invoice>('lglm_invoices', DEFAULT_INVOICES);
  }

  static saveInvoices(invoices: Invoice[]): void {
    saveTable<Invoice>('lglm_invoices', invoices);
  }

  static getCollaborators(): Collaborator[] {
    return getTable<Collaborator>('lglm_collaborators', DEFAULT_COLLABORATORS);
  }

  static saveCollaborators(collaborators: Collaborator[]): void {
    saveTable<Collaborator>('lglm_collaborators', collaborators);
  }

  static getPayments(): CollaboratorPayment[] {
    return getTable<CollaboratorPayment>('lglm_payments', DEFAULT_PAYMENTS);
  }

  static savePayments(payments: CollaboratorPayment[]): void {
    saveTable<CollaboratorPayment>('lglm_payments', payments);
  }

  static getExpenses(): Expense[] {
    return getTable<Expense>('lglm_expenses', DEFAULT_EXPENSES);
  }

  static saveExpenses(expenses: Expense[]): void {
    saveTable<Expense>('lglm_expenses', expenses);
  }

  static getRevenues(): RevenueRecord[] {
    return getTable<RevenueRecord>('lglm_revenues', DEFAULT_REVENUES);
  }

  static saveRevenues(revenues: RevenueRecord[]): void {
    saveTable<RevenueRecord>('lglm_revenues', revenues);
  }

  // Relations & CRUD business helpers
  static createReservation(reservation: Omit<Reservation, 'id' | 'createdAt'>, clientInfo: Omit<Client, 'id'>): Reservation {
    const reservations = this.getReservations();
    const clients = this.getClients();
    const cars = this.getCars();
    const revenues = this.getRevenues();

    // 1. Save or Update Client
    let client = clients.find(c => c.idCard.toLowerCase() === clientInfo.idCard.toLowerCase());
    if (!client) {
      client = {
        ...clientInfo,
        id: `client-${Date.now()}`
      };
      clients.push(client);
      this.saveClients(clients);
    } else {
      // Update info
      client.fullName = clientInfo.fullName;
      client.phone = clientInfo.phone;
      client.address = clientInfo.address;
      client.email = clientInfo.email;
      client.nationality = clientInfo.nationality;
      client.drivingLicense = clientInfo.drivingLicense;
      client.licenseIssueDate = clientInfo.licenseIssueDate;
      this.saveClients(clients);
    }

    // 2. Generate unique reservation number
    const year = new Date().getFullYear();
    const count = reservations.filter(r => r.id.startsWith(`RES-${year}`)).length + 1;
    const resId = `RES-${year}-${String(count).padStart(4, '0')}`;

    const newReservation: Reservation = {
      ...reservation,
      id: resId,
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      clientNationality: client.nationality,
      clientDrivingLicense: client.drivingLicense,
      clientLicenseIssueDate: client.licenseIssueDate,
      createdAt: new Date().toISOString()
    };

    reservations.unshift(newReservation);
    this.saveReservations(reservations);

    // 3. Mark car as Louée and update car mileage if startMileage provided
    const updatedCars = cars.map(c => {
      if (c.id === reservation.carId) {
        const newKm = (reservation.startMileage !== undefined && reservation.startMileage > c.mileage)
          ? reservation.startMileage
          : c.mileage;
        return { ...c, status: 'Louée' as const, mileage: newKm };
      }
      return c;
    });
    this.saveCars(updatedCars);

    // 4. Record advance as revenue
    if (reservation.advancePaid > 0) {
      const newRevenue: RevenueRecord = {
        id: `rev-${Date.now()}`,
        date: reservation.startDate,
        amount: reservation.advancePaid,
        type: 'Location',
        description: `Avance Location ${reservation.carBrandModel} - ${resId} (${client.fullName})`
      };
      revenues.push(newRevenue);
      this.saveRevenues(revenues);
    }

    return newReservation;
  }

  static returnCar(reservationId: string, remainingPaid: number, returnMileage?: number): void {
    const reservations = this.getReservations();
    const cars = this.getCars();
    const revenues = this.getRevenues();

    const reservationIndex = reservations.findIndex(r => r.id === reservationId);
    if (reservationIndex === -1) return;

    const reservation = reservations[reservationIndex];
    reservation.status = 'Terminée';
    if (returnMileage !== undefined && returnMileage !== null) {
      reservation.returnMileage = returnMileage;
    }
    
    if (remainingPaid > 0) {
      reservation.advancePaid += remainingPaid;
      reservation.remainingAmount = Math.max(0, reservation.totalAmount - reservation.advancePaid);

      // Record remaining revenue
      const newRevenue: RevenueRecord = {
        id: `rev-rem-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: remainingPaid,
        type: 'Location',
        description: `Solde Location ${reservation.carBrandModel} - ${reservationId} (${reservation.clientName})`
      };
      revenues.push(newRevenue);
      this.saveRevenues(revenues);
    }

    reservations[reservationIndex] = reservation;
    this.saveReservations(reservations);

    // Free the car & update its mileage if returnMileage provided
    const updatedCars = cars.map(c => {
      if (c.id === reservation.carId) {
        const newMileage = (returnMileage !== undefined && returnMileage > c.mileage) ? returnMileage : c.mileage;
        return { ...c, status: 'Disponible' as const, mileage: newMileage };
      }
      return c;
    });
    this.saveCars(updatedCars);
  }

  static performVidange(carId: string, currentMileage?: number): void {
    const cars = this.getCars();
    const updatedCars = cars.map(c => {
      if (c.id === carId) {
        const vidangeKm = currentMileage !== undefined ? currentMileage : c.mileage;
        return { ...c, mileage: Math.max(c.mileage, vidangeKm), lastVidangeMileage: vidangeKm };
      }
      return c;
    });
    this.saveCars(updatedCars);
  }

  static deleteReservation(reservationId: string): void {
    const reservations = this.getReservations();
    const cars = this.getCars();
    const revenues = this.getRevenues();
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) return;

    // Remove reservation
    const updatedReservations = reservations.filter(r => r.id !== reservationId);
    this.saveReservations(updatedReservations);

    // Remove all associated revenue records
    const updatedRevenues = revenues.filter(r => !r.description.includes(reservationId));
    this.saveRevenues(updatedRevenues);

    // Free the car if no other active reservation
    const hasOtherActive = updatedReservations.some(r => r.carId === reservation.carId && r.status === 'Location En cours');
    if (!hasOtherActive) {
      const updatedCars = cars.map(c => {
        if (c.id === reservation.carId) return { ...c, status: 'Disponible' as const };
        return c;
      });
      this.saveCars(updatedCars);
    }
  }

  static updateReservationStatus(reservationId: string, newStatus: Reservation['status']): void {
    const reservations = this.getReservations();
    const cars = this.getCars();
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return;

    const reservation = { ...reservations[index], status: newStatus };
    reservations[index] = reservation;
    this.saveReservations(reservations);

    const carId = reservation.carId;
    if (newStatus === 'Location En cours') {
      const updatedCars = cars.map(c => c.id === carId ? { ...c, status: 'Louée' as const } : c);
      this.saveCars(updatedCars);
    } else {
      const hasOtherActive = reservations.some(r => r.id !== reservationId && r.carId === carId && r.status === 'Location En cours');
      if (!hasOtherActive) {
        const updatedCars = cars.map(c => c.id === carId ? { ...c, status: 'Disponible' as const } : c);
        this.saveCars(updatedCars);
      }
    }
  }

  static confirmPayment(reservationId: string, amountPaid: number): void {
    const reservations = this.getReservations();
    const revenues = this.getRevenues();

    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return;

    const reservation = reservations[index];
    reservation.advancePaid += amountPaid;
    reservation.remainingAmount = Math.max(0, reservation.totalAmount - reservation.advancePaid);

    reservations[index] = reservation;
    this.saveReservations(reservations);

    // Record the payment as revenue
    if (amountPaid > 0) {
      const newRevenue: RevenueRecord = {
        id: `rev-pay-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: amountPaid,
        type: 'Location',
        description: `Paiement ${reservation.carBrandModel} - ${reservationId} (${reservation.clientName})`
      };
      revenues.push(newRevenue);
      this.saveRevenues(revenues);
    }
  }

  static updateFullReservation(
    reservationId: string,
    reservationData: Omit<Reservation, 'id' | 'createdAt'>,
    clientInfo: Omit<Client, 'id'>
  ): Reservation | null {
    const reservations = this.getReservations();
    const clients = this.getClients();
    const cars = this.getCars();

    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return null;

    const existingRes = reservations[index];

    // 1. Save or Update Client
    let client = clients.find(c => c.id === existingRes.clientId || c.idCard.toLowerCase() === clientInfo.idCard.toLowerCase());
    if (!client) {
      client = {
        ...clientInfo,
        id: `client-${Date.now()}`
      };
      clients.push(client);
    } else {
      client.fullName = clientInfo.fullName;
      client.phone = clientInfo.phone;
      client.address = clientInfo.address;
      client.email = clientInfo.email;
      client.nationality = clientInfo.nationality;
      client.drivingLicense = clientInfo.drivingLicense;
      client.licenseIssueDate = clientInfo.licenseIssueDate;
    }
    this.saveClients(clients);

    // 2. Update Reservation keeping the same ID
    const updatedReservation: Reservation = {
      ...reservationData,
      id: reservationId,
      createdAt: existingRes.createdAt,
      clientId: client.id,
      clientName: client.fullName,
      clientPhone: client.phone,
      clientNationality: client.nationality,
      clientDrivingLicense: client.drivingLicense,
      clientLicenseIssueDate: client.licenseIssueDate,
    };

    reservations[index] = updatedReservation;
    this.saveReservations(reservations);

    // 3. Update Car status if car changed
    if (existingRes.carId !== reservationData.carId) {
      const hasOtherActive = reservations.some(r => r.id !== reservationId && r.carId === existingRes.carId && r.status === 'Location En cours');
      const updatedCars = cars.map(c => {
        if (c.id === existingRes.carId && !hasOtherActive) return { ...c, status: 'Disponible' as const };
        if (c.id === reservationData.carId) return { ...c, status: 'Louée' as const };
        return c;
      });
      this.saveCars(updatedCars);
    }

    return updatedReservation;
  }

  static updateReservation(
    reservationId: string,
    updates: {
      endDate: string;
      pricePerDay: number;
      deposit: number;
      notes?: string;
    }
  ): Reservation | null {
    const reservations = this.getReservations();
    const revenues = this.getRevenues();
    const index = reservations.findIndex(r => r.id === reservationId);
    if (index === -1) return null;

    const reservation = { ...reservations[index] };
    const previousTotal = reservation.totalAmount;

    // Recalculate duration
    const start = new Date(reservation.startDate);
    const end = new Date(updates.endDate);
    const diffTime = end.getTime() - start.getTime();
    const newDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const newTotal = newDays * updates.pricePerDay;
    const newRemaining = Math.max(0, newTotal - reservation.advancePaid);

    reservation.endDate = updates.endDate;
    reservation.pricePerDay = updates.pricePerDay;
    reservation.deposit = updates.deposit;
    reservation.days = newDays;
    reservation.totalAmount = newTotal;
    reservation.remainingAmount = newRemaining;

    reservations[index] = reservation;
    this.saveReservations(reservations);

    // If total increased due to prolongation, record difference as revenue note
    const difference = newTotal - previousTotal;
    if (difference > 0) {
      const newRevenue: RevenueRecord = {
        id: `rev-ext-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        type: 'Location',
        description: `Prolongation ${reservation.carBrandModel} - ${reservationId} (+${difference.toLocaleString('fr-TN')} DT - ${reservation.clientName})`
      };
      revenues.push(newRevenue);
      this.saveRevenues(revenues);
    }

    return reservation;
  }

  static createInvoiceFromReservation(reservationId: string, hasTVA: boolean): Invoice {
    const reservations = this.getReservations();
    const invoices = this.getInvoices();
    const settings = this.getSettings();
    const clients = this.getClients();

    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) throw new Error("Réservation non trouvée");

    const client = clients.find(c => c.id === reservation.clientId);

    // Unique invoice number
    const year = new Date().getFullYear();
    const count = invoices.filter(i => i.id.startsWith(`FACT-${year}`)).length + 1;
    const invoiceId = `FACT-${year}-${String(count).padStart(4, '0')}`;

    // Calculations
    const totalTTC = reservation.totalAmount;
    let amountHT = totalTTC;
    let amountTVA = 0;
    const tvaRate = settings.tvaRate;

    if (hasTVA) {
      amountHT = totalTTC / (1 + tvaRate / 100);
      amountTVA = totalTTC - amountHT;
    }

    const newInvoice: Invoice = {
      id: invoiceId,
      reservationId: reservation.id,
      clientName: reservation.clientName,
      clientPhone: reservation.clientPhone,
      clientAddress: client ? client.address : "",
      carBrandModel: reservation.carBrandModel,
      carRegistration: reservation.carRegistration,
      startDate: reservation.startDate,
      endDate: reservation.endDate,
      days: reservation.days,
      pricePerDay: reservation.pricePerDay,
      hasTVA,
      tvaRate,
      amountHT: Number(amountHT.toFixed(2)),
      amountTVA: Number(amountTVA.toFixed(2)),
      amountTTC: totalTTC,
      createdAt: new Date().toISOString(),
    };

    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);

    // Update reservation hasInvoice status
    const updatedReservations = reservations.map(r => {
      if (r.id === reservationId) {
        return { ...r, hasInvoice: true };
      }
      return r;
    });
    this.saveReservations(updatedReservations);

    return newInvoice;
  }

  // Backup & Restore
  static exportDatabase(): string {
    const data = {
      settings: this.getSettings(),
      cars: this.getCars(),
      clients: this.getClients(),
      reservations: this.getReservations(),
      invoices: this.getInvoices(),
      collaborators: this.getCollaborators(),
      payments: this.getPayments(),
      expenses: this.getExpenses(),
      revenues: this.getRevenues()
    };
    return JSON.stringify(data, null, 2);
  }

  static importDatabase(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);
      
      // Validation de sécurité avant import
      const validation = validateImportedDatabase(data);
      if (!validation.valid) {
        const errMsg = `Import refusé : ${validation.errors.join(', ')}`;
        logSecurityEvent('IMPORT_BLOCKED', errMsg);
        console.error(errMsg);
        return false;
      }

      if (data.settings) localStorage.setItem('lglm_settings', JSON.stringify(data.settings));
      if (data.cars) localStorage.setItem('lglm_cars', JSON.stringify(data.cars));
      if (data.clients) localStorage.setItem('lglm_clients', JSON.stringify(data.clients));
      if (data.reservations) localStorage.setItem('lglm_reservations', JSON.stringify(data.reservations));
      if (data.invoices) localStorage.setItem('lglm_invoices', JSON.stringify(data.invoices));
      if (data.collaborators) localStorage.setItem('lglm_collaborators', JSON.stringify(data.collaborators));
      if (data.payments) localStorage.setItem('lglm_payments', JSON.stringify(data.payments));
      if (data.expenses) localStorage.setItem('lglm_expenses', JSON.stringify(data.expenses));
      if (data.revenues) localStorage.setItem('lglm_revenues', JSON.stringify(data.revenues));
      persistToDisk();
      logSecurityEvent('IMPORT_SUCCESS', `Base de données importée avec succès`);
      return true;
    } catch (e) {
      logSecurityEvent('IMPORT_ERROR', String(e));
      console.error("Error importing database", e);
      return false;
    }
  }

  static resetDatabase(): void {
    localStorage.removeItem('lglm_settings');
    localStorage.removeItem('lglm_cars');
    localStorage.removeItem('lglm_clients');
    localStorage.removeItem('lglm_reservations');
    localStorage.removeItem('lglm_invoices');
    localStorage.removeItem('lglm_collaborators');
    localStorage.removeItem('lglm_payments');
    localStorage.removeItem('lglm_expenses');
    localStorage.removeItem('lglm_revenues');
    persistToDisk();
  }
}
