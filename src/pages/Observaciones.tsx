import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProfesorSearch } from '@/components/profesores/ProfesorSearch';
import { ProfesorPanel } from '@/components/profesores/ProfesorPanel';
import { FormularioProfesor } from '@/components/profesores/FormularioProfesor';
import { useApp } from '@/context/AppContext';
import { Profesor } from '@/types';
import { ClipboardList, UserPlus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Observaciones() {
  const { profesores, refreshData } = useApp();
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);
  const [mostrarFormProfesor, setMostrarFormProfesor] = useState(false);

  const handleProfesorCreado = async (profesor: Profesor) => {
    setMostrarFormProfesor(false);
    await refreshData(); // Recargar lista de profesores
    setSelectedProfesor(profesor);
  };

  // ─── Vista: Formulario nuevo profesor ───
  if (mostrarFormProfesor) {
    return (
      <Layout>
        <div className="animate-fade-in max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setMostrarFormProfesor(false)}
            className="text-muted-foreground hover:text-foreground -ml-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la lista
          </Button>
          <FormularioProfesor
            onCreado={handleProfesorCreado}
            onCancelar={() => setMostrarFormProfesor(false)}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {!selectedProfesor ? (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-foreground">
                  Observaciones por Profesor
                </h1>
              </div>
              <Button
                onClick={() => setMostrarFormProfesor(true)}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Agregar profesor
              </Button>
            </div>
            <p className="text-muted-foreground">
              Busca un profesor para ver su historial de evaluaciones y registrar nuevas observaciones.
            </p>
          </div>

          {/* Search */}
          <ProfesorSearch
            profesores={profesores}
            onSelectProfesor={setSelectedProfesor}
            selectedProfesorId={selectedProfesor?.id}
          />
        </div>
      ) : (
        <ProfesorPanel
          profesor={selectedProfesor}
          onBack={() => setSelectedProfesor(null)}
        />
      )}
    </Layout>
  );
}
