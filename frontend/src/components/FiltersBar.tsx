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
    <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-2xl shadow-lg transition-all duration-300 h-full lg:sticky lg:top-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6b7bb5]">Filters</p>
          <h3 className="text-white text-xl font-semibold">Refine doctors</h3>
          <p className="text-sm text-[#6b7bb5]">Narrow by name, location, or specialty</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-[#a3aed0] hover:text-white hover:bg-white/5"
          onClick={handleReset}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm text-[#a3aed0]">Search by name</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7bb5] w-4 h-4" />
            <Input
              type="text"
              placeholder="e.g. Dr. John Doe"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10 bg-[#0b1437] border-[#2d4a7c] rounded-xl text-white placeholder:text-[#6b7bb5] focus:border-blue-500 transition-all"
            />
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
              <SelectItem value="bucuresti">Bucuresti</SelectItem>
              <SelectItem value="galati">Galati</SelectItem>
              <SelectItem value="cluj">Cluj-Napoca</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-[#a3aed0]">Specialization</label>
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
              <SelectItem value="dermatology">Dermatology</SelectItem>
              <SelectItem value="gynecology">Gynecology</SelectItem>
              <SelectItem value="internal">Internal Medicine</SelectItem>
              <SelectItem value="orthopedic">Orthopedic Surgery</SelectItem>
              <SelectItem value="pediatrics">Pediatrics</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex flex-wrap gap-2">
            {['cardiology', 'dermatology', 'pediatrics', 'orthopedic'].map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedSpecialty(tag)}
                className={`rounded-full px-3 py-1 text-xs transition-all border ${
                  selectedSpecialty === tag
                    ? 'bg-blue-500/10 border-blue-400 text-blue-200'
                    : 'bg-[#0b1437] border-[#2d4a7c] text-[#a3aed0] hover:border-blue-500'
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
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:scale-105 transform duration-200 transition-all"
            onClick={handleSearch}
          >
            Apply filters
          </Button>
          <Button
            variant="outline"
            className="flex-1 bg-[#0b1437] border-[#2d4a7c] text-[#a3aed0] hover:text-white hover:border-blue-500 rounded-xl"
            onClick={handleReset}
          >
            Clear
          </Button>
        </div>

        <p className="text-xs text-[#6b7bb5]">
          Apply filters to see matching doctors instantly
        </p>
      </div>
    </Card>
  );
}
