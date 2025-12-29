import { Button } from './ui/button';
import { Star, MapPin, Eye, Building2 } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import type { Doctor } from '../types/doctor';

interface DoctorCardProps {
  doctor: Doctor;
  onViewDoctor: (doctorId: number) => void;
}

export function DoctorCard({ doctor, onViewDoctor }: DoctorCardProps) {
  return (
    <div 
      className="relative group backdrop-blur-xl bg-gradient-to-br from-white/5 via-white/3 to-transparent rounded-3xl p-6 border border-white/10 shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:scale-[1.02] hover:border-purple-500/30 cursor-pointer animate-fade-in-up"
      onClick={() => onViewDoctor(doctor.id)}
    >
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
      <div className="relative z-10 flex flex-col md:flex-row gap-6">
        {/* Doctor Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-2 border-purple-400/50 hover:border-purple-300/70 transition-all duration-300 group shadow-lg shadow-purple-500/20">
            {doctor.imageUrl ? (
              <ImageWithFallback
                src={doctor.imageUrl}
                alt={doctor.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center">
                <Eye className="w-12 h-12 text-purple-200" />
              </div>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex-1 space-y-3">
          {/* Name and Specialty */}
          <div>
            <h3 className="text-white font-bold text-xl">{doctor.name}</h3>
            <p className="text-purple-300 mt-1 font-medium">{doctor.specialization}</p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 transition-all ${
                    i < Math.floor(doctor.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>
            <span className="text-white font-bold">{doctor.rating}</span>
            <span className="text-purple-200/60">({doctor.reviewsCount} reviews)</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-2 text-purple-200/70">
            <Eye className="w-4 h-4" />
            <span className="text-sm font-medium">{doctor.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="flex-1 space-y-3">
          {/* Clinic Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-500/20 to-purple-600/20 text-purple-200 px-4 py-2 rounded-xl text-sm font-semibold border border-purple-500/30 shadow-lg shadow-purple-500/20">
            <Building2 className="w-4 h-4" />
            {doctor.clinic}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-purple-200/70">
            <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-purple-300" />
            <span className="text-sm font-medium">{doctor.fullAddress}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center">
          <Button 
            className="bg-gradient-to-r from-purple-600 via-purple-500 to-purple-600 hover:from-purple-500 hover:via-purple-400 hover:to-purple-500 text-white rounded-xl px-6 shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 whitespace-nowrap transition-all duration-300 hover:scale-105 transform font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              onViewDoctor(doctor.id);
            }}
          >
            View Profile →
          </Button>
        </div>
      </div>
    </div>
  );
}
