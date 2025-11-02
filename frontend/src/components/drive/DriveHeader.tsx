import { Search, HelpCircle, Settings, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
}: DriveHeaderProps) => {
  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4">
      {/* Left Section - Logo and Search */}
      <div className="flex items-center gap-4 flex-1">
        {/* Menu Icon (Mobile) */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5 text-gray-600" />
        </Button>

        {/* Logo */}
        <div className="flex items-center gap-2 min-w-[120px]">
          <img src="/drive-icon.png" alt="Drive" className="h-10 w-10" />
          <span className="text-[22px] text-gray-700 font-normal hidden sm:block">
            Drive
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-[720px]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600" />
            <Input
              type="search"
              placeholder="Search in Drive"
              className="w-full pl-12 pr-4 h-12 bg-gray-100 border-0 rounded-lg hover:bg-gray-200 focus:bg-white focus:shadow-md focus-visible:ring-1 focus-visible:ring-blue-500 transition-all"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Right Section - Actions and Profile */}
      <div className="flex items-center gap-1">
        {/* Help */}
        <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-600 hover:bg-gray-100">
          <HelpCircle className="h-5 w-5" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon" className="h-10 w-10 text-gray-600 hover:bg-gray-100">
          <Settings className="h-5 w-5" />
        </Button>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-10 w-10 rounded-full p-0 ml-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-600 text-white text-sm">
                  {getInitials(userEmail)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-2 py-3 text-center">
              <Avatar className="h-16 w-16 mx-auto mb-2">
                <AvatarFallback className="bg-blue-600 text-white text-xl">
                  {getInitials(userEmail)}
                </AvatarFallback>
              </Avatar>
              <p className="font-medium text-sm">{userEmail}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="cursor-pointer">
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default DriveHeader;
