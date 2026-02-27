import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Profesor, Visita, VisitaProgramada, User } from '@/types';
import { getCurrentUser, isAuthenticated, logout as authLogout } from '@/services/auth';
import { AUTH_LOGOUT_EVENT } from '@/api/http';
import {
  getProfesores,
  getVisitas,
  getVisitasProgramadas,
  updateVisitaProgramada,
} from '@/api/endpoints';

const DEFAULT_LIMIT = 100;

interface AppContextType {
  profesores: Profesor[];
  visitas: Visita[];
  visitasProgramadas: VisitaProgramada[];
  loading: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  agregarVisita: (visita: Visita) => void;
  agregarVisitaProgramada: (visita: VisitaProgramada) => void;
  confirmarVisitaProgramada: (id: string) => Promise<void>;
  getVisitasByProfesor: (profesorId: string) => Visita[];
  getProfesorById: (id: string) => Profesor | undefined;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profesores, setProfesores] = useState<Profesor[]>([]);
  const [visitas, setVisitas] = useState<Visita[]>([]);
  const [visitasProgramadas, setVisitasProgramadas] = useState<VisitaProgramada[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const refreshData = useCallback(async () => {
    if (!isAuthenticated()) return;
    setLoading(true);
    try {
      const [profRes, visRes, vpRes] = await Promise.all([
        getProfesores({ page: 1, limit: DEFAULT_LIMIT }),
        getVisitas({ page: 1, limit: DEFAULT_LIMIT }),
        getVisitasProgramadas({ page: 1, limit: DEFAULT_LIMIT }),
      ]);
      setProfesores(profRes.profesores);
      setVisitas(visRes.visitas);
      setVisitasProgramadas(vpRes.visitas);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    if (user) {
      refreshData();
    }
  }, [refreshData]);

  useEffect(() => {
    const handleLogout = () => {
      setCurrentUser(null);
      setProfesores([]);
      setVisitas([]);
      setVisitasProgramadas([]);
    };
    window.addEventListener(AUTH_LOGOUT_EVENT, handleLogout);
    return () => window.removeEventListener(AUTH_LOGOUT_EVENT, handleLogout);
  }, []);

  const agregarVisita = useCallback((visita: Visita) => {
    setVisitas((prev) => [...prev, visita]);
  }, []);

  const agregarVisitaProgramada = useCallback((visita: VisitaProgramada) => {
    setVisitasProgramadas((prev) => [...prev, visita]);
  }, []);

  const confirmarVisitaProgramada = useCallback(async (id: string) => {
    await updateVisitaProgramada(id, { confirmada: true });
    setVisitasProgramadas((prev) =>
      prev.map((v) => (v.id === id ? { ...v, confirmada: true } : v))
    );
  }, []);

  const getVisitasByProfesor = useCallback(
    (profesorId: string) => visitas.filter((v) => v.profesorId === profesorId),
    [visitas]
  );

  const getProfesorById = useCallback(
    (id: string) => profesores.find((p) => p.id === id),
    [profesores]
  );

  const logout = useCallback(async () => {
    await authLogout();
    setCurrentUser(null);
    setProfesores([]);
    setVisitas([]);
    setVisitasProgramadas([]);
  }, []);

  useEffect(() => {
    const checkAuth = () => {
      if (isAuthenticated()) {
        const user = getCurrentUser();
        setCurrentUser(user);
      } else {
        setCurrentUser(null);
      }
    };
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider
      value={{
        profesores,
        visitas,
        visitasProgramadas,
        loading,
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
