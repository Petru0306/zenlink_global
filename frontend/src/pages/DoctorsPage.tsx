import { useState, useMemo } from 'react'
import type { Doctor } from '../types/doctor'
import FiltersBar from '../components/FiltersBar'
import { DoctorCard } from '../components/DoctorCard'
import { StatsGrid } from '../components/StatsGrid'
import { Button } from '../components/ui/button';

// Mock data pentru doctori
const mockDoctors: Doctor[] = [
  {
    id: 1,
    name: 'Dr. Alina Ion',
    specialization: 'Primary Care, Gynecology',
    rating: 4.98,
    reviewsCount: 565,
    views: 106489,
    location: 'Bucharest, Sector 1',
    fullAddress: 'BUCURESTI, Str. Ion Campineanu nr. 23, Sector 1',
    clinic: 'Clinica Sala Palatului',
    imageUrl: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBtZWRpY2FsfGVufDF8fHx8MTc2MTk2NjU1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 2,
    name: 'Dr. Gabriela Sofiniuc',
    specialization: 'Specialist, Cardiology',
    rating: 4.95,
    reviewsCount: 541,
    views: 71105,
    location: 'Galati',
    fullAddress: 'Galati, Str. G-ral Alexandru Cernat nr. 61, Galati',
    clinic: 'Hiperdia Medical Center',
    imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjIwMjY3MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 3,
    name: 'Dr. Lucretia Anghel',
    specialization: 'Primary Care, Internal Medicine',
    rating: 4.96,
    reviewsCount: 512,
    views: 64221,
    location: 'Galati',
    fullAddress: 'Galati, Str. G-ral Alexandru Cernat nr. 61, Galati',
    clinic: 'Hiperdia Medical Center',
    imageUrl: 'https://images.unsplash.com/photo-1631558554770-74e921444006?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZG9jdG9yJTIwaG9zcGl0YWx8ZW58MXx8fHwxNzYyMDI2ODQzfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 4,
    name: 'Dr. Loredana Cosmina Popescu',
    specialization: 'Specialist, Dermatology',
    rating: 4.99,
    reviewsCount: 474,
    views: 31635,
    location: 'Bucharest, Sector 1',
    fullAddress: 'BUCURESTI, Str. Ion Campineanu nr. 23, Sector 1',
    clinic: 'Clinica Sala Palatului',
    imageUrl: 'https://images.unsplash.com/photo-1580281657702-257584239a55?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtZWRpY2FsJTIwcHJvZmVzc2lvbmFsJTIwY2xpbmljfGVufDF8fHx8MTc2MTk5OTk1OHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 5,
    name: 'Dr. Marcus Chen',
    specialization: 'Orthopedic Surgery',
    rating: 4.94,
    reviewsCount: 389,
    views: 45821,
    location: 'Bucharest, Sector 1',
    fullAddress: 'BUCURESTI, Bd. Magheru nr. 15, Sector 1',
    clinic: 'ZenLink Orthopedic Center',
    imageUrl: 'https://images.unsplash.com/photo-1615177393114-bd2917a4f74a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2N0b3IlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NjIwMjY3MzF8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 6,
    name: 'Dr. Elena Popovici',
    specialization: 'Pediatrics',
    rating: 4.97,
    reviewsCount: 623,
    views: 89234,
    location: 'Cluj-Napoca',
    fullAddress: 'Cluj-Napoca, Str. Clinicilor nr. 8',
    clinic: 'Children\'s Health Center',
    imageUrl: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBkb2N0b3IlMjBtZWRpY2FsfGVufDF8fHx8MTc2MTk2NjU1Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

export default function DoctorsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');

  const handleSearch = (search: string, location: string, specialization: string) => {
    setSearchTerm(search.toLowerCase());
    setLocationFilter(location.toLowerCase());
    setSpecializationFilter(specialization.toLowerCase());
  };

  const filteredDoctors = useMemo(() => {
    return mockDoctors.filter((doctor) => {
      const matchesSearch = !searchTerm || doctor.name.toLowerCase().includes(searchTerm);
      const matchesLocation = !locationFilter || doctor.location.toLowerCase().includes(locationFilter);
      const matchesSpecialization = !specializationFilter || doctor.specialization.toLowerCase().includes(specializationFilter);
      
      return matchesSearch && matchesLocation && matchesSpecialization;
    });
  }, [searchTerm, locationFilter, specializationFilter]);

  const handleViewDoctor = (doctorId: number) => {
    // TODO: Navigate to doctor profile page when routing is implemented
    console.log('View profile for doctor:', doctorId);
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-white text-4xl mb-2 font-semibold">Find a Doctor</h1>
          <p className="text-[#a3aed0]">
            Browse our network of {mockDoctors.length} medical professionals
          </p>
        </div>

        {/* Stats Grid */}
        <StatsGrid />

        <FiltersBar onSearch={handleSearch} />
        
        {/* Results Header */}
        <div className="flex items-center justify-between">
          <div className="text-white">
            Showing <span className="text-blue-400 font-semibold">{filteredDoctors.length}</span> doctors
          </div>
          <Button variant="outline" className="bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-xl text-[#a3aed0] hover:text-white hover:border-blue-500 transition-all">
            Sort by Rating
          </Button>
        </div>

        {/* Doctor Cards */}
        <div className="space-y-4">
          {filteredDoctors.map((doctor, index) => (
            <div 
              key={doctor.id} 
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <DoctorCard doctor={doctor} onViewDoctor={handleViewDoctor} />
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="flex justify-center pt-4">
          <button className="bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] text-white px-10 py-4 rounded-xl border border-[#2d4a7c] hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-500/20 hover:scale-105 transform duration-300">
            Load More Doctors
          </button>
        </div>
      </div>
    </div>
  )
}
