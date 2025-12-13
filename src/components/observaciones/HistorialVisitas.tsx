import { Visita } from '@/types';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface HistorialVisitasProps {
  visitas: Visita[];
}

function getLevelClass(nivel: number): string {
  switch (nivel) {
    case 1: return 'level-i';
    case 2: return 'level-ii';
    case 3: return 'level-iii';
    case 4: return 'level-iv';
    default: return 'bg-muted text-muted-foreground';
  }
}

function getLevelText(nivel: number): string {
  switch (nivel) {
    case 1: return 'Nivel I - En inicio';
    case 2: return 'Nivel II - En proceso';
    case 3: return 'Nivel III - Satisfactorio';
    case 4: return 'Nivel IV - Destacado';
    default: return 'Sin evaluar';
  }
}

export function HistorialVisitas({ visitas }: HistorialVisitasProps) {
  // Group visits by year
  const visitasByYear = visitas.reduce((acc, visita) => {
    const year = new Date(visita.fecha).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(visita);
    return acc;
  }, {} as Record<number, Visita[]>);

  const years = Object.keys(visitasByYear).map(Number).sort((a, b) => b - a);

  if (visitas.length === 0) {
    return (
      <div className="card-flat p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No hay visitas registradas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year} className="card-flat p-5">
          <h4 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {year}
          </h4>
          <div className="space-y-3">
            {visitasByYear[year]
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .map((visita, index) => (
                <div
                  key={visita.id}
                  className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                >
                  {/* Index */}
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-sm font-medium text-accent-foreground">
                      {visitasByYear[year].length - index}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      Visita {visitasByYear[year].length - index}
                    </p>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(visita.fecha), "d 'de' MMMM", { locale: es })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {visita.hora}
                      </span>
                    </div>
                  </div>

                  {/* Level Badge */}
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className={`level-badge ${getLevelClass(visita.nivelLogroTotal)}`}>
                      {visita.nivelLogroTotal}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
