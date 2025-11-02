import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X, FileIcon, FolderIcon, Star, Download, Share2, Trash2 } from "lucide-react";
import type { File } from "@/services/types";

interface DetailsPanelProps {
  file: File | null;
  onClose: () => void;
  onStar?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onTrash?: () => void;
}

const DetailsPanel = ({
  file,
  onClose,
  onStar,
  onDownload,
  onShare,
  onTrash
}: DetailsPanelProps) => {
  if (!file) return null;

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold">Details</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Preview/Icon */}
          <div className="flex items-center justify-center p-8 bg-muted rounded-lg">
            {file.type === 'folder' ? (
              <FolderIcon className="h-20 w-20 text-blue-500" />
            ) : file.mimeType?.startsWith('image/') && file.filePath ? (
              <img
                src={file.filePath}
                alt={file.name}
                className="max-h-40 max-w-full object-contain rounded"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <FileIcon className="h-20 w-20 text-gray-500" />
            )}
          </div>

          {/* File Name */}
          <div>
            <h4 className="font-medium text-lg break-words">{file.name}</h4>
            {file.mimeType && (
              <p className="text-sm text-muted-foreground mt-1">{file.mimeType}</p>
            )}
          </div>

          <Separator />

          {/* Quick Actions */}
          <div className="space-y-2">
            <h5 className="text-sm font-medium text-muted-foreground">Actions</h5>
            <div className="flex flex-wrap gap-2">
              {onStar && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStar}
                  className="gap-2"
                >
                  <Star className={`h-4 w-4 ${file.isStarred ? 'fill-current' : ''}`} />
                  {file.isStarred ? 'Unstar' : 'Star'}
                </Button>
              )}
              {file.type === 'file' && onDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onDownload}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Download
                </Button>
              )}
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              )}
              {onTrash && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTrash}
                  className="gap-2 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  {file.isTrashed ? 'Delete' : 'Trash'}
                </Button>
              )}
            </div>
          </div>

          <Separator />

          {/* File Information */}
          <div className="space-y-4">
            <h5 className="text-sm font-medium text-muted-foreground">Information</h5>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Type</p>
                <p className="text-sm font-medium">
                  {file.type === 'folder' ? 'Folder' : file.mimeType || 'File'}
                </p>
              </div>

              {file.size && (
                <div>
                  <p className="text-xs text-muted-foreground">Size</p>
                  <p className="text-sm font-medium">{formatFileSize(file.size)}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="text-sm font-medium">
                  {file.parentId ? 'In folder' : 'My Drive'}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Owner</p>
                <p className="text-sm font-medium">Me</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="text-sm font-medium">{formatDate(file.createdAt)}</p>
              </div>

              {file.updatedAt && (
                <div>
                  <p className="text-xs text-muted-foreground">Modified</p>
                  <p className="text-sm font-medium">{formatDate(file.updatedAt)}</p>
                </div>
              )}

              {file.isStarred && (
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <p className="text-sm font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Starred
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Activity (Placeholder) */}
          <div className="space-y-3">
            <h5 className="text-sm font-medium text-muted-foreground">Activity</h5>
            <p className="text-sm text-muted-foreground">
              No recent activity
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

export default DetailsPanel;
