import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Settings as SettingsIcon, 
  Save, 
  Database, 
  Lock, 
  Sun, 
  Moon, 
  RefreshCw, 
  CheckCircle, 
  FileJson,
  Upload,
  AlertCircle,
  Monitor,
  Laptop,
  Eye,
  EyeOff,
  RotateCcw
} from 'lucide-react';
import { AppSettings } from '../types';
import { DBManager } from '../utils/db';

interface SettingsProps {
  settings: AppSettings;
  onSettingsUpdated: (updatedSettings: AppSettings) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onResetDatabase: () => void;
}

export default function Settings({ settings, onSettingsUpdated, isDarkMode, onToggleDarkMode, onResetDatabase }: SettingsProps) {
  const companyNameRef = useRef<HTMLInputElement>(null);

  // Auto-focus on mount if company details are not set
  useEffect(() => {
    if (!settings.companyName && companyNameRef.current) {
      companyNameRef.current.focus();
    }
  }, []);

  // Form fields state
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [whatsApp, setWhatsApp] = useState(settings.whatsApp);
  const [email, setEmail] = useState(settings.email);
  const [signatureText, setSignatureText] = useState(settings.signatureText);
  const [tvaRate, setTvaRate] = useState(settings.tvaRate);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');

  // Passcode security states
  const [isPasswordActive, setIsPasswordActive] = useState(() => {
    return localStorage.getItem('app_passcode_enabled') === 'true';
  });
  const [passcode, setPasscode] = useState(() => {
    const raw = localStorage.getItem('app_passcode') || '1234';
    return raw.length === 64 ? '' : raw;
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);

  // Logo file reader base64 handler
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: AppSettings = {
      companyName,
      address,
      phone,
      whatsApp,
      email,
      signatureText,
      tvaRate,
      logoUrl
    };

    onSettingsUpdated(updated);
    
    // Save passcode security details
    localStorage.setItem('app_passcode_enabled', String(isPasswordActive));
    if (passcode.trim().length === 4) {
      localStorage.setItem('app_passcode', passcode.trim());
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleDownloadBackup = () => {
    const databaseJSON = DBManager.exportDatabase();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(databaseJSON);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `lglm_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const success = DBManager.importDatabase(text);
        if (success) {
          alert("Base de données restaurée avec succès ! L'application va se recharger.");
          window.location.reload();
        } else {
          alert("Erreur de format de fichier de sauvegarde.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleResetConfirm = () => {
    if (window.confirm("⚠️ ATTENTION DANGER : Êtes-vous sûr de vouloir effacer TOUTES les données ? Un fichier d'export Excel sera généré automatiquement par sécurité avant la suppression.")) {
      try {
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getCars()), "Véhicules");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getClients()), "Clients");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getReservations()), "Réservations");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getInvoices()), "Factures");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getExpenses()), "Dépenses");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getRevenues()), "Revenus");
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(DBManager.getCollaborators()), "Chauffeurs");
        
        XLSX.writeFile(wb, `LGLM_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
        
        DBManager.resetDatabase();
        alert("Les données ont été effacées et exportées avec succès ! Redémarrage.");
        window.location.reload();
      } catch(e) {
        alert("Erreur lors de l'exportation. La suppression a été annulée par sécurité.");
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-root">
      {/* Configuration warning banner */}
      {!settings.companyName && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 flex gap-3 text-xs font-semibold shadow-xs">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
          <div>
            <p className="font-bold text-sm">Configuration de l'Agence Requise</p>
            <p className="mt-1 text-amber-700 font-medium">Veuillez configurer la raison sociale et les informations de votre agence ci-dessous pour pouvoir utiliser l'application.</p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex justify-between items-center" id="settings-header-card">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <SettingsIcon size={20} className="text-[#0F2C59]" />
            Configuration Générale du Système
          </h2>
          <p className="text-xs text-gray-500">
            Personnalisez vos mentions contractuelles, activez la sécurité par mot de passe et sauvegardez vos tables.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-bold">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
          Sauvegarde automatique active (LocalStorage SQLite simulation)
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-form-grid">
        {/* Company profile parameters */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4 lg:col-span-2" id="company-profile-settings">
          <h3 className="font-bold text-[#0F2C59] text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
            <SettingsIcon size={14} />
            Coordonnées & Informations Contractuelles
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Raison Sociale de l'Agence *</label>
              <input 
                ref={companyNameRef}
                type="text"
                required
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-semibold text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Taux de TVA par défaut (%)</label>
              <input 
                type="number"
                min={0}
                max={100}
                value={tvaRate}
                onChange={e => setTvaRate(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Téléphone Secrétariat</label>
              <input 
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Direction</label>
              <input 
                type="tel"
                value={whatsApp}
                onChange={e => setWhatsApp(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Adresse Professionnelle Siège Social *</label>
              <input 
                type="text"
                required
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email de l'agence *</label>
              <input 
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Custom file uploader for Logo */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Logo de l'entreprise (Format PNG/JPEG)</label>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} className="h-10 w-10 object-contain rounded border bg-gray-50" alt="Logo preview" />
                ) : (
                  <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded text-gray-400 font-bold text-xs">BC</div>
                )}
                <div className="relative overflow-hidden cursor-pointer">
                  <span className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 cursor-pointer flex items-center gap-1">
                    <Upload size={12} />
                    Importer
                  </span>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleLogoChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>
                {logoUrl && (
                  <button 
                    type="button" 
                    onClick={() => setLogoUrl('')}
                    className="text-[10px] text-red-600 hover:underline cursor-pointer"
                  >
                    Retirer logo
                  </button>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 mb-1">Mentions Bas de Page / Signature Contrats</label>
              <textarea
                value={signatureText}
                onChange={e => setSignatureText(e.target.value)}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none font-medium text-gray-700"
              />
              <p className="text-[10px] text-gray-400 mt-1">Ce texte figurera sur la signature automatique de l'agence en bas de vos contrats.</p>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-50">
            {savedSuccess && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100">
                <CheckCircle size={14} />
                Paramètres enregistrés et synchronisés !
              </span>
            )}
            <div></div>
            <button
              type="submit"
              className="bg-[#0F2C59] hover:bg-blue-900 text-white font-bold text-xs px-6 py-2.5 rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Save size={14} />
              Enregistrer les Paramètres
            </button>
          </div>
        </div>

        {/* Security / Backup & Themes panel */}
        <div className="space-y-6" id="security-backup-panel">
          {/* Security passcode settings */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0F2C59] text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <Lock size={14} />
              Sécurité & Verrouillage Passcode
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-gray-700 block">Activer la Sécurité</span>
                  <p className="text-[10px] text-gray-400">Demander un code secret au démarrage.</p>
                </div>
                <input 
                  type="checkbox"
                  checked={isPasswordActive}
                  onChange={e => setIsPasswordActive(e.target.checked)}
                  className="w-4 h-4 text-[#0F2C59] border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                />
              </div>

              {isPasswordActive && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Code Secret Administrateur (4 chiffres)</label>
                  <div className="relative">
                    <input 
                      type={showPasscode ? 'text' : 'password'}
                      maxLength={4}
                      value={passcode}
                      onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                      placeholder={localStorage.getItem('app_passcode')?.length === 64 ? "•••• (Code inchangé)" : "1234"}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm tracking-widest font-mono text-center focus:border-blue-500 focus:outline-none bg-blue-50 bg-opacity-30 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasscode(!showPasscode)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 cursor-pointer p-1"
                      title={showPasscode ? 'Masquer le code' : 'Afficher le code'}
                    >
                      {showPasscode ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 font-semibold flex items-start gap-1 mt-1 leading-normal">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" />
                    <span>N'oubliez pas ce code ! En cas de perte, cliquez sur "Réinitialiser" ci-dessous.</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('⚠️ Réinitialiser le code d\'accès à 1234 par défaut ?')) {
                        setPasscode('1234');
                        localStorage.setItem('app_passcode', '1234');
                        alert('✅ Code réinitialisé à 1234.');
                      }
                    }}
                    className="w-full flex items-center justify-center gap-1.5 text-[10px] text-red-500 hover:text-red-700 hover:bg-red-50 border border-dashed border-red-200 py-1.5 rounded-lg cursor-pointer transition font-bold"
                  >
                    <RotateCcw size={10} />
                    Réinitialiser le Passcode à 1234
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Theme customizer */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0F2C59] text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <Sun size={14} />
              Thème Visualisation
            </h3>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { if (isDarkMode) onToggleDarkMode(); }}
                className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  !isDarkMode 
                    ? 'bg-blue-50 text-[#0F2C59] border-blue-200 font-bold' 
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Sun size={18} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Mode Clair</span>
              </button>
              <button
                type="button"
                onClick={() => { if (!isDarkMode) onToggleDarkMode(); }}
                className={`flex-1 py-3 border rounded-xl flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                  isDarkMode 
                    ? 'bg-[#0f172a] text-blue-400 border-[#1e293b] font-bold' 
                    : 'bg-white text-gray-600 border-gray-100 hover:bg-gray-50'
                }`}
              >
                <Moon size={18} />
                <span className="text-[10px] uppercase font-bold tracking-wider">Mode Sombre</span>
              </button>
            </div>
          </div>

          {/* Database management cards */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0F2C59] text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <Database size={14} />
              Sauvegarde, Export & Restauration
            </h3>

            <div className="space-y-2 text-xs">
              <p className="text-gray-500 leading-normal">
                Exportez toute la base de données de l'agence (contrats, clients, véhicules, comptabilité) sous forme de fichier JSON crypté pour sauvegarde de sécurité ou transfert d'ordinateur.
              </p>
              
              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <FileJson size={14} className="text-[#0F2C59]" />
                  Télécharger le backup JSON
                </button>

                <div className="relative w-full">
                  <span className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300 font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition text-xs">
                    <Upload size={14} className="text-emerald-600" />
                    Restaurer une sauvegarde JSON
                  </span>
                  <input 
                    type="file"
                    accept=".json"
                    onChange={handleRestoreBackup}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleResetConfirm}
                  className="w-full hover:bg-red-50 text-red-600 hover:text-red-700 border border-dashed border-red-200 hover:border-red-300 font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition mt-4"
                >
                  <RefreshCw size={14} />
                  Effacer toutes les données (Export Excel auto)
                </button>
              </div>
            </div>
          </div>

          {/* Desktop Application Version Card */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-xs space-y-4">
            <h3 className="font-bold text-[#0F2C59] text-xs uppercase pb-2 border-b border-gray-50 flex items-center gap-1.5">
              <Monitor size={14} className="text-blue-600" />
              Logiciel Bureau Indépendant (Windows .exe)
            </h3>

            <div className="space-y-3 text-xs">
              <p className="text-gray-500 leading-normal text-[11px]">
                Vous pouvez transformer ce gestionnaire en une véritable application de bureau Windows autonome, <strong>sans navigateur visible</strong>, dotée d'un design immersif et d'un démarrage direct.
              </p>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg space-y-2 text-[11px]">
                <div className="font-bold text-[#0F2C59] flex items-center gap-1">
                  <Laptop size={13} />
                  Procédure d'installation locale :
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-gray-700 leading-normal">
                  <li>Téléchargez le code source complet (bouton ZIP dans les réglages de l'éditeur ou clonez le dépôt).</li>
                  <li>Installez Node.js sur votre ordinateur puis ouvrez votre terminal dans le dossier du projet.</li>
                  <li>
                    Exécutez la commande d'installation des packages :
                    <pre className="bg-slate-900 text-white p-1.5 rounded-md font-mono text-[9px] mt-1 select-all">npm install</pre>
                  </li>
                  <li>
                    Pour tester l'application en mode bureau (développement) :
                    <pre className="bg-slate-900 text-white p-1.5 rounded-md font-mono text-[9px] mt-1 select-all">npm run electron:dev</pre>
                  </li>
                  <li>
                    Pour compiler et générer l'<strong>installateur .exe</strong> autonome :
                    <pre className="bg-slate-900 text-white p-1.5 rounded-md font-mono text-[9px] mt-1 select-all">npm run electron:build</pre>
                  </li>
                </ol>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-2.5 rounded-lg text-[10px] text-amber-800 leading-normal">
                💡 <strong>Astuce :</strong> La base de données SQLite/LocalStorage restera entièrement synchronisée et persistante, fonctionnant hors ligne de manière sécurisée sur votre disque dur.
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
