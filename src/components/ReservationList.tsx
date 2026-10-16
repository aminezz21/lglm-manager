import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  RotateCcw,
  AlertTriangle, 
  CheckCircle, 
  X, 
  Filter,
  FileText,
  Trash2,
  DollarSign,
  Edit2,
  Clock,
  ArrowRight,
  Gauge
} from 'lucide-react';
import { Reservation, Car } from '../types';

interface ReservationListProps {
  reservations: Reservation[];
  cars: Car[];
  onReturnProcessed: (reservationId: string, remainingPaid: number, returnMileage?: number) => void;
  onDeleteReservation: (reservationId: string) => void;
  onStatusChange: (reservationId: string, newStatus: Reservation['status']) => void;
  onConfirmPayment: (reservationId: string, amount: number) => void;
  onUpdateReservation: (reservationId: string, updates: { endDate: string; pricePerDay: number; deposit: number; }) => void;
  onNavigate: (view: string, data?: any) => void;
  initialSearch?: string;
}

export default function ReservationList({ 
  reservations, 
  cars, 
  onReturnProcessed,
  onDeleteReservation, 
  onStatusChange,
  onConfirmPayment,
  onUpdateReservation,
  onNavigate, 
  initialSearch = '' 
}: ReservationListProps) {

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCarFilter, setSelectedCarFilter] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'Tous' | 'Réservation En attente' | 'Réservation Confirmée' | 'Location En cours' | 'Terminée' | 'Annulée'
  >('Tous');
  const [startDateFilter, setStartDateFilter] = useState('');

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

  // Delete confirmation dialog
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [resIdToDelete, setResIdToDelete] = useState<string | null>(null);

  // Payment confirmation dialog
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentResId, setPaymentResId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');

  // Toast notification
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'info'>('success');

  // Edit / Prolongation modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editResId, setEditResId] = useState<string | null>(null);
  const [editEndDate, setEditEndDate] = useState('');
  const [editPricePerDay, setEditPricePerDay] = useState(0);
  const [editDeposit, setEditDeposit] = useState(0);

  // Derived live calculations for edit modal
  const getEditPreview = () => {
    const res = reservations.find(r => r.id === editResId);
    if (!res || !editEndDate) return null;
    const start = new Date(res.startDate);
    const end = new Date(editEndDate);
    const diff = end.getTime() - start.getTime();
    const newDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const newTotal = newDays * editPricePerDay;
    const newRemaining = Math.max(0, newTotal - (res.advancePaid || 0));
    const prolongDays = newDays - (res.days || 0);
    return { newDays, newTotal, newRemaining, prolongDays };
  };

  const systemDateStr = new Date().toISOString().split('T')[0];

  const showNotification = (message: string, type: 'success' | 'info' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4000);
  };

  const handleConfirmDelete = (id: string) => {
    setResIdToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const executeDelete = () => {
    if (!resIdToDelete) return;
    onDeleteReservation(resIdToDelete);
    setDeleteConfirmOpen(false);
    setResIdToDelete(null);
    showNotification('La réservation a été supprimée définitivement.');
  };

  // Return Car Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnResId, setReturnResId] = useState<string | null>(null);
  const [returnPaymentAmount, setReturnPaymentAmount] = useState<number>(0);
  const [returnMileageInput, setReturnMileageInput] = useState<number>(0);

  const openReturnModal = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;
    const car = cars.find(c => c.id === res.carId);
    setReturnResId(resId);
    setReturnPaymentAmount(res.remainingAmount || 0);
    const defaultReturnKm = res.returnMileage || (car ? car.mileage : res.startMileage || 0);
    setReturnMileageInput(defaultReturnKm);
    setReturnModalOpen(true);
  };

  const executeReturn = () => {
    if (!returnResId) return;
    onReturnProcessed(returnResId, Number(returnPaymentAmount) || 0, Number(returnMileageInput) || 0);
    setReturnModalOpen(false);
    setReturnResId(null);
    showNotification('Le retour du véhicule et le kilométrage ont été enregistrés avec succès !');
  };

  const handleStatusChange = (id: string, newStatus: Reservation['status']) => {
    if (newStatus === 'Terminée') {
      openReturnModal(id);
      return;
    }
    onStatusChange(id, newStatus);
    showNotification(`Statut mis à jour : "${newStatus}"`, 'info');
  };

  const openPaymentModal = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;
    setPaymentResId(resId);
    setPaymentAmount(String(res.remainingAmount));
    setPaymentType('full');
    setPaymentModalOpen(true);
  };

  const executePayment = () => {
    if (!paymentResId) return;
    const res = reservations.find(r => r.id === paymentResId);
    if (!res) return;

    const amount = paymentType === 'full' ? res.remainingAmount : Number(paymentAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > res.remainingAmount) return;

    onConfirmPayment(paymentResId, amount);
    setPaymentModalOpen(false);
    setPaymentResId(null);
    setPaymentAmount('');
    showNotification(`Paiement de ${(Number(amount) || 0).toLocaleString('fr-TN')} DT confirmé avec succès !`);
  };

  const openEditModal = (resId: string) => {
    const res = reservations.find(r => r.id === resId);
    if (!res) return;
    setEditResId(resId);
    setEditEndDate(res.endDate.includes('T') ? res.endDate.slice(0, 16) : res.endDate);
    setEditPricePerDay(res.pricePerDay);
    setEditDeposit(res.deposit);
    setEditModalOpen(true);
  };

  const executeEdit = () => {
    if (!editResId || !editEndDate) return;
    const preview = getEditPreview();
    if (!preview) return;
    onUpdateReservation(editResId, {
      endDate: editEndDate,
      pricePerDay: editPricePerDay,
      deposit: editDeposit
    });
    setEditModalOpen(false);
    setEditResId(null);
    const prolongMsg = preview.prolongDays > 0
      ? ` — Prolongation de ${preview.prolongDays} jour(s)`
      : preview.prolongDays < 0
        ? ` — Réduction de ${Math.abs(preview.prolongDays)} jour(s)`
        : '';
    showNotification(`Réservation mise à jour avec succès !${prolongMsg}`);
  };

  const filteredReservations = reservations.filter(res => {
    const matchesSearch = 
      res.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.clientPhone.includes(searchQuery) ||
      res.carBrandModel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.carRegistration.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCar = !selectedCarFilter || res.carId === selectedCarFilter;
    const matchesStatus = selectedStatusFilter === 'Tous' || res.status === selectedStatusFilter;
    const matchesStartDate = !startDateFilter || res.startDate >= startDateFilter;
    return matchesSearch && matchesCar && matchesStatus && matchesStartDate;
  });

  const getStatusStyle = (status: Reservation['status']) => {
    switch (status) {
      case 'Réservation En attente': return 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200';
      case 'Réservation Confirmée':  return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
      case 'Location En cours':       return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200';
      case 'Terminée':               return 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200';
      case 'Annulée':                return 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200';
    }
  };

  return (
    <div className="space-y-6" id="reservation-list-root">

      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-white text-xs font-bold transition-all duration-300 ${
          toastType === 'success' ? 'bg-emerald-700 border-emerald-600' : 'bg-[#0f2c59] border-blue-900/50'
        }`}>
          <CheckCircle size={14} className="shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setShowToast(false)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-[#0F2C59]" />
            Registre des Locations & Réservations
          </h2>
          <p className="text-xs text-gray-500">
            Consultez les contrats, filtrez par statut et gérez les retours de véhicules de l'agence.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('reserve')}
          className="bg-[#0F2C59] hover:bg-blue-900 text-white font-bold text-xs px-4 py-2.5 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          Nouveau Contrat de Location
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs space-y-4">
        <h4 className="font-bold text-gray-700 text-xs flex items-center gap-1.5 pb-2 border-b border-gray-100">
          <Filter size={14} className="text-gray-400" />
          Filtres de Recherche
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Recherche</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 text-gray-400" size={14} />
              <input 
                type="text" placeholder="Client, immatricule..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none bg-white text-gray-800"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Véhicule</label>
            <select value={selectedCarFilter} onChange={e => setSelectedCarFilter(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 focus:border-blue-500 focus:outline-none">
              <option value="">Tous les véhicules</option>
              {cars.map(c => <option key={c.id} value={c.id}>{c.brand} {c.model}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Statut</label>
            <select value={selectedStatusFilter} onChange={e => setSelectedStatusFilter(e.target.value as any)}
              className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white text-gray-800 focus:border-blue-500 focus:outline-none">
              <option value="Tous">Tous les statuts</option>
              <option value="Réservation En attente">Réservation En attente</option>
              <option value="Réservation Confirmée">Réservation Confirmée</option>
              <option value="Location En cours">Location En cours</option>
              <option value="Terminée">Terminée</option>
              <option value="Annulée">Annulée</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-bold uppercase border-b border-gray-100 text-[10px] tracking-wide">
                <th className="py-3 px-4">Locataire</th>
                <th className="py-3 px-4">Véhicule</th>
                <th className="py-3 px-4 text-center">Dates</th>
                <th className="py-3 px-4 text-right">Règlements</th>
                <th className="py-3 px-4 text-center">Caution</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-gray-400 font-medium">
                    Aucune réservation ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredReservations.map(res => {
                  const resEndDateOnly = res.endDate.split('T')[0];
                  const isPastDue = res.status === 'Location En cours' && resEndDateOnly < systemDateStr;
                  const isDueToday = res.status === 'Location En cours' && resEndDateOnly === systemDateStr;
                  const isFullyPaid = res.advancePaid >= res.totalAmount;
                  const isUnpaid = res.advancePaid === 0;

                  return (
                    <tr 
                      key={res.id}
                      className={`hover:bg-gray-50/50 transition ${
                        isDueToday ? 'bg-amber-50/40' : isPastDue ? 'bg-rose-50/30' : ''
                      }`}
                      id={`res-row-${res.id}`}
                    >
                      {/* Locataire */}
                      <td className="py-4 px-4">
                        <div className="font-extrabold text-gray-800">{res.clientName}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{res.clientPhone}</div>
                        {res.clientDrivingLicense && (
                          <div className="text-[10px] text-gray-400 mt-0.5">
                            Permis: <span className="font-mono font-bold text-gray-600">{res.clientDrivingLicense}</span>
                            {res.clientNationality && ` (${res.clientNationality})`}
                          </div>
                        )}
                        <div className="text-[10px] text-gray-400 font-mono mt-0.5">#{res.id}</div>
                      </td>

                      {/* Véhicule */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-700">{res.carBrandModel}</div>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          <span className="text-[10px] text-gray-500 font-mono font-semibold bg-gray-100 border border-gray-200 rounded px-1.5 py-0.5 w-max">
                            {res.carRegistration}
                          </span>
                          <span className="text-[10px] text-[#0F2C59] font-bold bg-blue-50 border border-blue-100 rounded px-1.5 py-0.5 w-max">
                            {cars.find(c => c.id === res.carId)?.transmission || 'Manuelle'}
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1 flex flex-wrap gap-1 font-mono">
                          {res.startMileage !== undefined && (
                            <span className="bg-gray-50 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200" title="Kilométrage Départ">
                              Départ: {res.startMileage.toLocaleString('fr-TN')} km
                            </span>
                          )}
                          {res.returnMileage !== undefined && (
                            <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded border border-emerald-200 font-bold" title="Kilométrage Retour">
                              Retour: {res.returnMileage.toLocaleString('fr-TN')} km
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-4 px-4 text-center space-y-1">
                        <div className="font-medium text-gray-800">{formatDateTime(res.startDate)} → {formatDateTime(res.endDate)}</div>
                        <div className="text-[10px] text-gray-500">
                          <strong className="text-gray-700">{res.days}</strong> Jours
                        </div>
                        {isDueToday && (
                          <span className="inline-block text-[9px] bg-amber-100 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded-full animate-pulse">
                            Retour aujourd'hui
                          </span>
                        )}
                        {isPastDue && (
                          <span className="inline-block text-[9px] bg-rose-100 text-rose-800 border border-rose-200 font-bold px-2 py-0.5 rounded-full">
                            En retard
                          </span>
                        )}
                      </td>

                      {/* Règlements */}
                      <td className="py-4 px-4 text-right space-y-1">
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold mr-1">Total</span>
                          <span className="font-bold text-gray-800">{(Number(res.totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold mr-1">Payé</span>
                          <span className="font-semibold text-emerald-600">{(Number(res.advancePaid) || 0).toLocaleString('fr-TN')} DT</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-gray-400 uppercase font-bold mr-1">Reste</span>
                          <span className={`font-semibold ${res.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {(Number(res.remainingAmount) || 0).toLocaleString('fr-TN')} DT
                          </span>
                        </div>
                        <div className="pt-1 flex justify-end">
                          {isFullyPaid ? (
                            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md">
                              ✓ Payée
                            </span>
                          ) : isUnpaid ? (
                            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 rounded-md">
                              Non Payée
                            </span>
                          ) : (
                            <span className="inline-block text-[9px] font-extrabold px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded-md">
                              Part. Payée
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Caution */}
                      <td className="py-4 px-4 text-center font-mono text-gray-600 text-xs">
                        {(Number(res.deposit) || 0).toLocaleString('fr-TN')} DT
                      </td>

                      {/* Statut — dropdown stylisé comme badge */}
                      <td className="py-4 px-4 text-center">
                        <select
                          value={res.status}
                          onChange={e => handleStatusChange(res.id, e.target.value as any)}
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none transition-all ${getStatusStyle(res.status)}`}
                        >
                          <option value="Réservation En attente">Réservation En attente</option>
                          <option value="Réservation Confirmée">Réservation Confirmée</option>
                          <option value="Location En cours">Location En cours</option>
                          <option value="Terminée">Terminée</option>
                          <option value="Annulée">Annulée</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isFullyPaid && (
                            <button
                              onClick={() => openPaymentModal(res.id)}
                              className="p-1.5 text-emerald-700 hover:text-white bg-emerald-50 hover:bg-emerald-600 border border-emerald-200 hover:border-emerald-600 rounded-lg transition cursor-pointer"
                              title="Confirmer un paiement"
                            >
                              <DollarSign size={12} />
                            </button>
                          )}
                          <button
                            onClick={() => openEditModal(res.id)}
                            className="p-1.5 text-amber-700 hover:text-white bg-amber-50 hover:bg-amber-600 border border-amber-200 hover:border-amber-600 rounded-lg transition cursor-pointer"
                            title="Modifier / Prolonger la réservation"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onNavigate('billing', { reservationId: res.id })}
                            className="p-1.5 text-gray-500 hover:text-blue-900 bg-gray-100 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition cursor-pointer"
                            title="Voir / Créer la Facture"
                          >
                            <FileText size={12} />
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(res.id)}
                            className="p-1.5 text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Prolongation Modal */}
      {editModalOpen && editResId && (() => {
        const res = reservations.find(r => r.id === editResId);
        if (!res) return null;
        const preview = getEditPreview();
        return (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-lg w-full overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Edit2 size={16} />
                    Modifier / Prolonger la Réservation
                  </h3>
                  <p className="text-[11px] text-amber-100 mt-0.5 font-mono">{res.id}</p>
                </div>
                <button onClick={() => setEditModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer p-1 hover:bg-white/10 rounded-lg transition">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Button to open full contract edit */}
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    onNavigate('reserve', { editReservation: res });
                  }}
                  className="w-full py-2.5 bg-[#0F2C59] hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition shadow-xs"
                >
                  <Edit2 size={15} />
                  Modifier le Contrat Complet (Mêmes coordonnées : Nom, CIN, Dates, Voiture, Tarifs)
                </button>

                {/* Client & Vehicle Info Banner */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-extrabold text-amber-900">{res.clientName}</p>
                      <p className="text-amber-700">{res.carBrandModel} — <span className="font-mono font-bold">{res.carRegistration}</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-amber-600 uppercase font-bold">Début</p>
                      <p className="font-bold text-amber-900">{formatDateTime(res.startDate)}</p>
                    </div>
                  </div>
                </div>

                {/* Current → New Date */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Clock size={13} className="text-amber-500" />
                    Nouvelle Date de Retour *
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 font-mono">
                      {formatDateTime(res.endDate)}
                    </div>
                    <ArrowRight size={16} className="text-amber-500 shrink-0" />
                    <input
                      type="datetime-local"
                      value={editEndDate}
                      onChange={e => setEditEndDate(e.target.value)}
                      className="flex-1 border border-amber-300 focus:border-amber-500 rounded-lg px-3 py-2 text-xs focus:outline-none bg-amber-50 font-mono"
                    />
                  </div>
                </div>

                {/* Price & Deposit */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Prix / Jour (DT)</label>
                    <input
                      type="number"
                      min={0}
                      value={editPricePerDay}
                      onChange={e => setEditPricePerDay(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-gray-700">Caution (DT)</label>
                    <input
                      type="number"
                      min={0}
                      value={editDeposit}
                      onChange={e => setEditDeposit(Number(e.target.value))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Live Preview Panel */}
                {preview && (
                  <div className="bg-[#0F2C59] rounded-xl p-4 text-white space-y-2">
                    <p className="text-[10px] uppercase font-bold text-blue-300 tracking-widest">Aperçu des modifications</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-[9px] text-blue-200 uppercase font-bold">Durée</p>
                        <p className="font-extrabold text-sm text-white">{preview.newDays} <span className="text-[10px] font-normal">jours</span></p>
                        {preview.prolongDays !== 0 && (
                          <p className={`text-[9px] font-bold mt-0.5 ${
                            preview.prolongDays > 0 ? 'text-amber-300' : 'text-rose-300'
                          }`}>
                            {preview.prolongDays > 0 ? '+' : ''}{preview.prolongDays}j
                          </p>
                        )}
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-[9px] text-blue-200 uppercase font-bold">Nouveau Total</p>
                        <p className="font-extrabold text-sm text-amber-300">{(Number(preview.newTotal) || 0).toLocaleString('fr-TN')} <span className="text-[10px]">DT</span></p>
                        {preview.newTotal !== res.totalAmount && (
                          <p className={`text-[9px] font-bold mt-0.5 ${
                            preview.newTotal > res.totalAmount ? 'text-amber-300' : 'text-rose-300'
                          }`}>
                            {preview.newTotal > res.totalAmount ? '+' : ''}{(Number(preview.newTotal - res.totalAmount) || 0).toLocaleString('fr-TN')} DT
                          </p>
                        )}
                      </div>
                      <div className="bg-white/10 rounded-lg p-2">
                        <p className="text-[9px] text-blue-200 uppercase font-bold">Reste à Payer</p>
                        <p className="font-extrabold text-sm text-emerald-300">{(Number(preview.newRemaining) || 0).toLocaleString('fr-TN')} <span className="text-[10px]">DT</span></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 pb-6 flex justify-end gap-2">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 font-bold cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  onClick={executeEdit}
                  disabled={!editEndDate}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                >
                  <CheckCircle size={13} />
                  Enregistrer les Modifications
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full overflow-hidden">
            <div className="bg-rose-600 text-white px-5 py-4 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <AlertTriangle size={16} />
                Confirmation de suppression
              </h3>
              <button onClick={() => setDeleteConfirmOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-gray-700 font-medium">
                Êtes-vous sûr de vouloir supprimer cette réservation ?
              </p>
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex items-start gap-2 text-[11px] text-rose-800 font-semibold">
                <AlertTriangle size={12} className="shrink-0 mt-0.5 text-rose-600" />
                <span>Cette action est définitive. La réservation sera effacée de la base de données et le véhicule sera libéré.</span>
              </div>
            </div>
            <div className="px-5 pb-5 flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={executeDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={12} />
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Confirmation Modal */}
      {paymentModalOpen && paymentResId && (() => {
        const res = reservations.find(r => r.id === paymentResId);
        if (!res) return null;
        return (
          <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
              <div className="bg-emerald-600 text-white px-5 py-4 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <DollarSign size={16} />
                  Confirmer le Paiement
                </h3>
                <button onClick={() => setPaymentModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                {/* Reservation summary */}
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client</span>
                    <span className="font-bold text-gray-800">{res.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Véhicule</span>
                    <span className="font-semibold text-gray-700">{res.carBrandModel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Montant Total</span>
                    <span className="font-bold text-gray-800">{(Number(res.totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Déjà Payé</span>
                    <span className="font-bold text-emerald-600">{(Number(res.advancePaid) || 0).toLocaleString('fr-TN')} DT</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                    <span className="text-gray-500 font-bold">Reste à Payer</span>
                    <span className="font-extrabold text-amber-600">{(Number(res.remainingAmount) || 0).toLocaleString('fr-TN')} DT</span>
                  </div>
                </div>

                {/* Payment type selector */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setPaymentType('full'); setPaymentAmount(String(res.remainingAmount)); }}
                    className={`flex-1 py-2 border rounded-lg text-xs font-bold transition cursor-pointer ${
                      paymentType === 'full'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Paiement Total
                  </button>
                  <button
                    type="button"
                    onClick={() => { setPaymentType('partial'); setPaymentAmount(''); }}
                    className={`flex-1 py-2 border rounded-lg text-xs font-bold transition cursor-pointer ${
                      paymentType === 'partial'
                        ? 'bg-amber-50 text-amber-800 border-amber-300'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Paiement Partiel
                  </button>
                </div>

                {/* Amount input for partial */}
                {paymentType === 'partial' && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Montant à payer (DT)</label>
                    <input
                      type="number"
                      min={1}
                      max={res.remainingAmount}
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder={`Max: ${(Number(res.remainingAmount) || 0).toLocaleString('fr-TN')} DT`}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none font-bold text-center text-gray-800"
                      autoFocus
                    />
                  </div>
                )}

                {/* Confirmation amount display */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <p className="text-[10px] text-emerald-600 uppercase font-bold">Montant du paiement</p>
                  <p className="text-xl font-black text-emerald-700 mt-1">
                    {paymentType === 'full'
                      ? res.remainingAmount.toLocaleString('fr-TN')
                      : (Number(paymentAmount) || 0).toLocaleString('fr-TN')
                    } DT
                  </p>
                </div>
              </div>
              <div className="px-5 pb-5 flex justify-end gap-2">
                <button
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 font-bold cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  onClick={executePayment}
                  disabled={paymentType === 'partial' && (!paymentAmount || Number(paymentAmount) <= 0 || Number(paymentAmount) > res.remainingAmount)}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                >
                  <CheckCircle size={12} />
                  Confirmer le Paiement
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Return Vehicle Modal */}
      {returnModalOpen && returnResId && (() => {
        const res = reservations.find(r => r.id === returnResId);
        if (!res) return null;
        const car = cars.find(c => c.id === res.carId);
        const startKm = res.startMileage || (car ? car.mileage : 0);
        const kmDriven = Math.max(0, returnMileageInput - startKm);
        const currentCarKm = car ? car.mileage : startKm;
        const lastVidangeKm = car?.lastVidangeMileage || 0;
        const totalKmSinceVidange = (returnMileageInput > currentCarKm ? returnMileageInput : currentCarKm) - lastVidangeKm;
        const isVidangeAlert = totalKmSinceVidange >= 9500;

        return (
          <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 max-w-md w-full overflow-hidden">
              <div className="bg-[#0F2C59] text-white px-5 py-4 flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <RotateCcw size={16} className="text-amber-400" />
                  Enregistrer le Retour du Véhicule
                </h3>
                <button onClick={() => setReturnModalOpen(false)} className="text-white/80 hover:text-white cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Vehicle and Client details */}
                <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Client:</span>
                    <span className="font-bold text-gray-800">{res.clientName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Véhicule:</span>
                    <span className="font-semibold text-[#0F2C59]">{res.carBrandModel} ({res.carRegistration})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Kilométrage de Départ:</span>
                    <span className="font-mono font-bold text-gray-700">{startKm.toLocaleString('fr-TN')} Km</span>
                  </div>
                </div>

                {/* Return Mileage Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Gauge size={14} className="text-[#0F2C59]" />
                    Kilométrage au Retour (Km Retour) *
                  </label>
                  <input
                    type="number"
                    min={startKm}
                    value={returnMileageInput}
                    onChange={e => setReturnMileageInput(Number(e.target.value))}
                    className="w-full border border-blue-300 focus:border-blue-600 rounded-lg px-3 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none bg-white"
                  />
                  <div className="flex justify-between text-[11px] text-gray-500 pt-0.5">
                    <span>Distance parcourue cette location:</span>
                    <span className="font-bold text-blue-900 font-mono">{kmDriven.toLocaleString('fr-TN')} Km</span>
                  </div>
                </div>

                {/* Vidange Warning indicator */}
                {isVidangeAlert && (
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-900 font-medium">
                    <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-bold">⚠️ Alerte Vidange requise !</p>
                      <p className="text-[11px] text-amber-800">
                        Ce véhicule aura cumulé <strong>{totalKmSinceVidange.toLocaleString('fr-TN')} Km</strong> depuis la dernière vidange (Seuil : 9 500 Km). Une alerte vidange sera affichée sur le tableau de bord.
                      </p>
                    </div>
                  </div>
                )}

                {/* Remaining Payment Input */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-gray-700">Règlement du Solde Restant (DT)</label>
                  <input
                    type="number"
                    min={0}
                    max={res.remainingAmount}
                    value={returnPaymentAmount}
                    onChange={e => setReturnPaymentAmount(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none font-bold text-gray-800"
                  />
                  <p className="text-[10px] text-gray-400">Reste dû initial : {res.remainingAmount.toLocaleString('fr-TN')} DT</p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="px-5 pb-5 flex justify-end gap-2">
                <button
                  onClick={() => setReturnModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-xs text-gray-600 hover:bg-gray-50 font-bold cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  onClick={executeReturn}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <CheckCircle size={14} />
                  Valider le Retour et le Kilométrage
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
