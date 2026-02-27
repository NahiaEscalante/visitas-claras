import { useState } from 'react';
import { Upload, FileText, X, Check, Calendar, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { uploadAgenda, createVisitasProgramadasBulk } from '@/api/endpoints';

interface SubirAgendaProps {
  onVisitasAgregadas: () => void;
}

interface FechasPendientes {
  profesorId: string | null;
  profesorNombre: string;
  ie: string;
  salon: string;
  fecha: string;
  hora: string;
}

export function SubirAgenda({ onVisitasAgregadas }: SubirAgendaProps) {
  const { refreshData } = useApp();
  const { toast } = useToast();
  const [archivoSubido, setArchivoSubido] = useState<File | null>(null);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [fechasPendientes, setFechasPendientes] = useState<FechasPendientes[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoSubido(file);
    setUploading(true);
    try {
      const result = await uploadAgenda(file);
      const fechas: FechasPendientes[] = (result.fechasExtraidas || []).map((f) => ({
        profesorId: f.profesorId ?? null,
        profesorNombre: f.profesorNombre,
        ie: f.ie,
        salon: f.salon,
        fecha: f.fecha,
        hora: f.hora,
      }));
      setFechasPendientes(fechas);
      setMostrarConfirmacion(true);
      if (fechas.length === 0 && !result.procesado) {
        toast({
          title: 'Sin fechas detectadas',
          description: 'No se pudieron extraer fechas del documento. Puedes agregar visitas manualmente.',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error al subir agenda',
        description: err instanceof Error ? err.message : 'No se pudo procesar el archivo.',
        variant: 'destructive',
      });
      setArchivoSubido(null);
    } finally {
      setUploading(false);
    }
  };

  const handleFechaChange = (index: number, campo: 'fecha' | 'hora', valor: string) => {
    setFechasPendientes((prev) =>
      prev.map((f, i) => (i === index ? { ...f, [campo]: valor } : f))
    );
  };

  const handleConfirmar = async () => {
    if (fechasPendientes.length === 0) {
      toast({
        title: 'Sin fechas',
        description: 'No hay fechas para programar.',
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await createVisitasProgramadasBulk({
        visitas: fechasPendientes.map((f) => ({
          profesorId: f.profesorId,
          fecha: f.fecha,
          hora: f.hora,
          ie: f.ie,
          salon: f.salon,
          notas: null,
        })),
      });
      toast({
        title: 'Agenda guardada',
        description: `${fechasPendientes.length} visitas han sido programadas exitosamente.`,
      });
      setArchivoSubido(null);
      setMostrarConfirmacion(false);
      setFechasPendientes([]);
      await refreshData();
      onVisitasAgregadas();
    } catch (err) {
      toast({
        title: 'Error al guardar',
        description: err instanceof Error ? err.message : 'No se pudieron crear las visitas programadas.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
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
        <label className={`upload-zone cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-primary" />
          )}
          <div className="text-center">
            <p className="font-medium text-foreground">
              {uploading ? 'Procesando documento...' : 'Sube el documento con las fechas anuales obligatorias'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              PDF o imagen (JPG, PNG). La IA extraerá las fechas.
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
              {fechasPendientes.length > 0
                ? 'Confirma las fechas extraídas del documento antes de agendar:'
                : 'No se detectaron fechas en el documento. Puedes cancelar y subir otro archivo.'}
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
            <Button onClick={handleCancelar} variant="outline" className="flex-1" disabled={saving}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              className="btn-primary flex-1"
              disabled={saving || fechasPendientes.length === 0}
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Guardando...' : 'Confirmar y agendar'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
