export interface User {
  _id: string;
  firstName: string;
  lastName?: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAdmin: boolean;
  userId: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  firstName: string;
  lastName?: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message?: string;
}
