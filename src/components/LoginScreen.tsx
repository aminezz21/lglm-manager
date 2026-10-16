import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldAlert, Car as CarIcon, KeyRound, RotateCcw, ShieldX, Clock } from 'lucide-react';
import { AppSettings } from '../types';
import {
  hashPasscode,
  verifyPasscode,
  isLockedOut,
  recordFailedAttempt,
  recordSuccessfulLogin,
  getRemainingAttempts,
  logSecurityEvent
} from '../utils/security';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  settings: AppSettings;
}

export default function LoginScreen({ onLoginSuccess, settings }: LoginScreenProps) {
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vérifie l'état de verrouillage au montage et toutes les secondes
  useEffect(() => {
    const checkLock = () => {
      const { locked, remainingSeconds } = isLockedOut();
      setIsLocked(locked);
      setLockCountdown(remainingSeconds);
      setRemainingAttempts(getRemainingAttempts());
    };
    checkLock();
    const timer = setInterval(checkLock, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Vérifie si verrouillé
    const lockStatus = isLockedOut();
    if (lockStatus.locked) {
      setIsLocked(true);
      setLockCountdown(lockStatus.remainingSeconds);
      return;
    }

    setIsSubmitting(true);

    try {
      const storedRaw = localStorage.getItem('app_passcode') || '1234';
      const isValid = await verifyPasscode(passcode, storedRaw);

      if (isValid) {
        recordSuccessfulLogin();
        logSecurityEvent('LOGIN_SUCCESS', `Connexion réussie`);

        // Migration: si ancien format texte clair → hacher le mot de passe
        if (storedRaw.length !== 64) {
          const hashed = await hashPasscode(storedRaw);
          localStorage.setItem('app_passcode', hashed);
        }

        onLoginSuccess();
      } else {
        const state = recordFailedAttempt();
        logSecurityEvent('LOGIN_FAILED', `Tentative ${state.attempts}/${5}`);

        if (state.lockedUntil) {
          setIsLocked(true);
          setLockCountdown(Math.ceil((state.lockedUntil - Date.now()) / 1000));
          logSecurityEvent('ACCOUNT_LOCKED', 'Compte verrouillé après 5 tentatives échouées');
        } else {
          setRemainingAttempts(Math.max(0, 5 - state.attempts));
        }

        setErrorMsg(true);
        setPasscode('');
        setTimeout(() => setErrorMsg(false), 3000);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPasscode = async () => {
    if (window.confirm('⚠️ Réinitialiser le code d\'accès à 1234 par défaut ?\n\nCette action est irréversible.')) {
      const hashed = await hashPasscode('1234');
      localStorage.setItem('app_passcode', hashed);
      setPasscode('');
      logSecurityEvent('PASSCODE_RESET', 'Code réinitialisé à 1234');
      alert('✅ Le code a été réinitialisé à 1234. Vous pouvez maintenant vous connecter.');
    }
  };

  const formatCountdown = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 bg-slate-900 flex flex-col justify-center items-center px-4 relative" id="login-container">
      {/* Background visual graphics */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-900 opacity-20 rounded-full filter blur-3xl -ml-20 -mt-20"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-900 opacity-20 rounded-full filter blur-3xl -mr-20 -mb-20"></div>

      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-8 max-w-sm w-full space-y-6 text-center animate-fade-in" id="login-card">
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="mx-auto w-16 h-16 bg-[#0F2C59] text-white rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden" id="login-icon">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} className="w-full h-full object-contain p-2 bg-white" alt="logo" />
            ) : (
              <CarIcon size={32} />
            )}
          </div>
          <h1 className="text-xl font-black text-gray-800 tracking-wide uppercase">LGLM</h1>
          <p className="text-xs text-gray-400 font-medium">LGLM Manager — Windows Desktop App</p>
        </div>

        {/* Écran de verrouillage */}
        {isLocked ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-red-700 font-bold">
                <ShieldX size={20} />
                <span>Accès Temporairement Bloqué</span>
              </div>
              <p className="text-xs text-red-600">
                Trop de tentatives incorrectes. Veuillez patienter.
              </p>
              <div className="flex items-center justify-center gap-2 bg-red-100 rounded-lg py-2 px-3">
                <Clock size={16} className="text-red-700" />
                <span className="font-mono font-bold text-red-800 text-lg">
                  {formatCountdown(lockCountdown)}
                </span>
              </div>
              <p className="text-[10px] text-red-400">
                L'accès sera débloqué automatiquement après ce délai.
              </p>
            </div>
          </div>
        ) : (
          /* Formulaire normal */
          <form onSubmit={handleLoginSubmit} className="space-y-4" id="login-form">
            <div className="space-y-1 text-left">
              <label className="block text-xs font-semibold text-gray-500 text-center mb-2">
                Saisir le Code d'accès Administrateur
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">
                  <KeyRound size={16} />
                </span>
                <input
                  type="password"
                  required
                  maxLength={8}
                  autoFocus
                  value={passcode}
                  onChange={e => setPasscode(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 focus:border-[#0F2C59] rounded-xl pl-10 pr-4 py-2.5 text-center font-mono tracking-widest text-lg text-gray-800 focus:outline-none bg-gray-50 disabled:opacity-50"
                />
              </div>
            </div>

            {errorMsg ? (
              <div className="text-xs text-rose-600 font-bold flex flex-col items-center gap-1 bg-rose-50 p-2 rounded-lg">
                <div className="flex items-center gap-1">
                  <ShieldAlert size={14} />
                  Code secret erroné !
                </div>
                {remainingAttempts > 0 && remainingAttempts < 5 && (
                  <span className="text-[10px] font-normal text-rose-500">
                    {remainingAttempts} tentative{remainingAttempts > 1 ? 's' : ''} restante{remainingAttempts > 1 ? 's' : ''} avant blocage
                  </span>
                )}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">
                Saisir le code secret (Le code par défaut d'usine est <strong>1234</strong>).
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0F2C59] hover:bg-blue-900 text-white font-bold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isSubmitting ? 'Vérification...' : 'Connexion Administrateur'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        )}

        {/* Footer info lock indicator */}
        <div className="pt-2 text-[10px] text-gray-400 border-t border-gray-100 flex items-center justify-center gap-1.5">
          <Lock size={12} />
          <span>Accès protégé par mot de passe chiffré SHA-256</span>
        </div>

        {/* Reset passcode button */}
        {!isLocked && (
          <button
            type="button"
            onClick={handleResetPasscode}
            className="w-full text-[10px] text-gray-400 hover:text-red-500 flex items-center justify-center gap-1 cursor-pointer transition pt-1"
          >
            <RotateCcw size={10} />
            Code oublié ? Réinitialiser à 1234
          </button>
        )}
      </div>
    </div>
  );
}
