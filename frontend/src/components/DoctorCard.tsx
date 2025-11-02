import { Card } from './ui/card';
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
    <Card className="p-6 bg-gradient-to-br from-[#1a2f5c] to-[#0f1f3d] border-[#2d4a7c] rounded-3xl shadow-lg hover:shadow-2xl hover:shadow-blue-600/20 transition-all hover:border-blue-500/50 hover:scale-[1.01] cursor-pointer transform duration-300" onClick={() => onViewDoctor(doctor.id)}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Doctor Image */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 rounded-2xl overflow-hidden bg-[#2d4a7c] ring-2 ring-[#2d4a7c]/50 hover:ring-blue-500/50 transition-all duration-300 group">
            {doctor.imageUrl ? (
              <ImageWithFallback
                src={doctor.imageUrl}
                alt={doctor.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-[#2d4a7c] flex items-center justify-center">
                <Eye className="w-12 h-12 text-[#6b7bb5]" />
              </div>
            )}
          </div>
        </div>

        {/* Doctor Info */}
        <div className="flex-1 space-y-3">
          {/* Name and Specialty */}
          <div>
            <h3 className="text-white font-semibold text-lg">{doctor.name}</h3>
            <p className="text-blue-400 mt-1">{doctor.specialization}</p>
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
                      : 'text-[#2d4a7c]'
                  }`}
                />
              ))}
            </div>
            <span className="text-white font-semibold">{doctor.rating}</span>
            <span className="text-[#6b7bb5]">({doctor.reviewsCount} reviews)</span>
          </div>

          {/* Views */}
          <div className="flex items-center gap-2 text-[#a3aed0]">
            <Eye className="w-4 h-4" />
            <span className="text-sm">{doctor.views.toLocaleString()} views</span>
          </div>
        </div>

        {/* Clinic Info */}
        <div className="flex-1 space-y-3">
          {/* Clinic Badge */}
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm shadow-lg shadow-blue-500/20">
            <Building2 className="w-4 h-4" />
            {doctor.clinic}
          </div>

          {/* Location */}
          <div className="flex items-start gap-2 text-[#a3aed0]">
            <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
            <span className="text-sm">{doctor.fullAddress}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center">
          <Button 
            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl px-6 shadow-lg shadow-blue-500/30 whitespace-nowrap transition-all hover:scale-105 transform duration-200"
            onClick={(e) => {
              e.stopPropagation();
              onViewDoctor(doctor.id);
            }}
          >
            View Profile →
          </Button>
        </div>
      </div>
    </Card>
  );
}
