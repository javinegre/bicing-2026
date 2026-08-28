const BASE_URL = (
  import.meta.env.VITE_BICING_API_BASE_URL ?? 'https://negre.co/bicing/api'
).replace(/\/$/, '');

export const API_BASE = `${BASE_URL}/v2`;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * `credentials: 'include'` because the config endpoints are gated by the shared
 * better-auth session cookie set at negre.co/login. The station feeds ignore it.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: { Accept: 'application/json', ...init.headers },
  });

  if (!res.ok) {
    throw new ApiError(`${init.method ?? 'GET'} ${path} failed`, res.status);
  }

  return (await res.json()) as T;
}
