import React, { createContext, useContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

interface User {
  id: number;
  username: string;
  name?: string;
  email?: string;
  role?: string;
  isHospital?: boolean;
}

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  isLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  // Check for existing session when the app loads
  const { data, isLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });
  
  // Update user when session data changes
  useEffect(() => {
    if (data) {
      // Use type assertion to ensure data is User or null
      setUser(data as User);
    } else if (!isLoading) {
      setUser(null);
    }
  }, [data, isLoading]);

  return React.createElement(
    AuthContext.Provider,
    { value: { user, setUser, isLoading } },
    children
  );
};

export const useAuth = () => useContext(AuthContext);
