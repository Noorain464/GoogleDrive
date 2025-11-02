export interface File {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
  mimeType?: string;
  size?: number;
  createdAt: string;
  updatedAt: string;
  isStarred: boolean;
  isTrashed: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  email: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  error?: string;
}