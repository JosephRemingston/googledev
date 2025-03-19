import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import { useAuth } from "@/lib/auth";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Check if we're in hospital dashboard or admin dashboard
  const isHospitalDashboard = window.location.pathname.startsWith("/hospital/dashboard");
  const isAdminDashboard = window.location.pathname.startsWith("/admin");
  
  // For hospital and admin dashboard, we don't show the standard header and footer
  if (isHospitalDashboard || isAdminDashboard) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen h-max bg-background flex flex-col">
      <Header />
      <main className="flex-grow">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
