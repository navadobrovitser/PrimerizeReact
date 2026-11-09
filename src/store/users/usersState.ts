export interface RegisterUserDto {
  id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
}

export interface UsersState {
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

export const initialState: UsersState = {
  loading: false,
  error: null,
  successMessage: null,
};