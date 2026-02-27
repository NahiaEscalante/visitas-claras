import { Layout } from '@/components/layout/Layout';
import { useApp } from '@/context/AppContext';
import { History, Calendar, Clock, User, TrendingUp, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function getLevelClass(nivel: number): string {
  switch (nivel) {
    case 1: return 'level-i';
    case 2: return 'level-ii';
    case 3: return 'level-iii';
    case 4: return 'level-iv';
    default: return 'bg-muted text-muted-foreground';
  }
}

export default function Historial() {
  const { visitas, getProfesorById } = useApp();

  // Sort by date descending
  const visitasOrdenadas = [...visitas].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <History className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Historial General
            </h1>
          </div>
          <p className="text-muted-foreground">
            Visualiza todas las observaciones realizadas a los docentes.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="card-elevated p-4">
            <p className="text-sm text-muted-foreground">Total visitas</p>
            <p className="text-2xl font-bold text-foreground">{visitas.length}</p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-sm text-muted-foreground">Nivel IV</p>
            <p className="text-2xl font-bold text-emerald-600">
              {visitas.filter((v) => v.nivelLogroTotal === 4).length}
            </p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-sm text-muted-foreground">Nivel III</p>
            <p className="text-2xl font-bold text-yellow-600">
              {visitas.filter((v) => v.nivelLogroTotal === 3).length}
            </p>
          </div>
          <div className="card-elevated p-4">
            <p className="text-sm text-muted-foreground">Por mejorar</p>
            <p className="text-2xl font-bold text-orange-600">
              {visitas.filter((v) => v.nivelLogroTotal <= 2).length}
            </p>
          </div>
        </div>

        {/* Visits List */}
        {visitasOrdenadas.length > 0 ? (
          <div className="space-y-4">
            {visitasOrdenadas.map((visita) => {
              const profesor = getProfesorById(visita.profesorId);
              return (
                <div key={visita.id} className="card-elevated p-5">
                  <div className="flex items-start gap-4">
                    {/* Photo */}
                    {profesor && (profesor.foto ? (
                      <img
                        src={profesor.foto}
                        alt={`${profesor.nombre} ${profesor.apellido}`}
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-border"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center ring-2 ring-border text-sm font-medium text-muted-foreground">
                        {profesor.nombre.charAt(0)}{profesor.apellido.charAt(0)}
                      </div>
                    ))}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {visita.datosDocente.nombreCompleto}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(visita.fecha), "d 'de' MMMM, yyyy", { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {visita.hora}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5" />
                          {visita.datosDocente.ie}
                        </span>
                      </div>

                      {/* Rubrics summary */}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {visita.rubricas.map((rubrica, i) => (
                          <span
                            key={rubrica.id}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              rubrica.nivel === 4 ? 'bg-emerald-100 text-emerald-700' :
                              rubrica.nivel === 3 ? 'bg-yellow-100 text-yellow-700' :
                              rubrica.nivel === 2 ? 'bg-orange-100 text-orange-700' :
                              rubrica.nivel === 1 ? 'bg-red-100 text-red-700' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            R{i + 1}: {rubrica.nivel || '-'}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Level badge */}
                    <div className="flex flex-col items-end gap-1">
                      <span className={`level-badge text-lg w-12 h-12 ${getLevelClass(visita.nivelLogroTotal)}`}>
                        {visita.nivelLogroTotal}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {visita.nivelLogroTotal === 4 ? 'Destacado' :
                         visita.nivelLogroTotal === 3 ? 'Satisfactorio' :
                         visita.nivelLogroTotal === 2 ? 'En proceso' :
                         'En inicio'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card-flat p-12 text-center">
            <History className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
            <p className="text-muted-foreground">No hay visitas registradas aún</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
