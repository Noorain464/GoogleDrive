export interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  created_at: string;
  parent_id: string | null;
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