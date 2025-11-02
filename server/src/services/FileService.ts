import { supabase } from '../config/supabase';
import { FileQueryOptions, FileData, FileMetadata, ApiResponse } from '../types';

export class FileService {
  private transformDatabaseFile(file: any): FileMetadata {
    return {
      id: file.id,
      name: file.name,
      type: file.type,
      mimeType: file.mime_type,
      size: file.size,
      parentId: file.parent_id,
      ownerId: file.owner_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at
    };
  }

  async getFiles(userId: string, options: FileQueryOptions): Promise<ApiResponse<FileMetadata[]>> {
    try {
      let query = supabase.from('files')
        .select('*')
        .eq('owner_id', userId);

      if (options.currentFolderId) {
        query = query.eq('parent_id', options.currentFolderId);
      } else if (options.currentView === 'my-drive') {
        query = query.is('parent_id', null);
      }

      if (options.searchQuery) {
        query = query.ilike('name', `%${options.searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      return {
        success: true,
        data: data.map(file => this.transformDatabaseFile(file))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async createFile(userId: string, data: FileData): Promise<ApiResponse<FileMetadata>> {
    try {
      const { data: file, error } = await supabase
        .from('files')
        .insert([{
          name: data.name,
          type: data.type,
          mime_type: data.mimeType,
          size: data.size,
          parent_id: data.parentId,
          owner_id: userId
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
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async updateFile(fileId: string, userId: string, updates: Partial<FileData>): Promise<ApiResponse<FileMetadata>> {
    try {
      const { data: file, error } = await supabase
        .from('files')
        .update({
          name: updates.name,
          type: updates.type,
          mime_type: updates.mimeType,
          size: updates.size,
          parent_id: updates.parentId
        })
        .eq('id', fileId)
        .eq('owner_id', userId)
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
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async deleteFile(fileId: string, userId: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId)
        .eq('owner_id', userId);

      if (error) throw error;

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }

  async searchFiles(userId: string, query: string): Promise<ApiResponse<FileMetadata[]>> {
    try {
      const { data, error } = await supabase
        .from('files')
        .select('*')
        .eq('owner_id', userId)
        .ilike('name', `%${query}%`);

      if (error) throw error;

      return {
        success: true,
        data: data.map(file => this.transformDatabaseFile(file))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      };
    }
  }
}