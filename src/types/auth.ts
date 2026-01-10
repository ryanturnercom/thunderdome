export interface SessionData {
  isAuthenticated: boolean;
  authenticatedAt?: number;
}

export const defaultSession: SessionData = {
  isAuthenticated: false,
};
