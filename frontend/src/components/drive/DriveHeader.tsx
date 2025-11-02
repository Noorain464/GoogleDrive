import { Search, Settings, HelpCircle, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DriveHeaderProps {
  onSignOut: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail: string;
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
    <div className="bg-white min-h-screen">
      {/* Navbar */}
      <header className="border-b bg-white shadow-sm">
        <div className="flex items-center justify-between px-5 py-2">
          {/* Left: Drive Logo + Title */}
          <div className="flex items-center gap-2 text-xl font-semibold text-gray-800"></div>

          {/* Right: Help, Settings, Profile */}
          <div className="flex items-center gap-2 ml-4">
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <HelpCircle className="h-5 w-5 text-gray-700" />
            </Button>
            <Button variant="ghost" size="icon" className="hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-700" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hover:bg-gray-100"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userEmail}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Welcome + Search (centered below navbar) */}
      <div className="flex flex-col items-center mt-10">
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
    </div>
  );
};

export default DriveHeader;
