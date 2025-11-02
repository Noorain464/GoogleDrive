import {
  HardDrive,
  Star,
  Clock,
  Trash2,
  Users,
  Upload,
  FolderPlus,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useState } from "react";
import { apiService } from "@/services/apiService";
import type { File as DriveFile } from "@/services/types";

interface DriveSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
}

const DriveSidebar = ({
  currentView,
  onViewChange,
  onUploadClick,
  onCreateFolderClick,
}: DriveSidebarProps) => {
  const navigationItems = [
    { id: "my-drive", label: "My Drive", icon: HardDrive },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "starred", label: "Starred", icon: Star },
    { id: "shared", label: "Shared with me", icon: Users },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  const [usedStorage, setUsedStorage] = useState<number>(0);
  const totalStorage = 15 * 1024 * 1024 * 1024; // 15 GB in bytes

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const response = await apiService.getFiles(null);
        if (response.success && response.data) {
          const files = response.data as DriveFile[];
          const totalUsed = files
            .filter((f) => f.type === "file" && !f.isTrashed)
            .reduce((acc, f) => acc + (f.size || 0), 0);
          setUsedStorage(totalUsed);
        }
      } catch (err) {
        console.error("Error fetching storage usage:", err);
      }
    };
    fetchStorage();
  }, []);

  const usedPercentage = Math.min(
    (usedStorage / totalStorage) * 100,
    100
  ).toFixed(2);

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 GB";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <aside className="w-64 bg-white border-r flex flex-col text-gray-800 shadow-sm">
      {/* Logo + New Button */}
      <div className="p-5">
        <div className="flex items-center gap-2 mb-6">
          {/* ✅ Replaced Cloud icon with your Drive icon */}
          <div className="flex items-center justify-center rounded-md p-2">
            <img src="/drive-icon.png" alt="Drive Icon" className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold text-gray-800 tracking-tight">
            Drive
          </span>
        </div>

        {/* "New" Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-full justify-start bg-white text-gray-800 font-medium py-5 rounded-xl shadow-md border hover:bg-gray-50 transition-all duration-200"
              size="lg"
            >
              <Plus className="mr-2 h-5  text-blue-600" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 mt-1 shadow-lg">
            <DropdownMenuItem
              onClick={onCreateFolderClick}
              className="cursor-pointer hover:bg-gray-100"
            >
              <FolderPlus className="mr-2 h-4 w-4 text-gray-700" />
              <span>New Folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onUploadClick}
              className="cursor-pointer hover:bg-gray-100"
            >
              <Upload className="mr-2 h-4 w-4 text-gray-700" />
              <span>Upload Files</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Separator className="my-2" />

      {/* Navigation Menu */}
      <nav className="flex-1 px-3">
        <ul className="space-y-1 mt-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
                    isActive
                      ? "bg-blue-100 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      isActive ? "text-blue-600" : "text-gray-600"
                    )}
                  />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Storage Section */}
      <div className="p-5 border-t mt-auto">
        <div>
          <p className="text-sm font-medium mb-1">Storage</p>
          <p className="text-xs text-gray-500 mb-2">
            {formatSize(usedStorage)} of {formatSize(totalStorage)} used
          </p>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${usedPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DriveSidebar;
