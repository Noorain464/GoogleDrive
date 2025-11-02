import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/services/apiService";
import DriveSidebar from "@/components/drive/DriveSidebar";
import DriveHeader from "@/components/drive/DriveHeader";
import FileGrid from "@/components/drive/FileGrid";
import UploadDialog from "@/components/drive/UploadDialog";
import CreateFolderDialog from "@/components/drive/CreateFolderDialog";
import { toast } from "sonner";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbItem {
  id: string | null;
  name: string;
}

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
  const [recentFiles, setRecentFiles] = useState<{ id: string; name: string }[]>([]);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([
    { id: null, name: "My Drive" }
  ]);

  useEffect(() => {
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

  const handleRefresh = async () => {
    setRefreshKey((prev) => prev + 1);
  
    try {
      const response = await apiService.getFiles();
      if (response.success && response.data) {
        setRecentFiles(response.data.slice(0, 5));
      } else {
        console.error("Failed to refresh files:", response.error);
      }
    } catch (error) {
      console.error("Error refreshing files:", error);
    }
  };

  const handleFolderChange = (folderId: string | null, folderName?: string) => {
    setCurrentFolderId(folderId);
    
    if (folderId === null) {
      // Going back to root
      setBreadcrumbs([{ id: null, name: "My Drive" }]);
    } else if (folderName) {
      // Entering a folder - add to breadcrumbs
      setBreadcrumbs(prev => [...prev, { id: folderId, name: folderName }]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const clickedItem = breadcrumbs[index];
    setCurrentFolderId(clickedItem.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const parentFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(parentFolder.id);
      setBreadcrumbs(newBreadcrumbs);
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
          recentFiles={recentFiles}
        />
        
        {/* Breadcrumb Navigation */}
        <div className="border-b px-6 py-3 flex items-center gap-2">
          {breadcrumbs.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackClick}
              className="mr-2"
            >
              ← Back
            </Button>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {breadcrumbs.map((item, index) => (
              <div key={item.id || 'root'} className="flex items-center gap-2">
                {index === 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBreadcrumbClick(index)}
                    className="flex items-center gap-1"
                  >
                    <Home className="w-4 h-4" />
                    {item.name}
                  </Button>
                ) : (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBreadcrumbClick(index)}
                      className={index === breadcrumbs.length - 1 ? "font-semibold" : ""}
                    >
                      {item.name}
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          <FileGrid 
            key={refreshKey}
            currentView={currentView}
            currentFolderId={currentFolderId}
            onFolderChange={handleFolderChange}
            searchQuery={searchQuery}
          />
        </main>
      </div>
    </div>
  );
};

export default Drive;