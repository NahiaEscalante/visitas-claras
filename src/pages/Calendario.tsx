import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CalendarioMensual } from '@/components/calendario/CalendarioMensual';
import { AsistenteAgendaPanel } from '@/components/calendario/AsistenteAgendaPanel';
import { ModalConfirmacion } from '@/components/calendario/ModalConfirmacion';
import { useApp } from '@/context/AppContext';
import { VisitaProgramada } from '@/types';
import { Calendar } from 'lucide-react';

export default function Calendario() {
  const { visitasProgramadas, confirmarVisitaProgramada, refreshData } = useApp();
  const [selectedVisita, setSelectedVisita] = useState<VisitaProgramada | null>(null);
  const [key, setKey] = useState(0);

  const handleConfirmar = () => {
    if (selectedVisita) {
      confirmarVisitaProgramada(selectedVisita.id);
    }
  };

  /**
   * Callback cuando el asistente de agenda aplica cambios.
   * La API ya creó/modificó/canceló las visitas en el backend.
   * Solo necesitamos refrescar datos y re-renderizar el calendario.
   */
  const handleCambiosAplicados = () => {
    refreshData();
    setKey(prev => prev + 1);
  };

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

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Calendar (8 columns) */}
          <div className="col-span-8">
            <CalendarioMensual
              key={key}
              visitas={visitasProgramadas}
              onSelectVisita={setSelectedVisita}
            />
          </div>

          {/* Right Column: Assistant Panel (4 columns) */}
          <div className="col-span-4">
            <AsistenteAgendaPanel onCambiosAplicados={handleCambiosAplicados} />
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
