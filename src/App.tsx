import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Car as CarIcon, 
  Calendar, 
  FileText, 
  TrendingUp, 
  Users, 
  Settings as SettingsIcon, 
  LogOut, 
  Clock, 
  Database, 
  ShieldCheck, 
  Sun, 
  Moon, 
  Minimize2, 
  Maximize2, 
  X,
  AlertTriangle,
  Info
} from 'lucide-react';

// DB managers and types
import { DBManager } from './utils/db';
import { Car, Client, Reservation, Invoice, Collaborator, CollaboratorPayment, Expense, RevenueRecord, AppSettings } from './types';

// Components
import Dashboard from './components/Dashboard';
import ReservationForm from './components/ReservationForm';
import CarManagement from './components/CarManagement';
import ReservationList from './components/ReservationList';
import Billing from './components/Billing';
import Finance from './components/Finance';
import Collaborators from './components/Collaborators';
import Settings from './components/Settings';
import LoginScreen from './components/LoginScreen';

export default function App() {
  // Authentication block
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const isSecurityEnabled = localStorage.getItem('app_passcode_enabled') === 'true';
    return !isSecurityEnabled; // If disabled, auto authenticate
  });

  // Windows chrome controls state
  const [isWindowMaximized, setIsWindowMaximized] = useState(true);
  const [isWindowMinimized, setIsWindowMinimized] = useState(false);
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  // Theme state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('app_theme_dark') === 'true';
  });

  // Live Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Active View Routing State
  const [activeView, setActiveView] = useState('dashboard');
  const [navData, setNavData] = useState<any>(null); // To pass data between views, e.g. reservation ID

  // Core Entity States
  const [cars, setCars] = useState<Car[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [payments, setPayments] = useState<CollaboratorPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [revenues, setRevenues] = useState<RevenueRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(() => DBManager.getSettings());

  // Load all data on mount (supports electron disk database sync)
  useEffect(() => {
    const initData = async () => {
      await DBManager.initAsync();
      setCars(DBManager.getCars());
      setClients(DBManager.getClients());
      setReservations(DBManager.getReservations());
      setInvoices(DBManager.getInvoices());
      setCollaborators(DBManager.getCollaborators());
      setPayments(DBManager.getPayments());
      setExpenses(DBManager.getExpenses());
      setRevenues(DBManager.getRevenues());
      setSettings(DBManager.getSettings());
    };
    initData();
  }, []);

  // Sync Live Clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Persist Dark Mode preference
  useEffect(() => {
    localStorage.setItem('app_theme_dark', String(isDarkMode));
  }, [isDarkMode]);

  // Wrapper triggers navigation with optional data payload
  const handleNavigate = (view: string, data?: any) => {
    setActiveView(view);
    setNavData(data);
  };

  // State handlers that save to storage & memory
  const handleCarsUpdated = (updatedCars: Car[]) => {
    setCars(updatedCars);
    DBManager.saveCars(updatedCars);
  };

  const handleExpensesUpdated = (updatedExpenses: Expense[]) => {
    setExpenses(updatedExpenses);
    DBManager.saveExpenses(updatedExpenses);
  };

  const handleInvoicesUpdated = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    DBManager.saveInvoices(updatedInvoices);
  };

  const handleCollaboratorsUpdated = (updatedCollabs: Collaborator[]) => {
    setCollaborators(updatedCollabs);
    DBManager.saveCollaborators(updatedCollabs);
  };

  // Complex payment update handler (Adds the payout to both the payouts log and the expense budget)
  const handlePaymentsUpdated = (
    updatedPayments: CollaboratorPayment[], 
    isNewPayment: boolean = false, 
    expenseAmount?: number, 
    expenseDesc?: string
  ) => {
    setPayments(updatedPayments);
    DBManager.savePayments(updatedPayments);

    if (isNewPayment && expenseAmount && expenseDesc) {
      // Create associated business expense automatically
      const newExpense: Expense = {
        id: `exp-sal-${Date.now()}`,
        description: expenseDesc,
        amount: expenseAmount,
        date: new Date().toISOString().split('T')[0],
        category: 'Salaire'
      };
      const updatedExpenses = [newExpense, ...expenses];
      setExpenses(updatedExpenses);
      DBManager.saveExpenses(updatedExpenses);
    }
  };

  const handleSettingsUpdated = (updatedSettings: AppSettings) => {
    setSettings(updatedSettings);
    DBManager.saveSettings(updatedSettings);
  };

  // Triggers full state reload on database actions
  const handleReservationCreatedOrReturned = () => {
    setReservations(DBManager.getReservations());
    setCars(DBManager.getCars());
    setRevenues(DBManager.getRevenues());
    setClients(DBManager.getClients());
  };

  const handleReturnCarFromList = (resId: string, remainingPaid: number, returnMileage?: number) => {
    DBManager.returnCar(resId, remainingPaid, returnMileage);
    handleReservationCreatedOrReturned();
  };

  const handleDeleteReservation = (resId: string) => {
    DBManager.deleteReservation(resId);
    handleReservationCreatedOrReturned();
  };

  const handleStatusChange = (resId: string, newStatus: Reservation['status']) => {
    DBManager.updateReservationStatus(resId, newStatus);
    handleReservationCreatedOrReturned();
  };

  const handleConfirmPayment = (resId: string, amount: number) => {
    DBManager.confirmPayment(resId, amount);
    handleReservationCreatedOrReturned();
  };

  const handleUpdateReservation = (resId: string, updates: { endDate: string; pricePerDay: number; deposit: number; }) => {
    DBManager.updateReservation(resId, updates);
    handleReservationCreatedOrReturned();
  };

  // Log out/Lock screen
  const handleLockScreen = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col" id="login-window-root">
        {/* WINDOW CHROME HEADER BAR on Login Screen */}
        <header 
          className="bg-[#0b1329] text-white h-11 flex items-center justify-between px-4 border-b border-gray-800 shrink-0 select-none print:hidden" 
          id="login-titlebar"
          style={{ WebkitAppRegion: 'drag' } as any}
        >
          <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <span className="font-extrabold text-xs text-yellow-500 font-sans">L</span>
            <span className="text-xs font-bold font-sans tracking-wide">
              LGLM Manager — Bureau Windows
            </span>
            <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-blue-100 font-mono">v2.0.0</span>
          </div>
          <div className="flex items-center" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button 
              onClick={() => {
                if ((window as any).electronAPI) {
                  (window as any).electronAPI.minimize();
                }
              }}
              className="h-11 px-3 hover:bg-gray-800 transition text-gray-400 hover:text-white cursor-pointer"
              title="Réduire"
            >
              <div className="w-3.5 h-0.5 bg-current mx-auto mt-4"></div>
            </button>
            <button 
              onClick={() => {
                if ((window as any).electronAPI) {
                  (window as any).electronAPI.maximize();
                }
              }}
              className="h-11 px-3 hover:bg-gray-800 transition text-gray-400 hover:text-white cursor-pointer"
              title="Agrandir"
            >
              <Minimize2 size={13} />
            </button>
            <button 
              onClick={() => {
                if ((window as any).electronAPI) {
                  (window as any).electronAPI.close();
                }
              }}
              className="h-11 px-4 hover:bg-red-600 transition text-gray-400 hover:text-white cursor-pointer"
              title="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        </header>
        <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} settings={settings} />
      </div>
    );
  }

  // Define sidebar menu options
  const menuItems = [
    { id: 'dashboard', name: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
    { id: 'reserve', name: 'Nouvelle Réservation', icon: <PlusCircle size={18} /> },
    { id: 'cars', name: 'Gestion Véhicules', icon: <CarIcon size={18} /> },
    { id: 'reservations', name: 'Liste Réservations', icon: <Calendar size={18} /> },
    { id: 'billing', name: 'Facturation & Devis', icon: <FileText size={18} /> },
    { id: 'finance', name: 'Gestion Financière', icon: <TrendingUp size={18} /> },
    { id: 'collaborators', name: 'Chauffeurs', icon: <Users size={18} /> },
    { id: 'settings', name: 'Paramètres Agence', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <div className={`h-screen overflow-hidden ${isDarkMode ? 'bg-[#0b0f19] text-gray-100' : 'bg-gray-100 text-gray-800'} transition-colors duration-200 p-0 flex flex-col`} id="app-window-root">
      
      {/* WINDOW CHROME HEADER BAR (Windows 11 Native desktop look with native dragging in Electron) */}
      <header 
        className="bg-[#0b1329] text-white h-11 flex items-center justify-between px-4 border-b border-gray-800 shrink-0 select-none print:hidden" 
        id="windows-titlebar"
        style={{ WebkitAppRegion: 'drag' } as any}
      >
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as any}>
          {settings.logoUrl ? (
            <img src={settings.logoUrl} className="h-5 w-5 object-contain bg-white rounded-xs" alt="icon" />
          ) : (
            <span className="font-extrabold text-xs text-yellow-500 font-sans">L</span>
          )}
          <span className="text-xs font-bold font-sans tracking-wide">
            LGLM Manager — Bureau Windows
          </span>
          <span className="text-[10px] bg-blue-900 px-2 py-0.5 rounded text-blue-100 font-mono">v2.0.0</span>
        </div>

        {/* Windows Chrome controls with no-drag capability for button interaction */}
        <div className="flex items-center" id="windows-chrome-controls" style={{ WebkitAppRegion: 'no-drag' } as any}>
          <button 
            onClick={() => {
              if ((window as any).electronAPI) {
                (window as any).electronAPI.minimize();
              } else {
                setIsWindowMinimized(!isWindowMinimized);
              }
            }}
            className="h-11 px-3 hover:bg-gray-800 transition text-gray-400 hover:text-white cursor-pointer"
            title="Réduire"
          >
            <div className="w-3.5 h-0.5 bg-current mx-auto mt-4"></div>
          </button>
          <button 
            onClick={() => {
              if ((window as any).electronAPI) {
                (window as any).electronAPI.maximize();
              } else {
                setIsWindowMaximized(!isWindowMaximized);
              }
            }}
            className="h-11 px-3 hover:bg-gray-800 transition text-gray-400 hover:text-white cursor-pointer"
            title={isWindowMaximized ? "Restaurer" : "Agrandir"}
          >
            <Minimize2 size={13} />
          </button>
          <button 
            onClick={() => setIsCloseAlertOpen(true)}
            className="h-11 px-4 hover:bg-red-600 transition text-gray-400 hover:text-white cursor-pointer"
            title="Fermer"
          >
            <X size={14} />
          </button>
        </div>
      </header>

      {/* Main Body container */}
      <div className={`flex flex-1 overflow-hidden ${isWindowMinimized ? 'hidden' : ''}`} id="desktop-view-body">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-64 bg-[#0F2C59] text-white flex flex-col justify-between shrink-0 border-r border-[#1a386b] print:hidden" id="app-sidebar">
          {/* Menu items block */}
          <div className="space-y-1.5 p-4">
            <div className="flex items-center gap-2 mb-6 px-1.5" id="sidebar-brand">
              <div className="h-8 w-8 bg-white rounded-md flex items-center justify-center p-1 shadow-md">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} className="w-full h-full object-contain" alt="brand" />
                ) : (
                  <CarIcon size={20} className="text-[#0F2C59]" />
                )}
              </div>
              <div>
                <h2 className="text-xs font-black tracking-widest text-amber-400 uppercase">LGLM</h2>
                <p className="text-[10px] text-gray-200 font-semibold uppercase leading-tight">{settings.companyName || 'RENT A CAR'}</p>
              </div>
            </div>

            <nav className="space-y-1" id="sidebar-nav">
              {menuItems.map(item => {
                const isDisabled = !settings.companyName && item.id !== 'settings';
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (!isDisabled) {
                        handleNavigate(item.id);
                      }
                    }}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                      isDisabled 
                        ? 'opacity-40 cursor-not-allowed text-gray-400' 
                        : activeView === item.id 
                          ? 'bg-amber-400 text-slate-900 shadow-md transform translate-x-1 font-black cursor-pointer' 
                          : 'hover:bg-blue-900 hover:bg-opacity-40 text-gray-200 cursor-pointer'
                    }`}
                    title={isDisabled ? "Veuillez d'abord configurer votre agence" : ""}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar bottom tools: locks, dark/light toggle and user indicators */}
          <div className="p-4 border-t border-[#1e4179] space-y-3 bg-[#0d2347]" id="sidebar-footer">
            <div className="flex items-center justify-between text-gray-300 text-[11px] font-medium" id="sidebar-theme-toggle">
              <span>Mode Visuel</span>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-1.5 hover:bg-[#1a386b] rounded-md transition cursor-pointer text-white"
                title="Basculer le mode d'affichage"
              >
                {isDarkMode ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} />}
              </button>
            </div>

            {/* Simulated Live User details */}
            <div className="flex items-center gap-2 p-1.5 rounded-lg bg-blue-950 bg-opacity-40 text-xs">
              <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[#0F2C59] font-black text-[10px] border border-white">
                AD
              </div>
              <div className="flex-1 truncate">
                <p className="font-extrabold text-[11px] truncate text-white">Mohamed Amine</p>
                <p className="text-[9px] text-gray-300">Administrateur</p>
              </div>
              <button 
                onClick={handleLockScreen}
                className="p-1 text-gray-300 hover:text-amber-400 transition cursor-pointer"
                title="Verrouiller la session"
              >
                <LogOut size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENT HOST WORKSPACE AREA */}
        <main className={`flex-1 overflow-y-auto p-6 focus:outline-none print:p-0 ${isDarkMode ? 'bg-[#0f172a]' : 'bg-gray-50'}`} id="app-workspace">
          
          {/* Conditional View Router */}
          {activeView === 'dashboard' && (
            <Dashboard 
              onNavigate={handleNavigate} 
              cars={cars} 
              reservations={reservations} 
              revenues={revenues} 
            />
          )}

          {activeView === 'reserve' && (
            <ReservationForm 
              cars={cars} 
              onReservationCreated={handleReservationCreatedOrReturned} 
              onNavigate={handleNavigate}
              settings={settings}
              editingReservation={navData?.editReservation}
            />
          )}

          {activeView === 'cars' && (
            <CarManagement 
              cars={cars} 
              onCarsUpdated={handleCarsUpdated} 
            />
          )}

          {activeView === 'reservations' && (
            <ReservationList 
              reservations={reservations} 
              cars={cars} 
              onReturnProcessed={handleReturnCarFromList}
              onDeleteReservation={handleDeleteReservation}
              onStatusChange={handleStatusChange}
              onConfirmPayment={handleConfirmPayment}
              onUpdateReservation={handleUpdateReservation}
              onNavigate={handleNavigate}
              initialSearch={navData?.search || ''}
            />
          )}

          {activeView === 'billing' && (
            <Billing 
              reservations={reservations} 
              invoices={invoices} 
              onInvoiceCreated={handleInvoicesUpdated} 
              settings={settings}
              preselectedResId={navData?.reservationId || ''}
            />
          )}

          {activeView === 'finance' && (
            <Finance 
              expenses={expenses} 
              revenues={revenues} 
              onExpensesUpdated={handleExpensesUpdated} 
            />
          )}

          {activeView === 'collaborators' && (
            <Collaborators 
              collaborators={collaborators} 
              payments={payments} 
              cars={cars} 
              onCollaboratorsUpdated={handleCollaboratorsUpdated} 
              onPaymentsUpdated={handlePaymentsUpdated} 
            />
          )}

          {activeView === 'settings' && (
            <Settings 
              settings={settings} 
              onSettingsUpdated={handleSettingsUpdated} 
              isDarkMode={isDarkMode} 
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)} 
              onResetDatabase={DBManager.resetDatabase} 
            />
          )}
        </main>
      </div>

      {/* SYSTEM STATUS FOOTER - hidden */}
      <footer className="hidden" id="windows-taskbar"></footer>

      {/* Close Software confirmation modal */}
      {isCloseAlertOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4" id="close-app-modal">
          <div className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full overflow-hidden flex flex-col text-gray-800">
            <div className="bg-slate-900 text-white p-3 flex items-center gap-2">
              <Info size={16} className="text-yellow-500" />
              <span className="font-bold text-xs">Fermer LGLM Manager ?</span>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-gray-600 leading-normal">
                Toutes les modifications de contrats, clients, paiements et véhicules sont sauvegardées automatiquement en temps réel dans votre base de données locale.
              </p>
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-[10px] text-blue-900 font-semibold flex items-start gap-1.5">
                <Database size={12} className="shrink-0 mt-0.5 text-blue-700" />
                <span>Restauration automatique disponible au prochain démarrage de l'application.</span>
              </div>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2 text-xs">
              <button 
                onClick={() => setIsCloseAlertOpen(false)}
                className="px-4 py-1.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer font-bold"
              >
                Retour au logiciel
              </button>
              <button 
                onClick={() => {
                  setIsCloseAlertOpen(false);
                  if ((window as any).electronAPI) {
                    (window as any).electronAPI.close();
                  } else {
                    handleLockScreen();
                  }
                }}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg cursor-pointer font-bold"
              >
                Fermer la session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
