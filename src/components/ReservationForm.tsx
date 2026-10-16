import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  FileText, 
  CreditCard, 
  Calendar, 
  Car as CarIcon, 
  DollarSign, 
  Printer, 
  CheckCircle,
  FileCheck,
  RotateCcw,
  Signature
} from 'lucide-react';
import { Car, Client, Reservation, AppSettings } from '../types';
import { DBManager } from '../utils/db';

interface ReservationFormProps {
  cars: Car[];
  onReservationCreated: () => void;
  onNavigate: (view: string) => void;
  settings: AppSettings;
  editingReservation?: Reservation | null;
}

export default function ReservationForm({ cars, onReservationCreated, onNavigate, settings, editingReservation }: ReservationFormProps) {
  const availableCars = cars.filter(c => c.status === 'Disponible' || c.id === editingReservation?.carId);

  // Form Client State
  const [fullName, setFullName] = useState('');
  const [idCard, setIdCard] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [nationality, setNationality] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [licenseIssueDate, setLicenseIssueDate] = useState('');

  // 2nd Driver Info
  const [showSecondDriver, setShowSecondDriver] = useState(false);
  const [secondDriverName, setSecondDriverName] = useState('');
  const [secondDriverIdCard, setSecondDriverIdCard] = useState('');
  const [secondDriverPhone, setSecondDriverPhone] = useState('');

  // Form Vehicle & Mileage State
  const [selectedCarId, setSelectedCarId] = useState('');
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [startMileage, setStartMileage] = useState<number>(0);
  const [returnMileage, setReturnMileage] = useState<number | ''>('');

  // Form Rental Info State
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const tzOffset = nextWeek.getTimezoneOffset() * 60000;
    return new Date(nextWeek.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [pricePerDay, setPricePerDay] = useState(0);

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
  const [advancePaid, setAdvancePaid] = useState(0);
  const [deposit, setDeposit] = useState(2000); // Default caution 2000 DT

  // Derived Calculations State
  const [days, setDays] = useState(7);
  const [totalAmount, setTotalAmount] = useState(0);
  const [remainingAmount, setRemainingAmount] = useState(0);

  // Step state: 'form' | 'contract' | 'success'
  const [step, setStep] = useState<'form' | 'contract' | 'success'>('form');
  const [generatedReservation, setGeneratedReservation] = useState<Reservation | null>(null);

  // Canvas ref for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  // Pre-fill fields if editing existing reservation
  useEffect(() => {
    if (editingReservation) {
      setFullName(editingReservation.clientName || '');
      setPhone(editingReservation.clientPhone || '');
      setNationality(editingReservation.clientNationality || '');
      setDrivingLicense(editingReservation.clientDrivingLicense || '');
      setLicenseIssueDate(editingReservation.clientLicenseIssueDate || '');
      setStartMileage(editingReservation.startMileage !== undefined ? editingReservation.startMileage : 0);
      setReturnMileage(editingReservation.returnMileage !== undefined ? editingReservation.returnMileage : '');

      const clients = DBManager.getClients();
      const client = clients.find(c => c.id === editingReservation.clientId || c.fullName.toLowerCase() === editingReservation.clientName.toLowerCase());
      if (client) {
        setIdCard(client.idCard || '');
        setAddress(client.address || '');
        setEmail(client.email || '');
      }

      if (editingReservation.secondDriverName) {
        setShowSecondDriver(true);
        setSecondDriverName(editingReservation.secondDriverName);
        setSecondDriverIdCard(editingReservation.secondDriverIdCard || '');
        setSecondDriverPhone(editingReservation.secondDriverPhone || '');
      }

      setSelectedCarId(editingReservation.carId);
      setStartDate(editingReservation.startDate);
      setEndDate(editingReservation.endDate);
      setPricePerDay(editingReservation.pricePerDay);
      setAdvancePaid(editingReservation.advancePaid);
      setDeposit(editingReservation.deposit);
    }
  }, [editingReservation]);

  // Handle selected car update
  useEffect(() => {
    if (selectedCarId) {
      const car = cars.find(c => c.id === selectedCarId);
      if (car) {
        setSelectedCar(car);
        if (!editingReservation) {
          setPricePerDay(car.pricePerDay);
          setStartMileage(car.mileage || 0);
        }
      }
    } else {
      setSelectedCar(null);
    }
  }, [selectedCarId, cars, editingReservation]);

  // Handle rental calculation updates
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end.getTime() - start.getTime();
      const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      setDays(calculatedDays);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const total = days * pricePerDay;
    setTotalAmount(total);
    setRemainingAmount(Math.max(0, total - advancePaid));
  }, [days, pricePerDay, advancePaid]);

  // Initialize Canvas
  useEffect(() => {
    if (step === 'contract' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0F2C59';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
      }
    }
  }, [step]);

  // Drawing mouse handlers for Signature Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const pos = getCoordinates(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pos = getCoordinates(e, canvas);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
    setSignatureDataUrl(null);
  };

  const getCoordinates = (e: any, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !idCard || !selectedCarId || !nationality || !drivingLicense || !licenseIssueDate) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, CIN, Nationalité, Permis, Date de délivrance, Véhicule).");
      return;
    }
    setStep('contract');
  };

  const handleSignAndConfirm = () => {
    if (!selectedCar) return;

    let signatureImage = null;
    if (canvasRef.current && hasSigned) {
      signatureImage = canvasRef.current.toDataURL();
      setSignatureDataUrl(signatureImage);
    }

    const reservationData = {
      clientId: "", // handled by DBManager
      clientName: fullName,
      clientPhone: phone,
      clientNationality: nationality,
      clientDrivingLicense: drivingLicense,
      clientLicenseIssueDate: licenseIssueDate,
      secondDriverName: showSecondDriver ? secondDriverName : undefined,
      secondDriverIdCard: showSecondDriver ? secondDriverIdCard : undefined,
      secondDriverPhone: showSecondDriver ? secondDriverPhone : undefined,
      carId: selectedCarId,
      carBrandModel: `${selectedCar.brand} ${selectedCar.model}`,
      carRegistration: selectedCar.registration,
      startDate,
      endDate,
      days,
      pricePerDay,
      totalAmount,
      advancePaid,
      remainingAmount,
      deposit,
      startMileage: Number(startMileage) || 0,
      returnMileage: returnMileage !== '' ? Number(returnMileage) : undefined,
      status: 'Location En cours' as const,
      hasContract: true,
      hasInvoice: false
    };

    const clientData = {
      fullName,
      idCard,
      phone,
      address,
      email,
      nationality,
      drivingLicense,
      licenseIssueDate
    };

    // Save using DBManager (create new or update existing contract)
    let res: Reservation | null;
    if (editingReservation) {
      res = DBManager.updateFullReservation(editingReservation.id, reservationData, clientData);
      if (!res) res = DBManager.createReservation(reservationData, clientData);
    } else {
      res = DBManager.createReservation(reservationData, clientData);
    }
    setGeneratedReservation(res);

    // Save signature inside reservation local storage if needed
    if (signatureImage && res) {
      localStorage.setItem(`sig_${res.id}`, signatureImage);
    }

    onReservationCreated();
    setStep('success');
  };

  const handlePrintContract = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reservation-form-container">
      {/* Step Progress indicators */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center justify-between" id="steps-header">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <FileText className="text-[#0F2C59]" />
          {editingReservation ? `Modifier le Contrat N° ${editingReservation.id}` : 'Créer un Contrat de Location'}
        </h2>
        <div className="flex items-center gap-2 text-sm" id="progress-pills">
          <span className={`px-3 py-1 rounded-full font-semibold ${step === 'form' ? 'bg-[#0F2C59] text-white' : 'bg-gray-100 text-gray-600'}`}>1. Saisie</span>
          <span className="text-gray-300">/</span>
          <span className={`px-3 py-1 rounded-full font-semibold ${step === 'contract' ? 'bg-[#0F2C59] text-white' : 'bg-gray-100 text-gray-600'}`}>2. Contrat & Signature</span>
          <span className="text-gray-300">/</span>
          <span className={`px-3 py-1 rounded-full font-semibold ${step === 'success' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>3. Terminé</span>
        </div>
      </div>

      {step === 'form' && (
        <form onSubmit={handleSubmitForm} className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="main-res-form">
          {/* CLIENT FORM CARD */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4 lg:col-span-2" id="client-form-section">
            <h3 className="font-bold text-[#0F2C59] flex items-center gap-2 pb-2 border-b border-gray-50 text-sm uppercase tracking-wide">
              <User size={18} />
              1. Informations du Client
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nom et Prénom *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Mohamed Ben Ali"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">CIN / Numéro Passeport *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: 08765432"
                  value={idCard}
                  onChange={e => setIdCard(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nationalité *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: Tunisienne"
                  value={nationality}
                  onChange={e => setNationality(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                <input 
                  type="tel"
                  placeholder="Ex: 98123456"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">N° de Permis *</label>
                <input 
                  type="text"
                  required
                  placeholder="Ex: 01/234567"
                  value={drivingLicense}
                  onChange={e => setDrivingLicense(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date de délivrance du permis *</label>
                <input 
                  type="date"
                  required
                  value={licenseIssueDate}
                  onChange={e => setLicenseIssueDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input 
                  type="email"
                  placeholder="Ex: client@email.tn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse Complète</label>
                <textarea 
                  placeholder="Ex: Avenue Habib Bourguiba, Tunis"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="md:col-span-2 mt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#0F2C59] cursor-pointer bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <input type="checkbox" checked={showSecondDriver} onChange={e => setShowSecondDriver(e.target.checked)} className="cursor-pointer" />
                  Ajouter un 2ème Conducteur au contrat (Optionnel)
                </label>
              </div>

              {showSecondDriver && (
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Nom du 2ème conducteur</label>
                    <input 
                      type="text"
                      placeholder="Ex: Sami Ben Ali"
                      value={secondDriverName}
                      onChange={e => setSecondDriverName(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">CIN / Passeport</label>
                    <input 
                      type="text"
                      placeholder="Ex: 01234567"
                      value={secondDriverIdCard}
                      onChange={e => setSecondDriverIdCard(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone</label>
                    <input 
                      type="tel"
                      placeholder="Ex: 98123456"
                      value={secondDriverPhone}
                      onChange={e => setSecondDriverPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <h3 className="font-bold text-[#0F2C59] flex items-center gap-2 pb-2 pt-4 border-b border-gray-50 text-sm uppercase tracking-wide">
              <CarIcon size={18} />
              2. Véhicule et Tarification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Sélectionner un Véhicule Disponible *</label>
                <select
                  required
                  value={selectedCarId}
                  onChange={e => setSelectedCarId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="">-- Choisissez un véhicule --</option>
                  {availableCars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.registration}) — {car.transmission || 'Manuelle'} — {(car.mileage || 0).toLocaleString('fr-TN')} Km — {car.pricePerDay} DT/jour
                    </option>
                  ))}
                </select>
                {availableCars.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Aucun véhicule n'est disponible actuellement. Veuillez en libérer ou en ajouter un nouveau.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Prix de Location Journalier (DT) *</label>
                <input 
                  type="number"
                  required
                  min={0}
                  value={pricePerDay === 0 ? '' : pricePerDay}
                  onChange={e => setPricePerDay(e.target.value === '' ? 0 : Number(e.target.value))}
                  placeholder="0"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kilométrage au Départ (Km Aller) *</label>
                <input 
                  type="number"
                  required
                  min={0}
                  value={startMileage}
                  onChange={e => setStartMileage(Number(e.target.value))}
                  placeholder="Ex: 85000"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono"
                />
                {selectedCar && (
                  <p className="text-[11px] text-[#0F2C59] bg-blue-50 border border-blue-100 rounded px-2 py-1 mt-1 font-mono">
                    ℹ️ Compteur actuel du véhicule : <strong>{(selectedCar.mileage || 0).toLocaleString('fr-TN')} Km</strong>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Kilométrage au Retour (Km Retour - Optionnel)</label>
                <input 
                  type="number"
                  min={0}
                  value={returnMileage}
                  onChange={e => setReturnMileage(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Rempli au retour du véhicule"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>

          {/* DATES & COST SUMMARY CARD */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4" id="cost-summary-section">
            <div className="space-y-4">
              <h3 className="font-bold text-[#0F2C59] flex items-center gap-2 pb-2 border-b border-gray-50 text-sm uppercase tracking-wide">
                <Calendar size={18} />
                3. Période & Paiement
              </h3>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date de Départ *</label>
                <input 
                  type="datetime-local"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Date de Retour Prévue *</label>
                <input 
                  type="datetime-local"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="bg-blue-50 p-3 rounded-lg flex items-center justify-between text-xs text-gray-700">
                <span className="font-medium">Durée totale calculée :</span>
                <span className="font-bold text-[#0F2C59] text-sm">{days} jour(s)</span>
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Caution Demandée (DT)</label>
                  <input 
                    type="number"
                    min={0}
                    value={deposit === 0 ? '' : deposit}
                    onChange={e => setDeposit(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="2000"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Avance Payée par le Client (DT)</label>
                  <input 
                    type="number"
                    min={0}
                    value={advancePaid === 0 ? '' : advancePaid}
                    onChange={e => setAdvancePaid(e.target.value === '' ? 0 : Number(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* High precision total estimation */}
              <div className="bg-[#0F2C59] text-white p-4 rounded-xl mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs opacity-80">
                  <span>Montant HT Estimé:</span>
                  <span>{(totalAmount / (1 + settings.tvaRate/100)).toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between items-center text-xs opacity-80 border-b border-blue-800 pb-1.5">
                  <span>TVA ({settings.tvaRate}%):</span>
                  <span>{(totalAmount - (totalAmount / (1 + settings.tvaRate/100))).toFixed(3)} DT</span>
                </div>
                <div className="flex justify-between items-center font-bold text-sm">
                  <span>Total TTC :</span>
                  <span className="text-lg text-amber-300">{(Number(totalAmount) || 0).toLocaleString('fr-TN')} DT</span>
                </div>
                <div className="flex justify-between items-center text-xs text-amber-100">
                  <span>Reste à payer au retour :</span>
                  <span className="font-semibold">{(Number(remainingAmount) || 0).toLocaleString('fr-TN')} DT</span>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={!selectedCarId}
              className={`w-full py-3 rounded-lg font-bold text-sm text-white transition flex items-center justify-center gap-2 cursor-pointer ${
                selectedCarId ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <FileCheck size={18} />
              Générer le Contrat de Location
            </button>
          </div>
        </form>
      )}

      {step === 'contract' && selectedCar && (
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-md max-w-4xl mx-auto space-y-6" id="contract-view-container">
          {/* Printable contract wrapper */}
          <div className="print-area p-6 border-2 border-gray-200 rounded-lg space-y-6" id="contract-printable-sheet">
            {/* Header company logo & title */}
            <div className="flex justify-between items-start border-b-2 border-gray-100 pb-4">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-[#0F2C59] tracking-wider uppercase">{settings.companyName}</h2>
                <p className="text-xs text-gray-500">{settings.address}</p>
                <p className="text-xs text-gray-500">Tél: {settings.phone} | WA: {settings.whatsApp}</p>
                <p className="text-xs text-gray-500">Email: {settings.email}</p>
              </div>
              <div className="text-right">
                <h3 className="text-lg font-extrabold text-gray-800">CONTRAT DE LOCATION</h3>
                <p className="text-xs font-mono text-gray-500">N° : CON-{new Date().getFullYear()}-TEMP</p>
                <p className="text-xs text-gray-400">Date d'édition : {new Date().toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            {/* Contract terms general description */}
            <p className="text-xs text-gray-700 leading-relaxed text-justify">
              Il a été convenu et arrêté ce qui suit entre l'agence de location de voitures <strong>{settings.companyName}</strong> d'une part, et le client désigné ci-après d'autre part. Le client déclare accepter les termes et conditions générales de location figurant au dos du présent contrat.
            </p>

            {/* Two Column details: Client vs Vehicle */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-[#0F2C59] border-b border-gray-200 pb-1 text-xs uppercase">LES COORDONNÉES DU LOCATAIRE</h4>
                <p className="text-xs text-gray-700"><strong>Nom Complet:</strong> {fullName}</p>
                <p className="text-xs text-gray-700"><strong>CIN / Passeport:</strong> <span className="font-mono">{idCard}</span></p>
                <p className="text-xs text-gray-700"><strong>Nationalité:</strong> {nationality}</p>
                <p className="text-xs text-gray-700"><strong>Téléphone:</strong> {phone}</p>
                <p className="text-xs text-gray-700"><strong>N° de Permis:</strong> <span className="font-mono">{drivingLicense}</span></p>
                <p className="text-xs text-gray-700"><strong>Délivré le:</strong> {licenseIssueDate ? new Date(licenseIssueDate).toLocaleDateString('fr-FR') : ''}</p>
                {email && <p className="text-xs text-gray-700"><strong>Email:</strong> {email}</p>}
                {address && <p className="text-xs text-gray-700"><strong>Adresse:</strong> {address}</p>}
                
                {showSecondDriver && secondDriverName && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-700"><strong>2ème Conducteur:</strong> {secondDriverName}</p>
                    <p className="text-xs text-gray-700"><strong>CIN:</strong> {secondDriverIdCard} | <strong>Tél:</strong> {secondDriverPhone}</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <h4 className="font-bold text-[#0F2C59] border-b border-gray-200 pb-1 text-xs uppercase">LE VÉHICULE EN LOCATION</h4>
                <p className="text-xs text-gray-700"><strong>Marque & Modèle:</strong> {selectedCar.brand} {selectedCar.model}</p>
                <p className="text-xs text-gray-700"><strong>Immatriculation:</strong> <span className="font-mono font-bold text-blue-900">{selectedCar.registration}</span></p>
                <p className="text-xs text-gray-700"><strong>Boîte de vitesse:</strong> {selectedCar.transmission || 'Manuelle'}</p>
                <p className="text-xs text-gray-700"><strong>Couleur:</strong> {selectedCar.color}</p>
                <p className="text-xs text-gray-700"><strong>Kilométrage de départ (Aller):</strong> <span className="font-mono font-bold">{(Number(startMileage || selectedCar.mileage || 0)).toLocaleString('fr-TN')} Km</span></p>
                {returnMileage !== '' && (
                  <p className="text-xs text-gray-700"><strong>Kilométrage de retour:</strong> <span className="font-mono font-bold text-emerald-800">{(Number(returnMileage)).toLocaleString('fr-TN')} Km</span></p>
                )}
                {returnMileage !== '' && Number(returnMileage) > Number(startMileage) && (
                  <p className="text-xs text-gray-700"><strong>Distance parcourue:</strong> <span className="font-mono font-bold text-blue-900">{(Number(returnMileage) - Number(startMileage)).toLocaleString('fr-TN')} Km</span></p>
                )}
                <p className="text-xs text-gray-700"><strong>Tarif de base journalier:</strong> {pricePerDay} DT/jour</p>
              </div>
            </div>

            {/* Financial transaction terms table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 bg-gray-100 text-xs font-bold text-gray-700 p-2 text-center">
                <div>Date de Départ</div>
                <div>Date de Retour</div>
                <div>Nbre Jours</div>
                <div>Caution (DT)</div>
                <div>Montant Total (DT)</div>
              </div>
              <div className="grid grid-cols-5 text-xs text-gray-800 p-3 text-center border-t border-gray-100 font-medium">
                <div>{formatDateTime(startDate)}</div>
                <div>{formatDateTime(endDate)}</div>
                <div>{days} jours</div>
                <div>{(Number(deposit) || 0).toLocaleString('fr-TN')} DT</div>
                <div className="font-bold text-blue-950">{(Number(totalAmount) || 0).toLocaleString('fr-TN')} DT</div>
              </div>
            </div>

            {/* Advance payment and remarks */}
            <div className="flex justify-between items-center bg-yellow-50 p-4 rounded-lg text-xs">
              <span className="font-medium text-amber-900">
                Acompte / Avance reçue à la signature : <strong>{(Number(advancePaid) || 0).toLocaleString('fr-TN')} DT</strong>
              </span>
              <span className="font-bold text-blue-950">
                Solde restant à régler au retour : {(Number(remainingAmount) || 0).toLocaleString('fr-TN')} DT
              </span>
            </div>

            {/* Interactive Signature Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-600">Signature de l'Agence & Cachet :</p>
                <div className="h-32 border border-gray-100 bg-gray-50 rounded-lg p-2 flex flex-col justify-between">
                  <p className="text-xs font-bold text-[#0F2C59]">{settings.signatureText}</p>
                  <p className="text-[10px] text-gray-400 text-right">Signé électroniquement</p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Signature size={14} className="text-blue-900" />
                    Signature du Client (Signez au pad) :
                  </p>
                  <button 
                    type="button"
                    onClick={clearSignature}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    Effacer
                  </button>
                </div>
                <div className="h-32 border-2 border-dashed border-gray-300 bg-white rounded-lg relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={350}
                    height={120}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair"
                  />
                  {!hasSigned && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[10px] text-gray-400">
                      Veuillez signer ici avec votre souris ou doigt
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100" id="contract-actions">
            <button 
              type="button"
              onClick={() => setStep('form')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={16} />
              Modifier Informations
            </button>
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={handlePrintContract}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={16} />
                Aperçu / Imprimer Contrat
              </button>
              <button 
                type="button"
                onClick={handleSignAndConfirm}
                className="px-6 py-2 bg-[#0F2C59] hover:bg-blue-900 text-white rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle size={16} />
                Valider & Enregistrer Contrat
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 'success' && generatedReservation && (
        <div className="bg-white p-8 rounded-xl border border-gray-100 shadow-md max-w-lg mx-auto text-center space-y-6" id="success-screen">
          <div className="inline-flex p-4 bg-emerald-50 rounded-full text-emerald-600">
            <CheckCircle size={48} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800">Contrat Validé avec Succès !</h3>
            <p className="text-xs text-gray-500 font-mono">ID de la réservation : {generatedReservation.id}</p>
            <p className="text-sm text-gray-600">
              Le contrat de location pour <strong>{fullName}</strong> a été enregistré. La voiture <strong>{generatedReservation.carBrandModel}</strong> est désormais marquée comme <strong>Louée</strong>.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg text-xs space-y-2 text-left">
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500">Immatriculation :</span>
              <span className="font-mono font-bold text-gray-800">{generatedReservation.carRegistration}</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500">Caution :</span>
              <span className="font-semibold text-gray-800">{(Number(generatedReservation.deposit) || 0).toLocaleString('fr-TN')} DT</span>
            </div>
            <div className="flex justify-between border-b border-gray-100 pb-1">
              <span className="text-gray-500">Acompte perçu :</span>
              <span className="font-semibold text-emerald-600">{(Number(generatedReservation.advancePaid) || 0).toLocaleString('fr-TN')} DT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Reste à payer :</span>
              <span className="font-bold text-blue-900">{(Number(generatedReservation.remainingAmount) || 0).toLocaleString('fr-TN')} DT</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => onNavigate('reservations')}
              className="w-full bg-[#0F2C59] hover:bg-blue-900 text-white font-semibold py-2.5 rounded-lg text-sm cursor-pointer"
            >
              Consulter la Liste des Réservations
            </button>
            <button 
              onClick={() => {
                // Reset form state
                setFullName('');
                setIdCard('');
                setPhone('');
                setAddress('');
                setEmail('');
                setNationality('');
                setDrivingLicense('');
                setLicenseIssueDate('');
                setSelectedCarId('');
                setAdvancePaid(0);
                setDeposit(2000);
                setHasSigned(false);
                setSignatureDataUrl(null);
                setSecondDriverName('');
                setSecondDriverIdCard('');
                setSecondDriverPhone('');
                setShowSecondDriver(false);
                setStep('form');
              }}
              className="w-full border border-gray-200 text-gray-700 hover:bg-gray-50 font-semibold py-2 rounded-lg text-sm cursor-pointer"
            >
              Créer un Autre Contrat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
