const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname || 'localhost'}:8080`;

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC';
  referralCode?: string;
}

export interface AuthResponse {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'PATIENT' | 'DOCTOR' | 'CLINIC';
  token: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

class AuthService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return token
      ? {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      : {
          'Content-Type': 'application/json',
        };
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    return response.json();
  }

  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(error.message || 'Signup failed');
    }

    return response.json();
  }

  async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: this.getAuthHeader(),
      });
    } catch {
      // Ignore errors - logout should work even if backend is down
    } finally {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Token refresh failed' }));
      throw new Error(error.message || 'Token refresh failed');
    }

    return response.json();
  }

  async validateToken(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/validate`, {
        method: 'GET',
        headers: this.getAuthHeader(),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to get current user');
    }

    return response.json();
  }

  // Helper to check if token is expired (client-side check)
  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      return Date.now() >= exp;
    } catch {
      return true;
    }
  }

  // Get stored tokens
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Store tokens
  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken);
  }
}

export const authService = new AuthService();
export default authService;

