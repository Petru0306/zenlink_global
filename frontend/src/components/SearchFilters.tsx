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
    <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 mb-2 h-full lg:sticky lg:top-6 animate-fade-in-up">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-200/70 font-medium mb-2">Filters</p>
            <h3 className="text-white text-2xl font-bold mb-1">Refine clinics</h3>
            <p className="text-sm text-purple-200/60 font-medium">Combine filters to narrow your search</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-200/70 hover:text-white hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all duration-300"
            onClick={handleReset}
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Search clinics</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-300/70" />
              <Input
                type="text"
                placeholder="Name, specialty, or location"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white/5 text-white placeholder:text-purple-200/50 rounded-xl border-white/10 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Specialty</label>
            <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white hover:border-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-purple-300" />
                  <SelectValue placeholder="All specialties" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                <SelectItem value="all" className="hover:bg-purple-500/20">All specialties</SelectItem>
                <SelectItem value="cardiology" className="hover:bg-purple-500/20">Cardiology</SelectItem>
                <SelectItem value="pediatrics" className="hover:bg-purple-500/20">Pediatrics</SelectItem>
                <SelectItem value="orthopedics" className="hover:bg-purple-500/20">Orthopedics</SelectItem>
                <SelectItem value="neurology" className="hover:bg-purple-500/20">Neurology</SelectItem>
                <SelectItem value="dermatology" className="hover:bg-purple-500/20">Dermatology</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {['cardiology', 'pediatrics', 'orthopedics', 'dermatology'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedSpecialty(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                    selectedSpecialty === tag
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-purple-200/70 hover:border-purple-500/30 hover:bg-white/10'
                  }`}
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Location</label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white hover:border-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-purple-300" />
                  <SelectValue placeholder="All locations" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                <SelectItem value="all" className="hover:bg-purple-500/20">All locations</SelectItem>
                <SelectItem value="bucharest" className="hover:bg-purple-500/20">Bucharest</SelectItem>
                <SelectItem value="cluj-napoca" className="hover:bg-purple-500/20">Cluj-Napoca</SelectItem>
                <SelectItem value="timisoara" className="hover:bg-purple-500/20">Timisoara</SelectItem>
                <SelectItem value="iasi" className="hover:bg-purple-500/20">Iasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Minimum rating</label>
            <Select value={selectedRating} onValueChange={setSelectedRating}>
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white hover:border-purple-500/50 focus:border-purple-500/50 transition-all backdrop-blur-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <SelectValue placeholder="Any rating" />
                </div>
              </SelectTrigger>
              <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                <SelectItem value="all" className="hover:bg-purple-500/20">Any rating</SelectItem>
                <SelectItem value="4.5" className="hover:bg-purple-500/20">4.5+ Stars</SelectItem>
                <SelectItem value="4.0" className="hover:bg-purple-500/20">4.0+ Stars</SelectItem>
                <SelectItem value="3.5" className="hover:bg-purple-500/20">3.5+ Stars</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => onViewChange('grid')}
                className={`p-2 rounded-lg transition-all ${
                  currentView === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={`p-2 rounded-lg transition-all ${
                  currentView === 'list'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-purple-200/70 hover:text-white hover:bg-white/10'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              <Button
                className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transition-all font-semibold"
                onClick={handleSearch}
                type="button"
              >
                Apply filters
              </Button>
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 rounded-xl transition-all duration-300"
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
            className="w-full text-sm text-purple-200/70 hover:text-white flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-purple-500/30 rounded-xl py-2 transition-all duration-300 font-medium"
          >
            {showAdvanced ? 'Hide extra filters' : 'Show extra filters'}
          </button>

          {showAdvanced && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div>
                <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide mb-2 block">Distance range</label>
                <Select defaultValue="any">
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white hover:border-purple-500/50 transition-all backdrop-blur-sm">
                    <SelectValue placeholder="Any distance" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                    <SelectItem value="any" className="hover:bg-purple-500/20">Any distance</SelectItem>
                    <SelectItem value="5" className="hover:bg-purple-500/20">Within 5km</SelectItem>
                    <SelectItem value="10" className="hover:bg-purple-500/20">Within 10km</SelectItem>
                    <SelectItem value="20" className="hover:bg-purple-500/20">Within 20km</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide mb-2 block">Availability</label>
                <Select defaultValue="any">
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl text-white hover:border-purple-500/50 transition-all backdrop-blur-sm">
                    <SelectValue placeholder="Any time" />
                  </SelectTrigger>
                  <SelectContent className="bg-black/90 backdrop-blur-xl text-white border-purple-500/30">
                    <SelectItem value="any" className="hover:bg-purple-500/20">Any time</SelectItem>
                    <SelectItem value="now" className="hover:bg-purple-500/20">Open now</SelectItem>
                    <SelectItem value="tomorrow" className="hover:bg-purple-500/20">Open tomorrow</SelectItem>
                    <SelectItem value="weekend" className="hover:bg-purple-500/20">Weekend available</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
