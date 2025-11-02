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
    <aside className="w-64 bg-white border-r flex flex-col text-gray-800">
      {/* New Button */}
      <div className="p-4 pt-5">
        {/* "New" Dropdown Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-fit justify-start bg-white text-gray-700 font-medium px-4 py-3 rounded-full shadow-md border hover:shadow-lg hover:bg-gray-50 transition-all duration-200"
              size="lg"
            >
              <Plus className="mr-3 h-5 w-5 text-gray-700" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 mt-1 shadow-lg">
            <DropdownMenuItem
              onClick={onCreateFolderClick}
              className="cursor-pointer hover:bg-gray-100 py-2.5"
            >
              <FolderPlus className="mr-3 h-5 w-5 text-gray-600" />
              <span>New folder</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onUploadClick}
              className="cursor-pointer hover:bg-gray-100 py-2.5"
            >
              <Upload className="mr-3 h-5 w-5 text-gray-600" />
              <span>File upload</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 mt-4">
        <ul className="space-y-0.5">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => onViewChange(item.id)}
                  className={cn(
                    "flex items-center w-full px-3 py-2.5 rounded-full text-sm font-normal transition-colors duration-150",
                    isActive
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <Icon
                    className={cn(
                      "mr-4 h-5 w-5",
                      isActive ? "text-blue-700" : "text-gray-600"
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
