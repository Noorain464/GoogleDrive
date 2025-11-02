import { Router, Request, Response } from 'express';
import { FileService } from '../services/FileService';
import multer from 'multer';

const router = Router();
const fileService = new FileService();
const upload = multer({ storage: multer.memoryStorage() });

// Get files in a folder
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.header('user-id'); // In production, get this from auth middleware
    const parentId = req.query.parentId as string | null;
    const view = req.query.view as string || 'my-drive';
    const searchQuery = req.query.search as string | undefined;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const files = await fileService.getFiles(userId, {
      currentFolderId: parentId,
      currentView: view,
      searchQuery
    });
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a folder
router.post('/', async (req, res) => {
  try {
    const userId = req.header('user-id'); // In production, get this from auth middleware
    const { name, type, parentId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await fileService.createFile(userId, {
      name,
      type,
      parentId
    });
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Upload a file
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.header('user-id'); // In production, get this from auth middleware
    const parentId = req.body.parentId;
    const file = req.file;
    
    if (!userId || !file) {
      return res.status(401).json({ error: 'Unauthorized or no file provided' });
    }

    const fileData = await fileService.createFile(userId, {
      name: file.originalname,
      type: 'file',
      mimeType: file.mimetype,
      size: file.size,
      parentId
    });
    res.json(fileData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a file or folder
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.header('user-id'); // In production, get this from auth middleware
    const fileId = req.params.id;
    const updates = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const file = await fileService.updateFile(fileId, userId, updates);
    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a file or folder
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.header('user-id'); // In production, get this from auth middleware
    const fileId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    await fileService.deleteFile(fileId, userId);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;