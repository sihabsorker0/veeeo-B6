import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { login, register, logout } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  subscribers: number;
  isAdmin?: boolean;
  bio?: string;
  createdAt?: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    email: string;
    avatarUrl?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUserInfo: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch current user
  const { data, isLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
    onError: () => {
      setUser(null);
    }
  });

  useEffect(() => {
    if (data && data.user) {
      setUser(data.user);
    }
  }, [data]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (credentials: { username: string; password: string }) => 
      login(credentials.username, credentials.password),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    }
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (userData: {
      username: string;
      password: string;
      email: string;
      avatarUrl?: string;
    }) => register(userData),
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Registration successful",
        description: `Welcome to VideoShare, ${data.user.username}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      setUser(null);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      queryClient.clear();
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Logout failed",
        description: error.message || "Could not log out",
        variant: "destructive",
      });
    }
  });

  const handleLogin = async (username: string, password: string) => {
    await loginMutation.mutateAsync({ username, password });
  };

  const handleRegister = async (userData: {
    username: string;
    password: string;
    email: string;
    avatarUrl?: string;
  }) => {
    await registerMutation.mutateAsync(userData);
  };

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const updateUserInfo = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: isLoading || loginMutation.isPending || registerMutation.isPending || logoutMutation.isPending,
        isAuthenticated: !!user,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        updateUserInfo
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
