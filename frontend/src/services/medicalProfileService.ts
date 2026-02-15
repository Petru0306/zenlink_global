export type MedicalProfileRequest = {
  bloodType?: string;
  allergies?: string;
  chronicConditions?: string;
  medications?: string;
  insuranceNumber?: string;
  weightKg?: string;
  weightChange?: string;
  weightDate?: string;
  heightCm?: string;
  glucose?: string;
  glucoseDate?: string;
  bloodPressure?: string;
  bpDate?: string;
};

export type MedicalProfileResponse = {
  id: number | null;
  userId: number;
  bloodType: string | null;
  allergies: string | null;
  chronicConditions: string | null;
  medications: string | null;
  insuranceNumber: string | null;
  weightKg: string | null;
  weightChange: string | null;
  weightDate: string | null;
  heightCm: string | null;
  glucose: string | null;
  glucoseDate: string | null;
  bloodPressure: string | null;
  bpDate: string | null;
  updatedAt: string | null;
};

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

class MedicalProfileService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getMyProfile(): Promise<MedicalProfileResponse> {
    const response = await fetch(`${API_BASE}/api/medical-profiles/me`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      throw new Error('Failed to load medical profile');
    }

    return response.json();
  }

  async getPatientProfile(patientId: number): Promise<MedicalProfileResponse> {
    const token = localStorage.getItem('token');
    console.log('🔐 Getting patient profile - patientId:', patientId, 'token exists:', !!token, 'token length:', token?.length);
    console.log('🔐 API_BASE:', API_BASE);
    console.log('🔐 Full URL:', `${API_BASE}/api/medical-profiles/patient/${patientId}`);
    
    try {
      const response = await fetch(`${API_BASE}/api/medical-profiles/patient/${patientId}`, {
        method: 'GET',
        headers: this.getAuthHeader(),
      });

      console.log('🔐 Response status:', response.status, response.statusText);
      console.log('🔐 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // If 404 or 401, return empty profile instead of throwing
        // 401 might happen if token is expired or missing, but we still want to show the card
        if (response.status === 404 || response.status === 401 || response.status === 403) {
          const errorText = await response.text().catch(() => '');
          console.log(`⚠️ No medical profile found for patient ${patientId} (status: ${response.status}) - returning empty profile`);
          console.log(`⚠️ Error response:`, errorText);
          return {
            id: null,
            userId: patientId,
            bloodType: null,
            allergies: null,
            chronicConditions: null,
            medications: null,
            insuranceNumber: null,
            weightKg: null,
            weightChange: null,
            weightDate: null,
            heightCm: null,
            glucose: null,
            glucoseDate: null,
            bloodPressure: null,
            bpDate: null,
            updatedAt: null
          };
        }
        const errorText = await response.text().catch(() => '');
        console.error('❌ Failed to load patient medical profile:', response.status, response.statusText, errorText);
        throw new Error(`Failed to load patient medical profile: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Successfully loaded medical profile:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching patient profile:', error);
      // Return empty profile on any error
      return {
        id: null,
        userId: patientId,
        bloodType: null,
        allergies: null,
        chronicConditions: null,
        medications: null,
        insuranceNumber: null,
        weightKg: null,
        weightChange: null,
        weightDate: null,
        heightCm: null,
        glucose: null,
        glucoseDate: null,
        bloodPressure: null,
        bpDate: null,
        updatedAt: null
      };
    }
  }

  async upsertProfile(payload: MedicalProfileRequest): Promise<MedicalProfileResponse> {
    const response = await fetch(`${API_BASE}/api/medical-profiles/me`, {
      method: 'PUT',
      headers: this.getAuthHeader(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to save medical profile';
      try {
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      } catch (e) {
        // Ignore error reading response
      }
      console.error('Medical profile save error:', response.status, errorMessage);
      throw new Error(`${errorMessage} (Status: ${response.status})`);
    }

    return response.json();
  }
}

export const medicalProfileService = new MedicalProfileService();
