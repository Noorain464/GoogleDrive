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
  path?: string;
  parentId?: string;
  storageKey?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  type: 'file' | 'folder';
  mimeType?: string;
  size?: number;
  path?: string;
  parentId?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityData {
  userId: string;
  fileId: string;
  action: 'create' | 'update' | 'delete' | 'rename' | 'move';
  details?: Record<string, any>;
}