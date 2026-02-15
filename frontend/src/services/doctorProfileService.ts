export type DoctorProfileRequest = {
  profileImageUrl?: string;
  tagline?: string;
  about?: string;
  specializations?: string;
  yearsOfExperience?: string;
  clinics?: string;
  consultationTypes?: string;
  languages?: string;
  medicalInterests?: string;
  workStyle?: string;
  professionalEmail?: string;
  clinicPhone?: string;
  generalAvailability?: string;
};

export type DoctorProfileResponse = {
  id: number | null;
  userId: number;
  profileImageUrl: string | null;
  tagline: string | null;
  about: string | null;
  specializations: string | null;
  yearsOfExperience: string | null;
  clinics: string | null;
  consultationTypes: string | null;
  languages: string | null;
  medicalInterests: string | null;
  workStyle: string | null;
  professionalEmail: string | null;
  clinicPhone: string | null;
  generalAvailability: string | null;
  updatedAt: string | null;
};

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

class DoctorProfileService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getMyProfile(): Promise<DoctorProfileResponse> {
    const response = await fetch(`${API_BASE}/api/doctor-profiles/me`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to load doctor profile';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Doctor profile load error data:', errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else {
          const errorText = await response.text();
          console.error('Doctor profile load error text:', errorText);
          if (errorText) {
            try {
              const parsed = JSON.parse(errorText);
              if (parsed.error) {
                errorMessage = parsed.error;
              } else if (parsed.message) {
                errorMessage = parsed.message;
              }
            } catch {
              errorMessage = errorText || `Failed to load doctor profile (Status: ${response.status})`;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
        errorMessage = `Failed to load doctor profile (Status: ${response.status})`;
      }
      console.error('Doctor profile load error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  }

  async getDoctorProfile(doctorId: number): Promise<DoctorProfileResponse> {
    const response = await fetch(`${API_BASE}/api/doctor-profiles/doctor/${doctorId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return empty profile if not found
      return {
        id: null,
        userId: doctorId,
        profileImageUrl: null,
        tagline: null,
        about: null,
        specializations: null,
        yearsOfExperience: null,
        clinics: null,
        consultationTypes: null,
        languages: null,
        medicalInterests: null,
        workStyle: null,
        professionalEmail: null,
        clinicPhone: null,
        generalAvailability: null,
        updatedAt: null
      };
    }

    return response.json();
  }

  async upsertProfile(payload: DoctorProfileRequest): Promise<DoctorProfileResponse> {
    const response = await fetch(`${API_BASE}/api/doctor-profiles/me`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save doctor profile';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (e) {
        // Ignore error reading response
        console.error('Error parsing error response:', e);
      }
      console.error('Doctor profile save error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const doctorProfileService = new DoctorProfileService();
