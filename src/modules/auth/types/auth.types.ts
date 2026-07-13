export interface AuthUser {
  id: number;
  documentId?: string;
  username: string;
  email: string;
  confirmed?: boolean;
  blocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  jwt: string;
  user: AuthUser;
}
