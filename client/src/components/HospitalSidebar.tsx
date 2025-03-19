import React from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Bed,
  Calendar,
  Building2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface HospitalSidebarProps {
  activePath: string;
}

const HospitalSidebar: React.FC<HospitalSidebarProps> = ({ activePath }) => {
  const [location, navigate] = useLocation();
  const { user, setUser } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  if (!user || !user.isHospital) {
    return null;
  }

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

  // Get initials for avatar
  const getInitials = () => {
    if (!user || !user.name) return "H";
    const nameParts = user.name.split(" ");
    if (nameParts.length > 1) {
      return `${nameParts[0][0]}${nameParts[1][0]}`;
    }
    return nameParts[0][0];
  };

  // Define navigation items
  const navItems = [
    {
      path: "/hospital/dashboard",
      label: "Overview",
      icon: <LayoutDashboard className="h-5 w-5 mr-2" />,
    },
    {
      path: "/hospital/dashboard/beds",
      label: "Bed Management",
      icon: <Bed className="h-5 w-5 mr-2" />,
    },
    {
      path: "/hospital/dashboard/bookings",
      label: "Bookings",
      icon: <Calendar className="h-5 w-5 mr-2" />,
    },
  ];

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white p-4 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white mr-2">
            {getInitials()}
          </div>
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">Hospital Dashboard</div>
          </div>
        </div>
        <button
          className="p-2 rounded-md hover:bg-gray-100 focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>
      
      {/* Mobile sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-10 lg:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-20" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 bg-primary-800 text-white">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="mt-1 text-primary-100">Hospital Dashboard</p>
            </div>
            
            <nav className="py-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`py-3 px-6 flex items-center ${
                      activePath === item.path
                        ? "text-primary font-medium border-l-4 border-primary bg-primary-50"
                        : "text-gray-600 hover:text-primary hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                  {getInitials()}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">Hospital Administrator</p>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full flex items-center justify-center"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-1/4 max-w-xs">
        <div className="bg-white rounded-lg shadow overflow-hidden sticky top-6">
          <div className="p-6 bg-primary-800 text-white">
            <h2 className="text-xl font-semibold">{user.name}</h2>
            <p className="mt-1 text-primary-100">Hospital Dashboard</p>
          </div>
          
          <nav className="-mb-px">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`py-4 px-6 flex items-center ${
                    activePath === item.path
                      ? "text-primary font-medium border-l-4 border-primary bg-primary-50"
                      : "text-gray-600 hover:text-primary hover:bg-gray-50 font-medium"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </a>
              </Link>
            ))}
          </nav>
          
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white">
                {getInitials()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Hospital Admin</p>
                <p className="text-xs text-gray-500">{user.username}</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="mt-4 w-full flex items-center justify-center"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default HospitalSidebar;
