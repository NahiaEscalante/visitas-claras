import { apiRequest } from './http';
import {
  UploadFileResponse,
  AIAutocompleteRequest,
  AIAutocompleteResponse,
  CreateVisitaPayload,
  CreateVisitaResponse,
} from './types';
import type { Profesor, Visita, VisitaProgramada, RubricaTemplate } from '@/types';
import type { Pagination } from '@/types';
import {
  UploadFileResponseSchema,
  AIAutocompleteResponseSchema,
  CreateVisitaPayloadSchema,
  CreateVisitaResponseSchema,
} from './schemas';

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `?${q}` : '';
}

// --- Archivos ---

export async function uploadArchivoObservacion(
  file: File,
  profesorId?: string
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tipo', 'observacion');
  if (profesorId) formData.append('profesorId', profesorId);

  const response = await apiRequest<UploadFileResponse>('archivos/upload', {
    method: 'POST',
    body: formData,
    isMultipart: true,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al subir archivo');
  }
  return UploadFileResponseSchema.parse(response.data) as UploadFileResponse;
}

export interface UploadAgendaResponse {
  archivoId: string;
  archivoUrl: string;
  fechasExtraidas: Array<{
    profesorId: string | null;
    profesorNombre: string;
    ie: string;
    salon: string;
    fecha: string;
    hora: string;
    confianza: number;
  }>;
  procesado: boolean;
  totalFechas: number;
}

export async function uploadAgenda(file: File): Promise<UploadAgendaResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiRequest<UploadAgendaResponse>('archivos/upload-agenda', {
    method: 'POST',
    body: formData,
    isMultipart: true,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al subir agenda');
  }
  return response.data;
}

export async function deleteArchivo(id: string): Promise<void> {
  const response = await apiRequest<null>(`archivos/${id}`, { method: 'DELETE' });
  if (!response.success) {
    throw new Error(response.error?.message || 'Error al eliminar archivo');
  }
}

// --- IA ---

export async function aiAutocompletarVisita(
  input: AIAutocompleteRequest
): Promise<AIAutocompleteResponse> {
  const response = await apiRequest<AIAutocompleteResponse>('visitas/ai/autocompletar', {
    method: 'POST',
    body: input,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al autocompletar con IA');
  }
  return AIAutocompleteResponseSchema.parse(response.data) as AIAutocompleteResponse;
}

// --- Visitas ---

export async function crearVisita(payload: CreateVisitaPayload): Promise<CreateVisitaResponse> {
  const validatedPayload = CreateVisitaPayloadSchema.parse(payload);
  const response = await apiRequest<CreateVisitaResponse>('visitas', {
    method: 'POST',
    body: validatedPayload,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visita');
  }
  return CreateVisitaResponseSchema.parse(response.data) as CreateVisitaResponse;
}

export interface GetVisitasParams {
  profesorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  nivelLogro?: number;
  ie?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetVisitasResponse {
  visitas: Visita[];
  pagination: Pagination;
}

export async function getVisitas(params: GetVisitasParams = {}): Promise<GetVisitasResponse> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  const response = await apiRequest<GetVisitasResponse>(`visitas${query}`, { method: 'GET' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al listar visitas');
  }
  return response.data;
}

export async function getVisitaById(id: string): Promise<Visita> {
  const response = await apiRequest<Visita>(`visitas/${id}`, { method: 'GET' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener visita');
  }
  return response.data;
}

export interface GetVisitasByProfesorResponse {
  profesor: { id: string; nombre: string; apellido: string };
  visitas: Visita[];
  pagination: Pagination;
}

export async function getVisitasByProfesor(
  profesorId: string,
  params: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' } = {}
): Promise<GetVisitasByProfesorResponse> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  const response = await apiRequest<GetVisitasByProfesorResponse>(
    `visitas/profesores/${profesorId}/visitas${query}`,
    { method: 'GET' }
  );
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al listar visitas del profesor');
  }
  return response.data;
}

export async function updateVisita(id: string, body: Partial<CreateVisitaPayload>): Promise<Visita> {
  const response = await apiRequest<Visita>(`visitas/${id}`, {
    method: 'PUT',
    body,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al actualizar visita');
  }
  return response.data;
}

export async function deleteVisita(id: string): Promise<void> {
  const response = await apiRequest<null>(`visitas/${id}`, { method: 'DELETE' });
  if (!response.success) {
    throw new Error(response.error?.message || 'Error al eliminar visita');
  }
}

// --- Visitas programadas ---

export interface GetVisitasProgramadasParams {
  profesorId?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  confirmada?: boolean;
  ie?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface GetVisitasProgramadasResponse {
  visitas: VisitaProgramada[];
  pagination: Pagination;
}

export async function getVisitasProgramadas(
  params: GetVisitasProgramadasParams = {}
): Promise<GetVisitasProgramadasResponse> {
  const query = buildQuery(params as Record<string, string | number | boolean | undefined>);
  const response = await apiRequest<GetVisitasProgramadasResponse>(
    `visitas-programadas${query}`,
    { method: 'GET' }
  );
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al listar visitas programadas');
  }
  return response.data;
}

export async function getVisitaProgramadaById(id: string): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`visitas-programadas/${id}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener visita programada');
  }
  return response.data;
}

export interface CreateVisitaProgramadaPayload {
  profesorId?: string | null;
  fecha: string;
  hora: string;
  ie: string;
  salon: string;
  notas?: string | null;
}

export async function createVisitaProgramada(
  payload: CreateVisitaProgramadaPayload
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>('visitas-programadas', {
    method: 'POST',
    body: payload,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visita programada');
  }
  return response.data;
}

export interface CreateVisitasProgramadasBulkPayload {
  visitas: CreateVisitaProgramadaPayload[];
}

export interface CreateVisitasProgramadasBulkResponse {
  created: number;
  visitas: VisitaProgramada[];
}

export async function createVisitasProgramadasBulk(
  payload: CreateVisitasProgramadasBulkPayload
): Promise<CreateVisitasProgramadasBulkResponse> {
  const response = await apiRequest<CreateVisitasProgramadasBulkResponse>('visitas-programadas', {
    method: 'POST',
    body: payload,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visitas programadas');
  }
  return response.data;
}

export async function updateVisitaProgramada(
  id: string,
  body: Partial<CreateVisitaProgramadaPayload & { confirmada?: boolean }>
): Promise<VisitaProgramada> {
  const response = await apiRequest<VisitaProgramada>(`visitas-programadas/${id}`, {
    method: 'PUT',
    body,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al actualizar visita programada');
  }
  return response.data;
}

export async function deleteVisitaProgramada(id: string): Promise<void> {
  const response = await apiRequest<null>(`visitas-programadas/${id}`, { method: 'DELETE' });
  if (!response.success) {
    throw new Error(response.error?.message || 'Error al eliminar visita programada');
  }
}

// --- Profesores ---

export interface GetProfesoresParams {
  search?: string;
  ie?: string;
  page?: number;
  limit?: number;
}

export interface GetProfesoresResponse {
  profesores: Profesor[];
  pagination: Pagination;
}

export async function getProfesores(
  params: GetProfesoresParams = {}
): Promise<GetProfesoresResponse> {
  const query = buildQuery(params as Record<string, string | number | undefined>);
  const response = await apiRequest<GetProfesoresResponse>(`profesores${query}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al listar profesores');
  }
  return response.data;
}

export async function getProfesorById(id: string): Promise<Profesor> {
  const response = await apiRequest<Profesor>(`profesores/${id}`, { method: 'GET' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener profesor');
  }
  return response.data;
}

export interface CreateProfesorPayload {
  nombre: string;
  apellido: string;
  dni?: string | null;
  ie: string;
  salon: string;
  foto?: string | null;
  cargo_laboral?: string | null;
  especialidad?: string | null;
  nivel_educativo?: string | null;
  grado?: string | null;
  seccion?: string | null;
  areas_curriculares?: string | null;
}

export async function createProfesor(payload: CreateProfesorPayload): Promise<Profesor> {
  const response = await apiRequest<Profesor>('profesores', {
    method: 'POST',
    body: payload,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear profesor');
  }
  return response.data;
}

export async function updateProfesor(
  id: string,
  payload: Partial<CreateProfesorPayload>
): Promise<Profesor> {
  const response = await apiRequest<Profesor>(`profesores/${id}`, {
    method: 'PUT',
    body: payload,
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al actualizar profesor');
  }
  return response.data;
}

export async function deleteProfesor(id: string): Promise<void> {
  const response = await apiRequest<null>(`profesores/${id}`, { method: 'DELETE' });
  if (!response.success) {
    throw new Error(response.error?.message || 'Error al eliminar profesor');
  }
}

// --- Rúbricas ---

export interface GetRubricasResponse {
  rubricas: RubricaTemplate[];
}

export async function getRubricas(): Promise<RubricaTemplate[]> {
  const response = await apiRequest<GetRubricasResponse>('rubricas', { method: 'GET' });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener rúbricas');
  }
  return response.data.rubricas;
}

// --- Estadísticas (opcional) ---

export interface EstadisticasResponse {
  totalVisitas: number;
  totalProfesores: number;
  totalVisitasProgramadas: number;
  visitasPorNivel: { nivel1: number; nivel2: number; nivel3: number; nivel4: number };
  visitasPorMes: Array<{ mes: string; total: number; nivelPromedio: number }>;
  visitasPendientesConfirmar: number;
  promedioNivelLogro: number;
  rubricasPromedio: Record<string, number>;
}

export async function getEstadisticas(params?: {
  ie?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<EstadisticasResponse> {
  const query = buildQuery((params || {}) as Record<string, string | undefined>);
  const response = await apiRequest<EstadisticasResponse>(`estadisticas${query}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener estadísticas');
  }
  return response.data;
}

export async function getEstadisticasByProfesor(profesorId: string) {
  const response = await apiRequest<unknown>(`estadisticas/profesores/${profesorId}`, {
    method: 'GET',
  });
  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al obtener estadísticas del profesor');
  }
  return response.data;
}
