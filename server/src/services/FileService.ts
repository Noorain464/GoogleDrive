import { supabase } from '../config/supabase';
import { FileQueryOptions, FileData, FileMetadata, ActivityData } from '../types';

export class FileService {
  async getFiles(userId: string, options: FileQueryOptions): Promise<FileMetadata[]> {
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
    return data as FileMetadata[];
  }

  async createFile(userId: string, data: {
    name: string;
    type: string;
    mimeType?: string;
    size?: number;
    path?: string;
    parentId?: string;
  }) {
    const { data: file, error } = await supabase
      .from('files')
      .insert([{
        ...data,
        owner_id: userId
      }])
      .select()
      .single();

    if (error) throw error;
    return file;
  }

  async updateFile(fileId: string, userId: string, data: {
    name?: string;
    type?: string;
    mimeType?: string;
    size?: number;
    path?: string;
    parentId?: string;
  }) {
    const { data: file, error } = await supabase
      .from('files')
      .update(data)
      .eq('id', fileId)
      .eq('owner_id', userId)
      .select()
      .single();

    if (error) throw error;
    return file;
  }

  async deleteFile(fileId: string, userId: string) {
    const { error } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId)
      .eq('owner_id', userId);

    if (error) throw error;
  }

  async searchFiles(userId: string, query: string) {
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .eq('owner_id', userId)
      .ilike('name', `%${query}%`);

    if (error) throw error;
    return data;
  }
}