export interface JWTPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
