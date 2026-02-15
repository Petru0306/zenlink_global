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
import { clinicProfileService, type ClinicProfileResponse } from '../services/clinicProfileService';

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
    console.log('Fetching clinics from backend...');
    Promise.all([
      fetch('http://localhost:8080/api/users/clinics').then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      }),
    ])
      .then(([users]: [User[]]) => {
        console.log('Received clinics:', users);

        // Fetch profiles for all clinics
        const profilePromises = users.map(user =>
          clinicProfileService.getClinicProfile(user.id)
            .then(profile => profile)
            .catch(() => null)
        );

        return Promise.all(profilePromises).then(profiles => {
          // Transform User to Clinic format with profile data
          const transformedClinics: Clinic[] = users.map((user, index) => {
            const profile = profiles[index];
            const specialties = profile?.specialties 
              ? profile.specialties.split(',').map(s => s.trim()).filter(Boolean)
              : [];

            return {
              id: user.id,
              name: profile?.name || `${user.firstName} ${user.lastName} Clinic`,
              image: profile?.bannerImageUrl || profile?.profileImageUrl || '',
              location: profile?.address || 'Location not set',
              distance: '',
              rating: 0,
              reviews: 0,
              specialties: specialties,
              verified: false,
              patients: 0,
              openHours: profile?.openHours || 'Hours not set',
              featured: false,
              description: profile?.description || profile?.about || profile?.tagline || 'Clinic information pending',
              phone: profile?.phone || user.phone || 'Phone not set',
              email: profile?.email || user.email,
              website: profile?.website || '',
              address: profile?.address || 'Address not set',
              doctors: [],
            };
          });
          console.log('Transformed clinics:', transformedClinics);
          setClinics(transformedClinics);
          setLoading(false);
        });
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

      <div className="p-8 pt-32 space-y-6 relative z-10">
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
                className={`${viewType === 'grid'
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
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-white/10 bg-[hsl(240,10%,6%)]/50 px-6 py-12 mt-12">
        <div className="max-w-[75rem] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Product</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Roadmap</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Company</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Press</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Resources</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">API</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-[hsl(220,12%,98%)]">Legal</h4>
              <ul className="space-y-2 text-[hsl(220,12%,85%)]">
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">HIPAA</a></li>
                <li><a href="#" className="hover:text-[hsl(220,12%,98%)] transition-colors">Compliance</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-400"></div>
              <span className="text-[hsl(220,12%,98%)]">ZenLink</span>
            </div>
            <p className="text-[hsl(220,12%,65%)] text-sm">© 2025 ZenLink. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

