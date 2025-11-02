import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { apiService } from "@/services/apiService";
import { Share2, Copy, X, Globe, Lock } from "lucide-react";
import type { File } from "@/services/types";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onShareComplete?: () => void;
}

interface SharedUser {
  id: string;
  email: string;
  permission: 'view' | 'edit';
}

const ShareDialog = ({ open, onOpenChange, file, onShareComplete }: ShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<'view' | 'edit'>('view');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [sharing, setSharing] = useState(false);
  const [linkSharing, setLinkSharing] = useState(false);
  const [shareableLink, setShareableLink] = useState("");

  useEffect(() => {
    if (open && file) {
      loadSharedUsers();
      generateShareableLink();
    }
  }, [open, file]);

  const loadSharedUsers = async () => {
    if (!file) return;

    try {
      const response = await apiService.getShares(file.id);
      if (response.success && response.data) {
        setSharedUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading shared users:', error);
    }
  };

  const generateShareableLink = () => {
    if (!file) return;
    const link = `${window.location.origin}/share/${file.id}`;
    setShareableLink(link);
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !file) {
      toast.error("Please enter an email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setSharing(true);

    try {
      const response = await apiService.shareFile(file.id, email, permission);
      if (!response.success) throw new Error(response.error);

      toast.success(`Shared with ${email}`);
      setEmail("");
      setPermission('view');
      loadSharedUsers();

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast.error(error.message || "Failed to share");
    } finally {
      setSharing(false);
    }
  };

  const handleRemoveUser = async (userId: string, userEmail: string) => {
    if (!file) return;

    try {
      const response = await apiService.unshareFile(file.id, userId);
      if (!response.success) throw new Error(response.error);

      toast.success(`Removed ${userEmail}`);
      loadSharedUsers();

      if (onShareComplete) {
        onShareComplete();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to remove user");
    }
  };

  const handleUpdatePermission = async (userId: string, newPermission: 'view' | 'edit') => {
    if (!file) return;

    try {
      const response = await apiService.updateSharePermission(file.id, userId, newPermission);
      if (!response.success) throw new Error(response.error);

      toast.success("Permission updated");
      loadSharedUsers();
    } catch (error: any) {
      toast.error(error.message || "Failed to update permission");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast.success("Link copied to clipboard");
  };

  const toggleLinkSharing = async () => {
    if (!file) return;

    try {
      const newState = !linkSharing;
      const response = await apiService.updateFileLinkSharing(file.id, newState);
      if (!response.success) throw new Error(response.error);

      setLinkSharing(newState);
      toast.success(newState ? "Link sharing enabled" : "Link sharing disabled");
    } catch (error: any) {
      toast.error(error.message || "Failed to update link sharing");
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (!file) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share "{file.name}"
          </DialogTitle>
          <DialogDescription>
            Share this {file.type === 'folder' ? 'folder' : 'file'} with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add People */}
          <form onSubmit={handleShare} className="space-y-3">
            <Label htmlFor="email">Add people</Label>
            <div className="flex gap-2">
              <Input
                id="email"
                type="email"
                placeholder="Enter email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Select value={permission} onValueChange={(value: 'view' | 'edit') => setPermission(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={sharing || !email.trim()}>
                {sharing ? "Sharing..." : "Share"}
              </Button>
            </div>
          </form>

          {/* Shared Users List */}
          {sharedUsers.length > 0 && (
            <div className="space-y-2">
              <Label>People with access</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sharedUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {getInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.permission}
                        onValueChange={(value: 'view' | 'edit') => handleUpdatePermission(user.id, value)}
                      >
                        <SelectTrigger className="w-24 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="view">View</SelectItem>
                          <SelectItem value="edit">Edit</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id, user.email)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Link Sharing */}
          <div className="space-y-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {linkSharing ? (
                  <Globe className="h-4 w-4 text-blue-500" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                <div>
                  <Label className="text-sm font-medium">
                    {linkSharing ? "Anyone with the link" : "Link sharing"}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {linkSharing ? "Can view this item" : "Enable to share via link"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLinkSharing}
              >
                {linkSharing ? "Disable" : "Enable"}
              </Button>
            </div>

            {linkSharing && (
              <div className="flex gap-2">
                <Input
                  value={shareableLink}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
