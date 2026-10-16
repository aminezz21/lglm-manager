import React, { useState, useEffect } from 'react';
import { 
  Car as CarIcon, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  PlusCircle, 
  CheckCircle, 
  ArrowRight,
  UserCheck,
  RotateCcw,
  Clock
} from 'lucide-react';
import { Car, Reservation, RevenueRecord } from '../types';
import { DBManager } from '../utils/db';

interface DashboardProps {
  onNavigate: (view: string, data?: any) => void;
  cars: Car[];
  reservations: Reservation[];
  revenues: RevenueRecord[];
}

export default function Dashboard({ onNavigate, cars, reservations, revenues }: DashboardProps) {
  const [todayAlerts, setTodayAlerts] = useState<Reservation[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(null);

  // Use the real current date
  const now = new Date();
  const systemDateStr = now.toISOString().split('T')[0];

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

  useEffect(() => {
    // Filter vehicles returning today (check return date without time)
    const alerts = reservations.filter(r => r.endDate.split('T')[0] === systemDateStr && r.status === 'Location En cours');
    setTodayAlerts(alerts);
  }, [reservations]);

  // Statistics calculations
  const totalCars = cars.length;
  const availableCars = cars.filter(c => c.status === 'Disponible').length;
  const rentedCars = cars.filter(c => c.status === 'Louée').length;
  const activeReservations = reservations.filter(r => r.status === 'Location En cours').length;

  // Monthly / Annual revenues
  const currentYear = now.getFullYear();
  const currentMonthNum = now.getMonth() + 1; // 1-indexed

  // Helper to check if a date string is in the current month/year
  const getRevenuesByPeriod = () => {
    let monthly = 0;
    let annual = 0;

    revenues.forEach(rev => {
      const revDate = new Date(rev.date);
      if (!isNaN(revDate.getTime())) {
        const y = revDate.getFullYear();
        const m = revDate.getMonth() + 1; // 1-indexed

        if (y === currentYear) {
          annual += rev.amount;
          if (m === currentMonthNum) {
            monthly += rev.amount;
          }
        }
      } else {
        // Fallback parse for "YYYY-MM-DD" simple format
        const parts = rev.date.split('-');
        if (parts.length >= 2) {
          const y = parseInt(parts[0]);
          const m = parseInt(parts[1]);
          if (y === currentYear) {
            annual += rev.amount;
            if (m === currentMonthNum) {
              monthly += rev.amount;
            }
          }
        }
      }
    });

    return { monthly, annual };
  };

  const { monthly: monthlyRevenue, annual: annualRevenue } = getRevenuesByPeriod();

  // Monthly Revenue Chart Data
  const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
  // Show the last 6 months up to current month
  const monthsList = [];
  for (let i = 5; i >= 0; i--) {
    let m = currentMonthNum - i;
    let y = currentYear;
    if (m <= 0) { m += 12; y -= 1; }
    monthsList.push({ name: monthNames[m - 1], key: m, year: y });
  }

  // Calculate dynamic amounts for months based on revenues table
  const monthlyData = monthsList.map(m => {
    let amount = 0;
    revenues.forEach(rev => {
      const parts = rev.date.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0]);
        const monthNum = parseInt(parts[1]);
        if (y === m.year && monthNum === m.key) {
          amount += rev.amount;
        }
      }
    });
    return { name: m.name, amount };
  });

  const maxRevenue = Math.max(...monthlyData.map(d => d.amount), 5000);

  // Cars needing Vidange calculation (distance since last vidange >= 9,500 km)
  const carsNeedingVidange = cars.filter(c => {
    const lastKm = c.lastVidangeMileage || 0;
    const driven = (c.mileage || 0) - lastKm;
    return driven >= 9500;
  });

  const handleDoVidange = (carId: string) => {
    DBManager.performVidange(carId);
    window.location.reload(); // Refresh app state
  };

  return (
    <div className="space-y-6" id="dashboard-root">
      {/* Upper Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F2C59] to-[#1e4881] text-white rounded-xl p-6 shadow-md relative overflow-hidden" id="welcome-banner">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
        <div className="relative z-10">
          <h1 className="text-2xl font-bold font-sans">LGLM Manager</h1>
          <p className="text-blue-100 mt-1 max-w-xl">
            Bienvenue dans votre outil professionnel de gestion de flotte et de location. Date système : <strong className="text-white">{now.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <button 
              onClick={() => onNavigate('reserve')}
              className="flex items-center gap-2 bg-white text-[#0F2C59] font-semibold px-4 py-2 rounded-lg text-sm hover:bg-blue-50 transition cursor-pointer"
              id="quick-add-res-btn"
            >
              <PlusCircle size={16} />
              Nouvelle Réservation
            </button>
            <button 
              onClick={() => onNavigate('cars')}
              className="flex items-center gap-2 bg-blue-900 bg-opacity-40 border border-blue-300 border-opacity-30 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-opacity-60 transition cursor-pointer"
              id="quick-add-car-btn"
            >
              <CarIcon size={16} />
              Ajouter Véhicule
            </button>
          </div>
        </div>
      </div>

      {/* VIDANGE MAINTENANCE ALERTS SECTION (≥ 9,500 KM) */}
      {carsNeedingVidange.length > 0 && (
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white rounded-xl p-5 shadow-lg border border-red-500 animate-pulse-once" id="vidange-alerts-section">
          <div className="flex items-center justify-between pb-3 border-b border-white/20">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/20 p-2 rounded-lg">
                <AlertTriangle size={22} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="font-extrabold text-base tracking-wide flex items-center gap-2">
                  ALERTES VIDANGE OBLIGATOIRE (SEUIL 9 500 KM)
                </h3>
                <p className="text-xs text-red-100">
                  {carsNeedingVidange.length} véhicule(s) ont franchi ou dépassé le seuil de 9 500 km parcourus depuis la dernière vidange.
                </p>
              </div>
            </div>
            <span className="bg-white text-red-700 text-xs font-black px-3 py-1 rounded-full shadow-xs">
              {carsNeedingVidange.length} Alerte(s) Vidange
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
            {carsNeedingVidange.map(car => {
              const lastKm = car.lastVidangeMileage || 0;
              const driven = car.mileage - lastKm;
              return (
                <div key={car.id} className="bg-white text-gray-900 rounded-xl p-4 shadow-sm border border-red-100 flex flex-col justify-between space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-gray-900">{car.brand} {car.model}</h4>
                      <p className="text-xs font-mono font-bold text-red-700 bg-red-50 border border-red-200 rounded px-2 py-0.5 w-max mt-1">
                        {car.registration}
                      </p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-1 bg-red-100 text-red-800 rounded-md border border-red-200">
                      Vidange Requis
                    </span>
                  </div>

                  <div className="bg-gray-50 p-2.5 rounded-lg text-xs space-y-1 font-mono">
                    <div className="flex justify-between text-gray-600">
                      <span>Kilométrage Actuel :</span>
                      <strong className="text-gray-900">{car.mileage.toLocaleString('fr-TN')} km</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Dernière Vidange :</span>
                      <span>{lastKm.toLocaleString('fr-TN')} km</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-1 text-red-700 font-bold">
                      <span>Parcouru depuis vidange :</span>
                      <span>{driven.toLocaleString('fr-TN')} / 9 500 km</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDoVidange(car.id)}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                  >
                    <CheckCircle size={14} />
                    Valider la Vidange (Réinitialiser Compteur)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" id="kpi-grid">
        {/* Total Voitures */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-cars">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Parc Automobile</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalCars} véhicules</h3>
            <div className="flex gap-2 text-xs text-gray-500 mt-2">
              <span className="flex items-center gap-1 text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                ● {availableCars} dispo
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                ● {rentedCars} loués
              </span>
            </div>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-[#0F2C59]">
            <CarIcon size={24} />
          </div>
        </div>

        {/* Réservations Actives */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-reservations">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Locations Actives</p>
            <h3 className="text-2xl font-bold text-gray-800 mt-1">{activeReservations} contrats</h3>
            <p className="text-xs text-gray-400 mt-2">
              Total historique : {reservations.length}
            </p>
          </div>
          <div className="bg-sky-50 p-3 rounded-lg text-sky-700">
            <Calendar size={24} />
          </div>
        </div>

        {/* Chiffre Mensuel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-monthly-rev">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenus du mois ({monthNames[currentMonthNum - 1]})</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{(Number(monthlyRevenue) || 0).toLocaleString('fr-TN')} DT</h3>
            <p className="text-xs text-gray-400 mt-2">
              TVA comprise (le cas échéant)
            </p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <TrendingUp size={24} />
          </div>
        </div>

        {/* Chiffre Annuel */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between" id="kpi-annual-rev">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Revenus de l'année {currentYear}</p>
            <h3 className="text-2xl font-bold text-blue-900 mt-1">{(Number(annualRevenue) || 0).toLocaleString('fr-TN')} DT</h3>
            <p className="text-xs text-gray-400 mt-2">
              Objectif annuel en bonne voie
            </p>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-900">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Main Panel Content: Today's Alerts & Income Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="dashboard-main-panels">
        {/* Left Column: Revenue Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs lg:col-span-2 flex flex-col justify-between" id="revenue-chart-panel">
          <div>
            <div className="flex justify-between items-center pb-4 border-b border-gray-50">
              <h4 className="font-bold text-gray-800">Graphique des Revenus Mensuels (DT)</h4>
              <span className="text-xs text-gray-500 font-medium">Année en cours : {currentYear}</span>
            </div>

            {/* Custom interactive Chart built with pure SVGs */}
            <div className="mt-6 relative" id="svg-chart-container">
              <div className="w-full flex items-end gap-4 px-2" style={{ height: '192px' }}>
                {monthlyData.map((d, idx) => {
                  const barHeight = Math.max((d.amount / maxRevenue) * 176, 6);
                  const isSelected = selectedMonthIndex === idx;
                  return (
                    <div 
                      key={idx} 
                      className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
                      style={{ height: '100%' }}
                      onMouseEnter={() => setSelectedMonthIndex(idx)}
                      onMouseLeave={() => setSelectedMonthIndex(null)}
                    >
                      <div className="w-full flex flex-col items-center justify-end relative" style={{ flex: 1 }}>
                        {/* Tooltip */}
                        <div className={`absolute bottom-full mb-2 bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg transition-opacity pointer-events-none whitespace-nowrap z-20 ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          {(Number(d.amount) || 0).toLocaleString('fr-TN')} DT
                        </div>
                        
                        {/* Bar */}
                        <div 
                          className={`w-full rounded-t-md transition-all duration-300 ${
                            isSelected 
                              ? 'bg-[#0F2C59] shadow-md shadow-blue-200' 
                              : 'bg-blue-500/70 group-hover:bg-blue-500/90'
                          }`}
                          style={{ height: `${barHeight}px` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 font-medium mt-2 shrink-0">{d.name}</span>
                    </div>
                  );
                })}
              </div>

              {/* Y-Axis guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none -z-10 border-b border-gray-100" style={{ height: '192px' }}>
                <div className="w-full border-t border-dashed border-gray-100"></div>
                <div className="w-full border-t border-dashed border-gray-100"></div>
                <div className="w-full border-t border-dashed border-gray-100"></div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between text-xs text-gray-600 mt-4">
            <span>💡 Passez la souris sur une barre pour voir les détails.</span>
            <button 
              onClick={() => onNavigate('finance')} 
              className="text-[#0F2C59] font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              Voir la finance <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Right Column: Return Alerts of the Day */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between" id="today-alerts-panel">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-50">
              <h4 className="font-bold text-gray-800 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" size={18} />
                Retours de Véhicules
              </h4>
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">
                {todayAlerts.length} Aujourd'hui
              </span>
            </div>

            <div className="mt-4 space-y-3 overflow-y-auto max-h-56" id="alerts-list">
              {todayAlerts.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <CheckCircle size={32} className="mx-auto text-emerald-500 opacity-60 mb-2" />
                  <p className="text-sm">Aucun véhicule à retourner aujourd'hui.</p>
                </div>
              ) : (
                todayAlerts.map(alert => (
                  <div 
                    key={alert.id}
                    className="p-3 bg-amber-50 bg-opacity-50 border border-amber-100 rounded-lg flex flex-col justify-between gap-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h5 className="font-semibold text-gray-800 text-sm">{alert.clientName}</h5>
                        <p className="text-xs text-gray-500">{alert.clientPhone}</p>
                        {alert.endDate.includes('T') && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-800 font-semibold mt-1">
                            <Clock size={12} className="text-amber-600" />
                            <span>Retour à : {alert.endDate.split('T')[1]}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-mono font-bold bg-white border border-amber-200 px-1.5 py-0.5 rounded text-amber-800">
                        {alert.carRegistration}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-amber-100/60 pt-2 text-xs">
                      <span className="font-medium text-gray-700">{alert.carBrandModel}</span>
                      <button
                        onClick={() => onNavigate('reservations', { search: alert.clientName })}
                        className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                      >
                        Enregistrer Retour <RotateCcw size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reservations')}
            className="w-full mt-4 border border-gray-200 text-gray-700 hover:bg-gray-50 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            Consulter toute la liste des locations
          </button>
        </div>
      </div>

      {/* Bottom Panel: Recent Reservations List */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-xs" id="recent-reservations-panel">
        <div className="flex justify-between items-center pb-4 border-b border-gray-50 mb-4">
          <h4 className="font-bold text-gray-800">Dernières Activités & Contrats</h4>
          <button 
            onClick={() => onNavigate('reservations')}
            className="text-[#0F2C59] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            Voir tout <ArrowRight size={12} />
          </button>
        </div>

        <div className="overflow-x-auto" id="recent-reservations-table">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-100">
                <th className="py-3 px-4">ID Contrat</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Véhicule</th>
                <th className="py-3 px-4">Période</th>
                <th className="py-3 px-4 text-right">Montant</th>
                <th className="py-3 px-4 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reservations.slice(0, 5).map(res => (
                <tr key={res.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-gray-600">{res.id}</td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-gray-800">{res.clientName}</div>
                    <div className="text-xs text-gray-400">{res.clientPhone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-gray-700 font-medium">{res.carBrandModel}</div>
                    <div className="text-xs text-gray-400 font-mono">{res.carRegistration}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    <div className="text-xs font-semibold">{formatDateTime(res.startDate)} au {formatDateTime(res.endDate)}</div>
                    <div className="text-xs text-gray-400">{res.days} Jours</div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="font-bold text-gray-800">{(Number(res.totalAmount) || 0).toLocaleString('fr-TN')} DT</div>
                    <div className="text-xs text-emerald-600 font-semibold">Payé: {(Number(res.advancePaid) || 0).toLocaleString('fr-TN')} DT</div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                      res.status === 'Location En cours'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : res.status === 'Terminée'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : res.status === 'Annulée'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : res.status === 'Réservation En attente'
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {res.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
