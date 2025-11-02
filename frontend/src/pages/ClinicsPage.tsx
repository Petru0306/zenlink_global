import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '../components/SearchFilters';
import { StatsGrid } from '../components/StatsGrid';
import { ClinicCard } from '../components/ClinicCard';
import { mockClinics } from '../data/mockData';

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

