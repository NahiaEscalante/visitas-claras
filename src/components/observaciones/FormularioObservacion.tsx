import { useState } from 'react';
import { Upload, FileText, X, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Profesor, Visita, Rubrica, DatosDocente } from '@/types';
import { rubricasTemplate } from '@/data/mockData';
import { useToast } from '@/hooks/use-toast';

interface FormularioObservacionProps {
  profesor: Profesor;
  onGuardar: (visita: Visita) => void;
}

const nivelesLogro = [
  { value: 1, label: 'I', description: 'En inicio', color: 'level-i' },
  { value: 2, label: 'II', description: 'En proceso', color: 'level-ii' },
  { value: 3, label: 'III', description: 'Satisfactorio', color: 'level-iii' },
  { value: 4, label: 'IV', description: 'Destacado', color: 'level-iv' },
];

export function FormularioObservacion({ profesor, onGuardar }: FormularioObservacionProps) {
  const { toast } = useToast();
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [seccionesExpandidas, setSeccionesExpandidas] = useState({
    datos: true,
    rubricas: true,
  });

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSubido(file);
      setMostrarFormulario(true);
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

  const handleGuardar = () => {
    const nivelTotal = calcularNivelTotal();
    if (nivelTotal === 0) {
      toast({
        title: 'Error',
        description: 'Debes evaluar al menos una rúbrica antes de guardar.',
        variant: 'destructive',
      });
      return;
    }

    const nuevaVisita: Visita = {
      id: `v-${Date.now()}`,
      profesorId: profesor.id,
      fecha: datosDocente.fechaVisita,
      hora: datosDocente.horaInicio,
      nivelLogroTotal: nivelTotal,
      rubricas,
      datosDocente,
    };

    onGuardar(nuevaVisita);
    
    // Reset form
    setArchivoSubido(null);
    setMostrarFormulario(false);
    setRubricas(
      rubricasTemplate.map((r) => ({
        id: r.id,
        nombre: r.nombre,
        nivel: null,
        observaciones: '',
      }))
    );

    toast({
      title: 'Visita guardada',
      description: 'La observación ha sido registrada exitosamente en el historial.',
    });
  };

  const toggleSeccion = (seccion: 'datos' | 'rubricas') => {
    setSeccionesExpandidas((prev) => ({
      ...prev,
      [seccion]: !prev[seccion],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      {!mostrarFormulario && (
        <div className="card-flat p-6">
          <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Subir documento de observación
          </h4>
          
          <label className="upload-zone cursor-pointer">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileUpload}
              className="hidden"
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

      {/* Form */}
      {mostrarFormulario && (
        <div className="space-y-6 animate-slide-up">
          {/* Uploaded file indicator */}
          <div className="card-flat p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">{archivoSubido?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {archivoSubido && (archivoSubido.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setArchivoSubido(null);
                setMostrarFormulario(false);
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Section 1: Teacher Data */}
          <div className="card-flat overflow-hidden">
            <button
              onClick={() => toggleSeccion('datos')}
              className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <h4 className="font-semibold text-foreground">
                Sección 1 — Datos del docente y la IE
              </h4>
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
                {rubricas.map((rubrica, index) => (
                  <div key={rubrica.id} className="p-4 bg-muted/30 rounded-xl">
                    <p className="font-medium text-foreground mb-3">
                      {index + 1}. {rubrica.nombre}
                    </p>
                    
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
                ))}

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
            <Button onClick={handleGuardar} className="btn-primary w-full sm:w-auto">
              <Save className="w-4 h-4 mr-2" />
              Guardar visita
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
