import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/services/apiService";
import DriveSidebar from "@/components/drive/DriveSidebar";
import DriveHeader from "@/components/drive/DriveHeader";
import FileGrid from "@/components/drive/FileGrid";
import UploadDialog from "@/components/drive/UploadDialog";
import CreateFolderDialog from "@/components/drive/CreateFolderDialog";
import { toast } from "sonner";

const Drive = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>("my-drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Check for existing auth
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (!token || !storedUser) {
      navigate("/auth");
      setLoading(false);
      return;
    }

    try {
      const userData = JSON.parse(storedUser);
      if (!userData.id || !userData.email) {
        throw new Error('Invalid user data');
      }
      
      apiService.setToken(token);
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Handle view changes from URL params
  useEffect(() => {
    const view = searchParams.get("view");
    if (view) {
      setCurrentView(view);
    }
  }, [searchParams]);

  const handleSignOut = async () => {
    try {
      const response = await apiService.logout();
      if (!response.success) {
        throw new Error(response.error || 'Failed to sign out');
      }
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      apiService.clearToken();
      
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <UploadDialog
        open={uploadDialogOpen}
        onOpenChange={setUploadDialogOpen}
        currentFolderId={currentFolderId}
        onUploadComplete={handleRefresh}
      />
      <CreateFolderDialog
        open={createFolderDialogOpen}
        onOpenChange={setCreateFolderDialogOpen}
        currentFolderId={currentFolderId}
        onFolderCreated={handleRefresh}
      />
      <DriveSidebar 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onUploadClick={() => setUploadDialogOpen(true)}
        onCreateFolderClick={() => setCreateFolderDialogOpen(true)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DriveHeader 
          onSignOut={handleSignOut}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          userEmail={user.email || ""}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <FileGrid 
            key={refreshKey}
            currentView={currentView}
            currentFolderId={currentFolderId}
            onFolderChange={setCurrentFolderId}
            searchQuery={searchQuery}
          />
        </main>
      </div>
    </div>
  );
};

export default Drive;
