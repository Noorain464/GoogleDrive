import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Star, Trash2, Download, Share2, Edit, FolderOpen } from "lucide-react";

interface FileContextMenuProps {
  children: React.ReactNode;
  isFolder: boolean;
  isStarred: boolean;
  isTrashed: boolean;
  onStar: () => void;
  onTrash: () => void;
  onDownload?: () => void;
  onShare: () => void;
  onRename: () => void;
  onOpen?: () => void;
}

const FileContextMenu = ({
  children,
  isFolder,
  isStarred,
  isTrashed,
  onStar,
  onTrash,
  onDownload,
  onShare,
  onRename,
  onOpen,
}: FileContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {isFolder && onOpen && (
          <>
            <ContextMenuItem onClick={onOpen}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Open
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        
        {!isTrashed && (
          <>
            <ContextMenuItem onClick={onStar}>
              <Star className={`mr-2 h-4 w-4 ${isStarred ? "fill-current" : ""}`} />
              {isStarred ? "Unstar" : "Star"}
            </ContextMenuItem>
            <ContextMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </ContextMenuItem>
            {!isFolder && onDownload && (
              <ContextMenuItem onClick={onDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onRename}>
              <Edit className="mr-2 h-4 w-4" />
              Rename
            </ContextMenuItem>
          </>
        )}
        
        <ContextMenuItem onClick={onTrash} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          {isTrashed ? "Delete forever" : "Move to trash"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default FileContextMenu;
