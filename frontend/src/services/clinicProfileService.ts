export type ClinicProfileRequest = {
  profileImageUrl?: string;
  bannerImageUrl?: string;
  name?: string;
  tagline?: string;
  about?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  specialties?: string;
  openHours?: string;
  description?: string;
  facilities?: string;
  insuranceAccepted?: string;
  languages?: string;
  galleryImages?: string; // JSON array of image URLs
};

export type ClinicProfileResponse = {
  id: number | null;
  userId: number;
  profileImageUrl: string | null;
  bannerImageUrl: string | null;
  name: string | null;
  tagline: string | null;
  about: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  specialties: string | null;
  openHours: string | null;
  description: string | null;
  facilities: string | null;
  insuranceAccepted: string | null;
  languages: string | null;
  galleryImages: string | null; // JSON array of image URLs
  updatedAt: string | null;
};

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

class ClinicProfileService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getMyProfile(): Promise<ClinicProfileResponse> {
    const response = await fetch(`${API_BASE}/api/clinic-profiles/me`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to load clinic profile';
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          console.error('Clinic profile load error data:', errorData);
          if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          }
        } else {
          const errorText = await response.text();
          console.error('Clinic profile load error text:', errorText);
          if (errorText) {
            try {
              const parsed = JSON.parse(errorText);
              if (parsed.error) {
                errorMessage = parsed.error;
              } else if (parsed.message) {
                errorMessage = parsed.message;
              }
            } catch {
              errorMessage = errorText || `Failed to load clinic profile (Status: ${response.status})`;
            }
          }
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
        errorMessage = `Failed to load clinic profile (Status: ${response.status})`;
      }
      console.error('Clinic profile load error:', response.status, errorMessage);
      
      // Return empty profile if not found
      return {
        id: null,
        userId: 0,
        profileImageUrl: null,
        bannerImageUrl: null,
        name: null,
        tagline: null,
        about: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        specialties: null,
        openHours: null,
        description: null,
        facilities: null,
        insuranceAccepted: null,
        languages: null,
        galleryImages: null,
        updatedAt: null
      };
    }

    return response.json();
  }

  async getClinicProfile(clinicId: number): Promise<ClinicProfileResponse> {
    const response = await fetch(`${API_BASE}/api/clinic-profiles/clinic/${clinicId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      // Return empty profile if not found
      return {
        id: null,
        userId: clinicId,
        profileImageUrl: null,
        bannerImageUrl: null,
        name: null,
        tagline: null,
        about: null,
        address: null,
        phone: null,
        email: null,
        website: null,
        specialties: null,
        openHours: null,
        description: null,
        facilities: null,
        insuranceAccepted: null,
        languages: null,
        galleryImages: null,
        updatedAt: null
      };
    }

    return response.json();
  }

  async upsertProfile(payload: ClinicProfileRequest): Promise<ClinicProfileResponse> {
    console.log('Upserting clinic profile with payload:', payload);
    console.log('Banner URL in payload:', payload.bannerImageUrl);
    const response = await fetch(`${API_BASE}/api/clinic-profiles/me`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save clinic profile';
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
      console.error('Clinic profile save error:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  }
}

export const clinicProfileService = new ClinicProfileService();
