export interface SessionData {
  isAuthenticated: boolean;
  isGuest?: boolean;
  authenticatedAt?: number;
}

export const defaultSession: SessionData = {
  isAuthenticated: false,
  isGuest: false,
};
