import { useState } from 'react';
import { Profesor } from '@/types';
import { useApp } from '@/context/AppContext';
import { User, Building2, GraduationCap, ArrowLeft, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HistorialVisitas } from '@/components/observaciones/HistorialVisitas';
import { FormularioObservacion } from '@/components/observaciones/FormularioObservacion';

interface ProfesorPanelProps {
  profesor: Profesor;
  onBack: () => void;
}

export function ProfesorPanel({ profesor, onBack }: ProfesorPanelProps) {
  const { agregarVisita } = useApp();
  const [enFocoObservacion, setEnFocoObservacion] = useState(false);

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
          <img
            src={profesor.foto}
            alt={`${profesor.nombre} ${profesor.apellido}`}
            className="w-20 h-20 rounded-xl object-cover ring-4 ring-accent"
          />
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
            </div>
          </div>
        </div>
      </div>

      {/* Layout dependiente de si hay observación en foco */}
      {!enFocoObservacion ? (
        <div className="grid lg:grid-cols-[minmax(0,0.38fr)_minmax(0,0.62fr)] gap-6">
          {/* Left: History */}
          <div className="min-h-[320px] max-h-[70vh] overflow-y-auto pr-1">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              Historial de evaluaciones
            </h3>
            <HistorialVisitas profesorId={profesor.id} />
          </div>

          {/* Right: Add Visit Button */}
          <div className="min-h-[320px] flex flex-col items-start">
            <h3 className="font-semibold text-lg text-foreground mb-4">
              Nueva observación
            </h3>
            <button
              onClick={() => setEnFocoObservacion(true)}
              className="w-full p-6 rounded-xl border-2 border-dashed border-primary/40 hover:border-primary hover:bg-primary/5 transition-all text-left bg-card"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="font-semibold text-foreground text-lg">Agregar visita</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Crea una nueva observación completando el formulario manualmente o usando IA.
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4 max-w-4xl mx-auto min-h-[320px] max-h-[80vh] overflow-y-auto pr-1">
          <h3 className="font-semibold text-lg text-foreground mb-4">
            Nueva observación
          </h3>
          <FormularioObservacion
            profesor={profesor}
            onGuardar={agregarVisita}
            onFocusChange={setEnFocoObservacion}
          />
        </div>
      )}
    </div>
  );
}
