export interface AuthState {
  token: string | null;
  role: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  codeSent: boolean;
}

export const initialAuthState: AuthState = {
  token: null,
  role: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  codeSent: false,
};