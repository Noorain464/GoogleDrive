import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, File, X } from "lucide-react";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string | null;
  onUploadComplete: () => void;
}

const UploadDialog = ({ open, onOpenChange, currentFolderId, onUploadComplete }: UploadDialogProps) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset drag state when dialog closes
  useEffect(() => {
    if (!open) {
      setIsDragging(false);
      setSelectedFiles([]);
    }
  }, [open]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Indicate that this is a valid drop target
    e.dataTransfer.dropEffect = "copy";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const files = Array.from(droppedFiles);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const formatFileSize = (bytes: number) => {
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let uploadedCount = 0;

      for (const file of selectedFiles) {
        const response = await apiService.uploadFile(file, currentFolderId);
        
        if ('error' in response) {
          throw new Error(response.error);
        }

        uploadedCount++;
        setUploadProgress((uploadedCount / totalFiles) * 100);
      }

      toast.success(`${totalFiles} file(s) uploaded successfully`);
      setSelectedFiles([]);
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload files");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
          <DialogDescription>
            Select files to upload to your drive
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-primary bg-primary/5 scale-105"
                : "border-border hover:border-primary"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <Upload className={`h-12 w-12 mx-auto mb-2 transition-colors ${
              isDragging ? "text-primary" : "text-muted-foreground"
            }`} />
            <p className="text-sm font-medium mb-1">
              {isDragging ? "Drop files here" : "Click to select files"}
            </p>
            <p className="text-xs text-muted-foreground">
              or drag and drop files here
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{selectedFiles.length} file(s) selected</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-secondary rounded">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFile(index)}
                      disabled={uploading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setSelectedFiles([]);
                onOpenChange(false);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
