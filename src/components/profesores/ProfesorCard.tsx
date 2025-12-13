import { Profesor } from '@/types';
import { User, Building2, GraduationCap } from 'lucide-react';

interface ProfesorCardProps {
  profesor: Profesor;
  onClick: () => void;
  isSelected?: boolean;
}

export function ProfesorCard({ profesor, onClick, isSelected }: ProfesorCardProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full card-elevated p-4 text-left transition-all duration-200 hover:shadow-elevated ${
        isSelected ? 'ring-2 ring-primary bg-accent/30' : ''
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Photo */}
        <div className="relative">
          <img
            src={profesor.foto}
            alt={`${profesor.nombre} ${profesor.apellido}`}
            className="w-14 h-14 rounded-full object-cover ring-2 ring-border"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
            <User className="w-3 h-3 text-success-foreground" />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {profesor.nombre} {profesor.apellido}
          </h3>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="w-3.5 h-3.5" />
              {profesor.ie}
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <GraduationCap className="w-3.5 h-3.5" />
              {profesor.salon}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <svg
          className="w-5 h-5 text-muted-foreground"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}
