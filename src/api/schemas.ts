/**
 * Esquemas Zod para validación de requests/responses de la API
 *
 * Alineados con el contrato API (API_CONTRACT.md).
 * Se usan para validar datos en modo mock y como capa extra de seguridad con la API real.
 */

import { z } from 'zod';

// ─── DatosDocente ──────────────────────────────────────────────────────
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

// ─── Rúbrica (frontend local con nombre) ───────────────────────────────
export const RubricaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  nivel: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.null()]),
  observaciones: z.string(),
});

// ─── Rúbrica API (como la devuelve el backend) ─────────────────────────
export const RubricaAPISchema = z.object({
  id: z.string(),
  visitaId: z.string().optional(),
  rubricaId: z.string(),
  nivel: z.number().nullable(),
  observaciones: z.string(),
  createdAt: z.string().optional(),
});

// ─── Upload File Response ──────────────────────────────────────────────
export const UploadFileResponseSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  url: z.string(),
  tipo: z.string(),
  size: z.number(),        // Contrato usa "size", no "tamaño"
  mimeType: z.string(),
  uploadedAt: z.string(),
});

// ─── User ──────────────────────────────────────────────────────────────
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombre: z.string(),
  apellido: z.string(),
  rol: z.string(),
  ie: z.string().nullable(),
  foto: z.string().nullable(),
  activo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// ─── Auth Response ─────────────────────────────────────────────────────
export const AuthResponseDataSchema = z.object({
  token: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: UserSchema,
});

// ─── IA Autocompletar Response ─────────────────────────────────────────
export const AIAutocompleteResponseSchema = z.object({
  evaluacionId: z.string(),
  estado: z.string(),
  requiereConfirmacionHumana: z.boolean(),
  datosDocente: DatosDocenteSchema,
  rubricas: z.array(z.object({
    id: z.string(),
    rubricaId: z.string(),
    nivel: z.number().nullable(),
    observaciones: z.string(),
  })),
  observacionGeneral: z.string().nullable(),
  explicacionesRubricas: z.array(z.object({
    rubricaId: z.string(),
    razon: z.string(),
    extractos: z.array(z.string()).nullable().optional(),
  })).nullable(),
  sugerenciasMejora: z.array(z.string()).nullable(),
  puntajeTotal: z.number().nullable(),
});

// ─── Create Visita Payload ─────────────────────────────────────────────
export const CreateVisitaPayloadSchema = z.object({
  profesorId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  datosDocente: DatosDocenteSchema,
  rubricas: z.array(z.object({
    rubricaId: z.string(),
    nivel: z.number().nullable(),
    observaciones: z.string(),
  })).min(1, 'Debe evaluar al menos una rúbrica'),
  archivoId: z.string().nullable().optional(),
  iaSuggestionId: z.string().nullable().optional(),
});

// ─── Create Visita Response ────────────────────────────────────────────
export const CreateVisitaResponseSchema = z.object({
  id: z.string(),
  profesorId: z.string(),
  fecha: z.string(),
  hora: z.string(),
  nivelLogroTotal: z.number(),
  rubricas: z.array(RubricaAPISchema),
  datosDocente: DatosDocenteSchema,
  archivoUrl: z.string().nullable().optional(),
  createdAt: z.string(),
});

// ─── Pagination ────────────────────────────────────────────────────────
export const PaginationSchema = z.object({
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});
