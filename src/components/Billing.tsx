import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Printer, 
  Download, 
  CheckCircle, 
  Sparkles,
  Plus,
  History,
  Check,
  Trash2,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { Reservation, Invoice, AppSettings } from '../types';
import { DBManager } from '../utils/db';
import { formatLegalAmountInWords } from '../utils/numberToWords';

interface BillingProps {
  reservations: Reservation[];
  invoices: Invoice[];
  onInvoiceCreated: (updatedInvoices: Invoice[]) => void;
  settings: AppSettings;
  preselectedResId?: string; // Passed when clicked "Facturer" from reservations list
}

export default function Billing({ reservations, invoices, onInvoiceCreated, settings, preselectedResId = '' }: BillingProps) {
  const [activeTab, setActiveTab] = useState<'contrat' | 'libre' | 'historique'>('contrat');
  
  // Tab 1: Contract Billing state
  const [selectedResId, setSelectedResId] = useState(preselectedResId);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [hasTVA, setHasTVA] = useState(true);
  
  // Tab 2: Free Creation (Manual Document) state
  const [docType, setDocType] = useState<'Facture' | 'Devis'>('Facture');
  const [clientName, setClientName] = useState('');
  const [matriculeFiscal, setMatriculeFiscal] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [docDate, setDocDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  
  const [clientIdCard, setClientIdCard] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [carRegistration, setCarRegistration] = useState('');
  const [carType, setCarType] = useState(''); // SUV, 4*4, etc.
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [pricePerDay, setPricePerDay] = useState<number>(300);
  const [customDays, setCustomDays] = useState<number | null>(null);
  const [customTotal, setCustomTotal] = useState<number | null>(null);
  const [manualHasTVA, setManualHasTVA] = useState(true);
  const [manualDocNumber, setManualDocNumber] = useState('');

  // Tab 3: History state
  const [searchQuery, setSearchQuery] = useState('');

  // General Invoice preview & messaging state
  const [currentInvoice, setCurrentInvoice] = useState<Invoice | null>(null);
  const [successMsg, setSuccessMsg] = useState(false);
  const [successText, setSuccessText] = useState('');

  // In-Place Invoice Editing State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Invoice | null>(null);

  // If a preselected ID is passed, load it automatically
  useEffect(() => {
    if (preselectedResId) {
      setSelectedResId(preselectedResId);
      setActiveTab('contrat');
    }
  }, [preselectedResId]);

  // Load selected reservation details for Tab 1
  useEffect(() => {
    if (selectedResId && activeTab === 'contrat') {
      const res = reservations.find(r => r.id === selectedResId);
      if (res) {
        setSelectedReservation(res);
        
        // Check if invoice already exists for this reservation
        const existingInvoice = invoices.find(i => i.reservationId === selectedResId);
        if (existingInvoice) {
          setCurrentInvoice(existingInvoice);
        } else {
          setCurrentInvoice(null);
        }
      }
    } else if (activeTab === 'contrat') {
      setSelectedReservation(null);
      setCurrentInvoice(null);
    }
  }, [selectedResId, reservations, invoices, activeTab]);

  // Helper: Format datetime strings nicely (e.g. '04/07/2026 10:30')
  const formatDateTime = (dtStr: string) => {
    if (!dtStr) return '';
    if (dtStr.includes('T')) {
      const [date, time] = dtStr.split('T');
      const parts = date.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]} ${time}`;
      }
      return dtStr.replace('T', ' ');
    }
    const parts = dtStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dtStr;
  };

  // Helper: Calculate days between dates
  const calculateDays = (start: string, end: string) => {
    if (!start || !end) return 1;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = eDate.getTime() - sDate.getTime();
    if (isNaN(diffTime)) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  const computedDays = calculateDays(startDate, endDate);
  const finalDays = customDays !== null ? customDays : computedDays;
  const calculatedTotal = finalDays * pricePerDay;
  const totalAmount = customTotal !== null ? customTotal : calculatedTotal;

  // Reset overrides when dates manually change
  useEffect(() => {
    setCustomDays(null);
    setCustomTotal(null);
  }, [startDate, endDate]);

  // Generate standard Invoice from Reservation
  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResId || !selectedReservation) return;

    try {
      const newInvoice = DBManager.createInvoiceFromReservation(selectedResId, hasTVA);
      onInvoiceCreated(DBManager.getInvoices());
      setCurrentInvoice(newInvoice);
      setIsEditing(false);
      setEditForm(null);
      setSuccessText("Facture contractuelle générée avec succès !");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err: any) {
      alert("Erreur lors de la génération de la facture: " + err.message);
    }
  };

  // Generate auto-suggested document number
  const generateAutoDocNumber = (type: 'Facture' | 'Devis') => {
    const year = new Date().getFullYear();
    if (type === 'Facture') {
      const count = invoices.filter(i => (i.type === 'Facture' || !i.type) && i.id.startsWith(`FACT-${year}`)).length + 1;
      return `FACT-${year}-${String(count).padStart(4, '0')}`;
    } else {
      const count = invoices.filter(i => i.type === 'Devis' && i.id.startsWith(`DEV-${year}`)).length + 1;
      return `DEV-${year}-${String(count).padStart(4, '0')}`;
    }
  };

  // Generate custom Invoice or Devis manually (all fields are completely optional)
  const handleGenerateCustomDocument = (e: React.FormEvent) => {
    e.preventDefault();

    // Use manually entered number or fall back to auto-generated
    const docId = manualDocNumber.trim() || generateAutoDocNumber(docType);
    
    // Check for duplicate ID
    if (invoices.some(i => i.id === docId)) {
      if (!window.confirm(`Le numéro "${docId}" existe déjà dans l'historique.\n\nVoulez-vous continuer quand même ?`)) return;
    }

    const amountTTC = totalAmount;
    let amountHT = amountTTC;
    let amountTVA = 0;
    
    if (manualHasTVA) {
      amountHT = amountTTC / (1 + settings.tvaRate / 100);
      amountTVA = amountTTC - amountHT;
    }

    const finalClientName = clientName.trim() || 'Client de passage';

    const newDoc: Invoice = {
      id: docId,
      reservationId: 'LIBRE', // Marks it as a custom/manual invoice
      clientName: finalClientName,
      clientPhone: clientPhone || 'N/A',
      clientAddress: clientAddress || 'N/A',
      carBrandModel: `${carBrand} ${carModel}`.trim() || 'Véhicule Non Spécifié',
      carRegistration: carRegistration || 'N/A',
      startDate,
      endDate,
      days: finalDays,
      pricePerDay,
      hasTVA: manualHasTVA,
      tvaRate: settings.tvaRate,
      amountHT: Number(amountHT.toFixed(2)),
      amountTVA: Number(amountTVA.toFixed(2)),
      amountTTC: amountTTC,
      createdAt: new Date().toISOString(),
      type: docType,
      matriculeFiscal: matriculeFiscal.trim() || undefined,
      docDate: docDate || undefined,
      description: description.trim() || undefined,
      carType: carType.trim() || undefined
    };

    const updatedInvoices = [newDoc, ...invoices];
    DBManager.saveInvoices(updatedInvoices);
    onInvoiceCreated(updatedInvoices);
    setCurrentInvoice(newDoc);
    setIsEditing(false);
    setEditForm(null);
    setSuccessText(`${docType === 'Devis' ? 'Devis' : 'Facture libre'} enregistré avec succès !`);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
    
    // Clear custom form fields after success
    setClientName('');
    setMatriculeFiscal('');
    setClientAddress('');
    setDocDate(new Date().toISOString().split('T')[0]);
    setDescription('');
    setClientIdCard('');
    setClientPhone('');
    setClientEmail('');
    setCarBrand('');
    setCarModel('');
    setCarRegistration('');
    setCarType('');
    setCustomTotal(null);
    setManualDocNumber('');
  };

  const handlePrint = () => {
    window.print();
  };

  // Start in-place editing of invoice
  const handleStartEdit = (invoiceToEdit: Invoice) => {
    setCurrentInvoice(invoiceToEdit);
    setEditForm({
      ...invoiceToEdit,
      type: invoiceToEdit.type === 'Devis' ? 'Devis' : 'Facture',
      clientName: invoiceToEdit.clientName || '',
      matriculeFiscal: invoiceToEdit.matriculeFiscal || '',
      clientAddress: invoiceToEdit.clientAddress === 'N/A' ? '' : (invoiceToEdit.clientAddress || ''),
      clientPhone: invoiceToEdit.clientPhone === 'N/A' ? '' : (invoiceToEdit.clientPhone || ''),
      carBrandModel: invoiceToEdit.carBrandModel === 'Véhicule Non Spécifié' ? '' : (invoiceToEdit.carBrandModel || ''),
      carRegistration: invoiceToEdit.carRegistration === 'N/A' ? '' : (invoiceToEdit.carRegistration || ''),
      carType: invoiceToEdit.carType || '',
      description: invoiceToEdit.description || '',
      docDate: invoiceToEdit.docDate || invoiceToEdit.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      days: invoiceToEdit.days || 1,
      pricePerDay: invoiceToEdit.pricePerDay || 0,
      amountTTC: Number(invoiceToEdit.amountTTC) || 0,
      amountHT: Number(invoiceToEdit.amountHT) || 0,
      amountTVA: Number(invoiceToEdit.amountTVA) || 0,
      hasTVA: invoiceToEdit.hasTVA ?? true,
      tvaRate: invoiceToEdit.tvaRate || settings.tvaRate || 19
    });
    setIsEditing(true);
  };

  // Cancel in-place editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  // Real-time calculations for Edit Mode
  const handleEditTotalChange = (newTTC: number) => {
    if (!editForm) return;
    const ttc = Math.max(0, newTTC);
    let ht = ttc;
    let tva = 0;
    if (editForm.hasTVA) {
      const rate = editForm.tvaRate || settings.tvaRate || 19;
      ht = Number((ttc / (1 + rate / 100)).toFixed(2));
      tva = Number((ttc - ht).toFixed(2));
    }
    setEditForm({
      ...editForm,
      amountTTC: ttc,
      amountHT: ht,
      amountTVA: tva
    });
  };

  const handleEditDaysOrPriceChange = (days: number, price: number) => {
    if (!editForm) return;
    const safeDays = Math.max(1, days);
    const safePrice = Math.max(0, price);
    const total = safeDays * safePrice;
    let ht = total;
    let tva = 0;
    if (editForm.hasTVA) {
      const rate = editForm.tvaRate || settings.tvaRate || 19;
      ht = Number((total / (1 + rate / 100)).toFixed(2));
      tva = Number((total - ht).toFixed(2));
    }
    setEditForm({
      ...editForm,
      days: safeDays,
      pricePerDay: safePrice,
      amountTTC: total,
      amountHT: ht,
      amountTVA: tva
    });
  };

  const handleEditTvaToggle = (newHasTVA: boolean) => {
    if (!editForm) return;
    const ttc = editForm.amountTTC;
    let ht = ttc;
    let tva = 0;
    if (newHasTVA) {
      const rate = editForm.tvaRate || settings.tvaRate || 19;
      ht = Number((ttc / (1 + rate / 100)).toFixed(2));
      tva = Number((ttc - ht).toFixed(2));
    }
    setEditForm({
      ...editForm,
      hasTVA: newHasTVA,
      amountHT: ht,
      amountTVA: tva
    });
  };

  // Save the modified invoice
  const handleSaveEdit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editForm || !currentInvoice) return;

    const finalId = editForm.id.trim() || currentInvoice.id;

    // Check ID conflict if changed
    if (finalId !== currentInvoice.id && invoices.some(i => i.id === finalId)) {
      alert(`Le numéro de pièce "${finalId}" existe déjà. Veuillez utiliser un numéro unique.`);
      return;
    }

    const updatedInvoice: Invoice = {
      ...editForm,
      id: finalId,
      clientName: editForm.clientName.trim() || 'Client de passage',
      clientPhone: editForm.clientPhone.trim() || 'N/A',
      clientAddress: editForm.clientAddress.trim() || 'N/A',
      carBrandModel: editForm.carBrandModel.trim() || 'Véhicule Non Spécifié',
      carRegistration: editForm.carRegistration.trim() || 'N/A',
      matriculeFiscal: editForm.matriculeFiscal?.trim() || undefined,
      description: editForm.description?.trim() || undefined,
      carType: editForm.carType?.trim() || undefined,
      amountHT: Number(Number(editForm.amountHT).toFixed(2)),
      amountTVA: Number(Number(editForm.amountTVA).toFixed(2)),
      amountTTC: Number(Number(editForm.amountTTC).toFixed(2))
    };

    const updatedInvoices = invoices.map(i => i.id === currentInvoice.id ? updatedInvoice : i);
    DBManager.saveInvoices(updatedInvoices);
    onInvoiceCreated(updatedInvoices);

    setCurrentInvoice(updatedInvoice);
    setIsEditing(false);
    setEditForm(null);

    setSuccessText(`Document ${updatedInvoice.id} mis à jour et enregistré avec succès !`);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Delete an invoice
  const handleDeleteInvoice = (invoiceToDelete: Invoice) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le document ${invoiceToDelete.id} ?\n\nCette action est irréversible.`)) return;
    
    const updatedInvoices = invoices.filter(i => i.id !== invoiceToDelete.id);
    DBManager.saveInvoices(updatedInvoices);
    onInvoiceCreated(updatedInvoices);
    
    // If the deleted invoice was the currently previewed one, clear preview
    if (currentInvoice?.id === invoiceToDelete.id) {
      setCurrentInvoice(null);
      setIsEditing(false);
      setEditForm(null);
    }
    
    // If the deleted invoice was linked to a reservation, update hasInvoice flag
    if (invoiceToDelete.reservationId && invoiceToDelete.reservationId !== 'LIBRE') {
      const allReservations = DBManager.getReservations();
      const updatedReservations = allReservations.map(r => {
        if (r.id === invoiceToDelete.reservationId) {
          return { ...r, hasInvoice: false };
        }
        return r;
      });
      DBManager.saveReservations(updatedReservations);
    }
    
    setSuccessText(`Document ${invoiceToDelete.id} supprimé avec succès.`);
    setSuccessMsg(true);
    setTimeout(() => setSuccessMsg(false), 3000);
  };

  // Filter for tab 3: History
  const filteredInvoices = invoices.filter(i => {
    const query = searchQuery.toLowerCase();
    return (
      i.id.toLowerCase().includes(query) ||
      i.clientName.toLowerCase().includes(query) ||
      i.carBrandModel.toLowerCase().includes(query) ||
      (i.carRegistration && i.carRegistration.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-6" id="billing-root">
      {/* View Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex justify-between items-center print:hidden" id="billing-header">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <FileText size={20} className="text-[#0F2C59]" />
            Facturation & Devis Professionnels
          </h2>
          <p className="text-xs text-gray-500">
            Émettez des factures de contrat, créez des devis d'estimation libres ou imprimez vos pièces au format de bureau.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="billing-main-grid">
        {/* Left column: Selection and calculation options */}
        <div className="space-y-4 print:hidden" id="billing-config-section">
          {/* Segmented Tab Controls */}
          <div className="bg-white p-1 rounded-xl border border-gray-100 shadow-xs flex gap-1">
            <button
              type="button"
              onClick={() => { setActiveTab('contrat'); setIsEditing(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'contrat' 
                  ? 'bg-[#0F2C59] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <FileText size={13} />
              Depuis Contrat
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('libre'); setIsEditing(false); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'libre' 
                  ? 'bg-[#0F2C59] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Plus size={13} />
              Création Libre
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('historique'); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                activeTab === 'historique' 
                  ? 'bg-[#0F2C59] text-white shadow-xs' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <History size={13} />
              Historique ({invoices.length})
            </button>
          </div>

          {/* TAB 1: FROM EXISTING RESERVATION / CONTRACT */}
          {activeTab === 'contrat' && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
              <h3 className="font-bold text-gray-800 text-xs uppercase border-b border-gray-50 pb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-blue-900" />
                1. Choix du Dossier Client
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">Sélectionner un Contrat de Location *</label>
                  <select
                    value={selectedResId}
                    onChange={e => setSelectedResId(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">-- Choisissez un contrat --</option>
                    {reservations.map(res => (
                      <option key={res.id} value={res.id}>
                        {res.id} — {res.clientName} ({res.carBrandModel})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedReservation && (
                  <div className="bg-gray-50 p-3 rounded-lg text-[11px] space-y-1.5 text-gray-700">
                    <p><strong>Client:</strong> {selectedReservation.clientName}</p>
                    <p><strong>Téléphone:</strong> {selectedReservation.clientPhone}</p>
                    <p><strong>Véhicule:</strong> {selectedReservation.carBrandModel} ({selectedReservation.carRegistration})</p>
                    <p><strong>Dates:</strong> {formatDateTime(selectedReservation.startDate)} au {formatDateTime(selectedReservation.endDate)} ({selectedReservation.days} jours)</p>
                    <p className="font-semibold text-blue-950"><strong>Montant Total:</strong> {(Number(selectedReservation.totalAmount) || 0).toLocaleString('fr-TN')} DT</p>
                  </div>
                )}
              </div>

              {selectedReservation && !currentInvoice && (
                <div className="space-y-4 border-t border-gray-100 pt-4">
                  <h3 className="font-bold text-gray-800 text-xs uppercase pb-1">
                    2. Paramètres Financiers
                  </h3>

                  <form onSubmit={handleGenerateInvoice} className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="space-y-0.5">
                        <label className="block text-xs font-bold text-gray-700">Appliquer la TVA</label>
                        <p className="text-[10px] text-gray-400">Taux par défaut de l'agence : {settings.tvaRate}%</p>
                      </div>
                      <input 
                        type="checkbox"
                        checked={hasTVA}
                        onChange={e => setHasTVA(e.target.checked)}
                        className="w-4 h-4 text-[#0F2C59] border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Calculation formulas in real time */}
                    <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                      <div className="flex justify-between text-gray-500">
                        <span>Montant Brut TTC :</span>
                        <span className="font-semibold">{(Number(selectedReservation.totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                      </div>
                      {hasTVA ? (
                        <>
                          <div className="flex justify-between text-gray-500">
                            <span>Montant Hors Taxe (HT) :</span>
                            <span>{(selectedReservation.totalAmount / (1 + settings.tvaRate/100)).toLocaleString('fr-TN', {maximumFractionDigits: 3})} DT</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>TVA ({settings.tvaRate}%) :</span>
                            <span>{(selectedReservation.totalAmount - (selectedReservation.totalAmount / (1 + settings.tvaRate/100))).toLocaleString('fr-TN', {maximumFractionDigits: 3})} DT</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">
                          <span>Exonéré de TVA (Facture HT) :</span>
                          <span>{(Number(selectedReservation.totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t border-dashed border-gray-100 pt-2 text-[#0F2C59]">
                        <span>Montant Final TTC :</span>
                        <span>{(Number(selectedReservation.totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                      </div>
                    </div>

                    {/* Montant en toutes lettres preview */}
                    <div className="bg-blue-50/70 border border-blue-200/60 p-2.5 rounded-lg text-[11px] text-[#0F2C59] space-y-1">
                      <span className="font-bold block text-[10px] text-blue-900 uppercase tracking-wider">Montant en toutes lettres :</span>
                      <p className="italic font-semibold text-blue-950">
                        {formatLegalAmountInWords(selectedReservation.totalAmount, 'Facture')}
                      </p>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#0F2C59] hover:bg-blue-900 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs transition cursor-pointer"
                    >
                      Générer et Enregistrer Facture
                    </button>
                  </form>
                </div>
              )}

              {currentInvoice && (
                <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 text-emerald-800 space-y-2 text-xs mt-3">
                  <div className="flex items-center gap-1.5 font-bold">
                    <CheckCircle size={16} />
                    <span>Facture déjà enregistrée !</span>
                  </div>
                  <p>Une facture a déjà été émise pour ce contrat sous le numéro <strong>{currentInvoice.id}</strong>.</p>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(currentInvoice)}
                    className="text-xs text-blue-900 hover:text-blue-950 underline font-bold mt-2 flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 size={12} />
                    Modifier cette Facture
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: FREE CREATION (MANUAL FORM) */}
          {activeTab === 'libre' && (
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs">
              <h3 className="font-bold text-gray-800 text-xs uppercase border-b border-gray-50 pb-2 mb-3 flex items-center gap-1.5 text-blue-900">
                <Plus size={14} />
                Nouveau Document Libre
              </h3>

              <form onSubmit={handleGenerateCustomDocument} className="space-y-4">
                {/* Doc Type Selection */}
                <div>
                  <label className="block text-[10px] font-bold text-gray-600 mb-1">Type de Document</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => { setDocType('Facture'); }}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        docType === 'Facture'
                          ? 'bg-blue-50 border-blue-900 text-blue-900'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Facture
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDocType('Devis'); }}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                        docType === 'Devis'
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      Devis (estimation)
                    </button>
                  </div>
                </div>

                {/* Numéro du Document (Manuel) */}
                <div className="border border-dashed border-blue-200 bg-blue-50/50 rounded-lg p-2.5 space-y-1.5">
                  <label className="block text-[10px] font-extrabold text-blue-900 uppercase tracking-wider">
                    N° du Document (Saisie Manuelle)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={manualDocNumber}
                      onChange={e => setManualDocNumber(e.target.value)}
                      placeholder={generateAutoDocNumber(docType)}
                      className="flex-1 border border-blue-300 rounded px-2 py-1.5 text-xs font-mono font-bold focus:outline-none focus:border-blue-600 bg-white text-blue-900 placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() => setManualDocNumber(generateAutoDocNumber(docType))}
                      className="px-2 py-1.5 text-[9px] font-bold bg-blue-900 text-white rounded hover:bg-blue-800 transition cursor-pointer whitespace-nowrap"
                      title="Utiliser le numéro suggéré automatiquement"
                    >
                      Auto
                    </button>
                  </div>
                  <p className="text-[9px] text-blue-700 opacity-70">
                    Laissez vide pour numérotation auto · Suggestion : <span className="font-mono font-bold">{generateAutoDocNumber(docType)}</span>
                  </p>
                </div>

                {/* Coordonnées Client / Société */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-extrabold text-[#0F2C59] uppercase tracking-wider mb-1">
                    1. Coordonnées Client / Société (Optionnel)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Nom de Société / Client</label>
                      <input
                        type="text"
                        value={clientName}
                        onChange={e => setClientName(e.target.value)}
                        placeholder="Ex: Société ABC SARL / Ahmed"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Matricule Fiscal</label>
                      <input
                        type="text"
                        value={matriculeFiscal}
                        onChange={e => setMatriculeFiscal(e.target.value)}
                        placeholder="Ex: 12345678-000"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Adresse</label>
                      <input
                        type="text"
                        value={clientAddress}
                        onChange={e => setClientAddress(e.target.value)}
                        placeholder="Ex: Boulevard d'Anfa, Casablanca"
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Date du Document</label>
                      <input
                        type="date"
                        value={docDate}
                        onChange={e => setDocDate(e.target.value)}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Zone de Description */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-extrabold text-[#0F2C59] uppercase tracking-wider mb-1">
                    2. Description de la Prestation (Optionnel)
                  </h4>
                  <div>
                    <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Zone de Description (ex: transfert aéroport, louer...)</label>
                    <textarea
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      placeholder="Ex: Transfert aéroport international Mohamed V vers Casablanca Centre, ou Location de voiture pour 3 jours..."
                      rows={2}
                      className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white resize-none"
                    />
                  </div>
                </div>

                {/* Informations Véhicule */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-extrabold text-[#0F2C59] uppercase tracking-wider mb-1">
                    3. Informations Véhicule (Optionnel)
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Modèle / Marque</label>
                      <input
                        type="text"
                        value={carModel}
                        onChange={e => setCarModel(e.target.value)}
                        placeholder="Ex: Renault Clio 5"
                        className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Immatriculation</label>
                      <input
                        type="text"
                        value={carRegistration}
                        onChange={e => setCarRegistration(e.target.value)}
                        placeholder="Ex: 12345-A-26"
                        className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Type (SUV, 4x4, etc.)</label>
                      <input
                        type="text"
                        value={carType}
                        onChange={e => setCarType(e.target.value)}
                        placeholder="Ex: 4x4, SUV, Berline"
                        className="w-full border border-gray-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Tarification et TVA */}
                <div className="space-y-2 border-t border-gray-100 pt-3">
                  <h4 className="text-[10px] font-extrabold text-[#0F2C59] uppercase tracking-wider mb-1">
                    4. Tarification & TVA (Optionnel)
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Montant Total TTC Direct</label>
                      <input
                        type="number"
                        min="0"
                        value={customTotal !== null ? customTotal : ''}
                        onChange={e => setCustomTotal(e.target.value === '' ? null : Number(e.target.value))}
                        placeholder={calculatedTotal.toString()}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white font-bold text-blue-900"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold font-normal text-gray-400">Ou calcul par jours: Tarif/Jour</label>
                      <input
                        type="number"
                        min="0"
                        value={pricePerDay}
                        onChange={e => setPricePerDay(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Nombre de jours</label>
                      <input
                        type="number"
                        min="1"
                        value={finalDays}
                        onChange={e => setCustomDays(Number(e.target.value))}
                        className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-gray-500 mb-0.5 font-bold">Montant Brut Établi</label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded px-2 py-1 text-xs font-black text-gray-700 truncate">
                        {(Number(totalAmount) || 0).toLocaleString('fr-TN')} DT
                      </div>
                    </div>
                  </div>

                  {/* TVA for custom doc */}
                  <div className="flex items-center justify-between p-2 bg-gray-50 border border-gray-100 rounded-lg mt-1">
                    <div className="space-y-0.5">
                      <label className="block text-[10px] font-bold text-gray-700">Appliquer la TVA</label>
                      <p className="text-[9px] text-gray-400">Taux de l'agence : {settings.tvaRate}%</p>
                    </div>
                    <input 
                      type="checkbox"
                      checked={manualHasTVA}
                      onChange={e => setManualHasTVA(e.target.checked)}
                      className="w-4 h-4 text-[#0F2C59] border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* Montant en toutes lettres preview */}
                  <div className="bg-blue-50/70 border border-blue-200/60 p-2.5 rounded-lg text-[11px] text-[#0F2C59] space-y-1">
                    <span className="font-bold block text-[10px] text-blue-900 uppercase tracking-wider">Montant en toutes lettres :</span>
                    <p className="italic font-semibold text-blue-950">
                      {formatLegalAmountInWords(totalAmount, docType)}
                    </p>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-2.5 rounded-lg text-xs font-black text-white shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    docType === 'Devis' 
                      ? 'bg-amber-500 hover:bg-amber-600' 
                      : 'bg-[#0F2C59] hover:bg-blue-900'
                  }`}
                >
                  <Plus size={14} />
                  Générer et Enregistrer le {docType}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: ISSUED DOCUMENTS HISTORY */}
          {activeTab === 'historique' && (
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
              <h3 className="font-bold text-gray-800 text-xs uppercase border-b border-gray-50 pb-2 flex items-center gap-1.5 text-blue-900">
                <History size={14} />
                Historique des Pièces
              </h3>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par client, immat, N°..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-white"
                />
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {filteredInvoices.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs">
                    Aucun document émis trouvé.
                  </div>
                ) : (
                  filteredInvoices.map(inv => (
                    <div
                      key={inv.id}
                      onClick={() => {
                        setCurrentInvoice(inv);
                        setIsEditing(false);
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                        currentInvoice?.id === inv.id
                          ? 'border-blue-900 bg-blue-50/70 shadow-xs'
                          : 'border-gray-100 hover:bg-gray-50 bg-white'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono font-bold text-xs text-[#0F2C59]">{inv.id}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          inv.type === 'Devis' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {inv.type || 'Facture'}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-gray-800 mt-1">{inv.clientName}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{inv.carBrandModel} — {new Date(inv.createdAt).toLocaleDateString('fr-FR')}</p>
                      <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                        <span className="text-[9px] text-gray-400">Total TTC:</span>
                        <span className="text-xs font-extrabold text-blue-900">{(Number(inv.amountTTC) || 0).toLocaleString('fr-TN')} DT</span>
                      </div>
                      {/* Action buttons: Edit & Delete */}
                      <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(inv);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-all cursor-pointer"
                          title="Modifier directement ce document avec le curseur"
                        >
                          <Edit3 size={11} />
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteInvoice(inv);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[10px] font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all cursor-pointer"
                          title="Supprimer ce document"
                        >
                          <Trash2 size={11} />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Success toast inside column */}
          {successMsg && (
            <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100 text-emerald-800 flex items-center gap-2 text-xs">
              <CheckCircle size={15} className="text-emerald-600" />
              <span className="font-semibold">{successText}</span>
            </div>
          )}
        </div>

        {/* Right column: Print Preview / In-Place Editing */}
        <div className="lg:col-span-2 space-y-4" id="billing-preview-section">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-gray-800 text-xs uppercase">
                {isEditing ? "Mode Modification de la Pièce" : "Aperçu Avant Impression de la Pièce"}
              </h4>
              {isEditing && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                  Édition en cours
                </span>
              )}
            </div>
            
            <div className="flex gap-2 flex-wrap">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit()}
                    className="px-3.5 py-1.5 border border-emerald-600 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-emerald-700 transition-all cursor-pointer shadow-xs"
                    title="Enregistrer toutes les modifications apportées à la facture"
                  >
                    <Save size={14} />
                    Enregistrer les modifications
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-3 py-1.5 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Annuler les modifications"
                  >
                    <X size={14} />
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    disabled={!currentInvoice}
                    onClick={handlePrint}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentInvoice 
                        ? 'border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer' 
                        : 'border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Printer size={14} />
                    {currentInvoice?.type === 'Devis' ? 'Imprimer le Devis' : 'Imprimer la Facture'}
                  </button>
                  <button
                    disabled={!currentInvoice}
                    onClick={() => {
                      if (!currentInvoice) return;
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentInvoice, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `${currentInvoice.type === 'Devis' ? 'devis' : 'facture'}_${currentInvoice.id}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                    }}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentInvoice 
                        ? 'border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer' 
                        : 'border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Download size={14} />
                    Exporter JSON
                  </button>
                  <button
                    disabled={!currentInvoice}
                    onClick={() => { if (currentInvoice) handleStartEdit(currentInvoice); }}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentInvoice 
                        ? 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100 cursor-pointer' 
                        : 'border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                    title="Modifier directement cette facture (cliquez pour éditer les champs avec le curseur)"
                  >
                    <Edit3 size={14} />
                    Modifier
                  </button>
                  <button
                    disabled={!currentInvoice}
                    onClick={() => { if (currentInvoice) handleDeleteInvoice(currentInvoice); }}
                    className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      currentInvoice 
                        ? 'border-red-300 text-red-600 bg-red-50 hover:bg-red-100 cursor-pointer' 
                        : 'border-gray-100 text-gray-300 cursor-not-allowed'
                    }`}
                  >
                    <Trash2 size={14} />
                    Supprimer
                  </button>
                </>
              )}
            </div>
          </div>

          {currentInvoice ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-md p-8 max-w-2xl mx-auto space-y-6 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none print:w-full" id="invoice-sheet">
              {/* EDIT MODE BANNER */}
              {isEditing && editForm && (
                <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-3 flex items-center justify-between text-xs text-amber-900 print:hidden shadow-xs">
                  <div className="flex items-center gap-2">
                    <Edit3 size={16} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">Mode Édition Activé</p>
                      <p className="text-[11px] text-amber-800">
                        Cliquez avec votre curseur sur les champs ci-dessous pour changer les informations de la facture, puis validez.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit()}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs flex items-center gap-1 cursor-pointer shadow-xs"
                    >
                      <Check size={13} />
                      Enregistrer
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-gray-300 text-gray-700 font-bold rounded text-xs cursor-pointer"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}

              {/* Header block */}
              <div className="flex justify-between items-start border-b border-gray-200 pb-5">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-[#0F2C59] tracking-wider uppercase">{settings.companyName}</h3>
                  <p className="text-xs text-gray-500 max-w-xs leading-relaxed">{settings.address}</p>
                  <p className="text-xs text-gray-400">Tél: {settings.phone} | Email: {settings.email}</p>
                </div>
                
                {/* Header right side: view vs edit */}
                <div className="text-right space-y-1">
                  {isEditing && editForm ? (
                    <div className="space-y-1.5 text-left bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase">Type de Document</label>
                        <div className="flex gap-1 mt-0.5">
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, type: 'Facture' })}
                            className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer ${
                              editForm.type !== 'Devis' ? 'bg-[#0F2C59] text-white' : 'bg-white border text-gray-600'
                            }`}
                          >
                            Facture
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditForm({ ...editForm, type: 'Devis' })}
                            className={`px-2 py-0.5 text-xs font-bold rounded cursor-pointer ${
                              editForm.type === 'Devis' ? 'bg-amber-500 text-white' : 'bg-white border text-gray-600'
                            }`}
                          >
                            Devis
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase">N° Pièce</label>
                        <input
                          type="text"
                          value={editForm.id}
                          onChange={e => setEditForm({ ...editForm, id: e.target.value })}
                          className="w-full border border-blue-300 rounded px-1.5 py-0.5 text-xs font-mono font-bold text-[#0F2C59] bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500 uppercase">Date d'émission</label>
                        <input
                          type="date"
                          value={editForm.docDate || editForm.createdAt?.split('T')[0] || ''}
                          onChange={e => setEditForm({ ...editForm, docDate: e.target.value })}
                          className="w-full border border-gray-300 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-lg font-black text-gray-800 tracking-tight uppercase">
                        {currentInvoice.type === 'Devis' ? 'DEVIS ESTIMATIF' : 'FACTURE'}
                      </h2>
                      <p className="text-xs font-mono font-bold text-[#0F2C59]">N° : {currentInvoice.id}</p>
                      <p className="text-xs text-gray-400">
                        Date d'émission : {currentInvoice.docDate 
                          ? new Date(currentInvoice.docDate).toLocaleDateString('fr-FR') 
                          : new Date(currentInvoice.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Bill to metadata */}
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <span className="text-gray-400 font-bold block uppercase tracking-wider mb-1">DÉTAILS DE L'AGENCE</span>
                  <p className="font-semibold text-gray-700">{settings.companyName}</p>
                  <p className="text-gray-500">{settings.address}</p>
                  <p className="text-gray-500">Tél : {settings.phone}</p>
                </div>

                <div>
                  <span className="text-gray-400 font-bold block uppercase tracking-wider mb-1">
                    {(isEditing ? editForm?.type : currentInvoice.type) === 'Devis' ? 'PROPOSÉ À (CLIENT)' : 'FACTURÉ À (LOCATAIRE)'}
                  </span>

                  {isEditing && editForm ? (
                    <div className="space-y-1.5 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-500">Nom du Client / Société *</label>
                        <input
                          type="text"
                          value={editForm.clientName}
                          onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                          placeholder="Nom complet ou Société"
                          className="w-full border border-blue-300 rounded px-2 py-1 text-xs font-bold text-gray-800 bg-white focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500">Matricule Fiscal</label>
                        <input
                          type="text"
                          value={editForm.matriculeFiscal || ''}
                          onChange={e => setEditForm({ ...editForm, matriculeFiscal: e.target.value })}
                          placeholder="Ex: 12345678-000"
                          className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500">Adresse</label>
                        <input
                          type="text"
                          value={editForm.clientAddress === 'N/A' ? '' : editForm.clientAddress}
                          onChange={e => setEditForm({ ...editForm, clientAddress: e.target.value })}
                          placeholder="Adresse"
                          className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-bold text-gray-500">Téléphone</label>
                        <input
                          type="text"
                          value={editForm.clientPhone === 'N/A' ? '' : editForm.clientPhone}
                          onChange={e => setEditForm({ ...editForm, clientPhone: e.target.value })}
                          placeholder="Téléphone"
                          className="w-full border border-gray-200 rounded px-2 py-0.5 text-xs bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-gray-800 text-sm">{currentInvoice.clientName}</p>
                      {currentInvoice.matriculeFiscal && (
                        <p className="text-gray-700 font-medium">Matricule Fiscal: {currentInvoice.matriculeFiscal}</p>
                      )}
                      {currentInvoice.clientAddress && currentInvoice.clientAddress !== 'N/A' && (
                        <p className="text-gray-500">{currentInvoice.clientAddress}</p>
                      )}
                      {currentInvoice.clientPhone && currentInvoice.clientPhone !== 'N/A' && (
                        <p className="text-gray-500">Tél : {currentInvoice.clientPhone}</p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Itemized Rent Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 font-bold border-b border-gray-200">
                      <th className="py-2.5 px-4">Description de la Prestation</th>
                      <th className="py-2.5 px-4 text-center">Nbre de Jours</th>
                      <th className="py-2.5 px-4 text-right">Tarif Jour</th>
                      <th className="py-2.5 px-4 text-right">Total Brut HT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-700">
                    {isEditing && editForm ? (
                      <tr>
                        <td className="py-3 px-4 space-y-2">
                          <div>
                            <label className="block text-[9px] font-bold text-gray-500 uppercase">Prestation / Libellé</label>
                            <textarea
                              value={editForm.description || ''}
                              onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                              placeholder="Description de la prestation (laisser vide pour utiliser le véhicule)"
                              rows={2}
                              className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-600 focus:outline-none bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-1.5 border-t border-gray-100 pt-1.5">
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500">Modèle Véhicule</label>
                              <input
                                type="text"
                                value={editForm.carBrandModel === 'Véhicule Non Spécifié' ? '' : editForm.carBrandModel}
                                onChange={e => setEditForm({ ...editForm, carBrandModel: e.target.value })}
                                placeholder="Ex: Renault Clio 5"
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500">Immatriculation</label>
                              <input
                                type="text"
                                value={editForm.carRegistration === 'N/A' ? '' : editForm.carRegistration}
                                onChange={e => setEditForm({ ...editForm, carRegistration: e.target.value })}
                                placeholder="Ex: 12345-A-26"
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-gray-500">Type de Véhicule</label>
                              <input
                                type="text"
                                value={editForm.carType || ''}
                                onChange={e => setEditForm({ ...editForm, carType: e.target.value })}
                                placeholder="Ex: SUV, 4x4"
                                className="w-full border border-gray-200 rounded px-1.5 py-0.5 text-xs bg-white focus:outline-none focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center align-top">
                          <input
                            type="number"
                            min="1"
                            value={editForm.days}
                            onChange={e => handleEditDaysOrPriceChange(Number(e.target.value), editForm.pricePerDay)}
                            className="w-16 border border-gray-300 rounded px-1.5 py-1 text-center text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-right align-top">
                          <input
                            type="number"
                            min="0"
                            value={editForm.pricePerDay}
                            onChange={e => handleEditDaysOrPriceChange(editForm.days, Number(e.target.value))}
                            className="w-20 border border-gray-300 rounded px-1.5 py-1 text-right text-xs font-bold bg-white focus:outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="py-3 px-4 text-right font-semibold align-top">
                          {(Number(editForm.hasTVA ? editForm.amountHT : editForm.amountTTC) || 0).toLocaleString('fr-TN')} DT
                        </td>
                      </tr>
                    ) : (
                      <tr>
                        <td className="py-3 px-4">
                          {currentInvoice.description ? (
                            <div className="font-semibold text-gray-800 whitespace-pre-line text-xs">
                              {currentInvoice.description}
                            </div>
                          ) : (
                            <div className="font-semibold text-gray-800">
                              Location Véhicule : {currentInvoice.carBrandModel}
                            </div>
                          )}
                          
                          {/* Vehicle details */}
                          {((currentInvoice.carBrandModel && currentInvoice.carBrandModel !== 'Véhicule Non Spécifié') || 
                            (currentInvoice.carRegistration && currentInvoice.carRegistration !== 'N/A') || 
                            currentInvoice.carType) && (
                            <div className="text-[10px] text-gray-400 mt-1.5 space-y-0.5 border-t border-gray-50 pt-1">
                              {currentInvoice.carBrandModel && currentInvoice.carBrandModel !== 'Véhicule Non Spécifié' && (
                                <div><span className="font-medium text-gray-500">Modèle:</span> {currentInvoice.carBrandModel}</div>
                              )}
                              {currentInvoice.carRegistration && currentInvoice.carRegistration !== 'N/A' && (
                                <div><span className="font-medium text-gray-500">Immatriculation:</span> {currentInvoice.carRegistration}</div>
                              )}
                              {currentInvoice.carType && (
                                <div><span className="font-medium text-gray-500">Type de Véhicule:</span> {currentInvoice.carType}</div>
                              )}
                            </div>
                          )}
                          
                          {currentInvoice.reservationId !== 'LIBRE' && (
                            <div className="text-[10px] text-gray-400 mt-1">
                              Période: {formatDateTime(currentInvoice.startDate)} au {formatDateTime(currentInvoice.endDate)}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-semibold">{currentInvoice.days} {currentInvoice.days > 1 ? 'jours' : 'jour'}</td>
                        <td className="py-3 px-4 text-right">{(Number(currentInvoice.pricePerDay) || 0).toLocaleString('fr-TN')} DT</td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {(Number(currentInvoice.hasTVA ? currentInvoice.amountHT : currentInvoice.amountTTC) || 0).toLocaleString('fr-TN')} DT
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Calculation Summary blocks */}
              <div className="flex justify-between items-start pt-4">
                {/* Edit Mode Direct Total or TVA Switch */}
                {isEditing && editForm ? (
                  <div className="space-y-2 bg-blue-50/50 p-3 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="edit-tva-check"
                        checked={editForm.hasTVA}
                        onChange={e => handleEditTvaToggle(e.target.checked)}
                        className="w-4 h-4 text-[#0F2C59] rounded cursor-pointer"
                      />
                      <label htmlFor="edit-tva-check" className="text-xs font-bold text-gray-700 cursor-pointer">
                        Appliquer la TVA ({editForm.tvaRate || settings.tvaRate}%)
                      </label>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-blue-900 mb-0.5">
                        Modifier le Montant Total TTC Direct (DT) :
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.amountTTC}
                        onChange={e => handleEditTotalChange(Number(e.target.value))}
                        className="w-40 border-2 border-blue-400 rounded px-2 py-1 text-sm font-black text-blue-900 bg-white focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                ) : <div />}

                <div className="w-72 space-y-1.5 text-xs">
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">Total Hors Taxes (HT) :</span>
                    <span className="font-medium text-gray-800">
                      {(Number(isEditing && editForm ? editForm.amountHT : currentInvoice.amountHT) || 0).toLocaleString('fr-TN')} DT
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-1">
                    <span className="text-gray-500">
                      TVA ({(isEditing && editForm ? editForm.hasTVA : currentInvoice.hasTVA) ? (isEditing && editForm ? editForm.tvaRate : currentInvoice.tvaRate) : 0}%) :
                    </span>
                    <span className="font-medium text-gray-800">
                      {(Number(isEditing && editForm ? editForm.amountTVA : currentInvoice.amountTVA) || 0).toLocaleString('fr-TN')} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#0F2C59] pt-1 border-t border-dashed border-gray-200">
                    <span>Montant Total TTC :</span>
                    <span>
                      {(Number(isEditing && editForm ? editForm.amountTTC : currentInvoice.amountTTC) || 0).toLocaleString('fr-TN')} DT
                    </span>
                  </div>
                </div>
              </div>

              {/* MONTANT EN TOUTES LETTRES (Arrêtée la présente facture à la somme de...) */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-lg p-3 text-xs text-[#0F2C59] mt-3 print:bg-white print:border-gray-400 print:p-2" id="invoice-legal-words-box">
                <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-gray-600 mb-0.5 print:text-gray-800">
                  <FileText size={12} className="text-[#0F2C59] print:hidden" />
                  <span>Arrêté du Montant en Toutes Lettres :</span>
                </div>
                <p className="font-bold text-xs text-gray-800 italic leading-relaxed">
                  {formatLegalAmountInWords(
                    isEditing && editForm ? editForm.amountTTC : currentInvoice.amountTTC, 
                    isEditing && editForm ? editForm.type : currentInvoice.type
                  )}
                </p>
              </div>

              {/* In-place edit bottom action buttons */}
              {isEditing && (
                <div className="pt-4 border-t border-amber-200 flex justify-end gap-2 print:hidden">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEdit()}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check size={14} />
                    Enregistrer les modifications
                  </button>
                </div>
              )}

              {/* Fine print legal requirements */}
              <div className="pt-6 border-t border-gray-100 text-center text-[10px] text-gray-400 space-y-1 leading-relaxed">
                <p>
                  {(isEditing && editForm ? editForm.type : currentInvoice.type) === 'Devis' 
                    ? "Ce document est un devis estimatif valable pour une durée de 15 jours." 
                    : "La facture est payable au comptant à la signature du contrat."}
                </p>
                <p>{settings.companyName} vous remercie de votre confiance.</p>
                <p className="font-semibold text-[#0F2C59]">{settings.signatureText}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400" id="invoice-preview-placeholder">
              <FileText size={48} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Veuillez sélectionner un contrat, créer un document libre, ou charger une pièce de l'historique à gauche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
