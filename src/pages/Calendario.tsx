import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CalendarioMensual } from '@/components/calendario/CalendarioMensual';
import { SubirAgenda } from '@/components/calendario/SubirAgenda';
import { ModalConfirmacion } from '@/components/calendario/ModalConfirmacion';
import { useApp } from '@/context/AppContext';
import { VisitaProgramada } from '@/types';
import { Calendar, Clock, Building2, GraduationCap, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function Calendario() {
  const { visitasProgramadas, confirmarVisitaProgramada } = useApp();
  const [selectedVisita, setSelectedVisita] = useState<VisitaProgramada | null>(null);
  const [key, setKey] = useState(0);

  const handleConfirmar = async () => {
    if (!selectedVisita) return;
    try {
      await confirmarVisitaProgramada(selectedVisita.id);
      setSelectedVisita(null);
    } catch {
      // Error ya manejado en contexto o se puede mostrar toast
    }
  };

  const visitasPendientes = visitasProgramadas.filter((v) => !v.confirmada);
  const visitasConfirmadas = visitasProgramadas.filter((v) => v.confirmada);

  return (
    <Layout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              Calendario de Visitas
            </h1>
          </div>
          <p className="text-muted-foreground">
            Programa y gestiona las visitas a los docentes de tu institución.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column: Calendar */}
          <div className="lg:col-span-2">
            <CalendarioMensual
              key={key}
              visitas={visitasProgramadas}
              onSelectVisita={setSelectedVisita}
            />
          </div>

          {/* Right Column: Upload & List */}
          <div className="space-y-6">
            {/* Upload */}
            <SubirAgenda onVisitasAgregadas={() => setKey((k) => k + 1)} />

            {/* Pending visits */}
            {visitasPendientes.length > 0 && (
              <div className="card-flat p-5">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Pendientes de confirmar ({visitasPendientes.length})
                </h4>
                <div className="space-y-3">
                  {visitasPendientes.map((visita) => (
                    <button
                      key={visita.id}
                      onClick={() => setSelectedVisita(visita)}
                      className="w-full text-left p-3 bg-warning/5 border border-warning/20 rounded-lg hover:bg-warning/10 transition-colors"
                    >
                      <p className="font-medium text-foreground">{visita.profesorNombre}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(visita.fecha), 'd MMM', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {visita.hora}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Confirmed visits */}
            {visitasConfirmadas.length > 0 && (
              <div className="card-flat p-5">
                <h4 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5 text-success" />
                  Confirmadas ({visitasConfirmadas.length})
                </h4>
                <div className="space-y-3">
                  {visitasConfirmadas.slice(0, 5).map((visita) => (
                    <div
                      key={visita.id}
                      className="p-3 bg-success/5 border border-success/20 rounded-lg"
                    >
                      <p className="font-medium text-foreground">{visita.profesorNombre}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(visita.fecha), 'd MMM', { locale: es })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {visita.hora}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {selectedVisita && (
        <ModalConfirmacion
          visita={selectedVisita}
          onClose={() => setSelectedVisita(null)}
          onConfirmar={handleConfirmar}
        />
      )}
    </Layout>
  );
}
