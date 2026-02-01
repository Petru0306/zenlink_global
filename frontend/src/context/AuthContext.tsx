import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { psychProfileService, type PsychProfileResponse } from '../services/psychProfileService';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'CLINIC';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  age?: number;
  role?: UserRole;
  token?: string;
  refreshToken?: string;
}

interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, phone?: string, role?: UserRole, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  isAuthenticated: boolean;
  psychProfile: PsychProfileResponse | null;
  psychProfileLoading: boolean;
  refreshPsychProfile: () => Promise<PsychProfileResponse | null>;
  setPsychProfile: (profile: PsychProfileResponse | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname || 'localhost'}:8080`;

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [psychProfile, setPsychProfile] = useState<PsychProfileResponse | null>(null);
  const [psychProfileLoading, setPsychProfileLoading] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Ensure role is included when loading from localStorage
        if (!parsedUser.role) {
          parsedUser.role = 'PATIENT'; // Default to PATIENT if role is missing
        }
        console.log('Loaded user from localStorage:', parsedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (user) {
      refreshPsychProfile();
    } else {
      setPsychProfile(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const refreshPsychProfile = async (): Promise<PsychProfileResponse | null> => {
    if (!user) {
      setPsychProfile(null);
      return null;
    }
    setPsychProfileLoading(true);
    try {
      const response = await psychProfileService.getMyProfile();
      setPsychProfile(response);
      return response;
    } catch (error) {
      console.error('Failed to load psych profile:', error);
      setPsychProfile(null);
      return null;
    } finally {
      setPsychProfileLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      console.log('Login success, received data:', data);
      
      const userData: User = {
        id: String(data.userId || data.id || Date.now()),
        email: data.email || email,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        phone: data.phone,
        role: data.role,
        token: data.token,
        refreshToken: data.refreshToken,
      };

      console.log('Setting user data with role:', userData.role, 'Full user:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      if (userData.refreshToken) {
        localStorage.setItem('refreshToken', userData.refreshToken);
      }
    } catch (error) {
      // If backend is not available, use mock authentication for development (login only)
      console.warn('Backend not available, using mock authentication:', error);
      
      // Mock login - check against localStorage stored users
      const storedUsers = localStorage.getItem('users');
      if (storedUsers) {
        const users = JSON.parse(storedUsers);
        const foundUser = users.find((u: any) => u.email === email && u.password === password);
        
        if (foundUser) {
          const userData: User = {
            id: foundUser.id,
            email: foundUser.email,
            firstName: foundUser.firstName,
            lastName: foundUser.lastName,
            phone: foundUser.phone,
            role: foundUser.role || 'PATIENT',
          };
          setUser(userData);
          localStorage.setItem('user', JSON.stringify(userData));
          return;
        }
      }
      
      throw error;
    }
  };

  const signup = async (firstName: string, lastName: string, email: string, password: string, phone?: string, role: UserRole = 'PATIENT', referralCode?: string) => {
    try {
      const requestBody: any = { 
        firstName, 
        lastName, 
        email, 
        password,
        phone,
        role,
      };
      
      // Always include referralCode for DOCTOR and CLINIC (even if empty, so backend can validate)
      // For PATIENT, don't include it
      if (role === 'DOCTOR' || role === 'CLINIC') {
        requestBody.referralCode = referralCode || '';
      }

      console.log('Signup request body:', requestBody);
      
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Signup response status:', response.status);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Signup error response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: 'Signup failed' };
        }
        
        const errorMessage = errorData.message || 'Signup failed';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Signup success, received data:', data);
      
      const userData: User = {
        id: String(data.userId || data.id || Date.now()),
        email: data.email || email,
        firstName: data.firstName || firstName,
        lastName: data.lastName || lastName,
        phone: data.phone || phone,
        role: data.role || role,
        token: data.token,
        refreshToken: data.refreshToken,
      };

      console.log('Setting user data with role:', userData.role, 'Full user:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
      if (userData.refreshToken) {
        localStorage.setItem('refreshToken', userData.refreshToken);
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Call logout endpoint (optional - JWT is stateless)
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore errors - logout should work even if backend is down
        });
      }
    } finally {
      // Always clear local state
      setUser(null);
      setPsychProfile(null);
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is invalid or expired
        await logout();
        return false;
      }

      const data = await response.json();
      
      // Update user with new token
      const updatedUser: User = {
        ...user!,
        token: data.token,
        refreshToken: data.refreshToken,
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      localStorage.setItem('token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return true;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        isLoading,
        login,
        signup,
        logout,
        refreshAccessToken,
        isAuthenticated: !!user,
        psychProfile,
        psychProfileLoading,
        refreshPsychProfile,
        setPsychProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
