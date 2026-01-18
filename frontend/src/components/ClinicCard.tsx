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
      className={`relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl overflow-hidden border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.03] hover:border-purple-500/30 ${
      featured ? 'ring-2 ring-purple-500/50' : ''
    } ${onViewClinic ? 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black' : ''}`}
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
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      
      {/* Image */}
      <div className="relative z-10 h-52 overflow-hidden group/image">
        <ImageWithFallback
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover/image:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        
        {featured && (
          <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xl shadow-purple-500/50 border border-purple-400/50">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/50"></span>
            Featured
          </div>
        )}
        
        {distance && (
          <div className="absolute top-4 right-4 backdrop-blur-xl bg-black/60 border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-medium">
            {distance}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-white text-xl font-bold">{name}</h3>
              {verified && (
                <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-purple-200/70 text-sm font-medium">
              <MapPin className="w-4 h-4 text-purple-300" />
              <span>{location}</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-white font-bold">{rating.toFixed(1)}</span>
            <span className="text-purple-200/60 text-xs">({reviews})</span>
          </div>
          {patients && (
            <>
              <span className="text-purple-400/40">•</span>
              <div className="flex items-center gap-1.5 text-purple-200/70 text-sm font-medium">
                <Users className="w-4 h-4 text-purple-300" />
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
              className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 px-3 py-1 rounded-full text-xs font-medium border border-purple-500/30 shadow-lg shadow-purple-500/20"
            >
              {specialty}
            </span>
          ))}
        </div>

        {/* Open Hours */}
        {openHours && (
          <div className="flex items-center gap-2 text-purple-200/70 text-sm mb-5 font-medium">
            <Clock className="w-4 h-4 text-green-400" />
            <span>{openHours}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button 
            onClick={() => onViewClinic?.(id)}
            className="flex-1 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:scale-105 transform duration-300 group font-semibold"
          >
            <span>View Details</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
          <button
            className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-purple-600/30 text-purple-200 rounded-xl transition-all hover:scale-110 transform duration-300 shadow-lg shadow-purple-500/20"
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

