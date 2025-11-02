import { useState, useMemo } from 'react';
import type { Clinic } from '../types/clinic';
import { SearchFilters } from '../components/SearchFilters';
import { StatsGrid } from '../components/StatsGrid';
import { ClinicCard } from '../components/ClinicCard';

// Mock data pentru clinici
const mockClinics: Clinic[] = [
  {
    id: 1,
    name: 'Clinica Sala Palatului',
    image: 'https://images.unsplash.com/photo-1758691463610-3c2ecf5fb3fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwY2xpbmljfGVufDF8fHx8MTc2MTk4NDA5NHww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Str. Ion Campineanu nr. 23, Sector 1, Bucharest',
    distance: '2.3 km',
    rating: 4.98,
    reviews: 865,
    specialties: ['Cardiology', 'Neurology', 'Orthopedics'],
    verified: true,
    patients: 12500,
    openHours: 'Open Now • Closes at 8:00 PM',
    featured: true,
  },
  {
    id: 2,
    name: 'MedLife Elite Center',
    image: 'https://images.unsplash.com/photo-1626315869436-d6781ba69d6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2MjA0OTg0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Calea Victoriei nr. 156, Sector 2, Bucharest',
    distance: '3.7 km',
    rating: 4.92,
    reviews: 1204,
    specialties: ['General Medicine', 'Pediatrics', 'Dermatology'],
    verified: true,
    patients: 18200,
    openHours: 'Open 24/7',
    featured: true,
  },
  {
    id: 3,
    name: 'Regina Maria Premium',
    image: 'https://images.unsplash.com/photo-1631507623104-aa66944677aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwY2VudGVyfGVufDF8fHx8MTc2MjA4NDMzOXww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Bd. Unirii nr. 45, Sector 3, Bucharest',
    distance: '4.1 km',
    rating: 4.87,
    reviews: 956,
    specialties: ['Surgery', 'Radiology', 'Laboratory'],
    verified: true,
    patients: 15600,
    openHours: 'Open Now • Closes at 7:00 PM',
  },
  {
    id: 4,
    name: 'Sanador Medical Center',
    image: 'https://images.unsplash.com/photo-1710074213379-2a9c2653046a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwZmFjaWxpdHl8ZW58MXx8fHwxNzYyMDg0MzM5fDA&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Str. Gheorghe Polizu nr. 7, Sector 1, Bucharest',
    distance: '1.8 km',
    rating: 4.95,
    reviews: 743,
    specialties: ['Emergency', 'Intensive Care', 'Oncology'],
    verified: true,
    patients: 9800,
    openHours: 'Open 24/7',
    featured: true,
  },
  {
    id: 5,
    name: 'Hiperdia Medical Institute',
    image: 'https://images.unsplash.com/photo-1758691463610-3c2ecf5fb3fa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBtZWRpY2FsJTIwY2xpbmljfGVufDF8fHx8MTc2MTk4NDA5NHww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Str. Garii nr. 19, Sector 4, Bucharest',
    distance: '5.2 km',
    rating: 4.83,
    reviews: 612,
    specialties: ['Diabetes', 'Endocrinology', 'Nutrition'],
    verified: true,
    patients: 7200,
    openHours: 'Open Now • Closes at 6:00 PM',
  },
  {
    id: 6,
    name: 'Acva Med Center',
    image: 'https://images.unsplash.com/photo-1626315869436-d6781ba69d6e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3NwaXRhbCUyMGJ1aWxkaW5nfGVufDF8fHx8MTc2MjA0OTg0M3ww&ixlib=rb-4.1.0&q=80&w=1080',
    location: 'Str. Imperatul Traian nr. 198, Sector 5, Bucharest',
    distance: '6.4 km',
    rating: 4.76,
    reviews: 485,
    specialties: ['Physical Therapy', 'Rehabilitation', 'Sports Medicine'],
    verified: false,
    patients: 5400,
    openHours: 'Open Now • Closes at 8:00 PM',
  },
];

export default function ClinicsPage() {
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  const handleSearch = (search: string, specialty: string, location: string, rating: string) => {
    setSearchTerm(search.toLowerCase());
    setSpecialtyFilter(specialty === 'all' ? '' : specialty.toLowerCase());
    setLocationFilter(location === 'all' ? '' : location.toLowerCase());
    setRatingFilter(rating === 'all' ? '' : rating);
  };

  const filteredClinics = useMemo(() => {
    return mockClinics.filter((clinic) => {
      const matchesSearch = !searchTerm || 
        clinic.name.toLowerCase().includes(searchTerm) ||
        clinic.location.toLowerCase().includes(searchTerm) ||
        clinic.specialties.some(s => s.toLowerCase().includes(searchTerm));
      
      const matchesSpecialty = !specialtyFilter || 
        clinic.specialties.some(s => s.toLowerCase().includes(specialtyFilter));
      
      const matchesLocation = !locationFilter || 
        clinic.location.toLowerCase().includes(locationFilter);
      
      const matchesRating = !ratingFilter || 
        clinic.rating >= parseFloat(ratingFilter);
      
      return matchesSearch && matchesSpecialty && matchesLocation && matchesRating;
    });
  }, [searchTerm, specialtyFilter, locationFilter, ratingFilter]);

  const handleViewClinic = (clinicId: number) => {
    // TODO: Navigate to clinic profile page when routing is implemented
    console.log('View profile for clinic:', clinicId);
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-white text-4xl mb-2 font-semibold">Clinics Directory</h1>
          <p className="text-[#a3aed0]">
            Browse and manage {mockClinics.length} medical facilities in your network
          </p>
        </div>

        {/* Stats Grid */}
        <StatsGrid />

        {/* Search and Filters */}
        <SearchFilters onViewChange={setViewType} currentView={viewType} onSearch={handleSearch} />

        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="text-white">
            Showing <span className="text-blue-400">{filteredClinics.length}</span> results
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[#a3aed0] text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{mockClinics.filter(c => c.featured).length} Featured Clinics</span>
            </div>
          </div>
        </div>

        {/* Clinic Cards Grid */}
        <div className={`${
          viewType === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
            : 'space-y-4'
        }`}>
          {filteredClinics.map((clinic, index) => (
            <div
              key={clinic.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ClinicCard {...clinic} onViewClinic={handleViewClinic} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4">
          <button className="bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] text-white px-10 py-4 rounded-xl border border-[#2d4a7c] hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-105 transform duration-300">
            Load More Clinics
          </button>
        </div>
      </div>
    </div>
  );
}

