import { Router, Response } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse } from '../types';

const router = Router();

router.use(authMiddleware);

// Share a file with a user
router.post('/:id/share', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const fileId = req.params.id;
  const { email, permission } = req.body;

  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  try {
    // Find user by email
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

    if (userError) throw userError;

    const sharedWithUser = userData.users.find(u => u.email === email);

    if (!sharedWithUser) {
      const response: ApiResponse<never> = {
        success: false,
        error: 'User not found'
      };
      return res.status(404).json(response);
    }

    // Check if file exists and user owns it
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .eq('owner_id', userId)
      .single();

    if (fileError && fileError.code !== 'PGRST116') {
      // Also check folders
      const { data: folderData, error: folderError } = await supabase
        .from('folders')
        .select('*')
        .eq('id', fileId)
        .eq('owner_id', userId)
        .single();

      if (folderError) throw new Error('File not found or access denied');
    }

    // Create share
    const { data: shareData, error: shareError } = await supabase
      .from('shares')
      .insert({
        file_id: fileData ? fileId : null,
        folder_id: fileData ? null : fileId,
        shared_with_user_id: sharedWithUser.id,
        shared_by_user_id: userId,
        permission: permission || 'view'
      })
      .select()
      .single();

    if (shareError) throw shareError;

    const response: ApiResponse<any> = {
      success: true,
      data: shareData
    };

    res.json(response);
  } catch (error: any) {
    console.error('Share error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to share file'
    };
    res.status(500).json(response);
  }
});

// Get all shares for a file
router.get('/:id/shares', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const fileId = req.params.id;

  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  try {
    // Get shares for file
    const { data: fileShares, error: fileError } = await supabase
      .from('shares')
      .select('*')
      .eq('file_id', fileId);

    // Get shares for folder
    const { data: folderShares, error: folderError } = await supabase
      .from('shares')
      .select('*')
      .eq('folder_id', fileId);

    const shares = [...(fileShares || []), ...(folderShares || [])];

    // Get user details for each share
    const sharesWithUsers = await Promise.all(
      shares.map(async (share) => {
        const { data: userData } = await supabase.auth.admin.getUserById(share.shared_with_user_id);
        return {
          id: share.shared_with_user_id,
          email: userData.user?.email || 'Unknown',
          permission: share.permission
        };
      })
    );

    const response: ApiResponse<any[]> = {
      success: true,
      data: sharesWithUsers
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get shares error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to get shares'
    };
    res.status(500).json(response);
  }
});

// Remove share (unshare)
router.delete('/:id/share/:userId', async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.userId;
  const fileId = req.params.id;
  const sharedUserId = req.params.userId;

  if (!ownerId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  try {
    // Delete share
    const { error } = await supabase
      .from('shares')
      .delete()
      .eq('shared_with_user_id', sharedUserId)
      .or(`file_id.eq.${fileId},folder_id.eq.${fileId}`);

    if (error) throw error;

    const response: ApiResponse<void> = {
      success: true
    };

    res.json(response);
  } catch (error: any) {
    console.error('Unshare error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to unshare'
    };
    res.status(500).json(response);
  }
});

// Update share permission
router.patch('/:id/share/:userId', async (req: AuthenticatedRequest, res: Response) => {
  const ownerId = req.userId;
  const fileId = req.params.id;
  const sharedUserId = req.params.userId;
  const { permission } = req.body;

  if (!ownerId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  try {
    // Update share permission
    const { data, error } = await supabase
      .from('shares')
      .update({ permission })
      .eq('shared_with_user_id', sharedUserId)
      .or(`file_id.eq.${fileId},folder_id.eq.${fileId}`)
      .select()
      .single();

    if (error) throw error;

    const response: ApiResponse<any> = {
      success: true,
      data
    };

    res.json(response);
  } catch (error: any) {
    console.error('Update permission error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to update permission'
    };
    res.status(500).json(response);
  }
});

// Get files shared with the current user
router.get('/shared', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  try {
    // Get shares where user is the recipient
    const { data: shares, error: sharesError } = await supabase
      .from('shares')
      .select('*')
      .eq('shared_with_user_id', userId);

    if (sharesError) throw sharesError;

    // Get file/folder details for each share
    const sharedItems: any[] = [];

    for (const share of shares || []) {
      if (share.file_id) {
        const { data: fileData } = await supabase
          .from('files')
          .select('*')
          .eq('id', share.file_id)
          .single();

        if (fileData) {
          sharedItems.push({
            id: fileData.id,
            name: fileData.name,
            type: 'file',
            mimeType: fileData.mime_type,
            size: fileData.file_size,
            parentId: fileData.folder_id,
            ownerId: fileData.owner_id,
            createdAt: fileData.created_at,
            updatedAt: fileData.updated_at,
            isStarred: fileData.is_starred,
            isTrashed: fileData.is_trashed,
            permission: share.permission
          });
        }
      } else if (share.folder_id) {
        const { data: folderData } = await supabase
          .from('folders')
          .select('*')
          .eq('id', share.folder_id)
          .single();

        if (folderData) {
          sharedItems.push({
            id: folderData.id,
            name: folderData.name,
            type: 'folder',
            parentId: folderData.parent_folder_id,
            ownerId: folderData.owner_id,
            createdAt: folderData.created_at,
            updatedAt: folderData.updated_at,
            isStarred: folderData.is_starred,
            isTrashed: folderData.is_trashed,
            permission: share.permission
          });
        }
      }
    }

    const response: ApiResponse<any[]> = {
      success: true,
      data: sharedItems
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get shared files error:', error);
    const response: ApiResponse<never> = {
      success: false,
      error: error.message || 'Failed to get shared files'
    };
    res.status(500).json(response);
  }
});

export default router;
