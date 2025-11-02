import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, Home, ChevronRight } from "lucide-react";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { File } from "@/services/types";

interface FolderNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: FolderNode[];
}

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "file" | "folder";
  itemName: string;
  currentFolderId: string | null;
  excludeFolderId?: string;
  onMoveComplete: () => void;
}

const MoveDialog = ({
  open,
  onOpenChange,
  itemId,
  itemType,
  itemName,
  currentFolderId,
  excludeFolderId,
  onMoveComplete,
}: MoveDialogProps) => {
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(currentFolderId);
  const [loading, setLoading] = useState(false);
  const [moving, setMoving] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      setSelectedFolderId(currentFolderId);
      loadFolders();
    }
  }, [open, currentFolderId]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const response = await apiService.getFiles(null);
      if (!response.success || !response.data) {
        throw new Error(response.error);
      }

      // Get all folders recursively
      const allFolders = await getAllFolders(response.data);

      // Build folder tree
      const folderMap = new Map<string, FolderNode>();
      const rootFolders: FolderNode[] = [];

      // First pass: create all folder nodes
      allFolders.forEach((folder) => {
        folderMap.set(folder.id, {
          id: folder.id,
          name: folder.name,
          parentId: folder.parentId,
          children: [],
        });
      });

      // Second pass: build tree structure
      allFolders.forEach((folder) => {
        const node = folderMap.get(folder.id)!;
        if (folder.parentId) {
          const parent = folderMap.get(folder.parentId);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
          } else {
            rootFolders.push(node);
          }
        } else {
          rootFolders.push(node);
        }
      });

      // Filter out excluded folder and its descendants
      const filteredFolders = filterExcludedFolders(rootFolders, excludeFolderId || "");
      setFolders(filteredFolders);
    } catch (error: any) {
      console.error("Error loading folders:", error);
      toast.error("Failed to load folders");
    } finally {
      setLoading(false);
    }
  };

  const getAllFolders = async (files: File[]): Promise<File[]> => {
    const folders = files.filter(f => f.type === 'folder' && !f.isTrashed);

    // Get folders from all levels
    for (const folder of folders) {
      const response = await apiService.getFiles(folder.id);
      if (response.success && response.data) {
        const subFolders = await getAllFolders(response.data);
        folders.push(...subFolders);
      }
    }

    return folders;
  };

  // Recursively filter out excluded folder and its descendants
  const filterExcludedFolders = (nodes: FolderNode[], excludeId: string): FolderNode[] => {
    if (!excludeId) return nodes;

    return nodes
      .filter((node) => node.id !== excludeId)
      .map((node) => ({
        ...node,
        children: node.children ? filterExcludedFolders(node.children, excludeId) : [],
      }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderTree = (nodes: FolderNode[], level: number = 0) => {
    return nodes.map((folder) => {
      const hasChildren = folder.children && folder.children.length > 0;
      const isExpanded = expandedFolders.has(folder.id);
      const isSelected = selectedFolderId === folder.id;

      return (
        <div key={folder.id}>
          <div
            className={cn(
              "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
              isSelected && "bg-accent"
            )}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={() => setSelectedFolderId(folder.id)}
          >
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="p-0.5 hover:bg-secondary rounded"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>
            ) : (
              <div className="w-5" />
            )}
            <Folder className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm flex-1 truncate">{folder.name}</span>
          </div>
          {hasChildren && isExpanded && (
            <div>{renderFolderTree(folder.children!, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  const handleMove = async () => {
    if (selectedFolderId === currentFolderId) {
      toast.info("Item is already in this location");
      onOpenChange(false);
      return;
    }

    setMoving(true);

    try {
      const response = await apiService.updateFile(itemId, { parentId: selectedFolderId });
      if (!response.success) throw new Error(response.error);

      toast.success(`${itemType === "file" ? "File" : "Folder"} moved successfully`);
      onMoveComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Move error:", error);
      toast.error(error.message || "Failed to move item");
    } finally {
      setMoving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Move {itemType === "file" ? "File" : "Folder"}</DialogTitle>
          <DialogDescription>
            Select a destination folder for "{itemName}"
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-muted-foreground">Loading folders...</div>
            </div>
          ) : (
            <div className="border rounded-lg max-h-64 overflow-y-auto">
              <div
                className={cn(
                  "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent transition-colors",
                  selectedFolderId === null && "bg-accent"
                )}
                onClick={() => setSelectedFolderId(null)}
              >
                <Home className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium">My Drive</span>
              </div>
              {folders.length > 0 ? (
                renderFolderTree(folders)
              ) : (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No folders available
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={moving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={moving || loading}
          >
            {moving ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MoveDialog;
