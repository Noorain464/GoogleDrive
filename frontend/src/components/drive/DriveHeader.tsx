import { Search, FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";

interface DriveHeaderProps {
  onSignOut: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail: string;
  recentFiles?: { id: string; name: string }[];
}

const DriveHeader = ({
  onSignOut,
  searchQuery,
  onSearchChange,
  userEmail,
  recentFiles = [],
}: DriveHeaderProps) => {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="flex flex-col items-center mt-10 mb-6">
        <h1 className="text-3xl font-semibold text-gray-800 mb-5">
          Welcome to Drive
        </h1>
        <div className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
          <Input
            type="search"
            placeholder="Search in Drive"
            className="pl-10 pr-4 py-3 rounded-full bg-gray-100 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 transition w-full"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Recently Uploaded Files */}
      {recentFiles.length > 0 && (
        <div className="px-10 pb-4">
          <h2 className="text-xl font-semibold text-gray-700 mb-3">
            Recently Uploaded
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentFiles.map((file) => (
              <div
                key={file.id}
                className="p-4 border rounded-lg flex items-center gap-2 shadow-sm hover:shadow-md transition"
              >
                <FileIcon className="h-5 w-5 text-blue-500" />
                <span className="truncate text-gray-700">{file.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriveHeader;
