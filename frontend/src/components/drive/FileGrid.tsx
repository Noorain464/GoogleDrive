import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Folder, Image, Film, Music, FileSpreadsheet, FileCode, Archive, Upload, ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [breadcrumbs, setBreadcrumbs] = useState<{ id: string | null; name: string }[]>([]);
  const [renameDialog, setRenameDialog] = useState<{
    open: boolean;
    itemId: string | null;
    itemType: "file" | "folder";
    currentName: string;
  }>({ open: false, itemId: null, itemType: "file", currentName: "" });
  const [moveDialog, setMoveDialog] = useState<{
    open: boolean;
    itemId: string | null;
    itemType: "file" | "folder";
    itemName: string;
  }>({ open: false, itemId: null, itemType: "file", itemName: "" });

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

  const loadBreadcrumbs = async () => {
    if (!currentFolderId || currentView !== "my-drive") {
      setBreadcrumbs([{ id: null, name: "My Drive" }]);
      return;
    }

    try {
      const crumbs: { id: string | null; name: string }[] = [];
      let folderId: string | null = currentFolderId;

      while (folderId) {
        const { data } = await supabase
          .from("folders")
          .select("id, name, parent_folder_id")
          .eq("id", folderId)
          .single();

        if (data) {
          crumbs.unshift({ id: data.id, name: data.name });
          folderId = data.parent_folder_id;
        } else {
          break;
        }
      }

      setBreadcrumbs([{ id: null, name: "My Drive" }, ...crumbs]);
    } catch (error) {
      console.error("Error loading breadcrumbs:", error);
    }
  };

  const loadContent = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load folders
      let foldersQuery = supabase
        .from("folders")
        .select("*")
        .eq("owner_id", user.id);

      if (currentView === "my-drive") {
        foldersQuery = foldersQuery.eq("is_trashed", false);
        if (currentFolderId) {
          foldersQuery = foldersQuery.eq("parent_folder_id", currentFolderId);
        } else {
          foldersQuery = foldersQuery.is("parent_folder_id", null);
        }
      } else if (currentView === "starred") {
        foldersQuery = foldersQuery.eq("is_starred", true).eq("is_trashed", false);
      } else if (currentView === "trash") {
        foldersQuery = foldersQuery.eq("is_trashed", true);
      }

      if (searchQuery) {
        foldersQuery = foldersQuery.ilike("name", `%${searchQuery}%`);
      }

      const { data: foldersData } = await foldersQuery;

      // Load files
      let filesQuery = supabase
        .from("files")
        .select("*")
        .eq("owner_id", user.id);

      if (currentView === "my-drive") {
        filesQuery = filesQuery.eq("is_trashed", false);
        if (currentFolderId) {
          filesQuery = filesQuery.eq("folder_id", currentFolderId);
        } else {
          filesQuery = filesQuery.is("folder_id", null);
        }
      } else if (currentView === "recent") {
        filesQuery = filesQuery
          .eq("is_trashed", false)
          .order("updated_at", { ascending: false })
          .limit(20);
      } else if (currentView === "starred") {
        filesQuery = filesQuery.eq("is_starred", true).eq("is_trashed", false);
      } else if (currentView === "trash") {
        filesQuery = filesQuery.eq("is_trashed", true);
      }

      if (searchQuery) {
        filesQuery = filesQuery.ilike("name", `%${searchQuery}%`);
      }

      const { data: filesData } = await filesQuery;

      setFolders(foldersData || []);
      setFiles(filesData || []);
    } catch (error) {
      console.error("Error loading content:", error);
      toast.error("Failed to load files and folders");
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileType: string | null) => {
    if (!fileType) return FileText;
    
    const type = fileType.toLowerCase();
    if (type.includes("image")) return Image;
    if (type.includes("video")) return Film;
    if (type.includes("audio")) return Music;
    if (type.includes("spreadsheet") || type.includes("excel")) return FileSpreadsheet;
    if (type.includes("code") || type.includes("javascript") || type.includes("python")) return FileCode;
    if (type.includes("zip") || type.includes("rar")) return Archive;
    
    return FileText;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const handleToggleStar = async (id: string, type: "file" | "folder", currentValue: boolean) => {
    try {
      const table = type === "file" ? "files" : "folders";
      const { error } = await supabase
        .from(table)
        .update({ is_starred: !currentValue })
        .eq("id", id);

      if (error) throw error;
      toast.success(currentValue ? "Removed from starred" : "Added to starred");
      loadContent();
    } catch (error: any) {
      toast.error("Failed to update");
    }
  };

  const handleTrash = async (id: string, type: "file" | "folder", isTrashed: boolean) => {
    try {
      const table = type === "file" ? "files" : "folders";
      
      if (isTrashed) {
        // Permanent delete
        if (type === "file") {
          const { data: fileData } = await supabase
            .from("files")
            .select("file_path")
            .eq("id", id)
            .single();

          if (fileData?.file_path) {
            await supabase.storage.from("drive-files").remove([fileData.file_path]);
          }
        }
        
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        toast.success("Deleted permanently");
      } else {
        // Move to trash
        const { error } = await supabase
          .from(table)
          .update({ is_trashed: true })
          .eq("id", id);

        if (error) throw error;
        toast.success("Moved to trash");
      }
      
      loadContent();
    } catch (error: any) {
      toast.error("Failed to delete");
    }
  };

  const handleDownload = async (file: DriveFile) => {
    try {
      const { data, error } = await supabase.storage
        .from("drive-files")
        .download(file.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("File downloaded");
    } catch (error: any) {
      toast.error("Failed to download file");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
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
    <div className="space-y-6">
      {currentView === "my-drive" && breadcrumbs.length > 0 && (
        <div className="flex items-center gap-1 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id || "root"} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => onFolderChange(crumb.id)}
              >
                {index === 0 && <Home className="h-4 w-4 mr-1" />}
                {crumb.name}
              </Button>
            </div>
          ))}
        </div>
      )}

      <RenameDialog
        open={renameDialog.open}
        onOpenChange={(open) =>
          setRenameDialog({ ...renameDialog, open })
        }
        itemId={renameDialog.itemId}
        itemType={renameDialog.itemType}
        currentName={renameDialog.currentName}
        onRenamed={loadContent}
      />

      <MoveDialog
        open={moveDialog.open}
        onOpenChange={(open) =>
          setMoveDialog({ ...moveDialog, open })
        }
        itemId={moveDialog.itemId || ""}
        itemType={moveDialog.itemType}
        itemName={moveDialog.itemName}
        currentFolderId={
          moveDialog.itemType === "file"
            ? files.find(f => f.id === moveDialog.itemId)?.folder_id ?? currentFolderId
            : folders.find(f => f.id === moveDialog.itemId)?.parent_folder_id ?? currentFolderId
        }
        excludeFolderId={moveDialog.itemType === "folder" ? moveDialog.itemId || undefined : undefined}
        onMoveComplete={loadContent}
      />

      {folders.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Folders</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <FileContextMenu
                key={folder.id}
                isFolder={true}
                isStarred={folder.is_starred}
                isTrashed={currentView === "trash"}
                onStar={() => handleToggleStar(folder.id, "folder", folder.is_starred)}
                onTrash={() => handleTrash(folder.id, "folder", currentView === "trash")}
                onShare={() => toast.info("Sharing coming soon")}
                onRename={() =>
                  setRenameDialog({
                    open: true,
                    itemId: folder.id,
                    itemType: "folder",
                    currentName: folder.name,
                  })
                }
                onMove={() =>
                  setMoveDialog({
                    open: true,
                    itemId: folder.id,
                    itemType: "folder",
                    itemName: folder.name,
                  })
                }
                onOpen={() => onFolderChange(folder.id)}
              >
                <Card
                  className="p-4 hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => onFolderChange(folder.id)}
                >
                  <div className="flex items-start gap-3">
                    <Folder className="h-6 w-6 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{folder.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(folder.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </Card>
              </FileContextMenu>
            ))}
          </div>
        </div>
      )}
      
      {files.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Files</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => {
              const Icon = getFileIcon(file.file_type);
              return (
                <FileContextMenu
                  key={file.id}
                  isFolder={false}
                  isStarred={file.is_starred}
                  isTrashed={currentView === "trash"}
                  onStar={() => handleToggleStar(file.id, "file", file.is_starred)}
                  onTrash={() => handleTrash(file.id, "file", currentView === "trash")}
                  onDownload={() => handleDownload(file)}
                  onShare={() => toast.info("Sharing coming soon")}
                  onRename={() =>
                    setRenameDialog({
                      open: true,
                      itemId: file.id,
                      itemType: "file",
                      currentName: file.name,
                    })
                  }
                  onMove={() =>
                    setMoveDialog({
                      open: true,
                      itemId: file.id,
                      itemType: "file",
                      itemName: file.name,
                    })
                  }
                >
                  <Card className="p-4 hover:bg-accent cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <Icon className="h-6 w-6 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(file.file_size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </Card>
                </FileContextMenu>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid;
