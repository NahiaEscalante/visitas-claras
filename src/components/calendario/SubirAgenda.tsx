import { useState } from 'react';
import { Upload, FileText, X, Check, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { VisitaProgramada, Profesor } from '@/types';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';

interface SubirAgendaProps {
  onVisitasAgregadas: () => void;
}

interface FechasPendientes {
  profesorId: string;
  profesorNombre: string;
  ie: string;
  salon: string;
  fecha: string;
  hora: string;
}

export function SubirAgenda({ onVisitasAgregadas }: SubirAgendaProps) {
  const { profesores, agregarVisitaProgramada } = useApp();
  const { toast } = useToast();
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [fechasPendientes, setFechasPendientes] = useState<FechasPendientes[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArchivoSubido(file);
      // Simulate extracting dates from document
      generarFechasSimuladas();
      setMostrarConfirmacion(true);
    }
  };

  const generarFechasSimuladas = () => {
    // Simulate 3 mandatory annual dates for some professors
    const fechas: FechasPendientes[] = profesores.slice(0, 3).flatMap((profesor) => [
      {
        profesorId: profesor.id,
        profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
        ie: profesor.ie,
        salon: profesor.salon,
        fecha: '2025-12-18',
        hora: '09:00',
      },
      {
        profesorId: profesor.id,
        profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
        ie: profesor.ie,
        salon: profesor.salon,
        fecha: '2026-03-15',
        hora: '10:00',
      },
      {
        profesorId: profesor.id,
        profesorNombre: `${profesor.nombre} ${profesor.apellido}`,
        ie: profesor.ie,
        salon: profesor.salon,
        fecha: '2026-06-20',
        hora: '08:30',
      },
    ]);
    setFechasPendientes(fechas);
  };

  const handleFechaChange = (index: number, campo: 'fecha' | 'hora', valor: string) => {
    setFechasPendientes((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [campo]: valor } : f))
    );
  };

  const handleConfirmar = () => {
    fechasPendientes.forEach((fecha) => {
      const nuevaVisita: VisitaProgramada = {
        id: `vp-${Date.now()}-${fecha.profesorId}`,
        profesorId: fecha.profesorId,
        profesorNombre: fecha.profesorNombre,
        fecha: fecha.fecha,
        hora: fecha.hora,
        ie: fecha.ie,
        salon: fecha.salon,
        confirmada: false,
      };
      agregarVisitaProgramada(nuevaVisita);
    });

    toast({
      title: 'Agenda guardada',
      description: `${fechasPendientes.length} visitas han sido programadas exitosamente.`,
    });

    setArchivoSubido(null);
    setMostrarConfirmacion(false);
    setFechasPendientes([]);
    onVisitasAgregadas();
  };

  const handleCancelar = () => {
    setArchivoSubido(null);
    setMostrarConfirmacion(false);
    setFechasPendientes([]);
  };

  return (
    <div className="card-flat p-6">
      <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
        <Calendar className="w-5 h-5 text-primary" />
        Subir archivo de fechas programadas
      </h4>

      {!mostrarConfirmacion ? (
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
              Sube el documento con las fechas anuales obligatorias
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF o imagen (JPG, PNG)
            </p>
          </div>
        </label>
      ) : (
        <div className="space-y-6 animate-slide-up">
          {/* File indicator */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">{archivoSubido?.name}</span>
            </div>
            <button onClick={handleCancelar} className="p-1 hover:bg-muted rounded">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Dates to confirm */}
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Confirma las fechas extraídas del documento antes de agendar:
            </p>

            {fechasPendientes.map((fecha, index) => (
              <div key={index} className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-sm font-medium text-accent-foreground">
                      {fecha.profesorNombre.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{fecha.profesorNombre}</p>
                    <p className="text-sm text-muted-foreground">
                      {fecha.ie} • {fecha.salon}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Fecha</Label>
                    <Input
                      type="date"
                      value={fecha.fecha}
                      onChange={(e) => handleFechaChange(index, 'fecha', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Hora</Label>
                    <Input
                      type="time"
                      value={fecha.hora}
                      onChange={(e) => handleFechaChange(index, 'hora', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={handleCancelar} variant="outline" className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleConfirmar} className="btn-primary flex-1">
              <Check className="w-4 h-4 mr-2" />
              Confirmar y agendar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
