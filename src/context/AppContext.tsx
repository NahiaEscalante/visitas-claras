/**
 * Contexto global de la aplicación
 *
 * Gestiona estado de profesores, visitas, visitas programadas y usuario autenticado.
 * Soporta dos modos:
 * - API real: cuando VITE_API_BASE_URL está definida, usa endpoints reales.
 * - Mock: cuando no hay API, usa datos simulados locales.
 *
 * Escucha el evento 'auth:logout' disparado por el interceptor HTTP para
 * limpiar la sesión si el refresh token falla.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Profesor, Visita, VisitaProgramada, User } from '@/types';
import { profesores as profesoresData, visitasIniciales, visitasProgramadasIniciales } from '@/data/mockData';
import { getCurrentUser, isAuthenticated, logout as authLogout, fetchCurrentUser } from '@/services/auth';
import { isApiModeEnabled } from '@/api/config';
import { apiGetProfesores, apiGetVisitas, apiGetVisitasProgramadas } from '@/api/endpoints';
import { mockGetVisitas, mockGetVisitasProgramadas } from '@/services/mockApi';

interface AppContextType {
  profesores: Profesor[];
  visitas: Visita[];
  visitasProgramadas: VisitaProgramada[];
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  agregarVisita: (visita: Visita) => void;
  agregarVisitaProgramada: (visita: VisitaProgramada) => void;
  confirmarVisitaProgramada: (id: string) => void;
  actualizarVisitaProgramada: (id: string, datos: Partial<VisitaProgramada>) => void;
  getVisitasByProfesor: (profesorId: string) => Visita[];
  getProfesorById: (id: string) => Profesor | undefined;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profesores, setProfesores] = useState<Profesor[]>(
    isApiModeEnabled() ? [] : (profesoresData as unknown as Profesor[])
  );
  const [visitas, setVisitas] = useState<Visita[]>(
    isApiModeEnabled() ? [] : (visitasIniciales as unknown as Visita[])
  );
  const [visitasProgramadas, setVisitasProgramadas] = useState<VisitaProgramada[]>(
    isApiModeEnabled() ? [] : (visitasProgramadasIniciales as unknown as VisitaProgramada[])
  );
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoadingState, setIsLoading] = useState(true);

  // ── Sincronizar datos mock ──
  const refreshDataMock = async () => {
    try {
      const [visitasData, visitasProgramadasData] = await Promise.all([
        mockGetVisitas(),
        mockGetVisitasProgramadas(),
      ]);
      setVisitas(visitasData as unknown as Visita[]);
      setVisitasProgramadas(visitasProgramadasData as unknown as VisitaProgramada[]);
    } catch (error) {
      console.error('Error al refrescar datos mock:', error);
    }
  };

  // ── Sincronizar datos desde la API real ──
  const refreshData = useCallback(async () => {
    if (!isApiModeEnabled()) {
      return refreshDataMock();
    }

    try {
      const [profesoresResp, visitasResp, vpResp] = await Promise.all([
        apiGetProfesores().catch(() => [] as Profesor[]),
        apiGetVisitas().catch(() => ({ data: [] as Visita[], pagination: { total: 0, limit: 50, offset: 0 } })),
        apiGetVisitasProgramadas().catch(() => [] as VisitaProgramada[]),
      ]);

      setProfesores(profesoresResp);
      setVisitas(visitasResp.data);
      setVisitasProgramadas(vpResp);
    } catch (error) {
      console.error('Error al refrescar datos:', error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Cargar usuario actual al iniciar ──
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      try {
        if (isApiModeEnabled()) {
          const user = await fetchCurrentUser();
          setCurrentUser(user);
          if (user) {
            await refreshData();
          }
        } else {
          const user = getCurrentUser();
          setCurrentUser(user);
          if (user) {
            await refreshDataMock();
          }
        }
      } catch (error) {
        console.error('Error inicializando auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Escuchar eventos de autenticación ──
  useEffect(() => {
    const handleForcedLogout = () => {
      setCurrentUser(null);
      if (isApiModeEnabled()) {
        setProfesores([]);
        setVisitas([]);
        setVisitasProgramadas([]);
      } else {
        setVisitas(visitasIniciales as unknown as Visita[]);
        setVisitasProgramadas(visitasProgramadasIniciales as unknown as VisitaProgramada[]);
      }
    };

    const handleLogin = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        refreshData();
      }
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    window.addEventListener('auth:login', handleLogin);
    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, [refreshData]);

  const agregarVisita = (visita: Visita) => {
    setVisitas(prev => [...prev, visita]);
    refreshData();
  };

  const agregarVisitaProgramada = (visita: VisitaProgramada) => {
    setVisitasProgramadas(prev => [...prev, visita]);
    refreshData();
  };

  const confirmarVisitaProgramada = (id: string) => {
    setVisitasProgramadas(prev =>
      prev.map(v => (v.id === id ? { ...v, confirmada: true } : v))
    );
    refreshData();
  };

  const actualizarVisitaProgramada = (id: string, datos: Partial<VisitaProgramada>) => {
    setVisitasProgramadas(prev =>
      prev.map(v => (v.id === id ? { ...v, ...datos } : v))
    );
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
    if (isApiModeEnabled()) {
      setProfesores([]);
      setVisitas([]);
      setVisitasProgramadas([]);
    } else {
      setVisitas(visitasIniciales as unknown as Visita[]);
      setVisitasProgramadas(visitasProgramadasIniciales as unknown as VisitaProgramada[]);
    }
  };

  // ── Verificar periódicamente la autenticación (solo mock) ──
  useEffect(() => {
    if (isApiModeEnabled()) return; // No necesario con API real (el interceptor maneja 401)

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
        currentUser,
        isAuthenticated: isAuthenticated(),
        isLoading: isLoadingState,
        agregarVisita,
        agregarVisitaProgramada,
        confirmarVisitaProgramada,
        actualizarVisitaProgramada,
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
