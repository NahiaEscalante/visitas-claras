/**
 * Servicio de API Mock completo
 * Simula todas las llamadas API con delays y respuestas realistas
 */

import { 
  UploadFileResponse, 
  AIAutocompleteRequest, 
  AIAutocompleteResponse,
  CreateVisitaPayload,
  CreateVisitaResponse 
} from '@/api/types';
import { Profesor, Visita, VisitaProgramada, DatosDocente, Rubrica } from '@/types';
import { profesores, visitasIniciales, visitasProgramadasIniciales, rubricasTemplate } from '@/data/mockData';

/**
 * Simula un delay de red (variable entre 300-1500ms)
 */
function delay(min: number = 300, max: number = 1500): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simula un error aleatorio (desactivado para demostraciones)
 */
function shouldSimulateError(): boolean {
  return false; // Desactivado para que funcione correctamente en demostraciones
  // return Math.random() < 0.05; // 5% de probabilidad (activar solo para testing)
}

/**
 * Almacenamiento simulado en memoria
 * Los datos se sincronizan con localStorage para persistencia entre recargas
 */

// Cargar datos desde localStorage si existen
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error(`Error loading ${key} from storage:`, error);
  }
  return defaultValue;
}

// Guardar datos en localStorage
function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to storage:`, error);
  }
}

let mockVisitas: Visita[] = loadFromStorage('mock_visitas', visitasIniciales);
let mockVisitasProgramadas: VisitaProgramada[] = loadFromStorage('mock_visitas_programadas', visitasProgramadasIniciales);
let mockArchivos: Map<string, { file: File; id: string; url: string }> = new Map();

/**
 * Generar ID único
 */
function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Simular análisis de documento con IA
 */
function simulateAIAnalysis(
  profesorId: string,
  fecha: string,
  hora: string
): AIAutocompleteResponse {
  const profesor = profesores.find(p => p.id === profesorId);
  if (!profesor) {
    throw new Error('Profesor no encontrado');
  }

  // Simular datos extraídos del documento
  const datosDocente: DatosDocente = {
    nombreCompleto: `${profesor.nombre} ${profesor.apellido}`,
    dni: `${Math.floor(Math.random() * 90000000) + 10000000}`, // DNI aleatorio
    cargoLaboral: 'Docente',
    especialidad: ['Comunicación', 'Matemáticas', 'Ciencia y Tecnología', 'Personal Social'][Math.floor(Math.random() * 4)],
    ie: profesor.ie,
    nivelEducativo: 'Primaria',
    grado: profesor.salon.split(' ')[0],
    seccion: profesor.salon.split(' ')[1] || 'A',
    areasCurriculares: ['Comunicación', 'Matemáticas'][Math.floor(Math.random() * 2)],
    fechaVisita: fecha,
    horaInicio: hora,
    horaFin: `${parseInt(hora.split(':')[0]) + 1}:${hora.split(':')[1]}`,
  };

  // Simular rúbricas con niveles aleatorios (tendencia hacia niveles 2-3)
  const rubricas: Rubrica[] = rubricasTemplate.map((template) => {
    // Probabilidad: 20% nivel 1, 30% nivel 2, 35% nivel 3, 15% nivel 4
    const rand = Math.random();
    let nivel: 1 | 2 | 3 | 4;
    if (rand < 0.2) nivel = 1;
    else if (rand < 0.5) nivel = 2;
    else if (rand < 0.85) nivel = 3;
    else nivel = 4;

    return {
      id: template.id,
      nombre: template.nombre,
      nivel,
      observaciones: `Observación simulada para ${template.nombre.toLowerCase()}. El docente muestra ${nivel === 4 ? 'excelente' : nivel === 3 ? 'buen' : nivel === 2 ? 'regular' : 'necesita mejorar'} desempeño en esta área.`,
    };
  });

  // Calcular nivel total
  const nivelTotal = Math.round(
    rubricas.reduce((sum, r) => sum + (r.nivel || 0), 0) / rubricas.length
  );

  // Simular confianza (0.6 - 0.95)
  const confianzaGeneral = 0.6 + Math.random() * 0.35;
  const confianzaDatosDocente = 0.7 + Math.random() * 0.25;

  const confianzaRubricas: Record<string, number> = {};
  rubricas.forEach(r => {
    confianzaRubricas[r.id] = 0.65 + Math.random() * 0.3;
  });

  // Generar advertencias si hay baja confianza
  const advertencias: AIAutocompleteResponse['advertencias'] = [];
  if (confianzaDatosDocente < 0.75) {
    advertencias.push({
      campo: 'datosDocente',
      mensaje: 'Algunos datos del docente tienen baja confianza. Por favor, verifica la información.',
      tipo: 'baja_confianza',
    });
  }

  rubricas.forEach(r => {
    if (confianzaRubricas[r.id] < 0.7) {
      advertencias.push({
        campo: `rubrica-${r.id}`,
        mensaje: `La evaluación de "${r.nombre}" tiene baja confianza. Revisa y ajusta si es necesario.`,
        tipo: 'baja_confianza',
      });
    }
  });

  return {
    datosDocente,
    rubricas,
    confianza: {
      datosDocente: confianzaDatosDocente,
      rubricas: confianzaRubricas,
      general: confianzaGeneral,
    },
    advertencias: advertencias.length > 0 ? advertencias : undefined,
    textoEstructurado: `Documento de observación analizado para ${datosDocente.nombreCompleto} el ${fecha} a las ${hora}.`,
  };
}

/**
 * API Mock: Upload de archivo
 */
export async function mockUploadArchivo(
  file: File,
  profesorId?: string
): Promise<UploadFileResponse> {
  await delay(800, 2000);

  if (shouldSimulateError()) {
    throw new Error('Error al subir archivo. Por favor, intenta nuevamente.');
  }

  const fileId = generateId('file');
  const fileUrl = `https://mock-storage.example.com/files/${fileId}`;

  // Guardar archivo en memoria
  mockArchivos.set(fileId, {
    file,
    id: fileId,
    url: fileUrl,
  });

  return {
    id: fileId,
    nombre: file.name,
    url: fileUrl,
    tipo: 'observacion',
    tamaño: file.size,
    mimeType: file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * API Mock: Autocompletar con IA
 */
export async function mockAIAutocompletar(
  input: AIAutocompleteRequest
): Promise<AIAutocompleteResponse> {
  await delay(2000, 4000); // Análisis con IA toma más tiempo

  if (shouldSimulateError()) {
    throw new Error('Error al analizar documento con IA. Por favor, intenta nuevamente.');
  }

  // Verificar que el archivo existe
  if (!mockArchivos.has(input.archivoId)) {
    // Si el archivo no está en memoria, puede que se haya perdido al recargar
    // En ese caso, simular el análisis de todas formas
    console.warn('Archivo no encontrado en memoria, pero continuando con simulación');
  }

  return simulateAIAnalysis(input.profesorId, input.fecha, input.hora);
}

/**
 * API Mock: Crear visita
 */
export async function mockCrearVisita(
  payload: CreateVisitaPayload
): Promise<CreateVisitaResponse> {
  await delay(500, 1200);

  if (shouldSimulateError()) {
    throw new Error('Error al crear visita. Por favor, intenta nuevamente.');
  }

  // Validar que el profesor existe
  const profesor = profesores.find(p => p.id === payload.profesorId);
  if (!profesor) {
    throw new Error('Profesor no encontrado');
  }

  // Calcular nivel total
  const nivelesValidos = payload.rubricas.filter(r => r.nivel !== null);
  if (nivelesValidos.length === 0) {
    throw new Error('Debe evaluar al menos una rúbrica');
  }

  const nivelTotal = Math.round(
    nivelesValidos.reduce((sum, r) => sum + (r.nivel || 0), 0) / nivelesValidos.length
  );

  const visitaId = generateId('visita');
  const archivoUrl = payload.archivoId 
    ? mockArchivos.get(payload.archivoId)?.url 
    : undefined;

  // Agregar a visitas (simular persistencia)
  const nuevaVisita: Visita = {
    id: visitaId,
    profesorId: payload.profesorId,
    fecha: payload.fecha,
    hora: payload.hora,
    nivelLogroTotal: nivelTotal,
    rubricas: payload.rubricas,
    datosDocente: payload.datosDocente,
  };

  mockVisitas.push(nuevaVisita);
  saveToStorage('mock_visitas', mockVisitas);

  return {
    id: visitaId,
    profesorId: payload.profesorId,
    fecha: payload.fecha,
    hora: payload.hora,
    nivelLogroTotal: nivelTotal,
    rubricas: payload.rubricas,
    datosDocente: payload.datosDocente,
    archivoUrl,
    createdAt: new Date().toISOString(),
  };
}

/**
 * API Mock: Obtener profesores
 */
export async function mockGetProfesores(): Promise<Profesor[]> {
  await delay(300, 800);
  return [...profesores];
}

/**
 * API Mock: Obtener visitas
 */
export async function mockGetVisitas(): Promise<Visita[]> {
  await delay(400, 1000);
  return [...mockVisitas];
}

/**
 * API Mock: Obtener visitas programadas
 */
export async function mockGetVisitasProgramadas(): Promise<VisitaProgramada[]> {
  await delay(400, 1000);
  return [...mockVisitasProgramadas];
}

/**
 * API Mock: Crear visita programada
 */
export async function mockCrearVisitaProgramada(
  visita: Omit<VisitaProgramada, 'id'>
): Promise<VisitaProgramada> {
  await delay(500, 1200);

  const nuevaVisita: VisitaProgramada = {
    ...visita,
    id: generateId('vp'),
  };

  mockVisitasProgramadas.push(nuevaVisita);
  saveToStorage('mock_visitas_programadas', mockVisitasProgramadas);
  return nuevaVisita;
}

/**
 * API Mock: Confirmar visita programada
 */
export async function mockConfirmarVisitaProgramada(id: string): Promise<VisitaProgramada> {
  await delay(300, 800);

  const visita = mockVisitasProgramadas.find(v => v.id === id);
  if (!visita) {
    throw new Error('Visita programada no encontrada');
  }

  visita.confirmada = true;
  saveToStorage('mock_visitas_programadas', mockVisitasProgramadas);
  return visita;
}

/**
 * Resetear datos mock (útil para testing)
 */
export function resetMockData(): void {
  mockVisitas = [...visitasIniciales];
  mockVisitasProgramadas = [...visitasProgramadasIniciales];
  mockArchivos.clear();
  saveToStorage('mock_visitas', mockVisitas);
  saveToStorage('mock_visitas_programadas', mockVisitasProgramadas);
}

