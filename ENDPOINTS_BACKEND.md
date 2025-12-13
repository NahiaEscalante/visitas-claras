# Especificación de Endpoints Backend - ObservaDoc

## 📋 Información General

**Base URL:** `https://api.observadoc.edu.pe/v1`  
**Formato:** REST API  
**Autenticación:** JWT Bearer Token (excepto login)  
**Content-Type:** `application/json` (excepto uploads de archivos)

---

## 🔐 Autenticación

### 1. POST /auth/login

**Descripción:** Autentica un usuario y retorna un token JWT.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "director@ejemplo.edu.pe",
  "password": "password123",
  "rememberMe": false
}
```

**Validaciones:**
- `email`: Requerido, formato de email válido
- `password`: Requerido, mínimo 8 caracteres
- `rememberMe`: Opcional, boolean

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "director@ejemplo.edu.pe",
      "nombre": "Juan",
      "apellido": "Pérez",
      "rol": "director",
      "ie": "IE San Martín",
      "foto": "https://example.com/foto.jpg"
    },
    "expiresIn": 3600
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email o contraseña incorrectos"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "email": "El email es requerido",
      "password": "La contraseña debe tener al menos 8 caracteres"
    }
  }
}
```

---

### 2. POST /auth/logout

**Descripción:** Invalida el token del usuario actual.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```

---

### 3. POST /auth/refresh

**Descripción:** Renueva el token de acceso usando el refresh token.

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token inválido o expirado"
  }
}
```

---

### 4. GET /auth/me

**Descripción:** Obtiene la información del usuario autenticado.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "user-123",
    "email": "director@ejemplo.edu.pe",
    "nombre": "Juan",
    "apellido": "Pérez",
    "rol": "director",
    "ie": "IE San Martín",
    "foto": "https://example.com/foto.jpg",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

**Response 401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido o expirado"
  }
}
```

---

## 👨‍🏫 Profesores

### 5. GET /profesores

**Descripción:** Obtiene la lista de profesores con opciones de búsqueda y paginación.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `search` (opcional): Búsqueda por nombre o apellido
- `ie` (opcional): Filtrar por Institución Educativa
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Cantidad de resultados por página (default: 20, max: 100)

**Ejemplo de Request:**
```
GET /profesores?search=María&ie=IE%20San%20Martín&page=1&limit=10
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "profesores": [
      {
        "id": "prof-1",
        "nombre": "María",
        "apellido": "García López",
        "foto": "https://example.com/fotos/maria.jpg",
        "ie": "IE San Martín",
        "salon": "3ro A",
        "dni": "45678912",
        "especialidad": "Comunicación",
        "createdAt": "2025-01-10T08:00:00Z",
        "updatedAt": "2025-01-10T08:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 6. GET /profesores/:id

**Descripción:** Obtiene los detalles de un profesor específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del profesor

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "prof-1",
    "nombre": "María",
    "apellido": "García López",
    "foto": "https://example.com/fotos/maria.jpg",
    "ie": "IE San Martín",
    "salon": "3ro A",
    "dni": "45678912",
    "cargoLaboral": "Docente",
    "especialidad": "Comunicación",
    "nivelEducativo": "Primaria",
    "grado": "3ro",
    "seccion": "A",
    "areasCurriculares": "Comunicación",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-10T08:00:00Z"
  }
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "PROFESOR_NOT_FOUND",
    "message": "Profesor no encontrado"
  }
}
```

---

### 7. POST /profesores

**Descripción:** Crea un nuevo profesor.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "nombre": "María",
  "apellido": "García López",
  "dni": "45678912",
  "ie": "IE San Martín",
  "salon": "3ro A",
  "cargoLaboral": "Docente",
  "especialidad": "Comunicación",
  "nivelEducativo": "Primaria",
  "grado": "3ro",
  "seccion": "A",
  "areasCurriculares": "Comunicación",
  "foto": "https://example.com/fotos/maria.jpg"
}
```

**Validaciones:**
- `nombre`: Requerido, string, mínimo 2 caracteres
- `apellido`: Requerido, string, mínimo 2 caracteres
- `dni`: Requerido, string, 8 dígitos
- `ie`: Requerido, string
- `salon`: Requerido, string
- `foto`: Opcional, URL válida o base64

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "prof-1",
    "nombre": "María",
    "apellido": "García López",
    "foto": "https://example.com/fotos/maria.jpg",
    "ie": "IE San Martín",
    "salon": "3ro A",
    "dni": "45678912",
    "cargoLaboral": "Docente",
    "especialidad": "Comunicación",
    "nivelEducativo": "Primaria",
    "grado": "3ro",
    "seccion": "A",
    "areasCurriculares": "Comunicación",
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "nombre": "El nombre es requerido",
      "dni": "El DNI debe tener 8 dígitos"
    }
  }
}
```

---

### 8. PUT /profesores/:id

**Descripción:** Actualiza la información de un profesor.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `id`: ID del profesor

**Request Body:**
```json
{
  "nombre": "María",
  "apellido": "García López",
  "ie": "IE San Martín",
  "salon": "4to A",
  "especialidad": "Comunicación y Matemáticas"
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizan los campos enviados.

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "prof-1",
    "nombre": "María",
    "apellido": "García López",
    "foto": "https://example.com/fotos/maria.jpg",
    "ie": "IE San Martín",
    "salon": "4to A",
    "especialidad": "Comunicación y Matemáticas",
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

---

### 9. DELETE /profesores/:id

**Descripción:** Elimina un profesor (soft delete recomendado).

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del profesor

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Profesor eliminado exitosamente"
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "PROFESOR_NOT_FOUND",
    "message": "Profesor no encontrado"
  }
}
```

---

## 📝 Visitas (Observaciones)

### 10. GET /visitas

**Descripción:** Obtiene la lista de visitas con filtros y paginación.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `profesorId` (opcional): Filtrar por ID de profesor
- `fechaDesde` (opcional): Fecha inicial (ISO 8601)
- `fechaHasta` (opcional): Fecha final (ISO 8601)
- `nivelLogro` (opcional): Filtrar por nivel de logro (1, 2, 3, 4)
- `ie` (opcional): Filtrar por Institución Educativa
- `page` (opcional): Número de página (default: 1)
- `limit` (opcional): Cantidad de resultados por página (default: 20, max: 100)
- `sortBy` (opcional): Campo para ordenar (default: "fecha")
- `sortOrder` (opcional): Orden (asc, desc) (default: "desc")

**Ejemplo de Request:**
```
GET /visitas?profesorId=prof-1&fechaDesde=2025-01-01&nivelLogro=4&page=1&limit=10&sortBy=fecha&sortOrder=desc
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": "visita-1",
        "profesorId": "prof-1",
        "profesor": {
          "id": "prof-1",
          "nombre": "María",
          "apellido": "García López",
          "foto": "https://example.com/fotos/maria.jpg"
        },
        "fecha": "2025-03-15",
        "hora": "09:30",
        "nivelLogroTotal": 3,
        "rubricas": [
          {
            "id": "rubrica-1",
            "nombre": "Involucra activamente a los estudiantes en el proceso de aprendizaje",
            "nivel": 3,
            "observaciones": "Buen uso de materiales"
          },
          {
            "id": "rubrica-2",
            "nombre": "Promueve el razonamiento, la creatividad y/o el pensamiento crítico",
            "nivel": 3,
            "observaciones": "Promueve preguntas"
          },
          {
            "id": "rubrica-3",
            "nombre": "Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes",
            "nivel": 4,
            "observaciones": "Excelente retroalimentación"
          },
          {
            "id": "rubrica-4",
            "nombre": "Propicia un ambiente de respeto y proximidad",
            "nivel": 3,
            "observaciones": "Clima positivo"
          },
          {
            "id": "rubrica-5",
            "nombre": "Regula positivamente el comportamiento de los estudiantes",
            "nivel": 2,
            "observaciones": "Puede mejorar"
          }
        ],
        "datosDocente": {
          "nombreCompleto": "María García López",
          "dni": "45678912",
          "cargoLaboral": "Docente",
          "especialidad": "Comunicación",
          "ie": "IE San Martín",
          "nivelEducativo": "Primaria",
          "grado": "3ro",
          "seccion": "A",
          "areasCurriculares": "Comunicación",
          "fechaVisita": "2025-03-15",
          "horaInicio": "09:30",
          "horaFin": "10:30"
        },
        "archivoUrl": "https://example.com/archivos/visita-1.pdf",
        "createdAt": "2025-03-15T10:00:00Z",
        "createdBy": {
          "id": "user-123",
          "nombre": "Juan",
          "apellido": "Pérez"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 11. GET /visitas/:id

**Descripción:** Obtiene los detalles completos de una visita específica.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID de la visita

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "visita-1",
    "profesorId": "prof-1",
    "profesor": {
      "id": "prof-1",
      "nombre": "María",
      "apellido": "García López",
      "foto": "https://example.com/fotos/maria.jpg",
      "ie": "IE San Martín",
      "salon": "3ro A"
    },
    "fecha": "2025-03-15",
    "hora": "09:30",
    "nivelLogroTotal": 3,
    "rubricas": [
      {
        "id": "rubrica-1",
        "nombre": "Involucra activamente a los estudiantes en el proceso de aprendizaje",
        "nivel": 3,
        "observaciones": "Buen uso de materiales"
      }
    ],
    "datosDocente": {
      "nombreCompleto": "María García López",
      "dni": "45678912",
      "cargoLaboral": "Docente",
      "especialidad": "Comunicación",
      "ie": "IE San Martín",
      "nivelEducativo": "Primaria",
      "grado": "3ro",
      "seccion": "A",
      "areasCurriculares": "Comunicación",
      "fechaVisita": "2025-03-15",
      "horaInicio": "09:30",
      "horaFin": "10:30"
    },
    "archivoUrl": "https://example.com/archivos/visita-1.pdf",
    "createdAt": "2025-03-15T10:00:00Z",
    "updatedAt": "2025-03-15T10:00:00Z",
    "createdBy": {
      "id": "user-123",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
}
```

---

### 12. GET /profesores/:id/visitas

**Descripción:** Obtiene todas las visitas de un profesor específico.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del profesor

**Query Parameters:**
- `page` (opcional): Número de página
- `limit` (opcional): Cantidad de resultados por página
- `sortBy` (opcional): Campo para ordenar (default: "fecha")
- `sortOrder` (opcional): Orden (asc, desc) (default: "desc")

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "profesor": {
      "id": "prof-1",
      "nombre": "María",
      "apellido": "García López"
    },
    "visitas": [
      {
        "id": "visita-1",
        "fecha": "2025-03-15",
        "hora": "09:30",
        "nivelLogroTotal": 3,
        "rubricas": []
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 13. POST /visitas

**Descripción:** Crea una nueva visita/observación.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "profesorId": "prof-1",
  "fecha": "2025-03-15",
  "hora": "09:30",
  "datosDocente": {
    "nombreCompleto": "María García López",
    "dni": "45678912",
    "cargoLaboral": "Docente",
    "especialidad": "Comunicación",
    "ie": "IE San Martín",
    "nivelEducativo": "Primaria",
    "grado": "3ro",
    "seccion": "A",
    "areasCurriculares": "Comunicación",
    "fechaVisita": "2025-03-15",
    "horaInicio": "09:30",
    "horaFin": "10:30"
  },
  "rubricas": [
    {
      "id": "involucra",
      "nombre": "Involucra activamente a los estudiantes en el proceso de aprendizaje",
      "nivel": 3,
      "observaciones": "Buen uso de materiales"
    },
    {
      "id": "razonamiento",
      "nombre": "Promueve el razonamiento, la creatividad y/o el pensamiento crítico",
      "nivel": 3,
      "observaciones": "Promueve preguntas"
    },
    {
      "id": "evalua",
      "nombre": "Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes",
      "nivel": 4,
      "observaciones": "Excelente retroalimentación"
    },
    {
      "id": "respeto",
      "nombre": "Propicia un ambiente de respeto y proximidad",
      "nivel": 3,
      "observaciones": "Clima positivo"
    },
    {
      "id": "comportamiento",
      "nombre": "Regula positivamente el comportamiento de los estudiantes",
      "nivel": 2,
      "observaciones": "Puede mejorar"
    }
  ],
  "archivoId": "archivo-123"
}
```

**Validaciones:**
- `profesorId`: Requerido, debe existir
- `fecha`: Requerido, formato ISO 8601 (YYYY-MM-DD)
- `hora`: Requerido, formato HH:mm
- `datosDocente`: Requerido, objeto válido
- `rubricas`: Requerido, array con mínimo 1 rúbrica evaluada
- `rubricas[].nivel`: Requerido, debe ser 1, 2, 3 o 4
- `archivoId`: Opcional, ID del archivo subido previamente

**Nota:** El `nivelLogroTotal` se calcula automáticamente como el promedio de los niveles de las rúbricas.

**Response 201 Created:**
```json
{
  "success": true,
  "data": {
    "id": "visita-1",
    "profesorId": "prof-1",
    "fecha": "2025-03-15",
    "hora": "09:30",
    "nivelLogroTotal": 3,
    "rubricas": [],
    "datosDocente": {},
    "archivoUrl": "https://example.com/archivos/visita-1.pdf",
    "createdAt": "2025-03-15T10:00:00Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "profesorId": "El profesor es requerido",
      "rubricas": "Debe evaluar al menos una rúbrica"
    }
  }
}
```

---

### 14. PUT /visitas/:id

**Descripción:** Actualiza una visita existente.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `id`: ID de la visita

**Request Body:**
```json
{
  "fecha": "2025-03-16",
  "hora": "10:00",
  "rubricas": [
    {
      "id": "involucra",
      "nivel": 4,
      "observaciones": "Excelente participación"
    }
  ]
}
```

**Nota:** Todos los campos son opcionales. Solo se actualizan los campos enviados. Si se actualizan rúbricas, se recalcula el `nivelLogroTotal`.

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "visita-1",
    "fecha": "2025-03-16",
    "hora": "10:00",
    "nivelLogroTotal": 4,
    "updatedAt": "2025-03-16T11:00:00Z"
  }
}
```

---

### 15. DELETE /visitas/:id

**Descripción:** Elimina una visita (soft delete recomendado).

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID de la visita

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Visita eliminada exitosamente"
}
```

---

## 📅 Visitas Programadas

### 16. GET /visitas-programadas

**Descripción:** Obtiene la lista de visitas programadas con filtros.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `profesorId` (opcional): Filtrar por ID de profesor
- `fechaDesde` (opcional): Fecha inicial (ISO 8601)
- `fechaHasta` (opcional): Fecha final (ISO 8601)
- `confirmada` (opcional): Filtrar por estado de confirmación (true/false)
- `ie` (opcional): Filtrar por Institución Educativa
- `page` (opcional): Número de página
- `limit` (opcional): Cantidad de resultados por página
- `sortBy` (opcional): Campo para ordenar (default: "fecha")
- `sortOrder` (opcional): Orden (asc, desc) (default: "asc")

**Ejemplo de Request:**
```
GET /visitas-programadas?confirmada=false&fechaDesde=2025-12-01&page=1&limit=20
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": "vp-1",
        "profesorId": "prof-3",
        "profesor": {
          "id": "prof-3",
          "nombre": "Ana",
          "apellido": "Torres Vega",
          "foto": "https://example.com/fotos/ana.jpg"
        },
        "profesorNombre": "Ana Torres Vega",
        "fecha": "2025-12-18",
        "hora": "09:00",
        "ie": "IE Santa Rosa",
        "salon": "2do C",
        "confirmada": true,
        "createdAt": "2025-01-10T08:00:00Z",
        "updatedAt": "2025-01-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

---

### 17. GET /visitas-programadas/:id

**Descripción:** Obtiene los detalles de una visita programada específica.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID de la visita programada

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "vp-1",
    "profesorId": "prof-3",
    "profesor": {
      "id": "prof-3",
      "nombre": "Ana",
      "apellido": "Torres Vega",
      "foto": "https://example.com/fotos/ana.jpg",
      "ie": "IE Santa Rosa",
      "salon": "2do C"
    },
    "profesorNombre": "Ana Torres Vega",
    "fecha": "2025-12-18",
    "hora": "09:00",
    "ie": "IE Santa Rosa",
    "salon": "2do C",
    "confirmada": true,
    "notas": "Visita de seguimiento trimestral",
    "createdAt": "2025-01-10T08:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

---

### 18. POST /visitas-programadas

**Descripción:** Crea una nueva visita programada.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body (una visita):**
```json
{
  "profesorId": "prof-3",
  "fecha": "2025-12-18",
  "hora": "09:00",
  "ie": "IE Santa Rosa",
  "salon": "2do C",
  "notas": "Visita de seguimiento trimestral"
}
```

**Request Body (múltiples visitas - bulk):**
```json
{
  "visitas": [
    {
      "profesorId": "prof-1",
      "fecha": "2025-12-18",
      "hora": "09:00",
      "ie": "IE San Martín",
      "salon": "3ro A"
    },
    {
      "profesorId": "prof-2",
      "fecha": "2026-03-15",
      "hora": "10:00",
      "ie": "IE Los Andes",
      "salon": "5to B"
    }
  ]
}
```

**Validaciones:**
- `profesorId`: Requerido, debe existir
- `fecha`: Requerido, formato ISO 8601 (YYYY-MM-DD), fecha futura
- `hora`: Requerido, formato HH:mm
- `ie`: Requerido, string
- `salon`: Requerido, string
- `notas`: Opcional, string

**Response 201 Created (una visita):**
```json
{
  "success": true,
  "data": {
    "id": "vp-1",
    "profesorId": "prof-3",
    "profesorNombre": "Ana Torres Vega",
    "fecha": "2025-12-18",
    "hora": "09:00",
    "ie": "IE Santa Rosa",
    "salon": "2do C",
    "confirmada": false,
    "createdAt": "2025-01-15T10:00:00Z"
  }
}
```

**Response 201 Created (múltiples visitas):**
```json
{
  "success": true,
  "data": {
    "created": 2,
    "visitas": [
      {
        "id": "vp-1",
        "profesorId": "prof-1",
        "fecha": "2025-12-18",
        "hora": "09:00",
        "confirmada": false
      },
      {
        "id": "vp-2",
        "profesorId": "prof-2",
        "fecha": "2026-03-15",
        "hora": "10:00",
        "confirmada": false
      }
    ]
  }
}
```

---

### 19. PUT /visitas-programadas/:id

**Descripción:** Actualiza una visita programada (usado principalmente para confirmar).

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Path Parameters:**
- `id`: ID de la visita programada

**Request Body (confirmar visita):**
```json
{
  "confirmada": true
}
```

**Request Body (actualizar fecha/hora):**
```json
{
  "fecha": "2025-12-20",
  "hora": "10:30",
  "notas": "Cambio de fecha por solicitud del docente"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "vp-1",
    "confirmada": true,
    "updatedAt": "2025-01-15T11:00:00Z"
  }
}
```

---

### 20. DELETE /visitas-programadas/:id

**Descripción:** Elimina una visita programada.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID de la visita programada

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Visita programada eliminada exitosamente"
}
```

---

## 📎 Archivos

### 21. POST /archivos/upload

**Descripción:** Sube un archivo (PDF o imagen) asociado a una observación.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: Archivo (PDF, JPG, JPEG, PNG)
- `tipo`: Tipo de archivo ("observacion" | "agenda")
- `profesorId`: ID del profesor (opcional, para observaciones)

**Validaciones:**
- `file`: Requerido, máximo 10MB
- Formatos permitidos: PDF, JPG, JPEG, PNG
- `tipo`: Requerido

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "id": "archivo-123",
    "nombre": "observacion_maria_2025-03-15.pdf",
    "url": "https://example.com/archivos/observacion_maria_2025-03-15.pdf",
    "tipo": "observacion",
    "tamaño": 245760,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-03-15T10:00:00Z"
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE",
    "message": "Formato de archivo no permitido. Solo se aceptan PDF, JPG, JPEG o PNG"
  }
}
```

**Response 413 Payload Too Large:**
```json
{
  "success": false,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "El archivo excede el tamaño máximo permitido (10MB)"
  }
}
```

---

### 22. POST /archivos/upload-agenda

**Descripción:** Sube y procesa un archivo de agenda para extraer fechas programadas.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
- `file`: Archivo (PDF, JPG, JPEG, PNG)

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "archivoId": "archivo-456",
    "archivoUrl": "https://example.com/archivos/agenda_2025.pdf",
    "fechasExtraidas": [
      {
        "profesorId": "prof-1",
        "profesorNombre": "María García López",
        "ie": "IE San Martín",
        "salon": "3ro A",
        "fecha": "2025-12-18",
        "hora": "09:00",
        "confianza": 0.95
      },
      {
        "profesorId": "prof-2",
        "profesorNombre": "Carlos Mendoza Ruiz",
        "ie": "IE Los Andes",
        "salon": "5to B",
        "fecha": "2026-03-15",
        "hora": "10:00",
        "confianza": 0.87
      }
    ],
    "procesado": true,
    "totalFechas": 2
  }
}
```

**Nota:** Este endpoint debe usar OCR o procesamiento de documentos para extraer fechas. Si no se pueden extraer, retornar array vacío y permitir que el usuario ingrese manualmente.

---

### 23. GET /archivos/:id

**Descripción:** Obtiene información de un archivo o descarga el archivo.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del archivo

**Query Parameters:**
- `download` (opcional): Si es `true`, descarga el archivo en lugar de retornar JSON

**Response 200 OK (info):**
```json
{
  "success": true,
  "data": {
    "id": "archivo-123",
    "nombre": "observacion_maria_2025-03-15.pdf",
    "url": "https://example.com/archivos/observacion_maria_2025-03-15.pdf",
    "tipo": "observacion",
    "tamaño": 245760,
    "mimeType": "application/pdf",
    "uploadedAt": "2025-03-15T10:00:00Z",
    "uploadedBy": {
      "id": "user-123",
      "nombre": "Juan",
      "apellido": "Pérez"
    }
  }
}
```

**Response 200 OK (download):**
- Content-Type según el tipo de archivo
- Content-Disposition: attachment; filename="..."
- Body: Stream del archivo

---

### 24. DELETE /archivos/:id

**Descripción:** Elimina un archivo.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del archivo

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Archivo eliminado exitosamente"
}
```

---

## 📊 Estadísticas

### 25. GET /estadisticas

**Descripción:** Obtiene estadísticas generales del sistema.

**Headers:**
```
Authorization: Bearer {token}
```

**Query Parameters:**
- `ie` (opcional): Filtrar por Institución Educativa
- `fechaDesde` (opcional): Fecha inicial para el rango
- `fechaHasta` (opcional): Fecha final para el rango

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "totalVisitas": 15,
    "totalProfesores": 5,
    "totalVisitasProgramadas": 8,
    "visitasPorNivel": {
      "nivel1": 2,
      "nivel2": 3,
      "nivel3": 6,
      "nivel4": 4
    },
    "visitasPorMes": [
      {
        "mes": "2025-01",
        "total": 3,
        "nivelPromedio": 3.2
      },
      {
        "mes": "2025-02",
        "total": 5,
        "nivelPromedio": 3.5
      }
    ],
    "visitasPendientesConfirmar": 3,
    "promedioNivelLogro": 3.1,
    "rubricasPromedio": {
      "involucra": 3.2,
      "razonamiento": 3.0,
      "evalua": 3.4,
      "respeto": 3.3,
      "comportamiento": 2.8
    }
  }
}
```

---

### 26. GET /estadisticas/profesores/:id

**Descripción:** Obtiene estadísticas específicas de un profesor.

**Headers:**
```
Authorization: Bearer {token}
```

**Path Parameters:**
- `id`: ID del profesor

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "profesor": {
      "id": "prof-1",
      "nombre": "María",
      "apellido": "García López"
    },
    "totalVisitas": 3,
    "visitasPorNivel": {
      "nivel1": 0,
      "nivel2": 1,
      "nivel3": 1,
      "nivel4": 1
    },
    "promedioNivelLogro": 3.3,
    "evolucion": [
      {
        "fecha": "2025-03-15",
        "nivelLogro": 3
      },
      {
        "fecha": "2025-06-20",
        "nivelLogro": 4
      }
    ],
    "rubricasPromedio": {
      "involucra": 3.5,
      "razonamiento": 3.3,
      "evalua": 3.7,
      "respeto": 3.5,
      "comportamiento": 3.0
    },
    "ultimaVisita": "2025-06-20",
    "proximaVisitaProgramada": "2025-12-18"
  }
}
```

---

## 🤖 Inteligencia Artificial (Autocompletado)

### 27. POST /visitas/ai/autocompletar

**Descripción:** Analiza un documento de observación subido y autocompleta los datos del docente y las rúbricas usando IA.

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "profesorId": "prof-1",
  "fecha": "2025-03-15",
  "hora": "09:30",
  "archivoId": "archivo-123",
  "contextoVisita": "Visita de seguimiento trimestral",
  "notasUsuario": "El docente mostró mejoras en participación"
}
```

**Validaciones:**
- `profesorId`: Requerido, debe existir
- `fecha`: Requerido, formato ISO 8601 (YYYY-MM-DD)
- `hora`: Requerido, formato HH:mm
- `archivoId`: Requerido, debe existir y ser un archivo válido
- `contextoVisita`: Opcional, string
- `notasUsuario`: Opcional, string

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "datosDocente": {
      "nombreCompleto": "María García López",
      "dni": "45678912",
      "cargoLaboral": "Docente",
      "especialidad": "Comunicación",
      "ie": "IE San Martín",
      "nivelEducativo": "Primaria",
      "grado": "3ro",
      "seccion": "A",
      "areasCurriculares": "Comunicación",
      "fechaVisita": "2025-03-15",
      "horaInicio": "09:30",
      "horaFin": "10:30"
    },
    "rubricas": [
      {
        "id": "involucra",
        "nombre": "Involucra activamente a los estudiantes en el proceso de aprendizaje",
        "nivel": 3,
        "observaciones": "El docente utilizó materiales didácticos que captaron la atención de los estudiantes. La mayoría participó activamente en las actividades propuestas."
      },
      {
        "id": "razonamiento",
        "nombre": "Promueve el razonamiento, la creatividad y/o el pensamiento crítico",
        "nivel": 3,
        "observaciones": "Se observaron preguntas abiertas que estimularon el pensamiento. Algunos estudiantes formularon ideas propias."
      },
      {
        "id": "evalua",
        "nombre": "Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes",
        "nivel": 4,
        "observaciones": "Excelente retroalimentación constante durante la clase. El docente monitoreó individualmente el progreso."
      },
      {
        "id": "respeto",
        "nombre": "Propicia un ambiente de respeto y proximidad",
        "nivel": 3,
        "observaciones": "Clima positivo en el aula. Comunicación respetuosa entre docente y estudiantes."
      },
      {
        "id": "comportamiento",
        "nombre": "Regula positivamente el comportamiento de los estudiantes",
        "nivel": 2,
        "observaciones": "Se observaron algunas interrupciones menores. El docente podría mejorar las estrategias de gestión del comportamiento."
      }
    ],
    "confianza": {
      "datosDocente": 0.95,
      "rubricas": {
        "involucra": 0.88,
        "razonamiento": 0.85,
        "evalua": 0.92,
        "respeto": 0.90,
        "comportamiento": 0.75
      },
      "general": 0.86
    },
    "advertencias": [
      {
        "campo": "comportamiento",
        "mensaje": "Confianza baja en la evaluación de esta rúbrica. Se recomienda revisar manualmente.",
        "tipo": "baja_confianza"
      }
    ],
    "textoEstructurado": "Observación de clase realizada el 15 de marzo de 2025..."
  }
}
```

**Response 400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Error de validación",
    "details": {
      "archivoId": "El archivo no existe o no es válido",
      "profesorId": "El profesor es requerido"
    }
  }
}
```

**Response 404 Not Found:**
```json
{
  "success": false,
  "error": {
    "code": "ARCHIVO_NOT_FOUND",
    "message": "Archivo no encontrado"
  }
}
```

**Response 500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "AI_PROCESSING_ERROR",
    "message": "Error al procesar el documento con IA. Por favor, intente nuevamente o complete el formulario manualmente."
  }
}
```

**Notas:**
- El endpoint debe procesar el archivo usando OCR/IA para extraer información estructurada
- Las rúbricas deben incluir las 5 obligatorias del sistema
- Los niveles deben estar en el rango 1-4
- Si la confianza es baja (< 0.7), se debe incluir una advertencia
- El formato de `datosDocente` y `rubricas` debe coincidir exactamente con el esperado por `POST /visitas`

---

## 📋 Rúbricas

### 27. GET /rubricas

**Descripción:** Obtiene el template de rúbricas del sistema.

**Headers:**
```
Authorization: Bearer {token}
```

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "rubricas": [
      {
        "id": "involucra",
        "nombre": "Involucra activamente a los estudiantes en el proceso de aprendizaje",
        "descripcion": "El docente logra que todos los estudiantes se involucren en actividades que promueven el aprendizaje.",
        "niveles": {
          "1": "En inicio",
          "2": "En proceso",
          "3": "Satisfactorio",
          "4": "Destacado"
        }
      },
      {
        "id": "razonamiento",
        "nombre": "Promueve el razonamiento, la creatividad y/o el pensamiento crítico",
        "descripcion": "El docente propone actividades de aprendizaje y establece interacciones pedagógicas que estimulan la formulación creativa de ideas o productos propios.",
        "niveles": {
          "1": "En inicio",
          "2": "En proceso",
          "3": "Satisfactorio",
          "4": "Destacado"
        }
      },
      {
        "id": "evalua",
        "nombre": "Evalúa el progreso de los aprendizajes para retroalimentar a los estudiantes",
        "descripcion": "El docente acompaña el proceso de aprendizaje de los estudiantes, monitoreando sus avances y dificultades.",
        "niveles": {
          "1": "En inicio",
          "2": "En proceso",
          "3": "Satisfactorio",
          "4": "Destacado"
        }
      },
      {
        "id": "respeto",
        "nombre": "Propicia un ambiente de respeto y proximidad",
        "descripcion": "El docente se comunica de manera respetuosa con los estudiantes y les transmite calidez o cordialidad.",
        "niveles": {
          "1": "En inicio",
          "2": "En proceso",
          "3": "Satisfactorio",
          "4": "Destacado"
        }
      },
      {
        "id": "comportamiento",
        "nombre": "Regula positivamente el comportamiento de los estudiantes",
        "descripcion": "El docente utiliza mecanismos formativos para orientar el comportamiento de los estudiantes.",
        "niveles": {
          "1": "En inicio",
          "2": "En proceso",
          "3": "Satisfactorio",
          "4": "Destacado"
        }
      }
    ]
  }
}
```

---

## 🔄 Códigos de Estado HTTP

### Códigos de Éxito
- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **204 No Content**: Operación exitosa sin contenido de respuesta

### Códigos de Error del Cliente
- **400 Bad Request**: Error de validación o solicitud mal formada
- **401 Unauthorized**: No autenticado o token inválido
- **403 Forbidden**: No tiene permisos para la operación
- **404 Not Found**: Recurso no encontrado
- **409 Conflict**: Conflicto (ej: recurso duplicado)
- **413 Payload Too Large**: Archivo demasiado grande
- **422 Unprocessable Entity**: Error de validación de negocio

### Códigos de Error del Servidor
- **500 Internal Server Error**: Error interno del servidor
- **503 Service Unavailable**: Servicio temporalmente no disponible

---

## 📝 Formato de Respuesta Estándar

### Respuesta Exitosa
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa" // Opcional
}
```

### Respuesta con Paginación
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### Respuesta de Error
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mensaje de error legible",
    "details": { ... } // Opcional, detalles adicionales
  }
}
```

---

## 🔒 Autenticación y Autorización

### Headers Requeridos
Todos los endpoints (excepto `/auth/login` y `/auth/refresh`) requieren:

```
Authorization: Bearer {token}
```

### Roles y Permisos
- **director**: Acceso completo a todas las funcionalidades
- **supervisor**: Puede ver y crear visitas, pero no eliminar
- **admin**: Acceso completo + gestión de usuarios

**Nota:** Implementar middleware de autorización según el rol del usuario.

---

## 📌 Notas de Implementación

### Validaciones Importantes

1. **Fechas:**
   - Formato ISO 8601: `YYYY-MM-DD`
   - Validar que fechas de visitas programadas sean futuras
   - Validar que fechas de visitas no sean futuras (o permitir con confirmación)

2. **Horas:**
   - Formato: `HH:mm` (24 horas)
   - Validar rango: 00:00 - 23:59

3. **Niveles de Logro:**
   - Solo aceptar valores: 1, 2, 3, 4
   - Calcular promedio automáticamente

4. **Archivos:**
   - Validar tamaño máximo: 10MB
   - Validar tipos MIME
   - Escanear por malware (recomendado)

### Consideraciones de Performance

1. **Paginación:** Siempre usar para listas grandes (default: 20 items)
2. **Índices de BD:** En `profesorId`, `fecha`, `ie`
3. **Caché:** Para templates de rúbricas y estadísticas
4. **Lazy Loading:** Para relaciones (profesor en visitas)

### Seguridad

1. **Rate Limiting:** Implementar en endpoints de autenticación
2. **CORS:** Configurar para dominio del frontend
3. **Sanitización:** Sanitizar todos los inputs
4. **Encriptación:** Encriptar datos sensibles (DNI, etc.)
5. **Logs:** Registrar todas las operaciones importantes

---

## 🚀 Endpoints Adicionales Recomendados

### 28. POST /auth/forgot-password

**Descripción:** Solicita restablecimiento de contraseña.

**Request Body:**
```json
{
  "email": "director@ejemplo.edu.pe"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Se ha enviado un email con instrucciones para restablecer tu contraseña"
}
```

---

### 29. POST /auth/reset-password

**Descripción:** Restablece la contraseña con un token.

**Request Body:**
```json
{
  "token": "reset-token-123",
  "newPassword": "nuevaPassword123"
}
```

---

### 30. GET /notificaciones

**Descripción:** Obtiene notificaciones del usuario (visitas pendientes, recordatorios, etc.).

**Response 200 OK:**
```json
{
  "success": true,
  "data": {
    "notificaciones": [
      {
        "id": "notif-1",
        "tipo": "visita_pendiente",
        "titulo": "Visita pendiente de confirmar",
        "mensaje": "Tienes 3 visitas programadas pendientes de confirmar",
        "leida": false,
        "createdAt": "2025-01-15T10:00:00Z"
      }
    ],
    "totalNoLeidas": 3
  }
}
```

---

**Total de Endpoints:** 30 endpoints principales + endpoints adicionales recomendados

**Última actualización:** Enero 2025

