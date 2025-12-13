import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Profesor } from '@/types';
import { ProfesorCard } from './ProfesorCard';

interface ProfesorSearchProps {
  profesores: Profesor[];
  onSelectProfesor: (profesor: Profesor) => void;
  selectedProfesorId?: string;
}

export function ProfesorSearch({ profesores, onSelectProfesor, selectedProfesorId }: ProfesorSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfesores = profesores.filter((profesor) => {
    const fullName = `${profesor.nombre} ${profesor.apellido}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar profesor por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12 h-12 bg-card border-border text-base"
        />
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {filteredProfesores.length} profesor{filteredProfesores.length !== 1 ? 'es' : ''} encontrado{filteredProfesores.length !== 1 ? 's' : ''}
      </p>

      {/* Professors Grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredProfesores.map((profesor) => (
          <ProfesorCard
            key={profesor.id}
            profesor={profesor}
            onClick={() => onSelectProfesor(profesor)}
            isSelected={profesor.id === selectedProfesorId}
          />
        ))}
      </div>

      {filteredProfesores.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground">No se encontraron profesores</p>
        </div>
      )}
    </div>
  );
}
