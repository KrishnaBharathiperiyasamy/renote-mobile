const SA_TOKEN_KEY = 'sa_token';

export function getSAToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(SA_TOKEN_KEY);
}

export function setSAToken(token: string): void {
  sessionStorage.setItem(SA_TOKEN_KEY, token);
}

export function clearSAToken(): void {
  sessionStorage.removeItem(SA_TOKEN_KEY);
}

function isTokenValid(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isSaRole =
      payload.role === 'SUPER_ADMIN' ||
      payload.role === 'super-admin' ||
      payload.legacyRole === 'super-admin';

    return (
      isSaRole &&
      Boolean(payload.username) &&
      !payload.authId &&
      payload.exp * 1000 > Date.now()
    );
  } catch {
    return false;
  }
}

/** Returns a valid super-admin token (sa_token or regular login token) */
function getEffectiveSAToken(): string | null {
  const saToken = getSAToken();
  if (saToken && isTokenValid(saToken)) return saToken;

  if (typeof window === 'undefined') return null;
  const loginToken = localStorage.getItem('token');
  if (loginToken && isTokenValid(loginToken)) return loginToken;

  return null;
}

export function isSAAuthenticated(): boolean {
  return getEffectiveSAToken() !== null;
}

export async function saFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getEffectiveSAToken();
  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  return fetch(url, { ...options, headers });
}
