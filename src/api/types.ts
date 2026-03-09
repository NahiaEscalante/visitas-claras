/**
 * Tipos de Request/Response específicos de la API
 *
 * Estos tipos representan los payloads exactos que el frontend envía y recibe
 * del backend, alineados con el contrato API (API_CONTRACT.md).
 */

import {
  DatosDocente,
  Rubrica,
  RubricaAPI,
  User,
  Archivo,
  CalendarChatResponse,
  StatsVisitas,
  Evaluacion,
  PaginationInfo,
  Visita,
  VisitaProgramada,
  ExplicacionRubrica,
  EvaluacionRubrica,
} from '@/types';

// ─── Auth ──────────────────────────────────────────────────────────────

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean | null;
}

export interface AuthResponseData {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

export interface RefreshRequest {
  refreshToken: string;
}

// ─── Profesores ────────────────────────────────────────────────────────

export interface CreateProfesorRequest {
  nombre: string;
  apellido: string;
  foto?: string | null;
  ie: string;
  salon: string;
  dni?: string | null;
  especialidad?: string | null;
  cargoLaboral?: string | null;
  nivelEducativo?: string | null;
  grado?: string | null;
  seccion?: string | null;
  areasCurriculares?: string | null;
  celular?: string | null;
}

export interface ProfesoresQueryParams {
  search?: string;
  ie?: string;
  activo?: boolean;
}

// ─── Archivos ──────────────────────────────────────────────────────────

/**
 * Respuesta de upload de archivo.
 * Nota: el campo es `size` (no `tamaño`) según el contrato API.
 */
export interface UploadFileResponse {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  size: number;        // bytes — contrato usa "size", no "tamaño"
  mimeType: string;
  uploadedAt: string;
}

export interface ArchivosQueryParams {
  tipo?: 'observacion' | 'documento' | 'foto';
  profesor_id?: string;  // ⚠️ snake_case según el contrato
  limit?: number;
  offset?: number;
}

// ─── IA ────────────────────────────────────────────────────────────────

/**
 * Request para POST /v1/ia/autocompletar
 * Nota: observadorId es requerido por el backend aunque también lo extrae del token.
 */
export interface AIAutocompleteRequest {
  profesorId: string;
  observadorId: string;   // Requerido — usar currentUser.id
  fecha: string;          // YYYY-MM-DD
  hora: string;           // HH:mm
  archivoId: string;
  contextoVisita?: string | null;
  notasUsuario?: string | null;
}

/**
 * Response de POST /v1/ia/autocompletar
 * Incluye evaluacionId y estado que el frontend anterior no tenía.
 */
export interface AIAutocompleteResponse {
  evaluacionId: string;
  estado: string;         // "draft"
  requiereConfirmacionHumana: boolean;
  datosDocente: DatosDocente;
  rubricas: Array<{
    id: string;
    rubricaId: string;
    nivel: number | null;
    observaciones: string;
  }>;
  observacionGeneral: string | null;
  explicacionesRubricas: ExplicacionRubrica[] | null;
  sugerenciasMejora: string[] | null;
  puntajeTotal: number | null;
}

// ─── Visitas ───────────────────────────────────────────────────────────

export interface VisitasQueryParams {
  profesorId?: string;
  fechaInicio?: string;    // YYYY-MM-DD
  fechaFin?: string;       // YYYY-MM-DD
  limit?: number;          // 1..100, default 50
  offset?: number;         // min 0, default 0
}

export interface VisitasListResponse {
  data: Visita[];
  pagination: PaginationInfo;
}

/**
 * Payload para POST /v1/visitas
 */
export interface CreateVisitaPayload {
  profesorId: string;
  fecha: string;           // YYYY-MM-DD
  hora: string;            // HH:mm
  datosDocente: DatosDocente;
  rubricas: Array<{
    id: string;            // Backend lo acepta pero genera su propio UUID
    rubricaId: string;
    nivel: number | null;
    observaciones: string;
  }>;
  archivoId?: string | null;
  iaSuggestionId?: string | null;
}

/**
 * Response de POST /v1/visitas (201)
 */
export interface CreateVisitaResponse {
  id: string;
  profesorId: string;
  fecha: string;
  hora: string;
  nivelLogroTotal: number;
  rubricas: RubricaAPI[];
  datosDocente: DatosDocente;
  archivoUrl: string | null;
  createdAt: string;
}

// ─── Visitas Programadas ───────────────────────────────────────────────

export interface VisitasProgramadasQueryParams {
  fecha?: string;
  desde?: string;
  hasta?: string;
  profesorId?: string;
  confirmada?: boolean;
  cancelada?: boolean;
  ie?: string;
  status?: string;
}

export interface CreateVisitaProgramadaRequest {
  profesorId: string;
  profesorNombre: string;
  fecha: string;           // YYYY-MM-DD
  hora: string;            // HH:mm
  ie: string;
  salon: string;
  confirmada?: boolean | null;
  duracionMinutos?: number | null;
}

export interface UpdateVisitaProgramadaRequest {
  fecha?: string | null;
  hora?: string | null;
  duracionMinutos?: number | null;
  confirmada?: boolean | null;
  notas?: string | null;
}

export interface CancelarVisitaProgramadaRequest {
  motivoCancelacion?: string | null;
  notas?: string | null;
}

export interface ReprogramarVisitaProgramadaRequest {
  fecha: string;
  hora: string;
  duracionMinutos?: number | null;
}

export interface FinalizarVisitaProgramadaRequest {
  notas?: string | null;
}

// ─── Calendar Chat ─────────────────────────────────────────────────────

export interface CalendarChatMessageRequest {
  text: string;
  conversationId?: string | null;
  archivoId?: string | null;
}

export interface CalendarChatConfirmRequest {
  proposalId: string;
}

export interface CalendarChatCancelRequest {
  proposalId: string;
}

// ─── Evaluaciones ──────────────────────────────────────────────────────

export interface UpdateEvaluacionRequest {
  observacionGeneral?: string | null;
  explicacionesRubricas?: ExplicacionRubrica[] | null;
  sugerenciasMejora?: string[] | null;
  puntajeTotal?: number | null;
  rubricas?: Array<{
    id: string;
    rubricaId: string;
    nivel: number | null;
    observaciones: string;
  }> | null;
}

// ─── Stats ─────────────────────────────────────────────────────────────

export interface StatsQueryParams {
  fechaInicio?: string;
  fechaFin?: string;
  ie?: string;
}
