import { z } from 'zod';
import { DatosDocente, Rubrica } from '@/types';

/**
 * Esquemas Zod para validación de requests/responses de la API
 */

// Schema para respuesta de upload
export const UploadFileResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  url: z.string(),
  tipo: z.string(),
  tamaño: z.number(),
  mimeType: z.string(),
  uploadedAt: z.string(),
});

// Schema para DatosDocente
export const DatosDocenteSchema = z.object({
  nombreCompleto: z.string().min(1),
  dni: z.string(),
  cargoLaboral: z.string(),
  especialidad: z.string(),
  ie: z.string().min(1),
  nivelEducativo: z.string(),
  grado: z.string(),
  seccion: z.string(),
  areasCurriculares: z.string(),
  fechaVisita: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  horaInicio: z.string().regex(/^\d{2}:\d{2}$/),
  horaFin: z.string().regex(/^\d{2}:\d{2}$/),
});

// Schema para Rubrica
export const RubricaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  nivel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()]),
  observaciones: z.string(),
});

// Schema para respuesta de IA
export const AIAutocompleteResponseSchema = z.object({
  datosDocente: DatosDocenteSchema,
  rubricas: z.array(RubricaSchema).min(5).max(5), // Debe tener exactamente 5 rúbricas
  confianza: z
    .object({
      datosDocente: z.number().min(0).max(1),
      rubricas: z.record(z.string(), z.number().min(0).max(1)),
      general: z.number().min(0).max(1),
    })
    .optional(),
  advertencias: z
    .array(
      z.object({
        campo: z.string(),
        mensaje: z.string(),
        tipo: z.enum(['baja_confianza', 'campo_faltante', 'inconsistencia']),
      })
    )
    .optional(),
  textoEstructurado: z.string().optional(),
});

// Schema para payload de crear visita
export const CreateVisitaPayloadSchema = z.object({
  profesorId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  datosDocente: DatosDocenteSchema,
  rubricas: z
    .array(RubricaSchema)
    .min(1, 'Debe evaluar al menos una rúbrica')
    .refine(
      (rubricas) => rubricas.some((r) => r.nivel !== null),
      'Debe evaluar al menos una rúbrica'
    ),
  archivoId: z.string().optional(),
});

// Schema para respuesta de crear visita
export const CreateVisitaResponseSchema = z.object({
  id: z.string(),
  profesorId: z.string(),
  fecha: z.string(),
  hora: z.string(),
  nivelLogroTotal: z.number().min(1).max(4),
  rubricas: z.array(RubricaSchema),
  datosDocente: DatosDocenteSchema,
  archivoUrl: z.string().optional(),
  createdAt: z.string(),
});

