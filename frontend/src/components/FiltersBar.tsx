import { useState } from 'react'
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Search, MapPin, Stethoscope } from 'lucide-react';

interface FiltersBarProps {
  onSearch: (searchTerm: string, location: string, specialization: string) => void;
}

export default function FiltersBar({ onSearch }: FiltersBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');

  const handleSearch = () => {
    const location = selectedLocation === 'all' ? '' : selectedLocation;
    const specialization = selectedSpecialty === 'all' ? '' : selectedSpecialty;
    onSearch(searchQuery, location, specialization);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6b7bb5] w-4 h-4" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white placeholder:text-[#6b7bb5] focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        {/* Location Filter */}
        <div className="md:col-span-1">
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
              <MapPin className="w-4 h-4 text-[#6b7bb5] mr-2" />
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="bucuresti">Bucuresti</SelectItem>
              <SelectItem value="galati">Galati</SelectItem>
              <SelectItem value="cluj">Cluj-Napoca</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specialty Filter */}
        <div className="md:col-span-1">
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
              <Stethoscope className="w-4 h-4 text-[#6b7bb5] mr-2" />
              <SelectValue placeholder="All specialties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              <SelectItem value="cardiology">Cardiology</SelectItem>
              <SelectItem value="dermatology">Dermatology</SelectItem>
              <SelectItem value="gynecology">Gynecology</SelectItem>
              <SelectItem value="internal">Internal Medicine</SelectItem>
              <SelectItem value="orthopedic">Orthopedic Surgery</SelectItem>
              <SelectItem value="pediatrics">Pediatrics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Search Button */}
        <div className="md:col-span-1">
          <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:scale-105 transform duration-200 transition-all" onClick={handleSearch}>
            Search Doctors
          </Button>
        </div>
      </div>

      <p className="text-xs text-[#6b7bb5] mt-4">
        *Results are sorted by patient reviews and ratings
      </p>
    </Card>
  )
}
