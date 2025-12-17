import { useState } from 'react';
import { Search, MapPin, Grid3x3, List, Stethoscope, Star, RotateCcw } from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

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

  const handleReset = () => {
    setSearchTerm('');
    setSelectedSpecialty('all');
    setSelectedLocation('all');
    setSelectedRating('all');
    setShowAdvanced(false);
    onSearch?.('', 'all', 'all', 'all');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] rounded-2xl border border-[#2d4a7c] mb-2 shadow-lg h-full lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6b7bb5]">Filters</p>
          <h3 className="text-white text-xl font-semibold">Refine clinics</h3>
          <p className="text-sm text-[#6b7bb5]">Combine filters to narrow your search</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#a3aed0] hover:text-white hover:bg-white/5"
          onClick={handleReset}
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-[#a3aed0]">Search clinics</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7bb5]" />
            <Input
              type="text"
              placeholder="Name, specialty, or location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-[#0b1437] text-white placeholder:text-[#6b7bb5] rounded-xl border-[#2d4a7c] focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#a3aed0]">Specialty</label>
          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#6b7bb5]" />
                <SelectValue placeholder="All specialties" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All specialties</SelectItem>
              <SelectItem value="cardiology">Cardiology</SelectItem>
              <SelectItem value="pediatrics">Pediatrics</SelectItem>
              <SelectItem value="orthopedics">Orthopedics</SelectItem>
              <SelectItem value="neurology">Neurology</SelectItem>
              <SelectItem value="dermatology">Dermatology</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {['cardiology', 'pediatrics', 'orthopedics', 'dermatology'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedSpecialty(tag)}
                className={`rounded-full px-3 py-1 text-xs transition-all border ${
                  selectedSpecialty === tag
                    ? 'bg-blue-500/10 border-blue-400 text-blue-200'
                    : 'bg-[#0b1437] border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500'
                }`}
              >
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#a3aed0]">Location</label>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#6b7bb5]" />
                <SelectValue placeholder="All locations" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              <SelectItem value="bucharest">Bucharest</SelectItem>
              <SelectItem value="cluj-napoca">Cluj-Napoca</SelectItem>
              <SelectItem value="timisoara">Timisoara</SelectItem>
              <SelectItem value="iasi">Iasi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-[#a3aed0]">Minimum rating</label>
          <Select value={selectedRating} onValueChange={setSelectedRating}>
            <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#f2c94c]" />
                <SelectValue placeholder="Any rating" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any rating</SelectItem>
              <SelectItem value="4.5">4.5+ Stars</SelectItem>
              <SelectItem value="4.0">4.0+ Stars</SelectItem>
              <SelectItem value="3.5">3.5+ Stars</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
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

          <div className="flex gap-2">
            <Button
              className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:scale-105 transition-all"
              onClick={handleSearch}
              type="button"
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="bg-[#0b1437] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 rounded-xl"
              onClick={handleReset}
              type="button"
            >
              Clear
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full text-sm text-[#a3aed0] hover:text-white flex items-center justify-center gap-2 bg-[#0b1437] border border-[#2d4a7c] rounded-xl py-2 transition-all"
        >
          {showAdvanced ? 'Hide extra filters' : 'Show extra filters'}
        </button>

        {showAdvanced && (
          <div className="pt-4 border-t border-[#2d4a7c] space-y-3">
            <div>
              <label className="text-sm text-[#a3aed0] mb-2 block">Distance range</label>
              <Select defaultValue="any">
                <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
                  <SelectValue placeholder="Any distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any distance</SelectItem>
                  <SelectItem value="5">Within 5km</SelectItem>
                  <SelectItem value="10">Within 10km</SelectItem>
                  <SelectItem value="20">Within 20km</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm text-[#a3aed0] mb-2 block">Availability</label>
              <Select defaultValue="any">
                <SelectTrigger className="bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white hover:border-blue-500 transition-all">
                  <SelectValue placeholder="Any time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any time</SelectItem>
                  <SelectItem value="now">Open now</SelectItem>
                  <SelectItem value="tomorrow">Open tomorrow</SelectItem>
                  <SelectItem value="weekend">Weekend available</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
