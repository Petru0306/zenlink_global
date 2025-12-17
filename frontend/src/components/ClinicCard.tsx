import { MapPin, Star, Users, CheckCircle2, Phone, Clock, ArrowUpRight } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Clinic } from '../types/clinic';

interface ClinicCardProps extends Clinic {
  onViewClinic?: (clinicId: number) => void;
}

export function ClinicCard({
  id,
  name,
  image,
  location,
  distance,
  rating,
  reviews,
  specialties,
  verified = false,
  patients,
  openHours,
  featured = false,
  onViewClinic,
}: ClinicCardProps) {
  return (
    <div
      className={`bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] rounded-3xl overflow-hidden border border-[#2d4a7c] transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-600/20 transform duration-300 ${
      featured ? 'ring-2 ring-blue-500/50' : ''
    } ${onViewClinic ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b1437]' : ''}`}
      role={onViewClinic ? 'button' : undefined}
      tabIndex={onViewClinic ? 0 : undefined}
      onClick={() => onViewClinic?.(id)}
      onKeyDown={(e) => {
        if (!onViewClinic) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onViewClinic(id);
        }
      }}
    >
      {/* Image */}
      <div className="relative h-52 overflow-hidden group">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b1437] via-transparent to-transparent"></div>
        
        {featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow-lg">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
            Featured
          </div>
        )}
        
        {distance && (
          <div className="absolute top-4 right-4 bg-[#0b1437]/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs border border-white/10">
            {distance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white text-lg">{name}</h3>
              {verified && (
                <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[#a3aed0] text-sm">
              <MapPin className="w-4 h-4" />
              <span>{location}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-[#2d4a7c]">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white">{rating.toFixed(1)}</span>
            <span className="text-[#6b7bb5] text-xs">({reviews})</span>
          </div>
          {patients && (
            <>
              <span className="text-[#2d4a7c]">•</span>
              <div className="flex items-center gap-1.5 text-[#a3aed0] text-sm">
                <Users className="w-4 h-4" />
                <span>{patients.toLocaleString()}+</span>
              </div>
            </>
          )}
        </div>

        {/* Specialties */}
        <div className="flex flex-wrap gap-2 mb-4">
          {specialties.map((specialty, index) => (
            <span
              key={index}
              className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/30"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* Open Hours */}
        {openHours && (
          <div className="flex items-center gap-2 text-[#a3aed0] text-sm mb-5">
            <Clock className="w-4 h-4 text-green-400" />
            <span>{openHours}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => onViewClinic?.(id)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 hover:scale-105 transform duration-200 group"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
          <button
            className="p-3 bg-[#2d4a7c] hover:bg-[#3d5a8c] text-white rounded-xl transition-all hover:scale-110 transform duration-200"
            onClick={(e) => e.stopPropagation()}
            type="button"
          >
            <Phone className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

