import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { FileIcon, FolderIcon } from 'lucide-react';
import { apiService } from '@/services/apiService';
import type { File } from '@/services/types';
import FileContextMenu from './FileContextMenu';
import RenameDialog from './RenameDialog';
import MoveDialog from './MoveDialog';
import FilePreviewDialog from './FilePreviewDialog';
import ShareDialog from './ShareDialog';
import { toast } from 'sonner';

interface FileGridProps {
  currentView: string;
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null, folderName?: string) => void;
  searchQuery: string;
  viewMode?: 'grid' | 'list';
  sortBy?: 'name' | 'date' | 'size';
  sortOrder?: 'asc' | 'desc';
  selectedFiles?: Set<string>;
  onFileSelect?: (fileId: string, selected: boolean) => void;
  onShowDetails?: (file: File) => void;
  onFilesLoaded?: (files: File[]) => void;
}

const FileGrid: React.FC<FileGridProps> = ({
  currentView,
  currentFolderId,
  onFolderChange,
  searchQuery,
  viewMode = 'grid',
  sortBy = 'name',
  sortOrder = 'asc',
  selectedFiles = new Set(),
  onFileSelect,
  onShowDetails,
  onFilesLoaded
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [draggedFile, setDraggedFile] = useState<File | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, [currentView, currentFolderId, searchQuery]);

  const fetchFiles = async () => {
    try {
      setLoading(true);

      let response;

      // Fetch shared files if in "shared" view
      if (currentView === 'shared') {
        response = await apiService.getSharedFiles();
      } else {
        response = await apiService.getFiles(currentFolderId);
      }

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to fetch files');
      }

      let fetchedFiles = response.data;

      if (currentView === 'starred') {
        fetchedFiles = fetchedFiles.filter((file: File) => file.isStarred)
      } else if (currentView === 'trash') {
        fetchedFiles = fetchedFiles.filter((file: File) => file.isTrashed);
      } else if (currentView !== 'shared') {
        fetchedFiles = fetchedFiles.filter((file: File) => !file.isTrashed);
      }

      if (searchQuery.trim()) {
        const lower = searchQuery.toLowerCase();
        fetchedFiles = fetchedFiles.filter((file: File) =>
          file.name.toLowerCase().includes(lower)
        );
      }

      // Apply sorting
      fetchedFiles = sortFiles(fetchedFiles, sortBy, sortOrder);

      setFiles(fetchedFiles);

      // Notify parent of loaded files
      if (onFilesLoaded) {
        onFilesLoaded(fetchedFiles);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const sortFiles = (files: File[], sortBy: string, order: string): File[] => {
    return [...files].sort((a, b) => {
      let comparison = 0;

      // Always put folders first
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'size':
          comparison = (a.size || 0) - (b.size || 0);
          break;
        default:
          comparison = 0;
      }

      return order === 'asc' ? comparison : -comparison;
    });
  };

  const handleItemClick = (file: File, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Multi-select with Ctrl/Cmd
      if (onFileSelect) {
        onFileSelect(file.id, !selectedFiles.has(file.id));
      }
      return;
    }

    if (file.type === 'folder') {
      onFolderChange(file.id, file.name);
    } else {
      // Open file preview
      setSelectedFile(file);
      setPreviewDialogOpen(true);
    }
  };

  const handleStar = async (file: File) => {
    try {
      const response = await apiService.updateFile(file.id, { isStarred: !file.isStarred });
      if (!response.success) throw new Error(response.error);

      toast.success(file.isStarred ? 'Removed from starred' : 'Added to starred');
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleTrash = async (file: File) => {
    try {
      if (file.isTrashed) {
        // Permanent delete
        const response = await apiService.deleteFile(file.id);
        if (!response.success) throw new Error(response.error);
        toast.success('Deleted permanently');
      } else {
        // Move to trash
        const response = await apiService.updateFile(file.id, { isTrashed: true });
        if (!response.success) throw new Error(response.error);
        toast.success('Moved to trash');
      }
      fetchFiles();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleDownload = async (file: File) => {
    try {
      const response = await apiService.downloadFile(file.id);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Download started');
    } catch (error: any) {
      toast.error(error.message || 'Failed to download');
    }
  };

  const handleRename = (file: File) => {
    setSelectedFile(file);
    setRenameDialogOpen(true);
  };

  const handleMove = (file: File) => {
    setSelectedFile(file);
    setMoveDialogOpen(true);
  };

  const handleShare = (file: File) => {
    setSelectedFile(file);
    setShareDialogOpen(true);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, file: File) => {
    e.stopPropagation();
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', file.id);

    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.stopPropagation();
    setDraggedFile(null);
    setDropTarget(null);

    // Remove visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e: React.DragEvent, folder: File) => {
    e.preventDefault();
    e.stopPropagation();

    if (folder.type === 'folder' && draggedFile && draggedFile.id !== folder.id) {
      e.dataTransfer.dropEffect = 'move';
      setDropTarget(folder.id);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.stopPropagation();
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolder: File) => {
    e.preventDefault();
    e.stopPropagation();

    setDropTarget(null);

    if (!draggedFile || draggedFile.id === targetFolder.id || targetFolder.type !== 'folder') {
      return;
    }

    // Prevent dropping a folder into itself or its descendants
    if (draggedFile.type === 'folder' && targetFolder.id === draggedFile.id) {
      toast.error('Cannot move folder into itself');
      return;
    }

    try {
      const response = await apiService.updateFile(draggedFile.id, {
        parentId: targetFolder.id
      });

      if (!response.success) throw new Error(response.error);

      toast.success(`Moved "${draggedFile.name}" to "${targetFolder.name}"`);
      fetchFiles();
    } catch (error: any) {
      console.error('Move error:', error);
      toast.error(error.message || 'Failed to move item');
    } finally {
      setDraggedFile(null);
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  return (
    <>
      <RenameDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        itemId={selectedFile?.id || null}
        itemType={selectedFile?.type || 'file'}
        currentName={selectedFile?.name || ''}
        onRenamed={fetchFiles}
      />

      <MoveDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        itemId={selectedFile?.id || ''}
        itemType={selectedFile?.type || 'file'}
        itemName={selectedFile?.name || ''}
        currentFolderId={currentFolderId}
        excludeFolderId={selectedFile?.type === 'folder' ? selectedFile.id : undefined}
        onMoveComplete={fetchFiles}
      />

      <FilePreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        file={selectedFile}
        onDownload={selectedFile ? () => handleDownload(selectedFile) : undefined}
      />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        file={selectedFile}
        onShareComplete={fetchFiles}
      />

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 min-h-[300px]">
          {files.map((file) => (
            <FileContextMenu
              key={file.id}
              isFolder={file.type === 'folder'}
              isStarred={file.isStarred}
              isTrashed={file.isTrashed}
              onStar={() => handleStar(file)}
              onTrash={() => handleTrash(file)}
              onDownload={() => handleDownload(file)}
              onShare={() => handleShare(file)}
              onRename={() => handleRename(file)}
              onMove={() => handleMove(file)}
              onOpen={() => file.type === 'folder' && onFolderChange(file.id, file.name)}
              onShowDetails={onShowDetails ? () => onShowDetails(file) : undefined}
            >
              <Card
                draggable={!file.isTrashed}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                onDragOver={file.type === 'folder' ? (e) => handleDragOver(e, file) : undefined}
                onDragLeave={file.type === 'folder' ? handleDragLeave : undefined}
                onDrop={file.type === 'folder' ? (e) => handleDrop(e, file) : undefined}
                className={`p-4 hover:bg-accent cursor-pointer transition-all ${
                  selectedFiles.has(file.id) ? 'bg-accent border-primary' : ''
                } ${
                  dropTarget === file.id ? 'ring-2 ring-primary bg-primary/10' : ''
                } ${
                  !file.isTrashed ? 'cursor-move' : ''
                }`}
                onClick={(e) => handleItemClick(file, e)}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-center">
                    {file.type === 'folder' ? (
                      <FolderIcon className="h-12 w-12 text-blue-500" />
                    ) : (
                      <FileIcon className="h-12 w-12 text-gray-500" />
                    )}
                  </div>
                  <div className="text-center">
                    <h3 className="font-medium text-sm truncate">{file.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </p>
                    {file.size && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </FileContextMenu>
          ))}
          {files.length === 0 && (
            <div className="col-span-full text-center text-muted-foreground py-12">
              <p className="text-lg">No files found</p>
              <p className="text-sm mt-2">Upload files or create folders to get started</p>
            </div>
          )}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium text-sm">Name</th>
                <th className="text-left p-3 font-medium text-sm">Modified</th>
                <th className="text-left p-3 font-medium text-sm">File size</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <FileContextMenu
                  key={file.id}
                  isFolder={file.type === 'folder'}
                  isStarred={file.isStarred}
                  isTrashed={file.isTrashed}
                  onStar={() => handleStar(file)}
                  onTrash={() => handleTrash(file)}
                  onDownload={() => handleDownload(file)}
                  onShare={() => handleShare(file)}
                  onRename={() => handleRename(file)}
                  onMove={() => handleMove(file)}
                  onOpen={() => file.type === 'folder' && onFolderChange(file.id, file.name)}
                  onShowDetails={onShowDetails ? () => onShowDetails(file) : undefined}
                >
                  <tr
                    draggable={!file.isTrashed}
                    onDragStart={(e) => handleDragStart(e, file)}
                    onDragEnd={handleDragEnd}
                    onDragOver={file.type === 'folder' ? (e) => handleDragOver(e, file) : undefined}
                    onDragLeave={file.type === 'folder' ? handleDragLeave : undefined}
                    onDrop={file.type === 'folder' ? (e) => handleDrop(e, file) : undefined}
                    className={`border-b hover:bg-accent cursor-pointer transition-colors ${
                      selectedFiles.has(file.id) ? 'bg-accent' : ''
                    } ${
                      dropTarget === file.id ? 'ring-2 ring-primary bg-primary/10' : ''
                    } ${
                      !file.isTrashed ? 'cursor-move' : ''
                    }`}
                    onClick={(e) => handleItemClick(file, e)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {file.type === 'folder' ? (
                          <FolderIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        ) : (
                          <FileIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        )}
                        <span className="truncate">{file.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {file.type === 'file' ? formatFileSize(file.size) : '-'}
                    </td>
                  </tr>
                </FileContextMenu>
              ))}
              {files.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-muted-foreground py-12">
                    <p className="text-lg">No files found</p>
                    <p className="text-sm mt-2">Upload files or create folders to get started</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default FileGrid;
