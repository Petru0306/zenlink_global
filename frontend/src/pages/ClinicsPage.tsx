import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SearchFilters } from '../components/SearchFilters';
import { ClinicCard } from '../components/ClinicCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
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
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');

  useEffect(() => {
    // Fetch real clinics from backend
    fetch('http://localhost:8080/api/users/clinics')
      .then(res => res.json())
      .then((users: User[]) => {
        // Transform User to Clinic format
        const transformedClinics: Clinic[] = users.map(user => ({
          id: user.id,
          name: `${user.firstName} ${user.lastName} Clinic`,
          image: '',
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

  const sortedClinics = useMemo(() => {
    const decorated = filteredClinics.map((clinic, idx) => ({ clinic, idx }));
    decorated.sort((a, b) => {
      if (sortBy === 'rating') {
        const diff = (b.clinic.rating ?? 0) - (a.clinic.rating ?? 0);
        return diff !== 0 ? diff : a.idx - b.idx;
      }
      if (sortBy === 'reviews') {
        const diff = (b.clinic.reviews ?? 0) - (a.clinic.reviews ?? 0);
        return diff !== 0 ? diff : a.idx - b.idx;
      }
      // name A -> Z
      const nameDiff = a.clinic.name.localeCompare(b.clinic.name, undefined, { sensitivity: 'base' });
      return nameDiff !== 0 ? nameDiff : a.idx - b.idx;
    });
    return decorated.map((x) => x.clinic);
  }, [filteredClinics, sortBy]);

  const navigate = useNavigate();

  const handleViewClinic = (clinicId: number) => {
    navigate(`/clinic/${clinicId}`);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px]" />
        <div className="absolute -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px]" />
        <div className="absolute top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px]" />
      </div>

      <div className="p-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="animate-fade-in-up">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent tracking-tight">
            Clinics Directory
          </h1>
          <p className="text-white/60 text-lg font-light tracking-wide">
            Browse and manage {clinics.length} medical facilities in your network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
          {/* Search and Filters */}
          <SearchFilters onViewChange={setViewType} currentView={viewType} onSearch={handleSearch} />

          <div className="space-y-6">
            {/* Results Header */}
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-white">
                  Showing <span className="text-purple-300 font-bold text-lg">{sortedClinics.length}</span> results
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-purple-200/70 text-sm bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span>{clinics.filter(c => c.featured).length} Featured Clinics</span>
                  </div>
                  <div className="flex items-center gap-2 backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white">
                    <span className="text-purple-200/70">Sort:</span>
                    <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                      <SelectTrigger
                        size="sm"
                        className="h-auto border-0 bg-transparent hover:border-0 px-0 py-0 text-white shadow-none focus-visible:ring-0"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                        <SelectItem value="rating" className="hover:bg-purple-500/20">Rating</SelectItem>
                        <SelectItem value="reviews" className="hover:bg-purple-500/20">Reviews</SelectItem>
                        <SelectItem value="name" className="hover:bg-purple-500/20">Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Clinic Cards Grid */}
            {loading ? (
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 text-center">
                <p className="text-white/60 text-lg">Loading clinics...</p>
              </div>
            ) : sortedClinics.length === 0 ? (
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 text-center">
                <p className="text-white/60 text-lg">No clinics found. Be the first to register!</p>
              </div>
            ) : (
              <div
                className={`${
                  viewType === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
                }`}
              >
                {sortedClinics.map((clinic, index) => (
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
              <button className="px-10 py-4 backdrop-blur-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl border border-purple-500/30 transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform duration-300 font-semibold">
                Load More Clinics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

