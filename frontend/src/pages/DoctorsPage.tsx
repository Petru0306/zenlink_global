import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FiltersBar from '../components/FiltersBar'
import { DoctorCard } from '../components/DoctorCard'
import { StatsGrid } from '../components/StatsGrid'
import { Button } from '../components/ui/button'
import { mockDoctors } from '../data/mockData'

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
