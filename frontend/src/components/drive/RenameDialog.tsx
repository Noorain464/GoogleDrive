import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string | null;
  itemType: "file" | "folder";
  currentName: string;
  onRenamed: () => void;
}

const RenameDialog = ({ open, onOpenChange, itemId, itemType, currentName, onRenamed }: RenameDialogProps) => {
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState(false);

  useEffect(() => {
    if (open) {
      setNewName(currentName);
    }
  }, [open, currentName]);

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newName.trim() || !itemId) {
      toast.error("Please enter a name");
      return;
    }

    if (newName.trim() === currentName) {
      onOpenChange(false);
      return;
    }

    setRenaming(true);

    try {
      const response = await apiService.renameFile(itemId, newName.trim());
      if (!response.success) throw new Error(response.error);

      toast.success(`${itemType === "file" ? "File" : "Folder"} renamed successfully`);
      onRenamed();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Rename error:", error);
      toast.error(error.message || "Failed to rename");
    } finally {
      setRenaming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleRename}>
          <DialogHeader>
            <DialogTitle>Rename {itemType === "file" ? "File" : "Folder"}</DialogTitle>
            <DialogDescription>
              Enter a new name for "{currentName}"
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="new-name">New Name</Label>
            <Input
              id="new-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={renaming}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={renaming || !newName.trim()}>
              {renaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameDialog;
