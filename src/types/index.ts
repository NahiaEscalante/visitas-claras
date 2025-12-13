export interface Profesor {
  id: string;
  nombre: string;
  apellido: string;
  foto: string;
  ie: string;
  salon: string;
}

export interface Rubrica {
  id: string;
  nombre: string;
  nivel: 1 | 2 | 3 | 4 | null;
  observaciones: string;
}

export interface Visita {
  id: string;
  profesorId: string;
  fecha: string;
  hora: string;
  nivelLogroTotal: number;
  rubricas: Rubrica[];
  datosDocente: DatosDocente;
}

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
  fechaVisita: string;
  horaInicio: string;
  horaFin: string;
}

export interface VisitaProgramada {
  id: string;
  profesorId: string;
  profesorNombre: string;
  fecha: string;
  hora: string;
  ie: string;
  salon: string;
  confirmada: boolean;
}

export type RubricaNombre = 
  | 'involucra'
  | 'razonamiento'
  | 'evalua'
  | 'respeto'
  | 'comportamiento';
