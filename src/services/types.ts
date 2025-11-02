export interface User {export interface FileItem {

  id: string;  id: string;

  email: string;  name: string;

  full_name?: string;  type: 'file' | 'folder';

  created_at: string;  created_at: string;

}  parent_id: string | null;

}

export interface FileItem {

  id: string;export interface Activity {

  name: string;  id: string;

  type: 'file' | 'folder';  user_id: string;

  storage_path?: string;  file_id: string;

  mime_type?: string;  action: string;

  size?: number;  created_at: string;

  parent_id: string | null;}

  owner_id: string;

  created_at: string;export interface User {

}  id: string;

  email: string;

export interface Activity {}
  id: string;
  user_id: string;
  action: 'upload' | 'delete' | 'rename' | 'create_folder';
  file_id: string;
  file_name: string;
  created_at: string;
}