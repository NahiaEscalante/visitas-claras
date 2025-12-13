import { apiRequest } from './http';
import { isApiModeEnabled } from './config';
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
import {
  mockUploadArchivo,
  mockAIAutocompletar,
  mockCrearVisita,
} from '@/services/mockApi';

/**
 * Endpoints de la API
 * Si no hay API configurada, usa el sistema mock simulado
 * Todas las funciones validan la respuesta con Zod antes de retornar
 */

/**
 * Sube un archivo de observación
 */
export async function uploadArchivoObservacion(
  file: File,
  profesorId?: string
): Promise<UploadFileResponse> {
  // Si no hay API, usar mock
  if (!isApiModeEnabled()) {
    try {
      const result = await mockUploadArchivo(file, profesorId);
      // Validar con Zod
      const validated = UploadFileResponseSchema.parse(result);
      return validated;
    } catch (error) {
      console.error('Error en mockUploadArchivo:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al subir archivo');
    }
  }

  // API real
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
  // Si no hay API, usar mock
  if (!isApiModeEnabled()) {
    try {
      const result = await mockAIAutocompletar(input);
      console.log('Resultado del mock antes de validar:', result);
      
      // Validar con Zod
      try {
        const validated = AIAutocompleteResponseSchema.parse(result);
        console.log('Validación exitosa:', validated);
        return validated;
      } catch (validationError) {
        console.error('Error de validación Zod:', validationError);
        // Si hay error de validación, intentar corregir los datos
        if (validationError instanceof Error && 'issues' in validationError) {
          const zodError = validationError as any;
          console.error('Detalles del error de validación:', JSON.stringify(zodError.issues, null, 2));
        }
        throw new Error(`Error de validación: ${validationError instanceof Error ? validationError.message : 'Formato de datos inválido'}`);
      }
    } catch (error) {
      console.error('Error en mockAIAutocompletar:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error al procesar autocompletado con IA');
    }
  }

  // API real
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

  // Si no hay API, usar mock
  if (!isApiModeEnabled()) {
    const result = await mockCrearVisita(validatedPayload);
    // Validar con Zod
    return CreateVisitaResponseSchema.parse(result);
  }

  // API real
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

