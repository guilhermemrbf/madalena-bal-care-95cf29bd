// Offline authentication utilities
// Caches user data locally for offline login capability

const CACHE_KEY = 'mb_offline_auth';
const SETUP_KEY = 'mb_setup_complete';

interface CachedUser {
  email: string;
  passwordHash: string;
  userId: string;
  profile: {
    full_name: string;
    cargo: string;
    avatar_initials: string;
  };
  role: 'admin' | 'funcionario';
  cachedAt: number;
}

interface OfflineAuthCache {
  users: CachedUser[];
}

// Simple hash for offline password verification (not for security-critical online use)
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_mb_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getCache(): OfflineAuthCache {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { users: [] };
}

function saveCache(cache: OfflineAuthCache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

/** Cache user credentials after successful online login */
export async function cacheUserForOffline(
  email: string,
  password: string,
  userId: string,
  profile: CachedUser['profile'],
  role: CachedUser['role']
) {
  const passwordHash = await hashPassword(password);
  const cache = getCache();
  
  // Update or add user
  const idx = cache.users.findIndex(u => u.email === email);
  const entry: CachedUser = { email, passwordHash, userId, profile, role, cachedAt: Date.now() };
  
  if (idx >= 0) {
    cache.users[idx] = entry;
  } else {
    cache.users.push(entry);
  }
  
  saveCache(cache);
}

/** Attempt offline login */
export async function offlineLogin(email: string, password: string): Promise<{
  success: boolean;
  user?: CachedUser;
  error?: string;
}> {
  const cache = getCache();
  const user = cache.users.find(u => u.email === email);
  
  if (!user) {
    return { success: false, error: 'Conta não encontrada no cache offline. Faça login online primeiro.' };
  }
  
  const passwordHash = await hashPassword(password);
  if (passwordHash !== user.passwordHash) {
    return { success: false, error: 'Senha incorreta' };
  }
  
  return { success: true, user };
}

/** Check if initial setup has been completed */
export function isSetupComplete(): boolean {
  return localStorage.getItem(SETUP_KEY) === 'true';
}

/** Mark setup as complete */
export function markSetupComplete() {
  localStorage.setItem(SETUP_KEY, 'true');
}

/** Get cached users count (to check if any admin exists offline) */
export function getCachedAdminCount(): number {
  const cache = getCache();
  return cache.users.filter(u => u.role === 'admin').length;
}
