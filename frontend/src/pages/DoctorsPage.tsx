import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FiltersBar from '../components/FiltersBar';
import { DoctorCard } from '../components/DoctorCard';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import type { Doctor } from '../types/doctor';

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'reviews' | 'name'>('rating');

  useEffect(() => {
    // Fetch real doctors from backend
    console.log('Fetching doctors from backend...');
    fetch('http://localhost:8080/api/users/doctors')
      .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((users: User[]) => {
        console.log('Received doctors:', users);
        // Transform User to Doctor format
        const transformedDoctors: Doctor[] = users.map(user => ({
          id: user.id,
          name: `Dr. ${user.firstName} ${user.lastName}`,
          specialization: 'General Medicine', // Default until profile is completed
          rating: 0,
          reviewsCount: 0,
          views: 0,
          location: 'Location not set',
          fullAddress: user.phone || 'Address not set',
          clinic: 'Clinic not set',
          clinicId: 0,
          imageUrl: undefined,
          bio: 'Profile information pending',
          education: [],
          experience: '',
          languages: [],
          consultationFee: 0,
        }));
        console.log('Transformed doctors:', transformedDoctors);
        setDoctors(transformedDoctors);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching doctors:', err);
        setLoading(false);
      });
  }, []);

  const handleSearch = (search: string, location: string, specialization: string) => {
    setSearchTerm(search.toLowerCase());
    setLocationFilter(location.toLowerCase());
    setSpecializationFilter(specialization.toLowerCase());
  };

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch = !searchTerm || doctor.name.toLowerCase().includes(searchTerm);
      const matchesLocation = !locationFilter || doctor.location.toLowerCase().includes(locationFilter);
      const matchesSpecialization = !specializationFilter || doctor.specialization.toLowerCase().includes(specializationFilter);
      
      return matchesSearch && matchesLocation && matchesSpecialization;
    });
  }, [doctors, searchTerm, locationFilter, specializationFilter]);

  const sortedDoctors = useMemo(() => {
    const decorated = filteredDoctors.map((doctor, idx) => ({ doctor, idx }));
    decorated.sort((a, b) => {
      if (sortBy === 'rating') {
        const diff = (b.doctor.rating ?? 0) - (a.doctor.rating ?? 0);
        return diff !== 0 ? diff : a.idx - b.idx;
      }
      if (sortBy === 'reviews') {
        const diff = (b.doctor.reviewsCount ?? 0) - (a.doctor.reviewsCount ?? 0);
        return diff !== 0 ? diff : a.idx - b.idx;
      }
      // name A -> Z
      const nameDiff = a.doctor.name.localeCompare(b.doctor.name, undefined, { sensitivity: 'base' });
      return nameDiff !== 0 ? nameDiff : a.idx - b.idx;
    });
    return decorated.map((x) => x.doctor);
  }, [filteredDoctors, sortBy]);

  const navigate = useNavigate();

  const handleViewDoctor = (doctorId: number) => {
    navigate(`/doctor/${doctorId}`);
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
            Find a Doctor
          </h1>
          <p className="text-white/60 text-lg font-light tracking-wide">
            Browse our network of {doctors.length} medical professionals
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 items-start">
          <FiltersBar onSearch={handleSearch} />

          <div className="space-y-6">
            {/* Results Header */}
            <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.01] hover:border-purple-500/30 animate-fade-in-up">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-white">
                  Showing <span className="text-purple-300 font-bold text-lg">{sortedDoctors.length}</span> doctors
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-sm text-purple-200/70 bg-white/5 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50" />
                    Updated in real-time
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

            {/* Doctor Cards */}
            {loading ? (
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 text-center">
                <p className="text-white/60 text-lg">Loading doctors...</p>
              </div>
            ) : sortedDoctors.length === 0 ? (
              <div className="relative backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-12 border border-white/10 text-center">
                <p className="text-white/60 text-lg">No doctors found. Be the first to register!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDoctors.map((doctor, index) => (
                  <div
                    key={doctor.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <DoctorCard doctor={doctor} onViewDoctor={handleViewDoctor} />
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            <div className="flex justify-center pt-4">
              <button className="px-10 py-4 backdrop-blur-xl bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl border border-purple-500/30 transition-all shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform duration-300 font-semibold">
                Load More Doctors
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
