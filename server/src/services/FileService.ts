import { supabase } from '../config/supabase';
import { FileQueryOptions, FileData, FileMetadata, ApiResponse } from '../types';

export class FileService {
  private extractErrorMessage(err: any): string {
    if (!err) return 'Internal server error';
    if (err instanceof Error && err.message) return err.message;
    if (typeof err === 'object') {
      if ('message' in err && err.message) return String((err as any).message);
      if ('error' in err && (err as any).error) return String((err as any).error);
    }
    try {
      return String(err);
    } catch {
      return 'Internal server error';
    }
  }

  private transformDatabaseFile(file: any): FileMetadata {
    return {
      id: file.id,
      name: file.name,
      type: 'file',
      mimeType: file.mime_type,
      size: file.file_size ?? file.size,
      parentId: file.folder_id ?? null,
      ownerId: file.owner_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      filePath: file.file_path,
      fileType: file.file_type,
      isStarred: file.is_starred,
      isTrashed: file.is_trashed
    };
  }

  private transformDatabaseFolder(folder: any): FileMetadata {
    return {
      id: folder.id,
      name: folder.name,
      type: 'folder',
      mimeType: undefined,
      size: undefined,
      parentId: folder.parent_folder_id ?? null,
      ownerId: folder.owner_id,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
      isStarred: folder.is_starred,
      isTrashed: folder.is_trashed
    };
  }

  // Return both folders and files inside the current folder for the user
  async getFiles(userId: string, options: FileQueryOptions): Promise<ApiResponse<FileMetadata[]>> {
    try {
      const folderCond = options.currentFolderId ? options.currentFolderId : null;

      // Fetch folders
      let foldersQuery = supabase
        .from('folders')
        .select('*')
        .eq('owner_id', userId);

      if (folderCond) foldersQuery = foldersQuery.eq('parent_folder_id', folderCond);
      else if (options.currentView === 'my-drive') foldersQuery = foldersQuery.is('parent_folder_id', null);

      if (options.searchQuery) foldersQuery = foldersQuery.ilike('name', `%${options.searchQuery}%`);

      const { data: foldersData, error: foldersError } = await foldersQuery;
      if (foldersError) throw foldersError;

      // Fetch files
      let filesQuery = supabase
        .from('files')
        .select('*')
        .eq('owner_id', userId);

      if (folderCond) filesQuery = filesQuery.eq('folder_id', folderCond);
      else if (options.currentView === 'my-drive') filesQuery = filesQuery.is('folder_id', null);

      if (options.searchQuery) filesQuery = filesQuery.ilike('name', `%${options.searchQuery}%`);

      const { data: filesData, error: filesError } = await filesQuery;
      if (filesError) throw filesError;

      const folders = (foldersData ?? []).map((f: any) => this.transformDatabaseFolder(f));
      const files = (filesData ?? []).map((f: any) => this.transformDatabaseFile(f));

      // Return folders first, then files
      return {
        success: true,
        data: [...folders, ...files]
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  async createFile(userId: string, data: FileData): Promise<ApiResponse<FileMetadata>> {
    try {
      if (data.type === 'folder') {
        const { data: folder, error } = await supabase
          .from('folders')
          .insert([{
            name: data.name,
            parent_folder_id: data.parentId,
            owner_id: userId,
            is_starred: data.isStarred ?? false,
            is_trashed: data.isTrashed ?? false
          }])
          .select()
          .single();

        if (error) throw error;

        return {
          success: true,
          data: this.transformDatabaseFolder(folder)
        };
      }

      // file
      const { data: file, error } = await supabase
        .from('files')
        .insert([{
          name: data.name,
          folder_id: data.parentId,
          owner_id: userId,
          file_path: data.filePath ?? '',
          file_type: data.fileType,
          file_size: data.size,
          mime_type: data.mimeType,
          is_starred: data.isStarred ?? false,
          is_trashed: data.isTrashed ?? false
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        success: true,
        data: this.transformDatabaseFile(file)
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  async updateFile(fileId: string, userId: string, updates: Partial<FileData>): Promise<ApiResponse<FileMetadata>> {
    try {
      // Try update files table first
      const { data: file, error } = await supabase
        .from('files')
        .update({
          name: updates.name,
          file_type: updates.fileType,
          file_size: updates.size,
          mime_type: updates.mimeType,
          folder_id: updates.parentId,
          is_starred: updates.isStarred,
          is_trashed: updates.isTrashed
        })
        .eq('id', fileId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (file && !error) {
        return {
          success: true,
          data: this.transformDatabaseFile(file)
        };
      }

      // If not found in files, try folders
      const { data: folder, error: folderError } = await supabase
        .from('folders')
        .update({
          name: updates.name,
          parent_folder_id: updates.parentId,
          is_starred: updates.isStarred,
          is_trashed: updates.isTrashed
        })
        .eq('id', fileId)
        .eq('owner_id', userId)
        .select()
        .single();

      if (folder && !folderError) {
        return {
          success: true,
          data: this.transformDatabaseFolder(folder)
        };
      }

      throw error ?? folderError ?? new Error('Not found');
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      // Try delete from files
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('owner_id', userId);

      if (!error) {
        return { success: true };
      }

      // Try delete folder
      const { error: folderError } = await supabase
        .from('folders')
        .delete()
        .eq('id', fileId)
        .eq('owner_id', userId);

      if (!folderError) {
        return { success: true };
      }

      throw error ?? folderError ?? new Error('Delete failed');
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  async downloadFile(fileId: string, userId: string): Promise<ApiResponse<FileMetadata>> {
    try {
      // Get file metadata
      const { data: file, error } = await supabase
        .from('files')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', userId)
        .single();

      if (error || !file) throw new Error('File not found');

      return {
        success: true,
        data: this.transformDatabaseFile(file)
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }

  async searchFiles(userId: string, query: string): Promise<ApiResponse<FileMetadata[]>> {
    try {
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', userId)
        .ilike('name', `%${query}%`);

      if (filesError) throw filesError;

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('owner_id', userId)
        .ilike('name', `%${query}%`);

      if (foldersError) throw foldersError;

      const folders = (foldersData ?? []).map((f: any) => this.transformDatabaseFolder(f));
      const files = (filesData ?? []).map((f: any) => this.transformDatabaseFile(f));

      return {
        success: true,
        data: [...folders, ...files]
      };
    } catch (error) {
      return {
        success: false,
        error: this.extractErrorMessage(error)
      };
    }
  }
}