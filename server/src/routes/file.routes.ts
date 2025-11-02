import { Router, Request, Response } from 'express';
import { FileService } from '../services/FileService';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import type { AuthenticatedRequest } from '../middleware/auth.middleware';
import type { ApiResponse, FileMetadata } from '../types';

const router = Router();
const fileService = new FileService();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Get files in a folder
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const parentId = req.query.parentId as string | null;
  const view = req.query.view as string || 'my-drive';
  const searchQuery = req.query.search as string | undefined;
  
  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.getFiles(userId, {
    currentFolderId: parentId,
    currentView: view,
    searchQuery
  });
  
  if (!response.success) {
    return res.status(500).json(response);
  }
  
  res.json(response);
});

// Create a folder
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const { name, type, parentId } = req.body;
  
  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.createFile(userId, {
    name,
    type,
    parentId
  });
  
  if (!response.success) {
    console.error('FileService.createFile failed:', response.error);
    return res.status(500).json(response);
  }
  
  console.log('FileService.createFile success:', response.data?.id || response.data?.name);
  res.json(response);
});

// Upload a file
router.post('/upload', upload.single('file'), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const parentId = req.body.parentId;
  const file = req.file;
  
  if (!userId || !file) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized or no file provided'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.createFile(userId, {
    name: file.originalname,
    type: 'file',
    mimeType: file.mimetype,
    size: file.size,
    parentId
  });
  
  if (!response.success) {
    return res.status(500).json(response);
  }
  
  res.json(response);
});

// Update a file or folder
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const fileId = req.params.id;
  const updates = req.body;
  
  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.updateFile(fileId, userId, updates);
  
  if (!response.success) {
    return res.status(500).json(response);
  }
  
  res.json(response);
});

// Download a file
router.get('/:id/download', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const fileId = req.params.id;

  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.downloadFile(fileId, userId);

  if (!response.success) {
    return res.status(404).json(response);
  }

  // For now, send file metadata. In production, you'd stream the actual file
  res.json(response);
});

// Delete a file or folder
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId;
  const fileId = req.params.id;

  if (!userId) {
    const response: ApiResponse<never> = {
      success: false,
      error: 'Unauthorized'
    };
    return res.status(401).json(response);
  }

  const response = await fileService.deleteFile(fileId, userId);

  if (!response.success) {
    return res.status(500).json(response);
  }

  res.json(response);
});

export default router;