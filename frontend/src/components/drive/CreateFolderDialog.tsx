import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiService } from "@/services/apiService";
import { toast } from "sonner";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentFolderId: string | null;
  onFolderCreated: () => void;
}

const CreateFolderDialog = ({ open, onOpenChange, currentFolderId, onFolderCreated }: CreateFolderDialogProps) => {
  const [folderName, setFolderName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!folderName.trim()) {
      toast.error("Please enter a folder name");
      return;
    }

    setCreating(true);

    try {
      const response = await apiService.createFolder(folderName.trim(), currentFolderId);

      if ('error' in response) {
        throw new Error(response.error);
      }

      toast.success("Folder created successfully");
      setFolderName("");
      onFolderCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Create folder error:", error);
      toast.error(error.message || "Failed to create folder");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleCreate}>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Enter a name for your new folder
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              placeholder="My Folder"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setFolderName("");
                onOpenChange(false);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating || !folderName.trim()}>
              {creating ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateFolderDialog;
