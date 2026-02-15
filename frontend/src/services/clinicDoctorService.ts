export interface ClinicDoctor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImageUrl?: string;
  specializations?: string;
  tagline?: string;
}

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';

class ClinicDoctorService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async getClinicDoctors(clinicId: number): Promise<ClinicDoctor[]> {
    const response = await fetch(`${API_BASE}/api/clinics/${clinicId}/doctors`, {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      console.error('Failed to load clinic doctors:', response.status);
      return [];
    }

    return response.json();
  }

  async searchDoctors(search: string = ''): Promise<ClinicDoctor[]> {
    const url = new URL(`${API_BASE}/api/clinics/doctors/search`);
    if (search) {
      url.searchParams.append('search', search);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      console.error('Failed to search doctors:', response.status);
      return [];
    }

    return response.json();
  }

  async addDoctor(clinicId: number, doctorId: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/clinics/${clinicId}/doctors/${doctorId}`, {
      method: 'POST',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to add doctor');
    }

    const data = await response.json();
    return data.ok === true;
  }

  async removeDoctor(clinicId: number, doctorId: number): Promise<boolean> {
    const response = await fetch(`${API_BASE}/api/clinics/${clinicId}/doctors/${doctorId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to remove doctor');
    }

    const data = await response.json();
    return data.ok === true;
  }
}

export const clinicDoctorService = new ClinicDoctorService();
