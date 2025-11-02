import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";
import type { File } from "@/services/types";

interface FilePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onDownload?: () => void;
}

const FilePreviewDialog = ({
  open,
  onOpenChange,
  file,
  onDownload
}: FilePreviewDialogProps) => {
  if (!file) return null;

  const getPreviewContent = () => {
    if (!file.mimeType) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p className="text-lg">No preview available</p>
          <p className="text-sm mt-2">Download the file to view its contents</p>
        </div>
      );
    }

    // Image preview
    if (file.mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center bg-muted rounded-lg overflow-hidden max-h-[70vh]">
          <img
            src={file.filePath || '#'}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
              e.currentTarget.alt = 'Preview not available';
            }}
          />
        </div>
      );
    }

    // PDF preview
    if (file.mimeType === 'application/pdf') {
      return (
        <div className="h-[70vh] w-full">
          <iframe
            src={file.filePath || '#'}
            className="w-full h-full border-0 rounded-lg"
            title={file.name}
          />
        </div>
      );
    }

    // Video preview
    if (file.mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center bg-black rounded-lg overflow-hidden max-h-[70vh]">
          <video
            src={file.filePath || '#'}
            controls
            className="max-w-full max-h-full"
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio preview
    if (file.mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <div className="text-6xl">🎵</div>
          <p className="text-lg font-medium">{file.name}</p>
          <audio
            src={file.filePath || '#'}
            controls
            className="w-full max-w-md"
          >
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // Text preview
    if (file.mimeType.startsWith('text/') ||
        file.mimeType === 'application/json' ||
        file.mimeType === 'application/javascript') {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
          <p className="text-lg">Text file preview coming soon</p>
          <p className="text-sm mt-2">Download the file to view its contents</p>
        </div>
      );
    }

    // Default: no preview
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <p className="text-lg">No preview available for this file type</p>
        <p className="text-sm mt-2">Download the file to view its contents</p>
      </div>
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{file.name}</DialogTitle>
              <div className="text-sm text-muted-foreground mt-1">
                {file.mimeType || 'Unknown type'} • {formatFileSize(file.size)}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onDownload && (
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {getPreviewContent()}
        </div>

        {/* File Details */}
        <div className="mt-6 grid grid-cols-2 gap-4 text-sm border-t pt-4">
          <div>
            <p className="text-muted-foreground">Type</p>
            <p className="font-medium">{file.mimeType || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Size</p>
            <p className="font-medium">{formatFileSize(file.size)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Created</p>
            <p className="font-medium">
              {new Date(file.createdAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Modified</p>
            <p className="font-medium">
              {new Date(file.updatedAt || file.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FilePreviewDialog;
