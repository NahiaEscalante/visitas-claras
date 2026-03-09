import { useState, useEffect, useRef } from 'react';
import { Upload, FileText, X, Save, ChevronDown, ChevronUp, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Profesor, Visita, Rubrica, DatosDocente } from '@/types';
import { rubricasTemplate } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { toast as sonnerToast } from 'sonner';
import { isApiModeEnabled } from '@/api/config';
import {
  uploadArchivoObservacion,
  aiAutocompletarVisita,
  apiUpdateEvaluacion,
  apiConfirmarEvaluacion,
} from '@/api/endpoints';
import { AIAutocompleteResponse } from '@/api/types';
import { useApp } from '@/context/AppContext';

/**
 * Transforma rúbricas del formato API al formato frontend.
 * La API retorna { id: uuid, rubricaId: "string", nivel, observaciones }
 * El formulario espera { id: "involucra", nombre: "Involucra activamente...", nivel, observaciones }
 *
 * El rubricaId del backend puede variar dependiendo de lo que Gemini genere.
 * Usamos 4 estrategias de matching para máxima robustez.
 */
function transformRubricasAPIToFrontend(
  rubricasAPI: AIAutocompleteResponse['rubricas']
): Rubrica[] {
  // Log para debug — ver qué retorna el backend
  console.log('[IA] Rúbricas recibidas del backend:', JSON.stringify(rubricasAPI, null, 2));

  // Si no hay rúbricas del backend, retornar templates vacíos
  if (!rubricasAPI || rubricasAPI.length === 0) {
    console.warn('[IA] No se recibieron rúbricas del backend');
    return rubricasTemplate.map((t) => ({
      id: t.id,
      nombre: t.nombre,
      nivel: null,
      observaciones: '',
    }));
  }

  // Keywords para matching fuzzy: template.id → palabras clave
  const keywordsMap: Record<string, string[]> = {
    involucra: ['involucra', 'activamente', 'participación', 'participacion'],
    razonamiento: ['razonamiento', 'creatividad', 'crítico', 'critico', 'pensamiento'],
    evalua: ['evalúa', 'evalua', 'progreso', 'retroaliment', 'aprendizaje'],
    respeto: ['respeto', 'proximidad', 'ambiente'],
    comportamiento: ['comportamiento', 'regula', 'positivamente'],
  };

  // Track cuáles rúbricas del API ya fueron asignadas
  const usedApiIndices = new Set<number>();

  /**
   * Buscar la mejor rúbrica API para un template dado.
   * Estrategias en orden de prioridad:
   * 1. Exact match: rubricaId === template.id
   * 2. Keyword match: rubricaId contiene alguna keyword del template
   * 3. Name contains: rubricaId contiene palabras del nombre del template
   */
  function findBestMatch(template: typeof rubricasTemplate[0]): AIAutocompleteResponse['rubricas'][0] | null {
    // Estrategia 1: Match exacto por rubricaId
    for (let i = 0; i < rubricasAPI.length; i++) {
      if (usedApiIndices.has(i)) continue;
      if (rubricasAPI[i].rubricaId === template.id) {
        usedApiIndices.add(i);
        return rubricasAPI[i];
      }
    }

    // Estrategia 2: rubricaId contiene keyword del template
    const keywords = keywordsMap[template.id] || [template.id];
    for (let i = 0; i < rubricasAPI.length; i++) {
      if (usedApiIndices.has(i)) continue;
      const rid = rubricasAPI[i].rubricaId.toLowerCase();
      if (keywords.some(kw => rid.includes(kw))) {
        usedApiIndices.add(i);
        return rubricasAPI[i];
      }
    }

    // Estrategia 3: Buscar por nombre del template en rubricaId o observaciones
    const templateWords = template.nombre.toLowerCase().split(' ').filter(w => w.length > 4);
    for (let i = 0; i < rubricasAPI.length; i++) {
      if (usedApiIndices.has(i)) continue;
      const rid = rubricasAPI[i].rubricaId.toLowerCase();
      const obs = rubricasAPI[i].observaciones.toLowerCase();
      const matchCount = templateWords.filter(w => rid.includes(w) || obs.includes(w)).length;
      if (matchCount >= 2) {
        usedApiIndices.add(i);
        return rubricasAPI[i];
      }
    }

    return null;
  }

  const result = rubricasTemplate.map((template, index) => {
    const apiRubrica = findBestMatch(template);

    // Estrategia 4: Fallback por índice si no se encontró match
    const fallback = !apiRubrica && index < rubricasAPI.length && !usedApiIndices.has(index)
      ? rubricasAPI[index]
      : null;

    if (fallback) {
      usedApiIndices.add(index);
    }

    const matched = apiRubrica || fallback;

    if (matched) {
      console.log(`[IA] Rúbrica "${template.id}" ← matched con rubricaId="${matched.rubricaId}" (nivel=${matched.nivel})`);
    } else {
      console.warn(`[IA] Rúbrica "${template.id}" — SIN MATCH en respuesta API`);
    }

    return {
      id: template.id,
      nombre: template.nombre,
      nivel: (matched?.nivel as 1 | 2 | 3 | 4 | null) ?? null,
      observaciones: matched?.observaciones ?? '',
    };
  });

  return result;
}

/**
 * Normaliza las claves de datosDocente al formato camelCase que espera el formulario.
 * El backend almacena datosDocente como JSONB libre — Gemini puede generar claves
 * en snake_case, camelCase, o variantes mixtas. Esta función asegura que siempre
 * se use el formato correcto.
 */
function normalizeDatosDocente(raw: Record<string, any>): DatosDocente {
  // Log para debug — ver exactamente qué retorna el backend
  console.log('[IA] datosDocente recibidos del backend:', JSON.stringify(raw, null, 2));

  // Mapa: clave destino (camelCase) → posibles claves fuente
  const keyMap: Record<keyof DatosDocente, string[]> = {
    nombreCompleto: ['nombreCompleto', 'nombre_completo', 'nombrecompleto', 'nombre'],
    dni: ['dni', 'DNI', 'Dni'],
    cargoLaboral: ['cargoLaboral', 'cargo_laboral', 'cargo'],
    especialidad: ['especialidad', 'Especialidad'],
    ie: ['ie', 'IE', 'institucion', 'institucionEducativa', 'institucion_educativa'],
    nivelEducativo: ['nivelEducativo', 'nivel_educativo', 'nivel'],
    grado: ['grado', 'Grado'],
    seccion: ['seccion', 'sección', 'Seccion', 'Sección'],
    areasCurriculares: ['areasCurriculares', 'areas_curriculares', 'areasC', 'area', 'areas'],
    fechaVisita: ['fechaVisita', 'fecha_visita', 'fecha'],
    horaInicio: ['horaInicio', 'hora_inicio', 'hora', 'horaInicial'],
    horaFin: ['horaFin', 'hora_fin', 'horaFinal'],
  };

  const result: Record<string, string> = {};
  for (const [targetKey, sourceKeys] of Object.entries(keyMap)) {
    let found = false;
    for (const srcKey of sourceKeys) {
      if (raw[srcKey] !== undefined && raw[srcKey] !== null) {
        result[targetKey] = String(raw[srcKey]);
        found = true;
        break;
      }
    }
    if (!found) {
      result[targetKey] = '';
    }
  }

  return result as unknown as DatosDocente;
}

interface FormularioObservacionProps {
  profesor: Profesor;
  onGuardar: (visita: Visita) => void;
  onFocusChange?: (enFoco: boolean) => void;
}

type ModoFormulario = 'manual' | 'ia';

const nivelesLogro = [
  { value: 1, label: 'I', description: 'En inicio', color: 'level-i' },
  { value: 2, label: 'II', description: 'En proceso', color: 'level-ii' },
  { value: 3, label: 'III', description: 'Satisfactorio', color: 'level-iii' },
  { value: 4, label: 'IV', description: 'Destacado', color: 'level-iv' },
];

export function FormularioObservacion({ profesor, onGuardar, onFocusChange }: FormularioObservacionProps) {
  const { toast } = useToast();
  const { agregarVisita, currentUser } = useApp();
  const [modo, setModo] = useState<ModoFormulario>('manual');
  const [iaSuggestionId, setIaSuggestionId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // Guardar los IDs de rúbricas originales de la evaluación para el PATCH
  const evaluacionRubricasRef = useRef<AIAutocompleteResponse['rubricas']>([]);
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [archivoId, setArchivoId] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    datos: true,
    rubricas: true,
  });
  const [advertenciasIA, setAdvertenciasIA] = useState<Array<{ campo: string; mensaje: string; tipo: string }>>([]);
  const [camposBajaConfianza, setCamposBajaConfianza] = useState<Set<string>>(new Set());
  const [observacionGeneralIA, setObservacionGeneralIA] = useState<string | undefined>(undefined);
  const [puntajeTotalIA, setPuntajeTotalIA] = useState<number | undefined>(undefined);
  const [explicacionesRubricasIA, setExplicacionesRubricasIA] = useState<AIAutocompleteResponse['explicacionesRubricas']>(null);
  const [sugerenciasMejoraIA, setSugerenciasMejoraIA] = useState<AIAutocompleteResponse['sugerenciasMejora']>(null);

  const [datosDocente, setDatosDocente] = useState<DatosDocente>({
    nombreCompleto: `${profesor.nombre} ${profesor.apellido}`,
    dni: '',
    cargoLaboral: 'Docente',
    especialidad: '',
    ie: profesor.ie,
    nivelEducativo: 'Primaria',
    grado: profesor.salon.split(' ')[0],
    seccion: profesor.salon.split(' ')[1] || 'A',
    areasCurriculares: '',
    fechaVisita: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '09:00',
  });

  const [rubricas, setRubricas] = useState<Rubrica[]>(
    rubricasTemplate.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      nivel: null,
      observaciones: '',
    }))
  );

  // Mutación para subir archivo
  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      console.log('Subiendo archivo:', file.name, file.size);
      return uploadArchivoObservacion(file, profesor.id);
    },
    onSuccess: (data) => {
      console.log('Archivo subido exitosamente:', data.id);
      setArchivoId(data.id);
      sonnerToast.dismiss('upload');
      sonnerToast.success('Archivo subido exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error al subir archivo:', error);
      sonnerToast.dismiss('upload');
      sonnerToast.error('Error al subir archivo', {
        description: error.message,
      });
    },
  });

  // Mutación para autocompletar con IA
  const aiMutation = useMutation({
    mutationFn: (fileId: string) => {
      if (!fileId) throw new Error('No hay archivo subido');
      console.log('Iniciando análisis IA con archivoId:', fileId);
      return aiAutocompletarVisita({
        profesorId: profesor.id,
        observadorId: currentUser?.id ?? '',
        fecha: datosDocente.fechaVisita,
        hora: datosDocente.horaInicio,
        archivoId: fileId,
      });
    },
    onSuccess: (data) => {
      console.log('Análisis IA completado:', data);

      // Normalizar datosDocente (puede venir en snake_case desde Gemini)
      const datosNormalizados = normalizeDatosDocente(data.datosDocente as Record<string, any>);
      setDatosDocente(datosNormalizados);

      // Transformar rúbricas del formato API al formato frontend
      const rubricasTransformadas = transformRubricasAPIToFrontend(data.rubricas);
      setRubricas(rubricasTransformadas);

      // Guardar referencia a las rúbricas originales de la API (con sus UUIDs) para el PATCH
      evaluacionRubricasRef.current = data.rubricas;

      // Guardar evaluacionId para usarlo como iaSuggestionId al crear visita
      if (data.evaluacionId) {
        setIaSuggestionId(data.evaluacionId);
      }

      // Estos campos vienen de la API real
      setObservacionGeneralIA(data.observacionGeneral ?? undefined);
      setPuntajeTotalIA(data.puntajeTotal ?? undefined);
      setExplicacionesRubricasIA(data.explicacionesRubricas || null);
      setSugerenciasMejoraIA(data.sugerenciasMejora || null);

      // Advertencias y confianza solo disponibles en modo mock
      setAdvertenciasIA([]);
      setCamposBajaConfianza(new Set<string>());
      
      setMostrarFormulario(true);
      sonnerToast.dismiss('ai');
      sonnerToast.success('Análisis completado', {
        description: 'Revisa y ajusta los datos antes de guardar.',
      });
    },
    onError: (error: Error) => {
      console.error('Error al analizar con IA:', error);
      sonnerToast.dismiss('ai');
      sonnerToast.error('Error al analizar con IA', {
        description: error.message,
      });
      // Permitir continuar en modo manual
      setMostrarFormulario(true);
    },
  });

  // Mutación ya no se necesita — handleGuardar hace PATCH+confirm directamente

  const resetFormulario = () => {
    setArchivoSubido(null);
    setArchivoId(null);
    setMostrarFormulario(false);
    if (onFocusChange) {
      onFocusChange(false);
    }
    setAdvertenciasIA([]);
    setCamposBajaConfianza(new Set());
    setObservacionGeneralIA(undefined);
    setPuntajeTotalIA(undefined);
    setExplicacionesRubricasIA(null);
    setSugerenciasMejoraIA(null);
    setIaSuggestionId(null);
    setIsSaving(false);
    evaluacionRubricasRef.current = [];
    setDatosDocente({
      nombreCompleto: `${profesor.nombre} ${profesor.apellido}`,
      dni: '',
      cargoLaboral: 'Docente',
      especialidad: '',
      ie: profesor.ie,
      nivelEducativo: 'Primaria',
      grado: profesor.salon.split(' ')[0],
      seccion: profesor.salon.split(' ')[1] || 'A',
      areasCurriculares: '',
      fechaVisita: new Date().toISOString().split('T')[0],
      horaInicio: '08:00',
      horaFin: '09:00',
    });
    setRubricas(
      rubricasTemplate.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        nivel: null,
        observaciones: '',
      }))
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSubido(file);
      if (modo === 'manual') {
        setMostrarFormulario(true);
        if (onFocusChange) {
          onFocusChange(true);
        }
      }
      if (modo === 'ia') {
        setMostrarFormulario(true);
        if (onFocusChange) {
          onFocusChange(true);
        }
      }
    }
  };

  const handleSubirYAnalizar = async () => {
    if (!archivoSubido) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona un archivo primero.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      // Primero subir archivo
      sonnerToast.loading('Subiendo archivo...', { id: 'upload' });
      const uploadResult = await uploadMutation.mutateAsync(archivoSubido);
      const fileId = uploadResult.id;
      setArchivoId(fileId);
      
      sonnerToast.success('Archivo subido exitosamente', { id: 'upload' });
      
      // Luego analizar con IA usando el ID del archivo subido
      sonnerToast.loading('Analizando documento con IA...', { id: 'ai' });
      await aiMutation.mutateAsync(fileId);
      if (onFocusChange) {
        onFocusChange(true);
      }
    } catch (error) {
      sonnerToast.dismiss('upload');
      sonnerToast.dismiss('ai');
      // Error ya manejado en las mutaciones
      console.error('Error en subida/análisis:', error);
    }
  };

  const handleNivelChange = (rubricaId: string, nivel: 1 | 2 | 3 | 4) => {
    setRubricas((prev) =>
      prev.map((r) => (r.id === rubricaId ? { ...r, nivel } : r))
    );
  };

  const handleObservacionChange = (rubricaId: string, observaciones: string) => {
    setRubricas((prev) =>
      prev.map((r) => (r.id === rubricaId ? { ...r, observaciones } : r))
    );
  };

  const calcularSumaNiveles = () => {
    const nivelesValidos = rubricas.filter((r) => r.nivel !== null);
    if (nivelesValidos.length === 0) return 0;
    return nivelesValidos.reduce((acc, r) => acc + (r.nivel || 0), 0);
  };

  const calcularNivelMedio = () => {
    const nivelesValidos = rubricas.filter((r) => r.nivel !== null);
    if (nivelesValidos.length === 0) return 0;
    const suma = nivelesValidos.reduce((acc, r) => acc + (r.nivel || 0), 0);
    return Math.round(suma / nivelesValidos.length);
  };

  const handleGuardar = async () => {
    const nivelTotal = calcularNivelMedio();
    if (nivelTotal === 0) {
      toast({
        title: 'Error',
        description: 'Debes evaluar al menos una rúbrica antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);

    try {
      if (iaSuggestionId && isApiModeEnabled()) {
        // ─── Flujo API real: solo PATCH + confirmar evaluación ───
        // Paso 1: Actualizar la evaluación draft con las ediciones del usuario
        const rubricasParaPatch = evaluacionRubricasRef.current.map(origRubrica => {
          const editada = rubricas.find(r => r.id === origRubrica.rubricaId);
          return {
            id: origRubrica.id,
            rubricaId: origRubrica.rubricaId,
            nivel: editada?.nivel ?? origRubrica.nivel,
            observaciones: editada?.observaciones ?? origRubrica.observaciones,
          };
        });

        await apiUpdateEvaluacion(iaSuggestionId, {
          observacionGeneral: observacionGeneralIA ?? null,
          puntajeTotal: puntajeTotalIA ?? null,
          rubricas: rubricasParaPatch,
          explicacionesRubricas: explicacionesRubricasIA ?? null,
          sugerenciasMejora: sugerenciasMejoraIA ?? null,
        });

        // Paso 2: Confirmar la evaluación (draft → confirmed)
        await apiConfirmarEvaluacion(iaSuggestionId);

      } else {
        // ─── Flujo mock: crear visita localmente ───
        const nuevaVisita: Visita = {
          id: `visita-${Date.now()}`,
          profesorId: profesor.id,
          observadorId: currentUser?.id ?? '',
          fecha: datosDocente.fechaVisita,
          hora: datosDocente.horaInicio,
          nivelLogroTotal: nivelTotal,
          datosDocente,
          observacionGeneral: observacionGeneralIA ?? null,
          archivoId: archivoId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          rubricas: rubricas.map(r => ({
            id: r.id,
            rubricaId: r.id,
            nivel: r.nivel,
            observaciones: r.observaciones,
          })),
        };
        agregarVisita(nuevaVisita);
      }

      resetFormulario();
      if (onFocusChange) {
        onFocusChange(false);
      }

      sonnerToast.success('Evaluación guardada exitosamente');
      toast({
        title: 'Evaluación guardada',
        description: 'La observación ha sido registrada exitosamente.',
      });
    } catch (error) {
      console.error('Error en flujo guardar:', error);
      sonnerToast.error('Error al guardar', {
        description: error instanceof Error ? error.message : 'Error desconocido',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleSeccion = (seccion: 'datos' | 'rubricas') => {
    setSeccionesExpandidas((prev) => ({
      ...prev,
      [seccion]: !prev[seccion],
    }));
  };

  // Siempre habilitar modo IA (usa mock API)
  const isApiMode = true; // Siempre activo porque usamos mock API
  const isLoading = uploadMutation.isPending || aiMutation.isPending || isSaving;

  return (
    <div className="space-y-6">
      {/* Selector de Modo */}
      {!mostrarFormulario && (
        <div className="card-flat p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h4 className="font-semibold text-foreground">
                Selecciona el modo de registro
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                Elige si quieres completar la observación manualmente o usando IA.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setModo('manual')}
              className={`group flex flex-col justify-between h-full p-4 rounded-xl border transition-all text-left bg-card ${
                modo === 'manual'
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              }`}
            >
              <div>
                <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  <span className="inline-flex h-6 px-2 items-center rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Modo manual
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Completa el formulario manualmente, editando cada campo según tu criterio.
                </div>
              </div>
            </button>
            <button
              onClick={() => setModo('ia')}
              disabled={!isApiMode}
              className={`group flex flex-col justify-between h-full p-4 rounded-xl border transition-all text-left bg-card ${
                modo === 'ia'
                  ? 'border-primary shadow-sm'
                  : 'border-border hover:border-primary/50 hover:bg-muted/40'
              } ${!isApiMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
                  <span className="inline-flex h-6 px-2 items-center rounded-full text-xs font-medium bg-primary/10 text-primary">
                    Modo IA
                  </span>
                  <Sparkles className="w-4 h-4" />
                  <span>Autocompletar</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {isApiMode
                    ? 'Sube un documento (PDF o imagen) y la IA propondrá datos y calificaciones que luego podrás ajustar.'
                    : 'Requiere configuración de API'}
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Resumen IA */}
      {mostrarFormulario && (observacionGeneralIA || puntajeTotalIA || (sugerenciasMejoraIA && sugerenciasMejoraIA.length > 0)) && (
        <div className="card-flat p-5 space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Resumen generado por IA
          </h4>

          {observacionGeneralIA && (
            <div className="text-sm text-muted-foreground whitespace-pre-line">
              {observacionGeneralIA}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Nivel medio:</span>
              <span className="level-badge px-3 py-1">
                {calcularNivelMedio() || '-'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Puntaje total:</span>
              <span className="px-3 py-1 rounded-full bg-accent text-foreground text-sm">
                {puntajeTotalIA ?? (calcularSumaNiveles() || '-')}
              </span>
            </div>
          </div>

          {sugerenciasMejoraIA && sugerenciasMejoraIA.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <p className="font-medium text-foreground mb-2">
                Sugerencias de apoyo al docente
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {sugerenciasMejoraIA.map((sugerencia, idx) => (
                  <li key={idx}>{sugerencia}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Upload Zone */}
      {!mostrarFormulario && (
        <div className="card-flat p-5 sm:p-6">
          <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {modo === 'ia' ? 'Subir documento para análisis con IA' : 'Subir documento de observación'}
          </h4>
          
          <label className="upload-zone cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
            <Upload className="w-10 h-10 text-primary" />
            <div className="text-center">
              <p className="font-medium text-foreground">
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                PDF o imagen (JPG, PNG)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Advertencias de IA */}
      {advertenciasIA && advertenciasIA.length > 0 && (
        <div className="card-flat p-4 bg-warning/5 border border-warning/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
            <div className="flex-1">
              <h5 className="font-semibold text-foreground mb-2">Revisar campos</h5>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {advertenciasIA.map((adv, idx) => (
                  <li key={idx}>• {adv.mensaje}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {mostrarFormulario && (
        <div className="space-y-5 animate-slide-up">
          {/* Uploaded file indicator */}
          {archivoSubido && (
            <div className="card-flat p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{archivoSubido.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(archivoSubido.size / 1024).toFixed(1)} KB
                    {modo === 'ia' && aiMutation.isSuccess && (
                      <span className="ml-2 text-success">• Análisis completado</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {modo === 'ia' && isApiMode && !aiMutation.isSuccess && (
                  <Button
                    onClick={handleSubirYAnalizar}
                    disabled={isLoading}
                    className="btn-primary flex items-center gap-2"
                  >
                    {isLoading && uploadMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : isLoading && aiMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Analizando con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analizar con IA</span>
                      </>
                    )}
                  </Button>
                )}

                <button
                  onClick={resetFormulario}
                  disabled={isLoading}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Teacher Data */}
          <div className="card-flat overflow-hidden">
            <button
              onClick={() => toggleSeccion('datos')}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">
                  Sección 1 — Datos del docente y la IE
                </h4>
                {camposBajaConfianza.has('datosDocente') && (
                  <Badge variant="outline" className="text-warning border-warning">
                    Revisar
                  </Badge>
                )}
              </div>
              {seccionesExpandidas.datos ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {seccionesExpandidas.datos && (
              <div className="p-5 pt-0 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="sm:col-span-2 lg:col-span-3">
                  <Label>Nombre completo del docente</Label>
                  <Input
                    value={datosDocente.nombreCompleto}
                    onChange={(e) => setDatosDocente({ ...datosDocente, nombreCompleto: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>DNI</Label>
                  <Input
                    value={datosDocente.dni}
                    onChange={(e) => setDatosDocente({ ...datosDocente, dni: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Cargo laboral</Label>
                  <Input
                    value={datosDocente.cargoLaboral}
                    onChange={(e) => setDatosDocente({ ...datosDocente, cargoLaboral: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Especialidad</Label>
                  <Input
                    value={datosDocente.especialidad}
                    onChange={(e) => setDatosDocente({ ...datosDocente, especialidad: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <Label>Institución Educativa</Label>
                  <Input
                    value={datosDocente.ie}
                    onChange={(e) => setDatosDocente({ ...datosDocente, ie: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Nivel educativo</Label>
                  <Input
                    value={datosDocente.nivelEducativo}
                    onChange={(e) => setDatosDocente({ ...datosDocente, nivelEducativo: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Grado</Label>
                  <Input
                    value={datosDocente.grado}
                    onChange={(e) => setDatosDocente({ ...datosDocente, grado: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Sección</Label>
                  <Input
                    value={datosDocente.seccion}
                    onChange={(e) => setDatosDocente({ ...datosDocente, seccion: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div className="sm:col-span-2 lg:col-span-2">
                  <Label>Áreas curriculares</Label>
                  <Input
                    value={datosDocente.areasCurriculares}
                    onChange={(e) => setDatosDocente({ ...datosDocente, areasCurriculares: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Fecha de visita</Label>
                  <Input
                    type="date"
                    value={datosDocente.fechaVisita}
                    onChange={(e) => setDatosDocente({ ...datosDocente, fechaVisita: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Hora de inicio</Label>
                  <Input
                    type="time"
                    value={datosDocente.horaInicio}
                    onChange={(e) => setDatosDocente({ ...datosDocente, horaInicio: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Hora de fin</Label>
                  <Input
                    type="time"
                    value={datosDocente.horaFin}
                    onChange={(e) => setDatosDocente({ ...datosDocente, horaFin: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Rubrics */}
          <div className="card-flat overflow-hidden">
            <button
              onClick={() => toggleSeccion('rubricas')}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold text-foreground">
                Sección 2 — Rúbricas obligatorias
              </h4>
              {seccionesExpandidas.rubricas ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {seccionesExpandidas.rubricas && (
              <div className="p-5 pt-0 space-y-6">
                {rubricas.map((rubrica, index) => {
                  const tieneBajaConfianza = camposBajaConfianza.has(`rubrica-${rubrica.id}`);
                  const explicacion = explicacionesRubricasIA?.find((e) => e.rubricaId === rubrica.id);
                  return (
                    <div key={rubrica.id} className="p-4 bg-muted/30 rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-medium text-foreground">
                          {index + 1}. {rubrica.nombre}
                        </p>
                        {tieneBajaConfianza && (
                          <Badge variant="outline" className="text-warning border-warning">
                            Revisar
                          </Badge>
                        )}
                      </div>
                      
                      {/* Level Selection */}
                      <div className="mb-3">
                        <Label className="text-sm text-muted-foreground mb-2 block">
                          Nivel de logro
                        </Label>
                        <div className="flex gap-2">
                          {nivelesLogro.map((nivel) => (
                            <button
                              key={nivel.value}
                              onClick={() => handleNivelChange(rubrica.id, nivel.value as 1 | 2 | 3 | 4)}
                              className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all ${
                                rubrica.nivel === nivel.value
                                  ? `${nivel.color} border-current`
                                  : 'border-border hover:border-primary/50 bg-card'
                              }`}
                            >
                              <span className="font-semibold block">{nivel.label}</span>
                              <span className="text-xs opacity-80">{nivel.description}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Observations */}
                      <div className="space-y-2">
                        <Label className="text-sm text-muted-foreground">Observaciones</Label>
                        <Textarea
                          value={rubrica.observaciones}
                          onChange={(e) => handleObservacionChange(rubrica.id, e.target.value)}
                          placeholder="Escribe tus observaciones aquí..."
                          className="mt-1.5 min-h-[80px]"
                        />
                        {explicacion && (
                          <div className="text-xs text-muted-foreground bg-background/60 rounded-lg p-3 border border-dashed border-border/60">
                            <p className="font-medium mb-1">Por qué la IA sugiere esta calificación:</p>
                            <p className="mb-1">{explicacion.razon}</p>
                            {explicacion.extractos && explicacion.extractos.length > 0 && (
                              <ul className="list-disc list-inside space-y-0.5">
                                {explicacion.extractos.map((ext, i) => (
                                  <li key={i}>{ext}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Total Level */}
                <div className="p-4 bg-accent rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-foreground">Nivel de logro medio:</span>
                  <div className="flex items-center gap-3">
                    <span className={`level-badge text-lg w-10 h-10 ${
                      calcularNivelMedio() === 1 ? 'level-i' :
                      calcularNivelMedio() === 2 ? 'level-ii' :
                      calcularNivelMedio() === 3 ? 'level-iii' :
                      calcularNivelMedio() === 4 ? 'level-iv' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {calcularNivelMedio() || '-'}
                    </span>
                    <span className="text-muted-foreground">
                      {calcularNivelMedio() === 1 ? 'En inicio' :
                       calcularNivelMedio() === 2 ? 'En proceso' :
                       calcularNivelMedio() === 3 ? 'Satisfactorio' :
                       calcularNivelMedio() === 4 ? 'Destacado' :
                       'Sin evaluar'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Save */}
          <div className="card-flat p-5">
            <h4 className="font-semibold text-foreground mb-4">
              Sección 3 — Guardar en historial
            </h4>
            <Button 
              onClick={handleGuardar} 
              disabled={isLoading}
              className="btn-primary w-full sm:w-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar visita
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
