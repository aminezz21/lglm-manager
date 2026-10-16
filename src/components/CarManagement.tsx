import React, { useState } from 'react';
import { 
  Car as CarIcon, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Gauge, 
  DollarSign, 
  FileImage,
  Check,
  X,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { Car } from '../types';
import { DBManager } from '../utils/db';

interface CarManagementProps {
  cars: Car[];
  onCarsUpdated: (updatedCars: Car[]) => void;
}

export default function CarManagement({ cars, onCarsUpdated }: CarManagementProps) {
  // UI State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Tous' | 'Disponible' | 'Louée'>('Tous');
  
  // Modal / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<Car | null>(null);

  // Form Field State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [registration, setRegistration] = useState('');
  const [color, setColor] = useState('');
  const [mileage, setMileage] = useState<number>(0);
  const [lastVidangeMileage, setLastVidangeMileage] = useState<number>(0);
  const [pricePerDay, setPricePerDay] = useState<number>(300);
  const [status, setStatus] = useState<'Disponible' | 'Louée'>('Disponible');
  const [transmission, setTransmission] = useState<'Manuelle' | 'Automatique'>('Manuelle');
  const [carImage, setCarImage] = useState<string>('');

  // Handle Photo Upload (Convert file to Base64 data url for storage in LocalStorage)
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCarImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Open Form for Adding
  const handleOpenAddForm = () => {
    setEditingCar(null);
    setBrand('');
    setModel('');
    setYear(new Date().getFullYear());
    setRegistration('');
    setColor('');
    setMileage(0);
    setLastVidangeMileage(0);
    setPricePerDay(300);
    setStatus('Disponible');
    setTransmission('Manuelle');
    setCarImage('');
    setIsFormOpen(true);
  };

  // Open Form for Editing
  const handleOpenEditForm = (car: Car) => {
    setEditingCar(car);
    setBrand(car.brand);
    setModel(car.model);
    setYear(car.year);
    setRegistration(car.registration);
    setColor(car.color);
    setMileage(car.mileage);
    setLastVidangeMileage(car.lastVidangeMileage || 0);
    setPricePerDay(car.pricePerDay);
    setStatus(car.status);
    setTransmission(car.transmission || 'Manuelle');
    setCarImage(car.image || '');
    setIsFormOpen(true);
  };

  // Save Add/Edit Car
  const handleSaveCar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !registration) {
      alert("Veuillez remplir les champs obligatoires (Marque, Modèle, Immatriculation)");
      return;
    }

    if (editingCar) {
      // Edit mode
      const updatedList = cars.map(c => {
        if (c.id === editingCar.id) {
          return {
            ...c,
            brand,
            model,
            year,
            registration,
            color,
            mileage,
            lastVidangeMileage,
            pricePerDay,
            status,
            transmission,
            image: carImage
          };
        }
        return c;
      });
      onCarsUpdated(updatedList);
    } else {
      // Create mode
      const newCar: Car = {
        id: `car-${Date.now()}`,
        brand,
        model,
        year,
        registration,
        color,
        mileage,
        lastVidangeMileage,
        pricePerDay,
        status,
        transmission,
        image: carImage
      };
      onCarsUpdated([newCar, ...cars]);
    }

    setIsFormOpen(false);
  };

  // Delete Car
  const handleDeleteCar = (car: Car) => {
    const isRented = car.status === 'Louée';
    const message = isRented
      ? `Attention : Le véhicule "${car.brand} ${car.model}" (${car.registration}) est actuellement marqué comme "Loué". Êtes-vous sûr de vouloir le supprimer définitivement ? Cette action est irréversible.`
      : `Êtes-vous sûr de vouloir supprimer définitivement le véhicule "${car.brand} ${car.model}" (${car.registration}) ? Cette action est irréversible.`;

    if (window.confirm(message)) {
      const updatedList = cars.filter(c => c.id !== car.id);
      onCarsUpdated(updatedList);
    }
  };

  // Filter cars
  const filteredCars = cars.filter(car => {
    const matchesSearch = `${car.brand} ${car.model} ${car.registration}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'Tous' || car.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="car-management-root">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-gray-100 shadow-xs gap-4" id="cars-view-header">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <CarIcon size={20} className="text-[#0F2C59]" />
            Gestion de la Flotte Véhicules
          </h2>
          <p className="text-xs text-gray-500">Ajouter, modifier ou supprimer les voitures de votre agence de location.</p>
        </div>
        <button
          onClick={handleOpenAddForm}
          className="bg-[#0F2C59] hover:bg-blue-900 text-white font-semibold text-sm px-4 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          id="btn-add-car"
        >
          <Plus size={16} />
          Ajouter un véhicule
        </button>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between" id="car-filters-panel">
        <div className="relative w-full md:w-96" id="car-search-box">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher marque, modèle, immatriculation..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto" id="car-status-filters">
          {(['Tous', 'Disponible', 'Louée'] as const).map(option => (
            <button
              key={option}
              onClick={() => setStatusFilter(option)}
              className={`flex-1 md:flex-initial text-xs font-semibold px-4 py-2 rounded-lg border transition cursor-pointer ${
                statusFilter === option 
                  ? 'bg-blue-50 text-[#0F2C59] border-blue-200 font-bold' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {option === 'Tous' ? 'Tous les véhicules' : option}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of cars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="cars-grid">
        {filteredCars.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-xl border border-dashed border-gray-200" id="cars-empty-state">
            <CarIcon size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500 text-sm font-semibold">Aucun véhicule ne correspond à vos critères de recherche.</p>
            <button 
              onClick={handleOpenAddForm} 
              className="mt-4 text-[#0F2C59] text-xs font-bold hover:underline cursor-pointer"
            >
              Ajouter un nouveau véhicule maintenant
            </button>
          </div>
        ) : (
          filteredCars.map(car => (
            <div 
              key={car.id} 
              className="bg-white rounded-xl border border-gray-100 shadow-xs hover:shadow-md transition overflow-hidden flex flex-col justify-between"
              id={`car-card-${car.id}`}
            >
              {/* Photo section */}
              <div className="h-44 bg-gray-100 relative overflow-hidden" id="car-card-img-wrapper">
                {car.image ? (
                  <img 
                    src={car.image} 
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <CarIcon size={48} className="opacity-40" />
                    <span className="text-[10px] mt-1 font-medium tracking-wide uppercase">Photo non disponible</span>
                  </div>
                )}
                {/* Status sticker */}
                <span className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full shadow-xs ${
                  car.status === 'Disponible' 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-amber-500 text-white'
                }`}>
                  {car.status}
                </span>
                {/* Year sticker */}
                <span className="absolute bottom-3 left-3 bg-gray-900 bg-opacity-70 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                  {car.year}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-extrabold text-gray-800 text-base">{car.brand} <span className="font-semibold text-gray-600">{car.model}</span></h3>
                  <div className="flex items-center gap-1.5 mt-1 font-mono font-bold text-xs text-blue-900 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-max">
                    {car.registration}
                  </div>
                </div>

                {/* Characteristics */}
                <div className="grid grid-cols-2 gap-3 text-xs border-y border-gray-50 py-3 text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Tag size={14} className="text-gray-400" />
                    <span>Couleur: <strong>{car.color || 'N/A'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Gauge size={14} className="text-gray-400" />
                    <span>Km: <strong>{(Number(car.mileage || 0) || 0).toLocaleString('fr-TN')}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 col-span-2 text-gray-600">
                    <span className="text-gray-400">⚙️</span>
                    <span>Boîte de vitesse: <strong>{car.transmission || 'Manuelle'}</strong></span>
                  </div>

                  {/* Vidange details */}
                  {(() => {
                    const lastKm = car.lastVidangeMileage || 0;
                    const drivenSinceVidange = car.mileage - lastKm;
                    const isVidangeDue = drivenSinceVidange >= 9500;
                    return (
                      <div className="col-span-2 bg-gray-50 p-2 rounded-lg space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500">Vidange :</span>
                          <span className={`font-bold ${isVidangeDue ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
                            {drivenSinceVidange.toLocaleString('fr-TN')} / 9 500 km
                          </span>
                        </div>
                        {isVidangeDue ? (
                          <div className="flex items-center justify-between text-red-600 font-bold text-[10px] pt-1 border-t border-red-100">
                            <span>⚠️ VIDANGE REQUISE</span>
                            <button
                              onClick={() => {
                                DBManager.performVidange(car.id);
                                const updated = cars.map(c => c.id === car.id ? { ...c, lastVidangeMileage: c.mileage } : c);
                                onCarsUpdated(updated);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-sans px-2 py-0.5 rounded cursor-pointer transition"
                            >
                              ✓ Valider Vidange
                            </button>
                          </div>
                        ) : (
                          <div className="text-[9px] text-gray-400 text-right">Dernière vidange: {lastKm.toLocaleString('fr-TN')} km</div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Price and Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Tarif journalier</span>
                    <span className="text-lg font-extrabold text-gray-800">{car.pricePerDay} <span className="text-xs font-semibold text-gray-500">DT/J</span></span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEditForm(car)}
                      className="p-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 text-gray-600 hover:text-blue-900 rounded-lg transition cursor-pointer"
                      title="Modifier les informations"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteCar(car)}
                      className="p-2 bg-gray-50 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-lg transition cursor-pointer"
                      title={car.status === 'Louée' ? "Supprimer le véhicule (Actuellement loué)" : "Supprimer le véhicule"}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Full screen popup form / modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="car-form-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-lg w-full overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="bg-[#0F2C59] text-white p-4 flex justify-between items-center">
              <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-1.5">
                <CarIcon size={16} />
                {editingCar ? 'Modifier les données du véhicule' : 'Ajouter un nouveau véhicule'}
              </h3>
              <button 
                onClick={() => setIsFormOpen(false)}
                className="text-white hover:text-gray-200 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSaveCar} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Marque *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: Peugeot, Renault"
                    value={brand}
                    onChange={e => setBrand(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Modèle *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: 208, Clio 5"
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Année de construction</label>
                  <input 
                    type="number"
                    min={1990}
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={e => setYear(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Immatriculation *</label>
                  <input 
                    type="text"
                    required
                    placeholder="Ex: 12345-A-26"
                    value={registration}
                    onChange={e => setRegistration(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Couleur</label>
                  <input 
                    type="text"
                    placeholder="Ex: Blanc, Gris"
                    value={color}
                    onChange={e => setColor(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kilométrage Actuel (Km)</label>
                  <input 
                    type="number"
                    min={0}
                    value={mileage}
                    onChange={e => setMileage(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Kilométrage Dernière Vidange (Km)</label>
                  <input 
                    type="number"
                    min={0}
                    value={lastVidangeMileage}
                    onChange={e => setLastVidangeMileage(Number(e.target.value))}
                    placeholder="0"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Prix de Location Journalier (DT)</label>
                  <input 
                    type="number"
                    min={0}
                    value={pricePerDay}
                    onChange={e => setPricePerDay(Number(e.target.value))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Disponibilité</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as 'Disponible' | 'Louée')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Louée">Louée</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Boîte de vitesse</label>
                  <select
                    value={transmission}
                    onChange={e => setTransmission(e.target.value as 'Manuelle' | 'Automatique')}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Manuelle">Manuelle</option>
                    <option value="Automatique">Automatique</option>
                  </select>
                </div>
              </div>

              {/* Photo Upload block */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Photo du Véhicule</label>
                <div className="border border-dashed border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center bg-gray-50 relative">
                  {carImage ? (
                    <div className="space-y-2 text-center w-full">
                      <img src={carImage} className="max-h-28 mx-auto rounded object-cover" alt="Preview" />
                      <button 
                        type="button" 
                        onClick={() => setCarImage('')}
                        className="text-[10px] text-red-600 hover:underline cursor-pointer block mx-auto"
                      >
                        Retirer la photo
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <FileImage className="mx-auto text-gray-400 mb-1" size={24} />
                      <p className="text-[11px] text-gray-500">Choisir un fichier image (.png, .jpg)</p>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoChange}
                        className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Modal buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0F2C59] hover:bg-blue-900 rounded-lg text-sm font-bold text-white shadow-xs cursor-pointer"
                >
                  {editingCar ? 'Enregistrer les modifications' : 'Enregistrer le véhicule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
