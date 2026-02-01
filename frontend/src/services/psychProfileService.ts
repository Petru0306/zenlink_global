const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  `http://${window.location.hostname || 'localhost'}:8080`;

export type PsychProfileResponse = {
  completed: boolean;
  temperament?: string;
  anxietyLevel?: string;
  anxietyScore?: number;
  controlNeed?: string;
  controlScore?: number;
  communicationStyle?: string;
  procedurePreference?: string;
  triggers?: string[];
  notes?: string;
  resultsSheet?: string;
  completedAt?: string;
  updatedAt?: string;
  answers?: Record<string, any>;
};

export type PsychProfileRequest = {
  answers: Record<string, any>;
};

class PsychProfileService {
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

  async getMyProfile(): Promise<PsychProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/api/me/psych-profile`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to load psych profile' }));
      throw new Error(error.message || 'Failed to load psych profile');
    }

    return response.json();
  }

  async upsertProfile(payload: PsychProfileRequest): Promise<PsychProfileResponse> {
    const response = await fetch(`${API_BASE_URL}/api/me/psych-profile`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save psych profile' }));
      throw new Error(error.message || 'Failed to save psych profile');
    }

    return response.json();
  }
}

export const psychProfileService = new PsychProfileService();
export default psychProfileService;

