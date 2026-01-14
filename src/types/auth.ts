export interface SessionData {
  isAuthenticated: boolean;
  isGuest?: boolean;
  authenticatedAt?: number;
  guestExecutionCount?: number;
  guestExecutionDate?: string; // YYYY-MM-DD format for daily reset tracking
}

export const defaultSession: SessionData = {
  isAuthenticated: false,
  isGuest: false,
};
