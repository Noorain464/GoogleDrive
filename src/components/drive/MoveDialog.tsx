import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Folder, Home, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface FolderNode {
  id: string;
  name: string;
  parent_folder_id: string | null;
  children?: FolderNode[];
}

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemType: "file" | "folder";
  itemName: string;
  currentFolderId: string | null;
  excludeFolderId?: string; // Folder being moved (to exclude it and its descendants)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get all folders except trashed ones
      const { data: foldersData, error } = await supabase
        .from("folders")
        .select("id, name, parent_folder_id")
        .eq("owner_id", user.id)
        .eq("is_trashed", false);

      if (error) throw error;

      // Build folder tree
      const folderMap = new Map<string, FolderNode>();
      const rootFolders: FolderNode[] = [];

      // First pass: create all folder nodes
      foldersData?.forEach((folder) => {
        folderMap.set(folder.id, {
          id: folder.id,
          name: folder.name,
          parent_folder_id: folder.parent_folder_id,
          children: [],
        });
      });

      // Second pass: build tree structure
      foldersData?.forEach((folder) => {
        const node = folderMap.get(folder.id)!;
        if (folder.parent_folder_id) {
          const parent = folderMap.get(folder.parent_folder_id);
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

  // Check if movingFolderId would be a descendant of targetFolderId (circular reference check)
  const wouldCreateCircularReference = async (movingFolderId: string, targetFolderId: string): Promise<boolean> => {
    if (movingFolderId === targetFolderId) return true;

    // Get all descendants of the folder being moved
    const descendants = await getAllDescendants(movingFolderId);
    return descendants.includes(targetFolderId);
  };

  // Get all descendant folder IDs recursively
  const getAllDescendants = async (folderId: string): Promise<string[]> => {
    const descendants: string[] = [];
    
    const { data: children } = await supabase
      .from("folders")
      .select("id")
      .eq("parent_folder_id", folderId)
      .eq("is_trashed", false);

    if (children) {
      for (const child of children) {
        descendants.push(child.id);
        const childDescendants = await getAllDescendants(child.id);
        descendants.push(...childDescendants);
      }
    }

    return descendants;
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // For folders: check if moving into own descendant (would create circular reference)
      if (itemType === "folder" && selectedFolderId) {
        const wouldCreateCircular = await wouldCreateCircularReference(itemId, selectedFolderId);
        if (wouldCreateCircular) {
          toast.error("Cannot move folder into its own subfolder");
          setMoving(false);
          return;
        }
      }

      const table = itemType === "file" ? "files" : "folders";
      const folderField = itemType === "file" ? "folder_id" : "parent_folder_id";

      const { error } = await supabase
        .from(table)
        .update({ [folderField]: selectedFolderId })
        .eq("id", itemId);

      if (error) throw error;

      // Log activity
      await supabase.from("activities").insert({
        user_id: user.id,
        action_type: "move",
        item_type: itemType,
        item_name: itemName,
      });

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

