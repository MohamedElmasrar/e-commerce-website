/** Holds the short-lived access token in memory only. The refresh token lives in an httpOnly cookie. */
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(token: string | null): void {
    accessToken = token;
    listeners.forEach((listener) => listener(token));
  },
  subscribe(listener: (token: string | null) => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
