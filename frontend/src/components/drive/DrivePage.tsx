import { useRef, useState } from "react";
import DriveSidebar from "./DriveSidebar";
import DriveHeader from "./DriveHeader";

const DrivePage = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [currentView, setCurrentView] = useState("my-drive");
  const [searchQuery, setSearchQuery] = useState("");

  // Trigger hidden file input when sidebar's upload button is clicked
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedFiles((prev) => [...files, ...prev]);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <DriveSidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        onUploadClick={handleUploadClick}
        onCreateFolderClick={() => console.log("New Folder")}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
      <DriveHeader
        onSignOut={handleSignOut}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail="sheza.mishal@gmail.com"
        recentFiles={uploadedFiles.map((file, index) => ({
            id: `${index}-${file.name}`,
            name: file.name,
        }))}
        />

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
};

export default DrivePage;
