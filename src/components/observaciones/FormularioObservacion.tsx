import { useState, useEffect } from 'react';
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
import { uploadArchivoObservacion, aiAutocompletarVisita, crearVisita } from '@/api/endpoints';
import { AIAutocompleteResponse } from '@/api/types';
import { useApp } from '@/context/AppContext';

interface FormularioObservacionProps {
  profesor: Profesor;
  onGuardar: (visita: Visita) => void;
}

type ModoFormulario = 'manual' | 'ia';

const nivelesLogro = [
  { value: 1, label: 'I', description: 'En inicio', color: 'level-i' },
  { value: 2, label: 'II', description: 'En proceso', color: 'level-ii' },
  { value: 3, label: 'III', description: 'Satisfactorio', color: 'level-iii' },
  { value: 4, label: 'IV', description: 'Destacado', color: 'level-iv' },
];

export function FormularioObservacion({ profesor, onGuardar }: FormularioObservacionProps) {
  const { toast } = useToast();
  const { agregarVisita } = useApp();
  const [modo, setModo] = useState<ModoFormulario>('manual');
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [archivoId, setArchivoId] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    datos: true,
    rubricas: true,
  });
  const [advertenciasIA, setAdvertenciasIA] = useState<AIAutocompleteResponse['advertencias']>([]);
  const [camposBajaConfianza, setCamposBajaConfianza] = useState<Set<string>>(new Set());

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
        fecha: datosDocente.fechaVisita,
        hora: datosDocente.horaInicio,
        archivoId: fileId,
      });
    },
    onSuccess: (data) => {
      console.log('Análisis IA completado:', data);
      // Autocompletar formulario con datos de IA
      setDatosDocente(data.datosDocente);
      setRubricas(data.rubricas);
      setAdvertenciasIA(data.advertencias || []);
      
      // Identificar campos con baja confianza
      const bajaConfianza = new Set<string>();
      if (data.confianza) {
        if (data.confianza.datosDocente < 0.7) {
          bajaConfianza.add('datosDocente');
        }
        Object.entries(data.confianza.rubricas).forEach(([id, conf]) => {
          if (conf < 0.7) {
            bajaConfianza.add(`rubrica-${id}`);
          }
        });
      }
      setCamposBajaConfianza(bajaConfianza);
      
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

  // Mutación para crear visita
  const crearVisitaMutation = useMutation({
    mutationFn: crearVisita,
    onSuccess: (data) => {
      // Convertir respuesta de API a formato Visita del contexto
      const nuevaVisita: Visita = {
        id: data.id,
        profesorId: data.profesorId,
        fecha: data.fecha,
        hora: data.hora,
        nivelLogroTotal: data.nivelLogroTotal,
        rubricas: data.rubricas,
        datosDocente: data.datosDocente,
      };
      
      agregarVisita(nuevaVisita);
      resetFormulario();
      
      sonnerToast.success('Visita guardada exitosamente');
      toast({
        title: 'Visita guardada',
        description: 'La observación ha sido registrada exitosamente en el historial.',
      });
    },
    onError: (error: Error) => {
      sonnerToast.error('Error al guardar visita', {
        description: error.message,
      });
    },
  });

  const resetFormulario = () => {
    setArchivoSubido(null);
    setArchivoId(null);
    setMostrarFormulario(false);
    setAdvertenciasIA([]);
    setCamposBajaConfianza(new Set());
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

  const calcularNivelTotal = () => {
    const nivelesValidos = rubricas.filter((r) => r.nivel !== null);
    if (nivelesValidos.length === 0) return 0;
    const suma = nivelesValidos.reduce((acc, r) => acc + (r.nivel || 0), 0);
    return Math.round(suma / nivelesValidos.length);
  };

  const handleGuardar = async () => {
    const nivelTotal = calcularNivelTotal();
    if (nivelTotal === 0) {
      toast({
        title: 'Error',
        description: 'Debes evaluar al menos una rúbrica antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      profesorId: profesor.id,
      fecha: datosDocente.fechaVisita,
      hora: datosDocente.horaInicio,
      datosDocente,
      rubricas,
      ...(archivoId && { archivoId }),
    };

    // Siempre usar API (mock o real)
    try {
      await crearVisitaMutation.mutateAsync(payload);
    } catch (error) {
      // Error ya manejado en la mutación
      return;
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
  const isLoading = uploadMutation.isPending || aiMutation.isPending || crearVisitaMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Selector de Modo */}
      {!mostrarFormulario && (
        <div className="card-flat p-6">
          <h4 className="font-semibold text-foreground mb-4">
            Selecciona el modo de registro
          </h4>
          <div className="grid sm:grid-cols-2 gap-4">
            <button
              onClick={() => setModo('manual')}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                modo === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="font-semibold text-foreground mb-1">Modo Manual</div>
              <div className="text-sm text-muted-foreground">
                Completa el formulario manualmente
              </div>
            </button>
            <button
              onClick={() => setModo('ia')}
              disabled={!isApiMode}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                modo === 'ia'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              } ${!isApiMode ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="font-semibold text-foreground mb-1 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Modo IA (Autocompletar)
              </div>
              <div className="text-sm text-muted-foreground">
                {isApiMode
                  ? 'Sube un documento y la IA completará el formulario'
                  : 'Requiere configuración de API'}
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!mostrarFormulario && (
        <div className="card-flat p-6">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
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

          {modo === 'ia' && archivoSubido && isApiMode && (
            <div className="mt-4">
              <Button
                onClick={handleSubirYAnalizar}
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {uploadMutation.isPending ? 'Subiendo archivo...' : 'Analizando con IA...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Subir y analizar con IA
                  </>
                )}
              </Button>
            </div>
          )}
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
        <div className="space-y-6 animate-slide-up">
          {/* Uploaded file indicator */}
          {archivoSubido && (
            <div className="card-flat p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{archivoSubido.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {archivoSubido && (archivoSubido.size / 1024).toFixed(1)} KB
                    {modo === 'ia' && aiMutation.isSuccess && (
                      <span className="ml-2 text-success">• Análisis completado</span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={resetFormulario}
                disabled={isLoading}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
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
              <div className="p-5 pt-0 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
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
                <div>
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
                <div>
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
                      <div>
                        <Label className="text-sm text-muted-foreground">Observaciones</Label>
                        <Textarea
                          value={rubrica.observaciones}
                          onChange={(e) => handleObservacionChange(rubrica.id, e.target.value)}
                          placeholder="Escribe tus observaciones aquí..."
                          className="mt-1.5 min-h-[80px]"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Total Level */}
                <div className="p-4 bg-accent rounded-xl flex items-center justify-between">
                  <span className="font-semibold text-foreground">Nivel de logro total:</span>
                  <div className="flex items-center gap-3">
                    <span className={`level-badge text-lg w-10 h-10 ${
                      calcularNivelTotal() === 1 ? 'level-i' :
                      calcularNivelTotal() === 2 ? 'level-ii' :
                      calcularNivelTotal() === 3 ? 'level-iii' :
                      calcularNivelTotal() === 4 ? 'level-iv' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {calcularNivelTotal() || '-'}
                    </span>
                    <span className="text-muted-foreground">
                      {calcularNivelTotal() === 1 ? 'En inicio' :
                       calcularNivelTotal() === 2 ? 'En proceso' :
                       calcularNivelTotal() === 3 ? 'Satisfactorio' :
                       calcularNivelTotal() === 4 ? 'Destacado' :
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
