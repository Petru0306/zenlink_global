export interface Doctor {
  id: number;
  name: string;
  specialization: string;
  rating: number;
  reviewsCount: number;
  views: number;
  location: string;
  fullAddress: string;
  clinic: string;
  clinicId: number;
  imageUrl?: string;
  bio?: string;
  education?: string[];
  experience?: string;
  languages?: string[];
  consultationFee?: number;
}


