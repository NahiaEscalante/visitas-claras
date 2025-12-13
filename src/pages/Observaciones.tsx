import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ProfesorSearch } from '@/components/profesores/ProfesorSearch';
import { ProfesorPanel } from '@/components/profesores/ProfesorPanel';
import { useApp } from '@/context/AppContext';
import { Profesor } from '@/types';
import { ClipboardList } from 'lucide-react';

export default function Observaciones() {
  const { profesores } = useApp();
  const [selectedProfesor, setSelectedProfesor] = useState<Profesor | null>(null);

  return (
    <Layout>
      {!selectedProfesor ? (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Observaciones por Profesor
              </h1>
            </div>
            <p className="text-muted-foreground">
              Busca un profesor para ver su historial de visitas y registrar nuevas observaciones.
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
