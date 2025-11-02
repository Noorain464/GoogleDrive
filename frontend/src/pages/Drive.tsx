import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "@/services/apiService";
import DriveSidebar from "@/components/drive/DriveSidebar";
import DriveHeader from "@/components/drive/DriveHeader";
import FileGrid from "@/components/drive/FileGrid";
import UploadDialog from "@/components/drive/UploadDialog";
import CreateFolderDialog from "@/components/drive/CreateFolderDialog";
import BulkActionsToolbar from "@/components/drive/BulkActionsToolbar";
import DetailsPanel from "@/components/drive/DetailsPanel";
import { toast } from "sonner";
import type { File } from "@/services/types";
import { ChevronRight, Home, Grid3x3, List, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

  // New states for view mode, sorting, and multi-select
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [detailsFile, setDetailsFile] = useState<File | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [allFiles, setAllFiles] = useState<File[]>([]);

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
    setSelectedFiles(new Set()); // Clear selection on refresh

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
    setSelectedFiles(new Set()); // Clear selection when changing folders

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
    setSelectedFiles(new Set()); // Clear selection
  };

  const handleBackClick = () => {
    if (breadcrumbs.length > 1) {
      const newBreadcrumbs = breadcrumbs.slice(0, -1);
      const parentFolder = newBreadcrumbs[newBreadcrumbs.length - 1];
      setCurrentFolderId(parentFolder.id);
      setBreadcrumbs(newBreadcrumbs);
      setSelectedFiles(new Set()); // Clear selection
    }
  };

  const handleFileSelect = (fileId: string, selected: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(fileId);
      } else {
        newSet.delete(fileId);
      }
      return newSet;
    });
  };

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleBulkStar = async () => {
    try {
      const promises = Array.from(selectedFiles).map(fileId =>
        apiService.updateFile(fileId, { isStarred: true })
      );
      await Promise.all(promises);
      toast.success(`${selectedFiles.size} items starred`);
      setSelectedFiles(new Set());
      handleRefresh();
    } catch (error: any) {
      toast.error('Failed to star items');
    }
  };

  const handleBulkMove = () => {
    toast.info('Bulk move coming soon');
  };

  const handleBulkTrash = async () => {
    try {
      const promises = Array.from(selectedFiles).map(fileId =>
        apiService.updateFile(fileId, { isTrashed: true })
      );
      await Promise.all(promises);
      toast.success(`${selectedFiles.size} items moved to trash`);
      setSelectedFiles(new Set());
      handleRefresh();
    } catch (error: any) {
      toast.error('Failed to trash items');
    }
  };

  const handleShowDetails = (file: File) => {
    setDetailsFile(file);
    setShowDetails(true);
  };

  const handleDetailsAction = async (action: 'star' | 'download' | 'share' | 'trash') => {
    if (!detailsFile) return;

    try {
      switch (action) {
        case 'star':
          await apiService.updateFile(detailsFile.id, { isStarred: !detailsFile.isStarred });
          toast.success(detailsFile.isStarred ? 'Removed from starred' : 'Added to starred');
          handleRefresh();
          setShowDetails(false);
          break;
        case 'download':
          const response = await apiService.downloadFile(detailsFile.id);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = detailsFile.name;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success('Download started');
          break;
        case 'share':
          toast.info('Share functionality coming soon');
          break;
        case 'trash':
          await apiService.updateFile(detailsFile.id, { isTrashed: true });
          toast.success('Moved to trash');
          handleRefresh();
          setShowDetails(false);
          break;
      }
    } catch (error: any) {
      toast.error(error.message || 'Action failed');
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
    <div className="flex h-screen overflow-hidden bg-white">
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

        {/* Breadcrumb and Controls */}
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1">
                {breadcrumbs.map((item, index) => (
                  <div key={item.id || 'root'} className="flex items-center">
                    {index === 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleBreadcrumbClick(index)}
                        className="flex items-center gap-2 text-gray-700 hover:bg-gray-100 px-2"
                      >
                        <Home className="w-4 h-4" />
                        <span className="text-sm">{item.name}</span>
                      </Button>
                    ) : (
                      <>
                        <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleBreadcrumbClick(index)}
                          className={`text-sm px-2 ${index === breadcrumbs.length - 1 ? "font-medium text-gray-900" : "text-gray-700 hover:bg-gray-100"}`}
                        >
                          {item.name}
                        </Button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* View Controls */}
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex items-center border border-gray-300 rounded-md">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={`h-8 w-8 rounded-r-none ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                >
                  <List className="h-4 w-4 text-gray-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={`h-8 w-8 rounded-l-none border-l border-gray-300 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                >
                  <Grid3x3 className="h-4 w-4 text-gray-600" />
                </Button>
              </div>

              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpDown className="h-4 w-4 text-gray-600" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortBy('name')} className="cursor-pointer">
                    Name
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('date')} className="cursor-pointer">
                    Last modified
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy('size')} className="cursor-pointer">
                    File size
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Selection Info */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{selectedFiles.size} item{selectedFiles.size > 1 ? 's' : ''} selected</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFiles(new Set())}
              >
                Clear selection
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6 bg-white">
            <FileGrid
              key={refreshKey}
              currentView={currentView}
              currentFolderId={currentFolderId}
              onFolderChange={handleFolderChange}
              searchQuery={searchQuery}
              viewMode={viewMode}
              sortBy={sortBy}
              sortOrder={sortOrder}
              selectedFiles={selectedFiles}
              onFileSelect={handleFileSelect}
              onShowDetails={handleShowDetails}
              onFilesLoaded={setAllFiles}
            />
          </main>

          {showDetails && (
            <DetailsPanel
              file={detailsFile}
              onClose={() => setShowDetails(false)}
              onStar={() => handleDetailsAction('star')}
              onDownload={() => handleDetailsAction('download')}
              onShare={() => handleDetailsAction('share')}
              onTrash={() => handleDetailsAction('trash')}
            />
          )}
        </div>
      </div>

      <BulkActionsToolbar
        selectedCount={selectedFiles.size}
        onStar={handleBulkStar}
        onMove={handleBulkMove}
        onTrash={handleBulkTrash}
        onClearSelection={() => setSelectedFiles(new Set())}
      />
    </div>
  );
};

export default Drive;
