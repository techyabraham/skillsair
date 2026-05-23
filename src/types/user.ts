export interface User {
  id: number;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  avatar: string;
  bio?: string;
  timezone?: string;
  roles: string[];
  registeredAt: string;
  lastLogin?: string;
}

export interface AuthUser extends User {
  token: string;
  refreshToken?: string;
  tokenExpiry?: number;
}

export interface StudentStats {
  totalEnrolled: number;
  totalCompleted: number;
  totalCertificates: number;
  totalWatchedHours: number;
  currentStreak: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  password: string;
  acceptTerms: boolean;
}

export interface PasswordResetData {
  email: string;
}

export interface ProfileUpdateData {
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  phone?: string;
  bio?: string;
  timezone?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
