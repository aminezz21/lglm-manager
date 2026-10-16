import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Trash2, 
  FileSpreadsheet, 
  Printer, 
  ChevronRight,
  UserCheck,
  X
} from 'lucide-react';
import { Collaborator, CollaboratorPayment, Car } from '../types';

interface CollaboratorsProps {
  collaborators: Collaborator[];
  payments: CollaboratorPayment[];
  cars: Car[];
  onCollaboratorsUpdated: (updatedList: Collaborator[]) => void;
  onPaymentsUpdated: (updatedPayments: CollaboratorPayment[], isNewPayment?: boolean, newExpenseAmount?: number, expenseDesc?: string) => void;
}

export default function Collaborators({ collaborators, payments, cars, onCollaboratorsUpdated, onPaymentsUpdated }: CollaboratorsProps) {
  // Modal toggle state
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState<string>('Tous');
  const [filterYear, setFilterYear] = useState<number>(new Date().getFullYear());

  // New Collaborator fields state
  const [collabName, setCollabName] = useState('');
  const [collabPhone, setCollabPhone] = useState('');
  const [collabCarId, setCollabCarId] = useState('');
  const [collabObs, setCollabObs] = useState('');

  // New Payment fields state
  const [payCollabId, setPayCollabId] = useState('');
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
  const [payObs, setPayObs] = useState('');

  // Months name array
  const monthsFr = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  // Add collaborator handler
  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collabName || !collabPhone) {
      alert("Veuillez remplir le nom et le téléphone.");
      return;
    }

    const selectedCar = cars.find(c => c.id === collabCarId);

    const newCollab: Collaborator = {
      id: `col-${Date.now()}`,
      fullName: collabName,
      phone: collabPhone,
      assignedCarId: collabCarId,
      assignedCarBrandModel: selectedCar ? `${selectedCar.brand} ${selectedCar.model}` : "Aucun",
      assignedCarRegistration: selectedCar ? selectedCar.registration : "Aucune",
      observations: collabObs
    };

    onCollaboratorsUpdated([newCollab, ...collaborators]);

    // Reset
    setCollabName('');
    setCollabPhone('');
    setCollabCarId('');
    setCollabObs('');
    setIsCollabModalOpen(false);
  };

  // Delete collaborator
  const handleDeleteCollaborator = (id: string) => {
    if (window.confirm("Supprimer ce collaborateur définitivement ?")) {
      const updated = collaborators.filter(c => c.id !== id);
      onCollaboratorsUpdated(updated);
    }
  };

  // Add payment handler
  const handleAddPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payCollabId || payAmount <= 0) {
      alert("Veuillez choisir un collaborateur et saisir un montant valide.");
      return;
    }

    const collab = collaborators.find(c => c.id === payCollabId);
    if (!collab) return;

    const paymentDateObj = new Date(payDate);
    const payMonthName = monthsFr[paymentDateObj.getMonth()];
    const payYearVal = paymentDateObj.getFullYear();

    const newPayment: CollaboratorPayment = {
      id: `pay-${Date.now()}`,
      collaboratorId: payCollabId,
      collaboratorName: collab.fullName,
      carId: collab.assignedCarId,
      carBrandModel: collab.assignedCarBrandModel,
      carRegistration: collab.assignedCarRegistration,
      paymentDate: payDate,
      amount: payAmount,
      month: payMonthName,
      year: payYearVal,
      observations: payObs
    };

    const descriptionText = `Rémunération / Commission - ${collab.fullName} (${payMonthName} ${payYearVal})`;

    // Log the payment and automatically add as business expense
    onPaymentsUpdated([newPayment, ...payments], true, payAmount, descriptionText);

    // Reset
    setPayCollabId('');
    setPayAmount(0);
    setPayObs('');
    setIsPaymentModalOpen(false);
  };

  // Delete payment line
  const handleDeletePayment = (id: string) => {
    if (window.confirm("Voulez-vous annuler cet historique de paiement ? (Ceci ne supprimera pas l'écriture comptable correspondante).")) {
      const updated = payments.filter(p => p.id !== id);
      onPaymentsUpdated(updated);
    }
  };

  // Filtering payments based on filters
  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.collaboratorName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.carBrandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.carRegistration.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesMonth = filterMonth === 'Tous' || p.month === filterMonth;
    const matchesYear = p.year === filterYear;

    return matchesSearch && matchesMonth && matchesYear;
  });

  // Excel / CSV Export
  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Collaborateur,Vehicule,Immatriculation,Date Paiement,Montant (DT),Mois,Annee,Observations\n";

    filteredPayments.forEach(p => {
      csvContent += `"${p.collaboratorName}","${p.carBrandModel}","${p.carRegistration}",${p.paymentDate},${p.amount},${p.month},${p.year},"${p.observations.replace(/"/g, '""')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compta_collaborateurs_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6" id="collaborators-root">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs gap-4" id="collab-header-panel">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Users size={20} className="text-[#0F2C59]" />
            Chauffeurs, Collaborateurs & Partenaires
          </h2>
          <p className="text-xs text-gray-500">
            Enregistrez les personnes travaillant avec votre agence de location de voitures, affectez-leur un véhicule et suivez leurs paiements.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsCollabModalOpen(true)}
            className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Plus size={14} />
            Nouveau Chauffeur
          </button>
          <button
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-[#0F2C59] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CreditCard size={14} />
            Enregistrer un Règlement
          </button>
        </div>
      </div>

      {/* Main split grid: Left = Collaborators List, Right = Payments history */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="collaborators-workspace">
        {/* Left column: Staff Directory */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4" id="staff-directory-card">
          <h3 className="font-bold text-gray-800 text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <UserCheck size={14} className="text-blue-900" />
            Annuaire du Personnel & Véhicules
          </h3>

          <div className="space-y-3 overflow-y-auto max-h-[500px]" id="collaborator-cards-scroller">
            {collaborators.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-xs font-medium">Aucun collaborateur enregistré.</p>
            ) : (
              collaborators.map(c => (
                <div 
                  key={c.id}
                  className="p-3 bg-gray-50 border border-gray-100 hover:border-gray-200 rounded-lg space-y-2 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-sm">{c.fullName}</h4>
                      <p className="text-xs text-gray-500">{c.phone}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteCollaborator(c.id)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                      title="Supprimer la fiche"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div className="text-[11px] text-gray-600 border-t border-gray-200/60 pt-2 space-y-1">
                    <p>🚗 <strong>Véhicule :</strong> {c.assignedCarBrandModel}</p>
                    <p>🏷️ <strong>Matricule :</strong> <span className="font-mono font-bold text-blue-950">{c.assignedCarRegistration}</span></p>
                    {c.observations && <p className="text-[10px] text-gray-400 italic">"{c.observations}"</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right column: Payments accounting history */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 space-y-4" id="compta-staff-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-gray-50 gap-3">
            <h3 className="font-bold text-gray-800 text-xs uppercase flex items-center gap-1.5">
              <CreditCard size={14} className="text-blue-900" />
              Historique des versements collaborateurs
            </h3>

            {/* Quick Filter bar */}
            <div className="flex flex-wrap items-center gap-2" id="staff-filters">
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="border border-gray-200 rounded px-2 py-1 text-[11px] bg-white focus:outline-none"
              >
                <option value="Tous">Tous les mois</option>
                {monthsFr.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
              <select
                value={filterYear}
                onChange={e => setFilterYear(Number(e.target.value))}
                className="border border-gray-200 rounded px-2 py-1 text-[11px] bg-white focus:outline-none"
              >
                <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
              </select>
              <button
                onClick={handleExportCSV}
                className="p-1 border border-gray-200 hover:bg-gray-50 rounded text-gray-600 transition cursor-pointer"
                title="Exporter Excel"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
              </button>
            </div>
          </div>

          {/* Quick Search inside payments */}
          <div className="relative w-full" id="staff-payment-search-box">
            <Search className="absolute left-2.5 top-2 text-gray-400" size={14} />
            <input 
              type="text"
              placeholder="Rechercher par nom de chauffeur, véhicule, immatriculation..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1 text-xs focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="overflow-x-auto" id="payments-history-table">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Collaborateur</th>
                  <th className="py-2.5 px-3">Véhicule Utilisé</th>
                  <th className="py-2.5 px-3 text-center">Période</th>
                  <th className="py-2.5 px-3 text-right">Montant Versé</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-gray-700">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400 font-medium">Aucun règlement répertorié.</td>
                  </tr>
                ) : (
                  filteredPayments.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50/50 transition" id={`payment-row-${p.id}`}>
                      <td className="py-3 px-3 font-mono text-gray-500">{p.paymentDate}</td>
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-gray-800">{p.collaboratorName}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-700">{p.carBrandModel}</div>
                        <span className="text-[10px] font-mono font-bold text-blue-900 bg-blue-50 px-1 py-0.2 rounded mt-0.5 inline-block">
                          {p.carRegistration}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-gray-500 font-semibold">
                        {p.month} {p.year}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-blue-950">
                        {(Number(p.amount) || 0).toLocaleString('fr-TN')} DT
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition cursor-pointer"
                          title="Supprimer la ligne de paiement"
                        >
                          <Trash2 size={12} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Staff Dialog */}
      {isCollabModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="staff-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-[#0F2C59] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <Users size={16} />
                Enregistrer un Chauffeur / Partenaire
              </h3>
              <button 
                onClick={() => setIsCollabModalOpen(false)}
                className="text-white hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddCollaborator} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom Complet *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Reda Benslimane"
                  value={collabName}
                  onChange={e => setCollabName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone Mobile *</label>
                <input 
                  type="tel"
                  required
                  placeholder="Ex: 0655443322"
                  value={collabPhone}
                  onChange={e => setCollabPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Attribuer un véhicule</label>
                <select
                  value={collabCarId}
                  onChange={e => setCollabCarId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Aucun véhicule --</option>
                  {cars.map(c => (
                    <option key={c.id} value={c.id}>{c.brand} {c.model} ({c.registration})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observations</label>
                <textarea
                  placeholder="Ex: Chauffeur VIP, missions aéroport..."
                  value={collabObs}
                  onChange={e => setCollabObs(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCollabModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0F2C59] hover:bg-blue-900 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Payment Dialog */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="staff-payment-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden flex flex-col">
            <div className="bg-[#0F2C59] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard size={16} />
                Payer un Chauffeur / Collaborateur
              </h3>
              <button 
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-white hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sélectionner le destinataire *</label>
                <select
                  required
                  value={payCollabId}
                  onChange={e => setPayCollabId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Choisissez un membre --</option>
                  {collaborators.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.assignedCarBrandModel})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Montant Brut réglé (DT) *</label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={payAmount}
                  onChange={e => setPayAmount(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date d'encaissement *</label>
                <input 
                  type="date"
                  required
                  value={payDate}
                  onChange={e => setPayDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Observations</label>
                <textarea
                  placeholder="Ex: Commissions mois en cours..."
                  value={payObs}
                  onChange={e => setPayObs(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold text-white shadow-xs cursor-pointer"
                >
                  Enregistrer et imputer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
