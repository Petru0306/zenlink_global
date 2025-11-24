import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '../components/SearchFilters';
import { StatsGrid } from '../components/StatsGrid';
import { ClinicCard } from '../components/ClinicCard';
import type { Clinic } from '../types/clinic';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

export default function ClinicsPage() {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'grid' | 'list'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  useEffect(() => {
    // Fetch real clinics from backend
    fetch('http://localhost:8080/api/users/clinics')
      .then(res => res.json())
      .then((users: User[]) => {
        // Transform User to Clinic format
        const transformedClinics: Clinic[] = users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName} Clinic`,
          image: undefined,
          location: 'Location not set',
          distance: '',
          rating: 0,
          reviews: 0,
          specialties: [],
          verified: false,
          patients: 0,
          openHours: 'Hours not set',
          featured: false,
          description: 'Clinic information pending',
          phone: user.phone || 'Phone not set',
          email: user.email,
          website: '',
          address: 'Address not set',
          doctors: [],
        }));
        setClinics(transformedClinics);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching clinics:', err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (search: string, specialty: string, location: string, rating: string) => {
    setSearchTerm(search.toLowerCase());
    setSpecialtyFilter(specialty === 'all' ? '' : specialty.toLowerCase());
    setLocationFilter(location === 'all' ? '' : location.toLowerCase());
    setRatingFilter(rating === 'all' ? '' : rating);
  };

  const filteredClinics = useMemo(() => {
    return clinics.filter((clinic) => {
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
  }, [clinics, searchTerm, specialtyFilter, locationFilter, ratingFilter]);

  const navigate = useNavigate()

  const handleViewClinic = (clinicId: number) => {
    navigate(`/clinic/${clinicId}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-white text-4xl mb-2 font-semibold">Clinics Directory</h1>
          <p className="text-[#a3aed0]">
            Browse and manage {clinics.length} medical facilities in your network
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
              <span>{clinics.filter(c => c.featured).length} Featured Clinics</span>
            </div>
          </div>
        </div>

        {/* Clinic Cards Grid */}
        {loading ? (
          <div className="text-white text-center py-12">Loading clinics...</div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-white text-center py-12">No clinics found. Be the first to register!</div>
        ) : (
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
        )}

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

