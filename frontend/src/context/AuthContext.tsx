import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'PATIENT' | 'DOCTOR' | 'CLINIC';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (firstName: string, lastName: string, email: string, password: string, phone?: string, role?: UserRole, referralCode?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
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
        firstName: data.firstName || data.firstName || '',
        lastName: data.lastName || data.lastName || '',
        phone: data.phone,
        role: data.role, // Backend should return the role
        token: data.token || data.accessToken,
      };

      console.log('Setting user data with role:', userData.role, 'Full user:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('token', userData.token);
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
            role: foundUser.role || 'PATIENT', // Include role from stored user
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
      console.log('=== SIGNUP FUNCTION v2 - NO MOCK AUTH ===');
      
      const response = await fetch('http://localhost:8080/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Signup response status:', response.status);
      console.log('Signup response ok?', response.ok);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error('Signup error response:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: 'Signup failed' };
        }
        
        // Show the actual error message from backend (e.g., "Invalid or already used referral code")
        const errorMessage = errorData.message || 'Signup failed';
        console.error('Throwing error with message:', errorMessage);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Signup success, received data:', data);
      
      // IMPORTANT: Use role from backend response, not from parameter
      const userData: User = {
        id: String(data.userId || data.id || Date.now()),
        email: data.email || email,
        firstName: data.firstName || firstName,
        lastName: data.lastName || lastName,
        phone: data.phone || phone,
        role: data.role || role, // Backend should return the role
        token: data.token || data.accessToken,
      };

      console.log('Setting user data with role:', userData.role, 'Full user:', userData);
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      if (userData.token) {
        localStorage.setItem('token', userData.token);
      }
    } catch (error: any) {
      // DO NOT use mock authentication for signup - always require backend validation
      // This ensures referral codes are properly validated
      console.error('=== SIGNUP ERROR CAUGHT - THROWING ERROR (NO MOCK) ===', error);
      throw error; // Re-throw to show error to user - DO NOT use mock auth
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

