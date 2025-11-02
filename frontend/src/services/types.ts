export interface File {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parent_id: string | null;
  owner_id: string;
  storage_path?: string;
  mime_type?: string;
  size?: number;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: string;
  user_id: string;
  file_id: string;
  action: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
}