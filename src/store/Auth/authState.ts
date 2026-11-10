
// מצב ההתחברות של המשתמש
export interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  codeSent: boolean;
}

// מצב התחלתי - המשתמש עדיין לא מחובר
export const initialAuthState: AuthState = {
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  codeSent: false,
};
