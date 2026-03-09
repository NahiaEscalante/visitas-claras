/**
 * Tipos de dominio del frontend — alineados con el contrato API (API_CONTRACT.md)
 *
 * Estos tipos representan las entidades de negocio tal como las devuelve el backend.
 * Los campos siguen la convención camelCase del contrato.
 */

// ─── Usuario autenticado ───────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  ie: string | null;
  foto: string | null;
  activo: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ─── Profesor ──────────────────────────────────────────────────────────
export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  foto: string;            // Backend retorna "" si es null en DB
  ie: string;
  salon: string;
  dni: string | null;
  especialidad: string | null;
  cargoLaboral: string | null;
  nivelEducativo: string | null;
  grado: string | null;
  seccion: string | null;
  areasCurriculares: string | null;
  celular: string | null;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Datos del docente (embebidos en Visita) ───────────────────────────
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
  fechaVisita: string;      // YYYY-MM-DD
  horaInicio: string;       // HH:mm
  horaFin: string;          // HH:mm
}

// ─── Rúbrica (evaluación individual dentro de una visita) ──────────────
export interface Rubrica {
  id: string;
  nombre: string;
  nivel: 1 | 2 | 3 | 4 | null;
  observaciones: string;
}

/**
 * Rúbrica tal como la devuelve la API en visitas y evaluaciones.
 * No incluye 'nombre' — solo rubricaId como identificador de desempeño.
 */
export interface RubricaAPI {
  id: string;               // UUID generado por el backend
  visitaId?: string;        // UUID de la visita asociada
  rubricaId: string;        // Identificador de la rúbrica (ej: "involucra")
  nivel: number | null;
  observaciones: string;
  createdAt?: string;
}

// ─── Visita ────────────────────────────────────────────────────────────
export interface Visita {
  id: string;
  profesorId: string;
  observadorId: string;
  fecha: string;             // YYYY-MM-DD
  hora: string;              // HH:mm
  nivelLogroTotal: number;
  datosDocente: DatosDocente;
  observacionGeneral: string | null;
  archivoId: string | null;
  createdAt: string;
  updatedAt: string;
  rubricas: RubricaAPI[];
  /** Solo presente en GET /visitas/{id} si la visita tiene IA asociada */
  ia?: {
    suggestionId: string;
    payload: Record<string, unknown>;
  };
}

// ─── Paginación (solo GET /visitas) ────────────────────────────────────
export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

// ─── Visita Programada ─────────────────────────────────────────────────
export type VisitaProgramadaStatus = 'pending' | 'active' | 'done' | 'canceled';

export interface VisitaProgramada {
  id: string;
  profesorId: string;
  profesorNombre: string;
  observadorId: string | null;
  fecha: string;             // YYYY-MM-DD
  hora: string;              // HH:mm
  duracionMinutos: number;   // default 90
  status: VisitaProgramadaStatus;
  ie: string;
  salon: string;
  confirmada: boolean;
  cancelada: boolean;
  motivoCancelacion: string | null;
  notas: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Archivo ───────────────────────────────────────────────────────────
export type ArchivoTipo = 'observacion' | 'documento' | 'foto';

export interface Archivo {
  id: string;
  nombre: string;
  url: string;               // "/v1/archivos/{id}"
  tipo: ArchivoTipo;
  size: number;              // bytes
  mimeType: string;
  uploadedAt: string;
}

// ─── Evaluación ────────────────────────────────────────────────────────
export type EvaluacionEstado = 'draft' | 'confirmed';

export interface ExplicacionRubrica {
  rubricaId: string;
  razon: string;
  extractos?: string[] | null;
}

export interface EvaluacionRubrica {
  id: string;
  evaluacionId?: string;
  rubricaId: string;
  nivel: number | null;
  observaciones: string;
  createdAt?: string;
}

export interface Evaluacion {
  id: string;
  profesorId: string;
  observadorId: string;
  archivoId: string | null;
  estado: EvaluacionEstado;
  requiereConfirmacionHumana: boolean;
  datosDocente: DatosDocente;
  observacionGeneral: string | null;
  explicacionesRubricas: ExplicacionRubrica[] | null;
  sugerenciasMejora: string[] | null;
  puntajeTotal: number | null;
  confirmadoPorId: string | null;
  fechaConfirmacion: string | null;
  contextoVisita: string | null;
  notasUsuario: string | null;
  rubricas: EvaluacionRubrica[];
  createdAt: string;
  updatedAt: string;
}

// ─── Estadísticas ──────────────────────────────────────────────────────
export interface EstadisticaPorInstitucion {
  ie: string;
  total: number;
  promedio: number;
}

export interface StatsVisitas {
  totalVisitas: number;
  nivelIV: number;
  nivelIII: number;
  porMejorar: number;
  porInstitucion: EstadisticaPorInstitucion[];
}

// ─── Calendar Chat ─────────────────────────────────────────────────────
export type CalendarChatType = 'ask' | 'info' | 'proposal' | 'result';

export interface CalendarChatAction {
  actionType: string;        // "create", "update", "cancel", etc.
  profesorId?: string;
  profesorNombre?: string;
  fecha?: string;
  hora?: string;
  duracionMinutos?: number;
  ie?: string;
  salon?: string;
  confirmada?: boolean;
}

export interface CalendarChatButton {
  id: string;
  label: string;
}

export interface CalendarChatResult {
  actionType: string;
  ok: boolean;
  data?: Record<string, unknown>;
}

/** Respuesta unificada del calendar-chat (discriminada por `type`) */
export interface CalendarChatResponse {
  type: CalendarChatType;
  message: string;
  // Campos presentes según el type:
  missingFields?: string[];               // type = "ask"
  proposalId?: string;                    // type = "proposal"
  actions?: CalendarChatAction[];         // type = "proposal"
  buttons?: CalendarChatButton[];         // type = "proposal"
  results?: CalendarChatResult[];         // type = "result"
}

// ─── Nombres de rúbricas (catálogo del frontend) ───────────────────────
export type RubricaNombre =
  | 'involucra'
  | 'razonamiento'
  | 'evalua'
  | 'respeto'
  | 'comportamiento';
