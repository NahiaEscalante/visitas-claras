import { DatosDocente, Rubrica } from '@/types';

/**
 * Tipos para la API de autocompletado con IA
 */

export interface AIAutocompleteRequest {
  profesorId: string;
  fecha: string; // ISO date string (YYYY-MM-DD)
  hora: string; // HH:mm
  archivoId: string;
  contextoVisita?: string; // Contexto adicional opcional
  notasUsuario?: string; // Notas del usuario opcional
}

export interface AIAutocompleteResponse {
  datosDocente: DatosDocente;
  rubricas: Rubrica[];
  confianza?: {
    datosDocente: number; // 0-1
    rubricas: Record<string, number>; // id de rúbrica -> confianza 0-1
    general: number; // 0-1
  };
  advertencias?: Array<{
    campo: string;
    mensaje: string;
    tipo: 'baja_confianza' | 'campo_faltante' | 'inconsistencia';
  }>;
  textoEstructurado?: string; // Texto extraído del documento
}

/**
 * Respuesta de upload de archivo
 */
export interface UploadFileResponse {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamaño: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Payload para crear visita
 */
export interface CreateVisitaPayload {
  profesorId: string;
  fecha: string; // ISO date string (YYYY-MM-DD)
  hora: string; // HH:mm
  datosDocente: DatosDocente;
  rubricas: Rubrica[];
  archivoId?: string;
}

/**
 * Respuesta de crear visita
 */
export interface CreateVisitaResponse {
  id: string;
  profesorId: string;
  fecha: string;
  hora: string;
  nivelLogroTotal: number;
  rubricas: Rubrica[];
  datosDocente: DatosDocente;
  archivoUrl?: string;
  createdAt: string;
}

