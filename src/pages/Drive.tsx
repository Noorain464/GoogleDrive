import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from '@supabase/supabase-js';
import DriveSidebar from "@/components/drive/DriveSidebar";
import DriveHeader from "@/components/drive/DriveHeader";
import FileGrid from "@/components/drive/FileGrid";
import UploadDialog from "@/components/drive/UploadDialog";
import CreateFolderDialog from "@/components/drive/CreateFolderDialog";
import { toast } from "sonner";

const Drive = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<string>("my-drive");
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Failed to sign out");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!session) {
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
          userEmail={session.user.email || ""}
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
