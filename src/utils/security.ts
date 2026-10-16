/**
 * LGLM Manager — Security Module
 * Protection contre : brute-force, XSS, injection, données corrompues
 */

// ─── HACHAGE DU MOT DE PASSE (SHA-256 via Web Crypto API) ──────────────────
export async function hashPasscode(passcode: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(passcode + 'lglm_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPasscode(input: string, storedHash: string): Promise<boolean> {
  // Support ancien format (texte brut) pour migration transparente
  if (storedHash.length !== 64) {
    return input === storedHash;
  }
  const inputHash = await hashPasscode(input);
  return inputHash === storedHash;
}

// ─── PROTECTION BRUTE-FORCE ──────────────────────────────────────────────────
const BRUTE_FORCE_KEY = 'lglm_bf_attempts';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes

export interface BruteForceState {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

export function getBruteForceState(): BruteForceState {
  try {
    const raw = sessionStorage.getItem(BRUTE_FORCE_KEY);
    if (!raw) return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
    return JSON.parse(raw);
  } catch {
    return { attempts: 0, lockedUntil: null, lastAttempt: 0 };
  }
}

export function isLockedOut(): { locked: boolean; remainingSeconds: number } {
  const state = getBruteForceState();
  if (!state.lockedUntil) return { locked: false, remainingSeconds: 0 };
  const now = Date.now();
  if (now < state.lockedUntil) {
    return {
      locked: true,
      remainingSeconds: Math.ceil((state.lockedUntil - now) / 1000)
    };
  }
  // Verrou expiré — reset
  resetBruteForce();
  return { locked: false, remainingSeconds: 0 };
}

export function recordFailedAttempt(): BruteForceState {
  const state = getBruteForceState();
  const newAttempts = state.attempts + 1;
  const newState: BruteForceState = {
    attempts: newAttempts,
    lockedUntil: newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_DURATION_MS : null,
    lastAttempt: Date.now()
  };
  sessionStorage.setItem(BRUTE_FORCE_KEY, JSON.stringify(newState));
  return newState;
}

export function recordSuccessfulLogin(): void {
  resetBruteForce();
}

export function resetBruteForce(): void {
  sessionStorage.removeItem(BRUTE_FORCE_KEY);
}

export function getRemainingAttempts(): number {
  const state = getBruteForceState();
  return Math.max(0, MAX_ATTEMPTS - state.attempts);
}

// ─── SANITISATION DES ENTRÉES (Anti-XSS) ────────────────────────────────────
export function sanitizeText(input: string, maxLength = 500): string {
  if (typeof input !== 'string') return '';
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function sanitizeNumber(input: any, min = 0, max = 9999999): number {
  const num = Number(input);
  if (isNaN(num) || !isFinite(num)) return min;
  return Math.max(min, Math.min(max, num));
}

export function sanitizeDate(input: string): string {
  if (!input || typeof input !== 'string') return '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.trim())) return '';
  const date = new Date(input);
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  if (year < 2000 || year > 2100) return '';
  return input.trim();
}

export function sanitizePhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.replace(/[^\d\s+\-().]/g, '').slice(0, 20).trim();
}

export function sanitizeEmail(input: string): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim().slice(0, 100);
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(trimmed) ? trimmed : '';
}

// ─── VALIDATION DES DONNÉES IMPORTÉES ───────────────────────────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateImportedDatabase(data: any): ValidationResult {
  const errors: string[] = [];

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Format de données invalide'] };
  }

  const allowedKeys = ['settings', 'cars', 'clients', 'reservations', 'invoices', 'collaborators', 'payments', 'expenses', 'revenues'];
  const dataKeys = Object.keys(data);
  const unknownKeys = dataKeys.filter(k => !allowedKeys.includes(k));
  if (unknownKeys.length > 0) {
    errors.push(`Clés inconnues détectées : ${unknownKeys.join(', ')}`);
  }

  const arrayFields = ['cars', 'clients', 'reservations', 'invoices', 'collaborators', 'payments', 'expenses', 'revenues'];
  for (const field of arrayFields) {
    if (data[field] !== undefined && !Array.isArray(data[field])) {
      errors.push(`Le champ "${field}" doit être un tableau`);
    }
  }

  const jsonSize = JSON.stringify(data).length;
  const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
  if (jsonSize > MAX_SIZE) {
    errors.push(`Fichier trop volumineux (${(jsonSize / 1024 / 1024).toFixed(1)} MB > 10 MB)`);
  }

  if (data.settings && typeof data.settings === 'object') {
    const s = data.settings;
    if (s.tvaRate !== undefined && (typeof s.tvaRate !== 'number' || s.tvaRate < 0 || s.tvaRate > 100)) {
      errors.push('Taux TVA invalide (doit être entre 0 et 100)');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ─── JOURNALISATION DE SÉCURITÉ ──────────────────────────────────────────────
const SECURITY_LOG_KEY = 'lglm_security_log';
const MAX_LOG_ENTRIES = 50;

export interface SecurityLogEntry {
  timestamp: string;
  event: string;
  details?: string;
}

export function logSecurityEvent(event: string, details?: string): void {
  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY);
    const log: SecurityLogEntry[] = raw ? JSON.parse(raw) : [];
    log.unshift({ timestamp: new Date().toISOString(), event, details });
    localStorage.setItem(SECURITY_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG_ENTRIES)));
  } catch {
    // Silencieux
  }
}

export function getSecurityLog(): SecurityLogEntry[] {
  try {
    const raw = localStorage.getItem(SECURITY_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
