import { Button } from "@/components/ui/button";
import { Star, Trash2, FolderInput, Download, X } from "lucide-react";

interface BulkActionsToolbarProps {
  selectedCount: number;
  onStar: () => void;
  onMove: () => void;
  onTrash: () => void;
  onDownload?: () => void;
  onClearSelection: () => void;
}

const BulkActionsToolbar = ({
  selectedCount,
  onStar,
  onMove,
  onTrash,
  onDownload,
  onClearSelection
}: BulkActionsToolbarProps) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
        <span className="font-medium">
          {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
        </span>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onStar}
            className="gap-2"
          >
            <Star className="h-4 w-4" />
            Star
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={onMove}
            className="gap-2"
          >
            <FolderInput className="h-4 w-4" />
            Move
          </Button>

          {onDownload && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onDownload}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onTrash}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Trash
          </Button>

          <div className="w-px h-6 bg-primary-foreground/20" />

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="hover:bg-primary-foreground/10"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsToolbar;
