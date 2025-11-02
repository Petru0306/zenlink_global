import { Search, MapPin, Filter, Grid3x3, List, ChevronDown } from 'lucide-react';
import { useState } from 'react';

interface SearchFiltersProps {
  onViewChange: (view: 'grid' | 'list') => void;
  currentView: 'grid' | 'list';
  onSearch?: (searchTerm: string, specialty: string, location: string, rating: string) => void;
}

export function SearchFilters({ onViewChange, currentView, onSearch }: SearchFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');

  const handleSearch = () => {
    onSearch?.(searchTerm, selectedSpecialty, selectedLocation, selectedRating);
  };

  return (
    <div className="bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] rounded-2xl p-6 border border-[#2d4a7c] mb-8">
      {/* Main Search Row */}
      <div className="flex gap-4 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6b7bb5]" />
          <input
            type="text"
            placeholder="Search clinics by name, specialty, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b1437] text-white placeholder:text-[#6b7bb5] pl-12 pr-4 py-4 rounded-xl border border-[#2d4a7c] focus:border-blue-500 outline-none transition-all"
          />
        </div>

        {/* Search Button */}
        <button 
          onClick={handleSearch}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-8 py-4 rounded-xl transition-all shadow-lg shadow-blue-500/30"
        >
          Search
        </button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        {/* Filter Dropdowns */}
        <div className="flex gap-3">
          <div className="relative">
            <select 
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="bg-[#0b1437] text-[#a3aed0] pl-4 pr-10 py-2.5 rounded-xl border border-[#2d4a7c] outline-none cursor-pointer appearance-none text-sm"
            >
              <option value="all">All Specialties</option>
              <option value="cardiology">Cardiology</option>
              <option value="pediatrics">Pediatrics</option>
              <option value="orthopedics">Orthopedics</option>
              <option value="neurology">Neurology</option>
              <option value="dermatology">Dermatology</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7bb5] pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="bg-[#0b1437] text-[#a3aed0] pl-4 pr-10 py-2.5 rounded-xl border border-[#2d4a7c] outline-none cursor-pointer appearance-none text-sm"
            >
              <option value="all">All Locations</option>
              <option value="bucharest">Bucharest</option>
              <option value="cluj-napoca">Cluj-Napoca</option>
              <option value="timisoara">Timisoara</option>
              <option value="iasi">Iasi</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7bb5] pointer-events-none" />
          </div>

          <div className="relative">
            <select 
              value={selectedRating}
              onChange={(e) => setSelectedRating(e.target.value)}
              className="bg-[#0b1437] text-[#a3aed0] pl-4 pr-10 py-2.5 rounded-xl border border-[#2d4a7c] outline-none cursor-pointer appearance-none text-sm"
            >
              <option value="all">Any Rating</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4.0">4.0+ Stars</option>
              <option value="3.5">3.5+ Stars</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7bb5] pointer-events-none" />
          </div>

          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 bg-[#0b1437] text-[#a3aed0] px-4 py-2.5 rounded-xl border border-[#2d4a7c] hover:border-blue-500 transition-all text-sm"
          >
            <Filter className="w-4 h-4" />
            More Filters
          </button>
        </div>

        {/* Right Side Options */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <select className="bg-[#0b1437] text-[#a3aed0] pl-4 pr-10 py-2.5 rounded-xl border border-[#2d4a7c] outline-none cursor-pointer appearance-none text-sm">
              <option>Sort by Rating</option>
              <option>Sort by Distance</option>
              <option>Sort by Reviews</option>
              <option>Sort by Name</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7bb5] pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#0b1437] p-1 rounded-xl border border-[#2d4a7c]">
            <button
              onClick={() => onViewChange('grid')}
              className={`p-2 rounded-lg transition-all ${
                currentView === 'grid'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-[#6b7bb5] hover:text-white'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => onViewChange('list')}
              className={`p-2 rounded-lg transition-all ${
                currentView === 'list'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'text-[#6b7bb5] hover:text-white'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="mt-6 pt-6 border-t border-[#2d4a7c] grid grid-cols-3 gap-4">
          <div>
            <label className="text-[#a3aed0] text-sm mb-2 block">Distance Range</label>
            <select className="w-full bg-[#0b1437] text-white px-4 py-2.5 rounded-xl border border-[#2d4a7c] text-sm outline-none">
              <option>Any Distance</option>
              <option>Within 5km</option>
              <option>Within 10km</option>
              <option>Within 20km</option>
            </select>
          </div>
          
          <div>
            <label className="text-[#a3aed0] text-sm mb-2 block">Availability</label>
            <select className="w-full bg-[#0b1437] text-white px-4 py-2.5 rounded-xl border border-[#2d4a7c] text-sm outline-none">
              <option>Any Time</option>
              <option>Open Now</option>
              <option>Open Tomorrow</option>
              <option>Weekend Available</option>
            </select>
          </div>

          <div>
            <label className="text-[#a3aed0] text-sm mb-2 block">Verification Status</label>
            <select className="w-full bg-[#0b1437] text-white px-4 py-2.5 rounded-xl border border-[#2d4a7c] text-sm outline-none">
              <option>All Clinics</option>
              <option>Verified Only</option>
              <option>Featured Only</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

