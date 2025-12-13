/**
 * Usuarios mock del sistema
 * Simula diferentes roles: director, supervisor, profesor
 */

export type UserRole = 'director' | 'supervisor' | 'profesor' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string; // En producción esto sería un hash
  nombre: string;
  apellido: string;
  rol: UserRole;
  ie?: string; // Institución Educativa (opcional para admin)
  foto?: string;
  activo: boolean;
}

/**
 * Usuarios de ejemplo para el sistema simulado
 * 
 * Credenciales de prueba:
 * - director@ejemplo.edu.pe / director123
 * - supervisor@ejemplo.edu.pe / supervisor123
 * - admin@ejemplo.edu.pe / admin123
 */
export const mockUsers: User[] = [
  // Directores
  {
    id: 'user-1',
    email: 'director@ejemplo.edu.pe',
    password: 'director123',
    nombre: 'Juan',
    apellido: 'Pérez García',
    rol: 'director',
    ie: 'IE San Martín',
    foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
  {
    id: 'user-2',
    email: 'director.losandes@ejemplo.edu.pe',
    password: 'director123',
    nombre: 'María',
    apellido: 'González López',
    rol: 'director',
    ie: 'IE Los Andes',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
  // Supervisores
  {
    id: 'user-3',
    email: 'supervisor@ejemplo.edu.pe',
    password: 'supervisor123',
    nombre: 'Carlos',
    apellido: 'Rodríguez Martínez',
    rol: 'supervisor',
    ie: 'IE San Martín',
    foto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
  {
    id: 'user-4',
    email: 'supervisor.santarosa@ejemplo.edu.pe',
    password: 'supervisor123',
    nombre: 'Ana',
    apellido: 'Torres Vega',
    rol: 'supervisor',
    ie: 'IE Santa Rosa',
    foto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
  // Admin
  {
    id: 'user-5',
    email: 'admin@ejemplo.edu.pe',
    password: 'admin123',
    nombre: 'Sistema',
    apellido: 'Administrador',
    rol: 'admin',
    foto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
  // Profesores (para futuras funcionalidades)
  {
    id: 'user-6',
    email: 'profesor.maria@ejemplo.edu.pe',
    password: 'profesor123',
    nombre: 'María',
    apellido: 'García López',
    rol: 'profesor',
    ie: 'IE San Martín',
    foto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
    activo: true,
  },
];

/**
 * Buscar usuario por email
 */
export function findUserByEmail(email: string): User | undefined {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.activo);
}

/**
 * Buscar usuario por ID
 */
export function findUserById(id: string): User | undefined {
  return mockUsers.find(u => u.id === id && u.activo);
}

/**
 * Verificar credenciales
 */
export function verifyCredentials(email: string, password: string): User | null {
  const user = findUserByEmail(email);
  if (!user) return null;
  if (user.password !== password) return null;
  return user;
}

