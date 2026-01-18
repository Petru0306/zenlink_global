import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Input } from './ui/input';
import { MapPin, RotateCcw, Search, Stethoscope } from 'lucide-react';

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

  const handleReset = () => {
    setSearchQuery('');
    setSelectedLocation('all');
    setSelectedSpecialty('all');
    onSearch('', '', '');
  };

  return (
    <div className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 h-full lg:sticky lg:top-6 animate-fade-in-up">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-widest text-purple-200/70 font-medium mb-2">Filters</p>
            <h3 className="text-white text-2xl font-bold mb-1">Refine doctors</h3>
            <p className="text-sm text-purple-200/60 font-medium">Narrow by name, location, or specialty</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-200/70 hover:text-white hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-xl transition-all duration-300"
            onClick={handleReset}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Search by name</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-300/70 w-4 h-4" />
              <Input
                type="text"
                placeholder="e.g. Dr. John Doe"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 bg-white/5 border-white/10 rounded-xl text-white placeholder:text-purple-200/50 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 transition-all backdrop-blur-sm"
              />
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
                <SelectItem value="bucuresti" className="hover:bg-purple-500/20">Bucuresti</SelectItem>
                <SelectItem value="galati" className="hover:bg-purple-500/20">Galati</SelectItem>
                <SelectItem value="cluj" className="hover:bg-purple-500/20">Cluj-Napoca</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm text-purple-200/70 font-medium uppercase tracking-wide">Specialization</label>
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
                <SelectItem value="dermatology" className="hover:bg-purple-500/20">Dermatology</SelectItem>
                <SelectItem value="gynecology" className="hover:bg-purple-500/20">Gynecology</SelectItem>
                <SelectItem value="internal" className="hover:bg-purple-500/20">Internal Medicine</SelectItem>
                <SelectItem value="orthopedic" className="hover:bg-purple-500/20">Orthopedic Surgery</SelectItem>
                <SelectItem value="pediatrics" className="hover:bg-purple-500/20">Pediatrics</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex flex-wrap gap-2">
              {['cardiology', 'dermatology', 'pediatrics', 'orthopedic'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedSpecialty(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all border ${
                    selectedSpecialty === tag
                      ? 'bg-gradient-to-r from-purple-500/20 to-purple-600/20 border-purple-400/50 text-purple-200 shadow-lg shadow-purple-500/20'
                      : 'bg-white/5 border-white/10 text-purple-200/70 hover:border-purple-500/30 hover:bg-white/10'
                  }`}
                  type="button"
                >
                  {tag.charAt(0).toUpperCase() + tag.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform duration-300 transition-all font-semibold"
              onClick={handleSearch}
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              className="flex-1 bg-white/5 border-white/10 text-purple-200/70 hover:text-white hover:border-purple-500/30 hover:bg-purple-500/10 rounded-xl transition-all duration-300"
              onClick={handleReset}
            >
              Clear
            </Button>
          </div>

          <p className="text-xs text-purple-200/50 font-medium">
            Apply filters to see matching doctors instantly
          </p>
        </div>
      </div>
    </div>
  );
}
