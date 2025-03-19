import React, { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const Header: React.FC = () => {
  const [location, navigate] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get user initials for the avatar
  const getInitials = () => {
    if (!user) return "U";
    if (user.name) {
      const nameParts = user.name.split(" ");
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`;
      }
      return nameParts[0][0];
    }
    return user.username[0].toUpperCase();
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      setUser(null);
      toast({
        title: "Logged out successfully",
        description: "You have been logged out",
      });
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out",
        variant: "destructive",
      });
    }
  };

  // Determine active navigation item
  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-primary font-bold text-xl cursor-pointer">
                MedBeds
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex items-center space-x-4">
              <Link 
                href="/"
                className={`px-3 py-2 text-sm font-medium ${
                  isActive("/")
                    ? "text-primary border-b-2 border-primary"
                    : "text-gray-600 hover:text-primary"
                }`}
              >
                Home
              </Link>
              {user && !user.isHospital && (
                <>
                  <Link 
                    href="/bookings"
                    className={`px-3 py-2 text-sm font-medium ${
                      isActive("/bookings")
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-600 hover:text-primary"
                    }`}
                  >
                    My Bookings
                  </Link>
                </>
              )}
              {user && user.isHospital && (
                <Link 
                  href="/hospital/dashboard"
                  className={`px-3 py-2 text-sm font-medium ${
                    location.startsWith("/hospital/dashboard")
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  Dashboard
                </Link>
              )}
              {user && user.role === "admin" && (
                <Link 
                  href="/admin"
                  className={`px-3 py-2 text-sm font-medium ${
                    location.startsWith("/admin")
                      ? "text-primary border-b-2 border-primary"
                      : "text-gray-600 hover:text-primary"
                  }`}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
          
          <div className="hidden sm:flex items-center space-x-3">
            {!user ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-primary">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-primary hover:bg-primary-700 text-white">
                    Sign up
                  </Button>
                </Link>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-white">
                      {getInitials()}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-4 py-2">
                      <p className="text-sm font-medium">{user.name || user.username}</p>
                      <p className="text-xs text-gray-500">
                        {user.email || (user.isHospital ? "Hospital" : "User")}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    {user.isHospital && (
                      <DropdownMenuItem
                        onClick={() => navigate("/hospital/dashboard")}
                        className="cursor-pointer"
                      >
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    {user.role === "admin" && (
                      <DropdownMenuItem
                        onClick={() => navigate("/admin")}
                        className="cursor-pointer"
                      >
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer"
                    >
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-primary hover:bg-gray-100"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden">
            <div className="pt-2 pb-3 space-y-1">
              <Link 
                href="/"
                className={`block px-3 py-2 text-base font-medium ${
                  isActive("/")
                    ? "text-primary border-l-4 border-primary bg-primary-50"
                    : "text-gray-600 hover:text-primary hover:bg-gray-50"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </Link>
              {user && !user.isHospital && (
                <Link 
                  href="/bookings"
                  className={`block px-3 py-2 text-base font-medium ${
                    isActive("/bookings")
                      ? "text-primary border-l-4 border-primary bg-primary-50"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Bookings
                </Link>
              )}
              {user && user.isHospital && (
                <Link 
                  href="/hospital/dashboard"
                  className={`block px-3 py-2 text-base font-medium ${
                    location.startsWith("/hospital/dashboard")
                      ? "text-primary border-l-4 border-primary bg-primary-50"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {user && user.role === "admin" && (
                <Link 
                  href="/admin"
                  className={`block px-3 py-2 text-base font-medium ${
                    location.startsWith("/admin")
                      ? "text-primary border-l-4 border-primary bg-primary-50"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
            {user ? (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="flex items-center px-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                      {getInitials()}
                    </div>
                  </div>
                  <div className="ml-3">
                    <div className="text-base font-medium text-gray-800">
                      {user.name || user.username}
                    </div>
                    <div className="text-sm font-medium text-gray-500">
                      {user.email || (user.isHospital ? "Hospital" : "User")}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1">
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-100"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            ) : (
              <div className="pt-4 pb-3 border-t border-gray-200">
                <div className="space-y-1">
                  <Link 
                    href="/login"
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    href="/register"
                    className="block px-4 py-2 text-base font-medium text-gray-600 hover:text-primary hover:bg-gray-100"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
