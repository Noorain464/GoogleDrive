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
  parentId?: string; // maps to files.folder_id or folders.parent_folder_id
  filePath?: string;
  fileType?: string;
  isStarred?: boolean;
  isTrashed?: boolean;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  parentId: string | null; // folder id for files, parent folder id for folders
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  fileType?: string;
  isStarred?: boolean;
  isTrashed?: boolean;
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