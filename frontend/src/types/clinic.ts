export interface Clinic {
  id: number;
  name: string;
  image: string;
  location: string;
  distance?: string;
  rating: number;
  reviews: number;
  specialties: string[];
  verified?: boolean;
  patients?: number;
  openHours?: string;
  featured?: boolean;
}

