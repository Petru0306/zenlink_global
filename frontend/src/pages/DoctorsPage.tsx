import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FiltersBar from '../components/FiltersBar'
import { DoctorCard } from '../components/DoctorCard'
import { StatsGrid } from '../components/StatsGrid'
import { Button } from '../components/ui/button'
import type { Doctor } from '../types/doctor'

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

  const navigate = useNavigate()

  const handleViewDoctor = (doctorId: number) => {
    navigate(`/doctor/${doctorId}`);
  };

  return (
    <div className="min-h-screen bg-[#0b1437]">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-white text-4xl mb-2 font-semibold">Find a Doctor</h1>
          <p className="text-[#a3aed0]">
            Browse our network of {doctors.length} medical professionals
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
        {loading ? (
          <div className="text-white text-center py-12">Loading doctors...</div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-white text-center py-12">No doctors found. Be the first to register!</div>
        ) : (
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
        )}

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
