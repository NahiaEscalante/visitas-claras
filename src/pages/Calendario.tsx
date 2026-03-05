import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { CalendarioMensual } from '@/components/calendario/CalendarioMensual';
import { AsistenteAgendaPanel } from '@/components/calendario/AsistenteAgendaPanel';
import { ModalConfirmacion } from '@/components/calendario/ModalConfirmacion';
import { useApp } from '@/context/AppContext';
import { VisitaProgramada } from '@/types';
import { Calendar } from 'lucide-react';

export default function Calendario() {
  const { visitasProgramadas, confirmarVisitaProgramada, agregarVisitaProgramada, actualizarVisitaProgramada } = useApp();
  const [selectedVisita, setSelectedVisita] = useState<VisitaProgramada | null>(null);
  const [key, setKey] = useState(0);

  const handleConfirmar = () => {
    if (selectedVisita) {
      confirmarVisitaProgramada(selectedVisita.id);
    }
  };

  const handleConfirmarCambioAsistente = (cambio: any) => {
    // Procesar el cambio propuesto por el asistente
    if (cambio.tipo === 'crear') {
      const nuevaVisita: VisitaProgramada = {
        id: `vp-${Date.now()}`,
        profesorId: `prof-${Date.now()}`,
        profesorNombre: cambio.profesorNombre,
        fecha: cambio.fecha,
        hora: cambio.hora,
        ie: cambio.ie,
        salon: cambio.salon,
        confirmada: false,
      };
      agregarVisitaProgramada(nuevaVisita);
    } else if (cambio.tipo === 'reprogramar') {
      // Buscar visita existente y actualizar
      const visitaExistente = visitasProgramadas.find(v => 
        v.profesorNombre === cambio.profesorNombre && !v.confirmada
      );
      if (visitaExistente) {
        actualizarVisitaProgramada(visitaExistente.id, {
          fecha: cambio.fecha,
          hora: cambio.hora,
        });
      }
    } else if (cambio.tipo === 'cancelar') {
      // Buscar visita existente y eliminar (marcar como cancelada)
      const visitaExistente = visitasProgramadas.find(v => 
        v.profesorNombre === cambio.profesorNombre && !v.confirmada
      );
      if (visitaExistente) {
        // Por ahora, simplemente actualizamos para reflejar el cambio
        actualizarVisitaProgramada(visitaExistente.id, {
          fecha: cambio.fecha,
          hora: cambio.hora,
        });
      }
    }
    
    // Forzar re-render del calendario
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
            <AsistenteAgendaPanel onConfirmarCambio={handleConfirmarCambioAsistente} />
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
