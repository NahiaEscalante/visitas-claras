import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Profesor, Visita, VisitaProgramada } from '@/types';
import { profesores as profesoresData, visitasIniciales, visitasProgramadasIniciales } from '@/data/mockData';

interface AppContextType {
  profesores: Profesor[];
  visitas: Visita[];
  visitasProgramadas: VisitaProgramada[];
  agregarVisita: (visita: Visita) => void;
  agregarVisitaProgramada: (visita: VisitaProgramada) => void;
  confirmarVisitaProgramada: (id: string) => void;
  getVisitasByProfesor: (profesorId: string) => Visita[];
  getProfesorById: (id: string) => Profesor | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profesores] = useState<Profesor[]>(profesoresData);
  const [visitas, setVisitas] = useState<Visita[]>(visitasIniciales);
  const [visitasProgramadas, setVisitasProgramadas] = useState<VisitaProgramada[]>(visitasProgramadasIniciales);

  const agregarVisita = (visita: Visita) => {
    setVisitas(prev => [...prev, visita]);
  };

  const agregarVisitaProgramada = (visita: VisitaProgramada) => {
    setVisitasProgramadas(prev => [...prev, visita]);
  };

  const confirmarVisitaProgramada = (id: string) => {
    setVisitasProgramadas(prev =>
      prev.map(v => (v.id === id ? { ...v, confirmada: true } : v))
    );
  };

  const getVisitasByProfesor = (profesorId: string) => {
    return visitas.filter(v => v.profesorId === profesorId);
  };

  const getProfesorById = (id: string) => {
    return profesores.find(p => p.id === id);
  };

  return (
    <AppContext.Provider
      value={{
        profesores,
        visitas,
        visitasProgramadas,
        agregarVisita,
        agregarVisitaProgramada,
        confirmarVisitaProgramada,
        getVisitasByProfesor,
        getProfesorById,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
