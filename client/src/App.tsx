import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import UserLogin from "@/pages/UserLogin";
import UserRegister from "@/pages/UserRegister";
import HospitalLogin from "@/pages/HospitalLogin";
import HospitalRegister from "@/pages/HospitalRegister";
import HospitalDashboard from "@/pages/HospitalDashboard";
import HospitalBedManagement from "@/pages/HospitalBedManagement";
import HospitalBookings from "@/pages/HospitalBookings";
import UserBookings from "@/pages/UserBookings";
import AdminDashboard from "@/pages/AdminDashboard";
import { AuthProvider } from "@/lib/auth";

function Router() {
  const [location] = useLocation();

  // Check if we're in hospital dashboard section
  const isHospitalDashboard = location.startsWith("/hospital/dashboard");
  
  // For admin dashboard
  const isAdminDashboard = location.startsWith("/admin");

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/login" component={UserLogin} />
      <Route path="/register" component={UserRegister} />
      <Route path="/hospital/login" component={HospitalLogin} />
      <Route path="/hospital/register" component={HospitalRegister} />
      
      {/* User routes */}
      <Route path="/bookings" component={UserBookings} />
      
      {/* Hospital routes */}
      <Route path="/hospital/dashboard" component={HospitalDashboard} />
      <Route path="/hospital/dashboard/beds" component={HospitalBedManagement} />
      <Route path="/hospital/dashboard/bookings" component={HospitalBookings} />
      
      {/* Admin routes */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout>
          <Router />
        </Layout>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
