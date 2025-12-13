import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Profesor, Visita, VisitaProgramada } from '@/types';
import { profesores as profesoresData, visitasIniciales, visitasProgramadasIniciales } from '@/data/mockData';
import { getCurrentUser, isAuthenticated, logout as authLogout } from '@/services/auth';
import { User } from '@/data/mockUsers';
import { mockGetVisitas, mockGetVisitasProgramadas } from '@/services/mockApi';

interface AppContextType {
  profesores: Profesor[];
  visitas: Visita[];
  visitasProgramadas: VisitaProgramada[];
  currentUser: Omit<User, 'password'> | null;
  isAuthenticated: boolean;
  agregarVisita: (visita: Visita) => void;
  agregarVisitaProgramada: (visita: VisitaProgramada) => void;
  confirmarVisitaProgramada: (id: string) => void;
  getVisitasByProfesor: (profesorId: string) => Visita[];
  getProfesorById: (id: string) => Profesor | undefined;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profesores] = useState<Profesor[]>(profesoresData);
  const [visitas, setVisitas] = useState<Visita[]>(visitasIniciales);
  const [visitasProgramadas, setVisitasProgramadas] = useState<VisitaProgramada[]>(visitasProgramadasIniciales);
  const [currentUser, setCurrentUser] = useState<Omit<User, 'password'> | null>(null);

  // Cargar usuario actual al iniciar
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    
    // Sincronizar datos con mock API
    if (user) {
      refreshData();
    }
  }, []);

  // Sincronizar datos desde mock API
  const refreshData = async () => {
    try {
      const [visitasData, visitasProgramadasData] = await Promise.all([
        mockGetVisitas(),
        mockGetVisitasProgramadas(),
      ]);
      setVisitas(visitasData);
      setVisitasProgramadas(visitasProgramadasData);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  };

  const agregarVisita = (visita: Visita) => {
    setVisitas(prev => [...prev, visita]);
    // Sincronizar con mock API
    refreshData();
  };

  const agregarVisitaProgramada = (visita: VisitaProgramada) => {
    setVisitasProgramadas(prev => [...prev, visita]);
    // Sincronizar con mock API
    refreshData();
  };

  const confirmarVisitaProgramada = (id: string) => {
    setVisitasProgramadas(prev =>
      prev.map(v => (v.id === id ? { ...v, confirmada: true } : v))
    );
    // Sincronizar con mock API
    refreshData();
  };

  const getVisitasByProfesor = (profesorId: string) => {
    return visitas.filter(v => v.profesorId === profesorId);
  };

  const getProfesorById = (id: string) => {
    return profesores.find(p => p.id === id);
  };

  const logout = async () => {
    await authLogout();
    setCurrentUser(null);
    // Limpiar datos al cerrar sesión
    setVisitas(visitasIniciales);
    setVisitasProgramadas(visitasProgramadasIniciales);
  };

  // Actualizar usuario cuando cambia la autenticación
  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const user = getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    };

    // Verificar cada vez que cambia el localStorage
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        profesores,
        visitas,
        visitasProgramadas,
        currentUser,
        isAuthenticated: isAuthenticated(),
        agregarVisita,
        agregarVisitaProgramada,
        confirmarVisitaProgramada,
        getVisitasByProfesor,
        getProfesorById,
        logout,
        refreshData,
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
