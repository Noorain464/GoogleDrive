import { Cloud, HardDrive, Star, Clock, Trash2, Users, Upload, FolderPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DriveSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onUploadClick: () => void;
  onCreateFolderClick: () => void;
}

const DriveSidebar = ({ currentView, onViewChange, onUploadClick, onCreateFolderClick }: DriveSidebarProps) => {
  const navigationItems = [
    { id: "my-drive", label: "My Drive", icon: HardDrive },
    { id: "recent", label: "Recent", icon: Clock },
    { id: "starred", label: "Starred", icon: Star },
    { id: "shared", label: "Shared with me", icon: Users },
    { id: "trash", label: "Trash", icon: Trash2 },
  ];

  return (
    <aside className="w-64 border-r bg-sidebar flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-6">
          <div className="rounded-lg bg-primary p-2">
            <Cloud className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-semibold">CloudDrive</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full justify-start" size="lg">
              <Cloud className="mr-2 h-5 w-5" />
              New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={onCreateFolderClick}>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onUploadClick}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Files
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <Separator />
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <li key={item.id}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-accent"
                  )}
                  onClick={() => onViewChange(item.id)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <div className="rounded-lg bg-secondary p-3">
          <div className="text-sm font-medium mb-1">Storage</div>
          <div className="text-xs text-muted-foreground mb-2">
            0 GB of 15 GB used
          </div>
          <div className="h-2 rounded-full bg-background overflow-hidden">
            <div className="h-full bg-primary w-0 transition-all" />
          </div>
        </div>
      </div>
    </aside>
  );
};

export default DriveSidebar;
