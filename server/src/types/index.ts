export interface FileQueryOptions {
  currentFolderId: string | null;
  currentView: string;
  searchQuery?: string;
}

export interface FileData {
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  parentId?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  parentId: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  email: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  error?: string;
}