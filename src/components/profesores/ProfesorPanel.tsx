import { Profesor } from '@/types';
import { useApp } from '@/context/AppContext';
import { User, Building2, GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistorialVisitas } from '@/components/observaciones/HistorialVisitas';
import { FormularioObservacion } from '@/components/observaciones/FormularioObservacion';

interface ProfesorPanelProps {
  profesor: Profesor;
  onBack: () => void;
}

export function ProfesorPanel({ profesor, onBack }: ProfesorPanelProps) {
  const { getVisitasByProfesor, agregarVisita } = useApp();
  const visitas = getVisitasByProfesor(profesor.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={onBack}
        className="text-muted-foreground hover:text-foreground -ml-2"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver a la lista
      </Button>

      {/* Header with Photo */}
      <div className="card-elevated p-6">
        <div className="flex items-center gap-5">
          {profesor.foto ? (
            <img
              src={profesor.foto}
              alt={`${profesor.nombre} ${profesor.apellido}`}
              className="w-20 h-20 rounded-xl object-cover ring-4 ring-accent"
            />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center ring-4 ring-accent text-2xl font-medium text-muted-foreground">
              {profesor.nombre.charAt(0)}{profesor.apellido.charAt(0)}
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {profesor.nombre} {profesor.apellido}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Building2 className="w-4 h-4" />
                {profesor.ie}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <GraduationCap className="w-4 h-4" />
                {profesor.salon}
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <User className="w-4 h-4" />
                {visitas.length} visita{visitas.length !== 1 ? 's' : ''} registrada{visitas.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: History */}
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-4">
            Historial de visitas
          </h3>
          <HistorialVisitas visitas={visitas} />
        </div>

        {/* Right: New Observation */}
        <div>
          <h3 className="font-semibold text-lg text-foreground mb-4">
            Nueva observación
          </h3>
          <FormularioObservacion
            profesor={profesor}
            onGuardar={agregarVisita}
          />
        </div>
      </div>
    </div>
  );
}
