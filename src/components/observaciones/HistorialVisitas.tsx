import { useState, useEffect } from 'react';
import { Evaluacion, EvaluacionRubrica } from '@/types';
import { Calendar, Clock, TrendingUp, ChevronDown, ChevronUp, Eye, ArrowLeft, Loader2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isApiModeEnabled } from '@/api/config';
import { apiGetEvaluacionesByProfesor } from '@/api/endpoints';
import { rubricasTemplate } from '@/data/mockData';

interface HistorialVisitasProps {
  profesorId: string;
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
    case 1: return 'Nivel I — En inicio';
    case 2: return 'Nivel II — En proceso';
    case 3: return 'Nivel III — Satisfactorio';
    case 4: return 'Nivel IV — Destacado';
    default: return 'Sin evaluar';
  }
}

function calcularNivelPromedio(rubricas: EvaluacionRubrica[]): number {
  const validos = rubricas.filter(r => r.nivel !== null && r.nivel !== undefined);
  if (validos.length === 0) return 0;
  return Math.round(validos.reduce((sum, r) => sum + (r.nivel ?? 0), 0) / validos.length);
}

/** Obtiene el nombre de la rúbrica del template por rubricaId */
function getRubricaNombre(rubricaId: string): string {
  const t = rubricasTemplate.find(rt => rt.id === rubricaId);
  return t?.nombre ?? rubricaId;
}

// ─── Vista detalle de evaluación (solo lectura) ──────────────────────

function EvaluacionDetalle({
  evaluacion,
  onBack,
}: {
  evaluacion: Evaluacion;
  onBack: () => void;
}) {
  const [seccionDatos, setSeccionDatos] = useState(true);
  const [seccionRubricas, setSeccionRubricas] = useState(true);
  const d = evaluacion.datosDocente;
  const nivel = evaluacion.puntajeTotal
    ? Math.round(evaluacion.puntajeTotal / Math.max(evaluacion.rubricas.length, 1))
    : calcularNivelPromedio(evaluacion.rubricas);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al historial
      </button>

      {/* Header */}
      <div className="card-elevated p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-foreground text-lg">
                Evaluación del {d.fechaVisita
                  ? format(new Date(d.fechaVisita + 'T12:00:00'), "d 'de' MMMM 'de' yyyy", { locale: es })
                  : '—'}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {d.horaInicio} — {d.horaFin} · {evaluacion.estado === 'confirmed' ? '✅ Confirmada' : '📝 Borrador'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`level-badge ${getLevelClass(nivel)}`}>
                {nivel}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{getLevelText(nivel)}</span>
          </div>
        </div>
      </div>

      {/* Sección 1 — Datos del docente (solo lectura) */}
      <div className="card-flat">
        <button
          onClick={() => setSeccionDatos(!seccionDatos)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h5 className="font-semibold text-foreground">Sección 1 — Datos del docente</h5>
          {seccionDatos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {seccionDatos && (
          <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3">
            {[
              ['Nombre completo', d.nombreCompleto],
              ['DNI', d.dni],
              ['Cargo laboral', d.cargoLaboral],
              ['Especialidad', d.especialidad],
              ['I.E.', d.ie],
              ['Nivel educativo', d.nivelEducativo],
              ['Grado', d.grado],
              ['Sección', d.seccion],
              ['Áreas curriculares', d.areasCurriculares],
              ['Fecha de visita', d.fechaVisita],
              ['Hora inicio', d.horaInicio],
              ['Hora fin', d.horaFin],
            ].map(([label, value]) => (
              <div key={label} className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-medium text-foreground">{value || '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sección 2 — Rúbricas (solo lectura) */}
      <div className="card-flat">
        <button
          onClick={() => setSeccionRubricas(!seccionRubricas)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <h5 className="font-semibold text-foreground">Sección 2 — Rúbricas</h5>
          {seccionRubricas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {seccionRubricas && (
          <div className="px-4 pb-4 space-y-4">
            {evaluacion.rubricas.map((rubrica, i) => (
              <div key={rubrica.id} className="bg-muted/30 rounded-xl p-4">
                <p className="font-medium text-foreground mb-3">
                  {i + 1}. {getRubricaNombre(rubrica.rubricaId)}
                </p>

                {/* Nivel - botones de solo lectura */}
                <p className="text-xs text-muted-foreground mb-2">Nivel de logro</p>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {([1, 2, 3, 4] as const).map((n) => (
                    <div
                      key={n}
                      className={`text-center py-2.5 px-2 rounded-lg border text-sm transition-colors ${
                        rubrica.nivel === n
                          ? `${getLevelClass(n)} font-semibold`
                          : 'border-border bg-card text-muted-foreground'
                      }`}
                    >
                      <div className="font-bold">{'I'.repeat(n)}</div>
                      <div className="text-xs mt-0.5">
                        {n === 1 ? 'En inicio' : n === 2 ? 'En proceso' : n === 3 ? 'Satisfactorio' : 'Destacado'}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Observaciones */}
                {rubrica.observaciones && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Observaciones</p>
                    <div className="bg-card border border-border rounded-lg p-3 text-sm text-foreground">
                      {rubrica.observaciones}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Observación general */}
      {evaluacion.observacionGeneral && (
        <div className="card-flat p-4">
          <h5 className="font-semibold text-foreground mb-2">Observación general</h5>
          <p className="text-sm text-muted-foreground">{evaluacion.observacionGeneral}</p>
        </div>
      )}

      {/* Sugerencias de mejora */}
      {evaluacion.sugerenciasMejora && evaluacion.sugerenciasMejora.length > 0 && (
        <div className="card-flat p-4">
          <h5 className="font-semibold text-foreground mb-2">Sugerencias de mejora</h5>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            {evaluacion.sugerenciasMejora.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────

export function HistorialVisitas({ profesorId }: HistorialVisitasProps) {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEval, setSelectedEval] = useState<Evaluacion | null>(null);

  useEffect(() => {
    if (!isApiModeEnabled()) return; // Mock no tiene este endpoint

    const fetchEvaluaciones = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await apiGetEvaluacionesByProfesor(profesorId, 'confirmed');
        setEvaluaciones(data);
      } catch (err) {
        console.error('Error al cargar evaluaciones:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar historial');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluaciones();
  }, [profesorId]);

  // ─── Vista detalle ───
  if (selectedEval) {
    return <EvaluacionDetalle evaluacion={selectedEval} onBack={() => setSelectedEval(null)} />;
  }

  // ─── Estados vacíos ───
  if (isLoading) {
    return (
      <div className="card-flat p-8 text-center">
        <Loader2 className="w-8 h-8 text-primary mx-auto mb-3 animate-spin" />
        <p className="text-muted-foreground">Cargando historial...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card-flat p-8 text-center">
        <p className="text-destructive mb-2">{error}</p>
        <p className="text-sm text-muted-foreground">Intenta recargar la página</p>
      </div>
    );
  }

  if (!isApiModeEnabled() || evaluaciones.length === 0) {
    return (
      <div className="card-flat p-8 text-center">
        <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
        <p className="text-muted-foreground">No hay evaluaciones registradas</p>
      </div>
    );
  }

  // ─── Agrupar por año ───
  const evalsByYear = evaluaciones.reduce((acc, ev) => {
    const fecha = ev.datosDocente.fechaVisita || ev.createdAt;
    const year = new Date(fecha.includes('T') ? fecha : fecha + 'T12:00:00').getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(ev);
    return acc;
  }, {} as Record<number, Evaluacion[]>);

  const years = Object.keys(evalsByYear).map(Number).sort((a, b) => b - a);

  return (
    <div className="space-y-6">
      {years.map((year) => (
        <div key={year} className="card-flat p-4">
          <h4 className="font-semibold text-lg text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            {year}
          </h4>
          <div className="space-y-2.5">
            {evalsByYear[year]
              .sort((a, b) => {
                const fA = a.datosDocente.fechaVisita || a.createdAt;
                const fB = b.datosDocente.fechaVisita || b.createdAt;
                return new Date(fB.includes('T') ? fB : fB + 'T12:00:00').getTime()
                  - new Date(fA.includes('T') ? fA : fA + 'T12:00:00').getTime();
              })
              .map((ev, index) => {
                const nivel = calcularNivelPromedio(ev.rubricas);
                const fecha = ev.datosDocente.fechaVisita || ev.createdAt;

                return (
                  <button
                    key={ev.id}
                    onClick={() => setSelectedEval(ev)}
                    className="w-full flex items-center gap-3.5 p-3.5 bg-muted/50 rounded-lg hover:bg-muted transition-colors text-left"
                  >
                    {/* Index */}
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-accent-foreground">
                        {evalsByYear[year].length - index}
                      </span>
                    </div>

                    {/* Date & Time */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">
                        Evaluación {evalsByYear[year].length - index}
                      </p>
                      <div className="flex items-center gap-2.5 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {fecha
                            ? format(
                                new Date(fecha.includes('T') ? fecha : fecha + 'T12:00:00'),
                                "d 'de' MMMM",
                                { locale: es }
                              )
                            : '—'}
                        </span>
                        {ev.datosDocente.horaInicio && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {ev.datosDocente.horaInicio}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Level Badge + eye */}
                    <div className="flex items-center gap-2 shrink-0">
                      <TrendingUp className="w-4 h-4 text-muted-foreground" />
                      <span className={`level-badge ${getLevelClass(nivel)}`}>
                        {nivel || '—'}
                      </span>
                      <Eye className="w-4 h-4 text-muted-foreground ml-1" />
                    </div>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}
