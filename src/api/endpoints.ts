/**
 * Endpoints de la API — alineados con el contrato (API_CONTRACT.md)
 *
 * Cada función:
 * 1. Si no hay API configurada (VITE_API_BASE_URL): usa el sistema mock.
 * 2. Si hay API: llama al backend real mediante apiRequest.
 *
 * Organización por dominio: Auth, Profesores, Visitas, VisitasProgramadas,
 * Archivos, IA, CalendarChat, Stats, Evaluaciones.
 */

import { apiRequest } from './http';
import { isApiModeEnabled } from './config';
import type {
  UploadFileResponse,
  AIAutocompleteRequest,
  AIAutocompleteResponse,
  CreateVisitaPayload,
  CreateVisitaResponse,
  LoginRequest,
  AuthResponseData,
  RefreshRequest,
  ProfesoresQueryParams,
  VisitasQueryParams,
  VisitasProgramadasQueryParams,
  CreateVisitaProgramadaRequest,
  UpdateVisitaProgramadaRequest,
  CancelarVisitaProgramadaRequest,
  ReprogramarVisitaProgramadaRequest,
  FinalizarVisitaProgramadaRequest,
  CalendarChatMessageRequest,
  CalendarChatConfirmRequest,
  CalendarChatCancelRequest,
  StatsQueryParams,
  UpdateEvaluacionRequest,
  ArchivosQueryParams,
} from './types';
import type {
  Profesor,
  Visita,
  VisitaProgramada,
  PaginationInfo,
  CalendarChatResponse,
  StatsVisitas,
  Evaluacion,
  DatosDocente,
  ExplicacionRubrica,
  User,
  Archivo,
} from '@/types';
import {
  mockUploadArchivo,
  mockAIAutocompletar,
  mockCrearVisita,
  mockGetProfesores,
  mockGetVisitas,
  mockGetVisitasProgramadas,
  mockCrearVisitaProgramada,
  mockConfirmarVisitaProgramada,
} from '@/services/mockApi';

// ─── Helpers ───────────────────────────────────────────────────────────

/** Construye query string a partir de un objeto, omitiendo valores undefined/null */
function buildQueryString(params: Record<string, unknown>): string {
  const entries = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return entries.length > 0 ? `?${entries.join('&')}` : '';
}

// ═══════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════

/** POST /v1/auth/login */
export async function apiLogin(payload: LoginRequest): Promise<AuthResponseData> {
  const response = await apiRequest<AuthResponseData>('/v1/auth/login', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al iniciar sesión');
  }

  return response.data;
}

/** POST /v1/auth/refresh */
export async function apiRefresh(payload: RefreshRequest): Promise<AuthResponseData> {
  const response = await apiRequest<AuthResponseData>('/v1/auth/refresh', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al refrescar sesión');
  }

  return response.data;
}

/** POST /v1/auth/logout */
export async function apiLogout(): Promise<void> {
  await apiRequest('/v1/auth/logout', { method: 'POST' });
}

/** GET /v1/auth/me */
export async function apiGetMe(): Promise<User> {
  const response = await apiRequest<User>('/v1/auth/me');

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener usuario');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// PROFESORES
// ═══════════════════════════════════════════════════════════════════════

/** GET /v1/profesores */
export async function apiGetProfesores(params?: ProfesoresQueryParams): Promise<Profesor[]> {
  if (!isApiModeEnabled()) {
    return mockGetProfesores();
  }

  const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
  const response = await apiRequest<Profesor[]>(`/v1/profesores${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener profesores');
  }

  return response.data;
}

/** GET /v1/profesores/{id} */
export async function apiGetProfesor(id: string): Promise<Profesor> {
  const response = await apiRequest<Profesor>(`/v1/profesores/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Profesor no encontrado');
  }

  return response.data;
}

/** POST /v1/profesores */
export async function apiCreateProfesor(payload: Omit<Profesor, 'id' | 'activo' | 'createdAt' | 'updatedAt'>): Promise<Profesor> {
  const response = await apiRequest<Profesor>('/v1/profesores', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear profesor');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// VISITAS
// ═══════════════════════════════════════════════════════════════════════

/** GET /v1/visitas (con paginación) */
export async function apiGetVisitas(
  params?: VisitasQueryParams
): Promise<{ data: Visita[]; pagination: PaginationInfo }> {
  if (!isApiModeEnabled()) {
    const visitas = await mockGetVisitas();
    return {
      data: visitas as unknown as Visita[],
      pagination: { total: visitas.length, limit: 50, offset: 0 },
    };
  }

  const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
  const response = await apiRequest<Visita[]>(`/v1/visitas${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener visitas');
  }

  return {
    data: response.data,
    pagination: response.pagination || { total: response.data.length, limit: 50, offset: 0 },
  };
}

/** GET /v1/visitas/{id} */
export async function apiGetVisita(id: string): Promise<Visita> {
  const response = await apiRequest<Visita>(`/v1/visitas/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Visita no encontrada');
  }

  return response.data;
}

/** POST /v1/visitas */
export async function apiCreateVisita(payload: CreateVisitaPayload): Promise<CreateVisitaResponse> {
  if (!isApiModeEnabled()) {
    // Adaptar payload para mock (el mock usa el formato anterior con Rubrica)
    const mockPayload = {
      profesorId: payload.profesorId,
      fecha: payload.fecha,
      hora: payload.hora,
      datosDocente: payload.datosDocente,
      rubricas: payload.rubricas.map(r => ({
        id: r.rubricaId,
        nombre: r.rubricaId,
        nivel: r.nivel as 1 | 2 | 3 | 4 | null,
        observaciones: r.observaciones,
      })),
      archivoId: payload.archivoId || undefined,
    };
    const result = await mockCrearVisita(mockPayload);
    return result;
  }

  const response = await apiRequest<CreateVisitaResponse>('/v1/visitas', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visita');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// VISITAS PROGRAMADAS
// ═══════════════════════════════════════════════════════════════════════

/** GET /v1/visitas-programadas */
export async function apiGetVisitasProgramadas(
  params?: VisitasProgramadasQueryParams
): Promise<VisitaProgramada[]> {
  if (!isApiModeEnabled()) {
    return mockGetVisitasProgramadas() as unknown as Promise<VisitaProgramada[]>;
  }

  const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
  const response = await apiRequest<VisitaProgramada[]>(`/v1/visitas-programadas${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener visitas programadas');
  }

  return response.data;
}

/** GET /v1/visitas-programadas/{id} */
export async function apiGetVisitaProgramada(id: string): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Visita programada no encontrada');
  }

  return response.data;
}

/** POST /v1/visitas-programadas */
export async function apiCreateVisitaProgramada(
  payload: CreateVisitaProgramadaRequest
): Promise<VisitaProgramada> {
  if (!isApiModeEnabled()) {
    return mockCrearVisitaProgramada(payload as any) as unknown as Promise<VisitaProgramada>;
  }

  const response = await apiRequest<VisitaProgramada>('/v1/visitas-programadas', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visita programada');
  }

  return response.data;
}

/** PUT /v1/visitas-programadas/{id} */
export async function apiUpdateVisitaProgramada(
  id: string,
  payload: UpdateVisitaProgramadaRequest
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}`, {
    method: 'PUT',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al actualizar visita programada');
  }

  return response.data;
}

/** PUT /v1/visitas-programadas/{id}/confirmar */
export async function apiConfirmarVisitaProgramada(id: string): Promise<VisitaProgramada> {
  if (!isApiModeEnabled()) {
    return mockConfirmarVisitaProgramada(id) as unknown as Promise<VisitaProgramada>;
  }

  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}/confirmar`, {
    method: 'PUT',
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al confirmar visita programada');
  }

  return response.data;
}

/** PUT /v1/visitas-programadas/{id}/cancelar */
export async function apiCancelarVisitaProgramada(
  id: string,
  payload?: CancelarVisitaProgramadaRequest
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}/cancelar`, {
    method: 'PUT',
    body: payload || {},
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al cancelar visita programada');
  }

  return response.data;
}

/** PUT /v1/visitas-programadas/{id}/reprogramar */
export async function apiReprogramarVisitaProgramada(
  id: string,
  payload: ReprogramarVisitaProgramadaRequest
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}/reprogramar`, {
    method: 'PUT',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al reprogramar visita programada');
  }

  return response.data;
}

/** PUT /v1/visitas-programadas/{id}/finalizar */
export async function apiFinalizarVisitaProgramada(
  id: string,
  payload?: FinalizarVisitaProgramadaRequest
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`/v1/visitas-programadas/${id}/finalizar`, {
    method: 'PUT',
    body: payload || {},
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al finalizar visita programada');
  }

  return response.data;
}

/** DELETE /v1/visitas-programadas/{id} — responde 204 */
export async function apiDeleteVisitaProgramada(id: string): Promise<void> {
  const response = await apiRequest(`/v1/visitas-programadas/${id}`, {
    method: 'DELETE',
  });

  if (!response.success) {
    throw new Error(response.error?.message || 'Error al eliminar visita programada');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// ARCHIVOS
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /v1/archivos/upload (multipart/form-data)
 * @param file - Archivo a subir
 * @param tipo - Tipo de archivo: "observacion" | "documento" | "foto"
 * @param profesorId - UUID del profesor (opcional)
 */
export async function apiUploadArchivo(
  file: File,
  tipo: string = 'observacion',
  profesorId?: string
): Promise<UploadFileResponse> {
  if (!isApiModeEnabled()) {
    const result = await mockUploadArchivo(file, profesorId);
    // Adaptar mock (que usa 'tamaño') al tipo real (que usa 'size')
    return {
      ...result,
      size: result.tamaño ?? result.size ?? file.size,
    } as UploadFileResponse;
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('tipo', tipo);
  if (profesorId) {
    formData.append('profesorId', profesorId);
  }

  const response = await apiRequest<UploadFileResponse>('/v1/archivos/upload', {
    method: 'POST',
    body: formData,
    isMultipart: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al subir archivo');
  }

  return response.data;
}

/**
 * GET /v1/archivos
 * ⚠️ El query param de profesor es `profesor_id` (snake_case) según el contrato.
 */
export async function apiGetArchivos(params?: ArchivosQueryParams): Promise<Archivo[]> {
  const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
  const response = await apiRequest<Archivo[]>(`/v1/archivos${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener archivos');
  }

  return response.data;
}

/**
 * GET /v1/archivos/{id} — retorna BINARIO (blob), no JSON.
 */
export async function apiDownloadArchivo(id: string): Promise<Blob> {
  const response = await apiRequest<Blob>(`/v1/archivos/${id}`, {
    isBinary: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al descargar archivo');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// IA
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /v1/ia/autocompletar
 *
 * ⚠️ Ruta corregida: el contrato indica `/v1/ia/autocompletar`,
 *    NO `/v1/visitas/ai/autocompletar` como estaba antes.
 */
export async function apiIAAutocompletar(
  input: AIAutocompleteRequest
): Promise<AIAutocompleteResponse> {
  if (!isApiModeEnabled()) {
    const result = await mockAIAutocompletar(input as any);
    // Adaptar respuesta del mock al formato de la API real
    return {
      evaluacionId: `eval-mock-${Date.now()}`,
      estado: 'draft',
      requiereConfirmacionHumana: true,
      datosDocente: result.datosDocente,
      rubricas: result.rubricas.map(r => ({
        id: r.id,
        rubricaId: r.id,
        nivel: r.nivel,
        observaciones: r.observaciones,
      })),
      observacionGeneral: result.observacionGeneral || null,
      explicacionesRubricas: result.explicacionesRubricas || null,
      sugerenciasMejora: result.sugerenciasMejora || null,
      puntajeTotal: result.puntajeTotal || null,
    };
  }

  const response = await apiRequest<AIAutocompleteResponse>('/v1/ia/autocompletar', {
    method: 'POST',
    body: input,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al autocompletar con IA');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// CALENDAR CHAT
// ═══════════════════════════════════════════════════════════════════════

/** POST /v1/calendar-chat/message */
export async function apiCalendarChatMessage(
  payload: CalendarChatMessageRequest
): Promise<CalendarChatResponse> {
  const response = await apiRequest<CalendarChatResponse>('/v1/calendar-chat/message', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error en calendar chat');
  }

  return response.data;
}

/** POST /v1/calendar-chat/confirm */
export async function apiCalendarChatConfirm(
  payload: CalendarChatConfirmRequest
): Promise<CalendarChatResponse> {
  const response = await apiRequest<CalendarChatResponse>('/v1/calendar-chat/confirm', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al confirmar propuesta');
  }

  return response.data;
}

/** POST /v1/calendar-chat/cancel */
export async function apiCalendarChatCancel(
  payload: CalendarChatCancelRequest
): Promise<CalendarChatResponse> {
  const response = await apiRequest<CalendarChatResponse>('/v1/calendar-chat/cancel', {
    method: 'POST',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al cancelar propuesta');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// STATS
// ═══════════════════════════════════════════════════════════════════════

/** GET /v1/stats/visitas */
export async function apiGetStatsVisitas(params?: StatsQueryParams): Promise<StatsVisitas> {
  const qs = params ? buildQueryString(params as Record<string, unknown>) : '';
  const response = await apiRequest<StatsVisitas>(`/v1/stats/visitas${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener estadísticas');
  }

  return response.data;
}

// ═══════════════════════════════════════════════════════════════════════
// EVALUACIONES
// ═══════════════════════════════════════════════════════════════════════

/** GET /v1/evaluaciones/{evaluacion_id} */
export async function apiGetEvaluacion(id: string): Promise<Evaluacion> {
  const response = await apiRequest<Evaluacion>(`/v1/evaluaciones/${id}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Evaluación no encontrada');
  }

  return response.data;
}

/** PATCH /v1/evaluaciones/{evaluacion_id} (solo si estado=draft) */
export async function apiUpdateEvaluacion(
  id: string,
  payload: UpdateEvaluacionRequest
): Promise<Evaluacion> {
  const response = await apiRequest<Evaluacion>(`/v1/evaluaciones/${id}`, {
    method: 'PATCH',
    body: payload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al actualizar evaluación');
  }

  return response.data;
}

/** PATCH /v1/evaluaciones/{evaluacion_id}/confirmar */
export async function apiConfirmarEvaluacion(id: string): Promise<Evaluacion> {
  const response = await apiRequest<Evaluacion>(`/v1/evaluaciones/${id}/confirmar`, {
    method: 'PATCH',
    body: {},
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al confirmar evaluación');
  }

  return response.data;
}
// ═══════════════════════════════════════════════════════════════════════
// EVALUACIONES POR PROFESOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /v1/evaluaciones/profesor/{profesor_id}
 * Obtiene todas las evaluaciones de un profesor.
 * La respuesta del backend viene en snake_case, se normaliza a camelCase.
 */
export async function apiGetEvaluacionesByProfesor(
  profesorId: string,
  estado?: 'draft' | 'confirmed',
  limit: number = 50,
  offset: number = 0
): Promise<Evaluacion[]> {
  const params = new URLSearchParams();
  if (estado) params.set('estado', estado);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  const qs = `?${params.toString()}`;

  const response = await apiRequest<any[]>(`/v1/evaluaciones/profesor/${profesorId}${qs}`);

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener evaluaciones del profesor');
  }

  // Normalizar snake_case → camelCase
  return response.data.map((raw: any): Evaluacion => ({
    id: raw.id,
    profesorId: raw.profesor_id ?? raw.profesorId ?? profesorId,
    observadorId: raw.observador_id ?? raw.observadorId ?? '',
    archivoId: raw.archivo_id ?? raw.archivoId ?? null,
    estado: raw.estado ?? 'draft',
    requiereConfirmacionHumana: raw.requiere_confirmacion_humana ?? raw.requiereConfirmacionHumana ?? true,
    datosDocente: normalizeDatosDocenteFromAPI(raw.datos_docente ?? raw.datosDocente ?? {}),
    observacionGeneral: raw.observacion_general ?? raw.observacionGeneral ?? null,
    explicacionesRubricas: normalizeExplicacionesRubricas(raw.explicaciones_rubricas ?? raw.explicacionesRubricas),
    sugerenciasMejora: raw.sugerencias_mejora ?? raw.sugerenciasMejora ?? null,
    puntajeTotal: raw.puntaje_total ?? raw.puntajeTotal ?? null,
    confirmadoPorId: raw.confirmado_por_id ?? raw.confirmadoPorId ?? null,
    fechaConfirmacion: raw.fecha_confirmacion ?? raw.fechaConfirmacion ?? null,
    contextoVisita: raw.contexto_visita ?? raw.contextoVisita ?? null,
    notasUsuario: raw.notas_usuario ?? raw.notasUsuario ?? null,
    rubricas: (raw.rubricas ?? []).map((r: any) => ({
      id: r.id,
      evaluacionId: r.evaluacion_id ?? r.evaluacionId,
      rubricaId: r.rubrica_id ?? r.rubricaId ?? '',
      nivel: r.nivel,
      observaciones: r.observaciones ?? '',
      createdAt: r.created_at ?? r.createdAt,
    })),
    createdAt: raw.created_at ?? raw.createdAt ?? '',
    updatedAt: raw.updated_at ?? raw.updatedAt ?? '',
  }));
}

/** Normaliza datosDocente de snake_case (backend) a camelCase (frontend) */
function normalizeDatosDocenteFromAPI(raw: Record<string, any>): DatosDocente {
  return {
    nombreCompleto: raw.nombreCompleto ?? raw.nombre_completo ?? '',
    dni: raw.dni ?? raw.DNI ?? '',
    cargoLaboral: raw.cargoLaboral ?? raw.cargo_laboral ?? '',
    especialidad: raw.especialidad ?? '',
    ie: raw.ie ?? raw.IE ?? '',
    nivelEducativo: raw.nivelEducativo ?? raw.nivel_educativo ?? '',
    grado: raw.grado ?? '',
    seccion: raw.seccion ?? raw.sección ?? '',
    areasCurriculares: raw.areasCurriculares ?? raw.areas_curriculares ?? '',
    fechaVisita: raw.fechaVisita ?? raw.fecha_visita ?? '',
    horaInicio: raw.horaInicio ?? raw.hora_inicio ?? '',
    horaFin: raw.horaFin ?? raw.hora_fin ?? '',
  };
}

/** Normaliza explicacionesRubricas de snake_case a camelCase */
function normalizeExplicacionesRubricas(raw: any[] | null | undefined): ExplicacionRubrica[] | null {
  if (!raw) return null;
  return raw.map((e: any) => ({
    rubricaId: e.rubrica_id ?? e.rubricaId ?? '',
    razon: e.razon ?? '',
    extractos: e.extractos ?? null,
  }));
}

// ═══════════════════════════════════════════════════════════════════════
// ALIASES DE COMPATIBILIDAD
// ═══════════════════════════════════════════════════════════════════════
// Estas funciones mantienen compatibilidad con el código existente que las importa.

/** @deprecated Usar apiUploadArchivo en su lugar */
export async function uploadArchivoObservacion(
  file: File,
  profesorId?: string
): Promise<UploadFileResponse> {
  return apiUploadArchivo(file, 'observacion', profesorId);
}

/** @deprecated Usar apiIAAutocompletar en su lugar */
export async function aiAutocompletarVisita(
  input: AIAutocompleteRequest
): Promise<AIAutocompleteResponse> {
  return apiIAAutocompletar(input);
}

/** @deprecated Usar apiCreateVisita en su lugar */
export async function crearVisita(
  payload: CreateVisitaPayload
): Promise<CreateVisitaResponse> {
  return apiCreateVisita(payload);
}
