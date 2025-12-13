import { apiRequest } from './http';
import {
  UploadFileResponse,
  AIAutocompleteRequest,
  AIAutocompleteResponse,
  CreateVisitaPayload,
  CreateVisitaResponse,
} from './types';
import {
  UploadFileResponseSchema,
  AIAutocompleteResponseSchema,
  CreateVisitaPayloadSchema,
  CreateVisitaResponseSchema,
} from './schemas';

/**
 * Endpoints de la API
 * Todas las funciones validan la respuesta con Zod antes de retornar
 */

/**
 * Sube un archivo de observación
 */
export async function uploadArchivoObservacion(
  file: File,
  profesorId?: string
): Promise<UploadFileResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('tipo', 'observacion');
  if (profesorId) {
    formData.append('profesorId', profesorId);
  }

  const response = await apiRequest<UploadFileResponse>('/archivos/upload', {
    method: 'POST',
    body: formData,
    isMultipart: true,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al subir archivo');
  }

  // Validar con Zod
  const validated = UploadFileResponseSchema.parse(response.data);
  return validated;
}

/**
 * Autocompletar visita con IA
 */
export async function aiAutocompletarVisita(
  input: AIAutocompleteRequest
): Promise<AIAutocompleteResponse> {
  const response = await apiRequest<AIAutocompleteResponse>(
    '/visitas/ai/autocompletar',
    {
      method: 'POST',
      body: input,
    }
  );

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al autocompletar con IA');
  }

  // Validar con Zod
  const validated = AIAutocompleteResponseSchema.parse(response.data);
  return validated;
}

/**
 * Crear una nueva visita
 */
export async function crearVisita(
  payload: CreateVisitaPayload
): Promise<CreateVisitaResponse> {
  // Validar payload antes de enviar
  const validatedPayload = CreateVisitaPayloadSchema.parse(payload);

  const response = await apiRequest<CreateVisitaResponse>('/visitas', {
    method: 'POST',
    body: validatedPayload,
  });

  if (!response.success || !response.data) {
    throw new Error(response.error?.message || 'Error al crear visita');
  }

  // Validar respuesta con Zod
  const validated = CreateVisitaResponseSchema.parse(response.data);
  return validated;
}

