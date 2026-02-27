export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  foto: string | null;
  ie: string;
  salon: string;
  dni?: string | null;
  cargo_laboral?: string | null;
  especialidad?: string | null;
  nivel_educativo?: string | null;
  grado?: string | null;
  seccion?: string | null;
  areas_curriculares?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface Rubrica {
  id: string;
  nombre: string;
  nivel: 1 | 2 | 3 | 4 | null;
  observaciones: string;
}

export interface ProfesorReducido {
  id: string;
  nombre: string;
  apellido: string;
  foto?: string | null;
}

export interface Visita {
  id: string;
  profesorId: string;
  profesor?: ProfesorReducido;
  fecha: string;
  hora: string;
  nivelLogroTotal: number;
  rubricas: Rubrica[];
  datosDocente: DatosDocente;
  archivoUrl?: string | null;
  createdBy?: { id: string; nombre: string; apellido: string } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DatosDocente {
  nombreCompleto: string;
  dni: string;
  cargoLaboral: string;
  especialidad: string;
  ie: string;
  nivelEducativo: string;
  grado: string;
  seccion: string;
  areasCurriculares: string;
  fechaVisita: string;
  horaInicio: string;
  horaFin: string;
}

export interface VisitaProgramada {
  id: string;
  profesorId: string | null;
  profesor?: ProfesorReducido | null;
  profesorNombre?: string | null;
  fecha: string;
  hora: string;
  ie: string;
  salon: string;
  confirmada: boolean;
  notas?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type RubricaNombre =
  | 'involucra'
  | 'razonamiento'
  | 'evalua'
  | 'respeto'
  | 'comportamiento';

/** Usuario de sesión (sin contraseña), alineado con API /v1/auth/me y login */
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: 'director' | 'supervisor' | 'admin';
  ie?: string | null;
  foto?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Plantilla de rúbricas (GET /v1/rubricas) */
export interface RubricaTemplate {
  id: string;
  nombre: string;
  descripcion: string;
  niveles: {
    nivel1: string;
    nivel2: string;
    nivel3: string;
    nivel4: string;
  };
}

/** Paginación en respuestas de la API */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
