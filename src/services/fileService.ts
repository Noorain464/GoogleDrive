import { supabase } from '@/integrations/supabase/client';
import type { FileItem, Activity } from './types';

export const fileService = {
  async getFiles(options: {
    currentFolderId: string | null;
    currentView: string;
    searchQuery?: string;
  }) {
    let query = supabase.from('files').select('*');

    if (options.currentFolderId) {
      query = query.eq('parent_id', options.currentFolderId);
    } else if (options.currentView === 'my-drive') {
      query = query.is('parent_id', null);
    }

    if (options.searchQuery) {
      query = query.ilike('name', `%${options.searchQuery}%`);
    }

    return await query;
  },

  async createFolder(name: string, parentId: string | null) {
    return await supabase.from('files').insert({
      name,
      type: 'folder',
      parent_id: parentId,
    });
  },

  async uploadFile(file: File, parentId: string | null) {
    // Handle file upload to storage and database
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('files')
      .upload(fileName, file);

    if (uploadError) {
      throw uploadError;
    }

    return await supabase.from('files').insert({
      name: file.name,
      type: 'file',
      parent_id: parentId,
      storage_path: fileName,
    });
  },

  async renameFile(fileId: string, newName: string) {
    return await supabase
      .from('files')
      .update({ name: newName })
      .eq('id', fileId);
  },

  async deleteFile(fileId: string) {
    return await supabase
      .from('files')
      .delete()
      .eq('id', fileId);
  },

  async logActivity(activity: Omit<Activity, 'id' | 'created_at'>) {
    return await supabase.from('activities').insert(activity);
  }
};