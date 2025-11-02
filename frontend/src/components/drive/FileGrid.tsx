import React, { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { FileIcon, FolderIcon } from 'lucide-react';
import { fileService } from '@/services/fileService';
import type { File } from '@/services/types';



interface FileGridProps {
  currentView: string;
  currentFolderId: string | null;
  onFolderChange: (folderId: string | null) => void;
  searchQuery: string;
}

const FileGrid: React.FC<FileGridProps> = ({ currentView, currentFolderId, onFolderChange, searchQuery }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setLoading(true);
        const { data, error } = await fileService.getFiles({
          currentFolderId,
          currentView,
          searchQuery
        });

        if (error) {
          throw error;
        }

        setFiles(data || []);
      } catch (error) {
        console.error('Error fetching files:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [currentView, currentFolderId, searchQuery]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground">Loading files...</div>
      </div>
    );
  }

  const handleItemClick = (file: File) => {
    if (file.type === 'folder') {
      onFolderChange(file.id);
    } else {
      // Handle file click (download, preview, etc.)
      console.log('File clicked:', file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {files.map((file) => (
        <Card
          key={file.id}
          className="p-4 hover:bg-accent cursor-pointer"
          onClick={() => handleItemClick(file)}
        >
          <div className="flex items-center gap-3">
            {file.type === 'folder' ? (
              <FolderIcon className="h-8 w-8 text-blue-500" />
            ) : (
              <FileIcon className="h-8 w-8 text-gray-500" />
            )}
            <div>
              <h3 className="font-medium">{file.name}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Card>
      ))}
      {files.length === 0 && (
        <div className="col-span-full text-center text-muted-foreground py-8">
          No files found
        </div>
      )}
    </div>
  );
};

export default FileGrid;