# Especificaciones de la API — Guía para el Frontend

**Base URL:** `http://localhost:8000` (o la URL de despliegue)  
**Prefijo API v1:** `/v1`

---

## 1. Autenticación en las peticiones

Todos los endpoints excepto los de **Auth** (login, refresh, forgot-password, reset-password) requieren el token JWT en el header:

```http
Authorization: Bearer <access_token>
```

Si falta o es inválido, la respuesta será **401** con:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token requerido"
  }
}
```

---

## 2. Formato estándar de respuestas

### Respuesta exitosa

```json
{
  "success": true,
  "data": { ... }
}
```

Opcionalmente puede incluir `message`:

```json
{
  "success": true,
  "data": null,
  "message": "Mensaje opcional"
}
```

### Respuesta de error (4xx / 5xx)

El body de error sigue este formato:

```json
{
  "success": false,
  "error": {
    "code": "CODIGO_ERROR",
    "message": "Mensaje legible",
    "details": {}
  }
}
```

Códigos de error habituales: `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMIT_EXCEEDED`, `INVALID_REFRESH_TOKEN`, `INVALID_TOKEN`, `INVALID_TIPO`, `FILE_NOT_FOUND`, `ARCHIVO_NOT_FOUND`, `AI_PROCESSING_ERROR`, etc.

---

## 3. Paginación

Donde aplique, la paginación viene dentro de `data` con esta estructura:

```json
{
  "page": 1,
  "limit": 20,
  "total": 100,
  "totalPages": 5
}
```

Parámetros de query típicos: `page` (default 1), `limit` (default 20, máx. 100).

---

## 4. Endpoints por recurso

---

### Sistema (sin autenticación)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Info de la API |
| GET | `/health` | Health check |

**GET /**  
- **Respuesta 200:**  
```json
{
  "name": "ObservaDoc",
  "version": "1.0.0",
  "docs": "/docs",
  "openapi": "/openapi.json"
}
```

**GET /health**  
- **Respuesta 200:**  
```json
{ "status": "ok" }
```

---

### Auth

Base: **`/v1/auth`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| POST | `/v1/auth/login` | Iniciar sesión | ⭐ Sí |
| POST | `/v1/auth/refresh` | Renovar access token | ⭐ Sí |
| POST | `/v1/auth/logout` | Cerrar sesión | |
| GET | `/v1/auth/me` | Usuario actual | ⭐ Sí |
| POST | `/v1/auth/forgot-password` | Solicitar reseteo de contraseña | |
| POST | `/v1/auth/reset-password` | Restablecer contraseña con token | |

#### POST /v1/auth/login

- **Request (JSON):**
```json
{
  "email": "usuario@ejemplo.com",
  "password": "minimo8caracteres",
  "rememberMe": false
}
```
- **Validación:** `password` mínimo 8 caracteres.  
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "eyJ...",
    "user": {
      "id": "uuid",
      "email": "string",
      "nombre": "string",
      "apellido": "string",
      "rol": "director | supervisor | admin",
      "ie": "string | null",
      "foto": "string | null",
      "createdAt": "string | null",
      "updatedAt": "string | null"
    },
    "expiresIn": 3600
  }
}
```
- **Errores:** 401 (credenciales inválidas), 429 (rate limit).

#### POST /v1/auth/refresh

- **Request (JSON):**
```json
{
  "refreshToken": "eyJ..."
}
```
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "expiresIn": 3600
  }
}
```
- **Errores:** 401 (refresh inválido/expirado), 429 (rate limit).

#### POST /v1/auth/logout

- **Request (JSON):**
```json
{
  "refreshToken": "eyJ..."
}
```
- **Headers:** `Authorization: Bearer <token>`  
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": null,
  "message": "Sesión cerrada exitosamente"
}
```

#### GET /v1/auth/me

- **Headers:** `Authorization: Bearer <token>`  
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "nombre": "string",
    "apellido": "string",
    "rol": "director | supervisor | admin",
    "ie": "string | null",
    "foto": "string | null",
    "createdAt": "string | null",
    "updatedAt": "string | null"
  }
}
```

#### POST /v1/auth/forgot-password

- **Request (JSON):**
```json
{
  "email": "usuario@ejemplo.com"
}
```
- **Respuesta 200:** Siempre el mismo mensaje (no revela si el email existe):  
```json
{
  "success": true,
  "data": null,
  "message": "Se ha enviado un email con instrucciones para restablecer tu contraseña"
}
```

#### POST /v1/auth/reset-password

- **Request (JSON):**
```json
{
  "token": "token_del_email",
  "newPassword": "minimo8caracteres"
}
```
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": null,
  "message": "Contraseña restablecida exitosamente"
}
```
- **Error 400:** token inválido o expirado.

---

### Profesores

Base: **`/v1/profesores`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| GET | `/v1/profesores` | Listar profesores (paginado) | ⭐ Sí |
| GET | `/v1/profesores/{profesor_id}` | Obtener un profesor | ⭐ Sí |
| POST | `/v1/profesores` | Crear profesor | ⭐ Sí |
| PUT | `/v1/profesores/{profesor_id}` | Actualizar profesor | |
| DELETE | `/v1/profesores/{profesor_id}` | Eliminar profesor (solo director/admin) | |

#### GET /v1/profesores

- **Query:**  
  - `search` (opcional): búsqueda por texto  
  - `ie` (opcional): filtrar por IE  
  - `page`, `limit`, igual que paginación estándar  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "profesores": [
      {
        "id": "uuid",
        "nombre": "string",
        "apellido": "string",
        "foto": "string | null",
        "ie": "string",
        "salon": "string",
        "dni": "string | null",
        "cargo_laboral": "string | null",
        "especialidad": "string | null",
        "nivel_educativo": "string | null",
        "grado": "string | null",
        "seccion": "string | null",
        "areas_curriculares": "string | null",
        "createdAt": "string | null",
        "updatedAt": "string | null"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

#### GET /v1/profesores/{profesor_id}

- **Respuesta 200:** Un solo objeto con la misma forma que cada elemento de `profesores` arriba.

#### POST /v1/profesores

- **Request (JSON):**
```json
{
  "nombre": "string (min 2)",
  "apellido": "string (min 2)",
  "dni": "8 dígitos",
  "ie": "string",
  "salon": "string",
  "foto": "string | null",
  "cargo_laboral": "string | null",
  "especialidad": "string | null",
  "nivel_educativo": "string | null",
  "grado": "string | null",
  "seccion": "string | null",
  "areas_curriculares": "string | null"
}
```
- **Respuesta 201:** `data` = objeto profesor creado (misma forma que GET por id).

#### PUT /v1/profesores/{profesor_id}

- **Request (JSON):** Todos los campos opcionales; solo enviar los que se actualizan. Mismos nombres que en POST.  
- **Respuesta 200:** `data` = profesor actualizado.

#### DELETE /v1/profesores/{profesor_id}

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": null,
  "message": "Profesor eliminado exitosamente"
}
```
- **403:** si el usuario no es director ni admin.

---

### Visitas (realizadas)

Base: **`/v1/visitas`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| GET | `/v1/visitas` | Listar visitas (filtros + paginación) | ⭐ Sí |
| GET | `/v1/visitas/{visita_id}` | Obtener una visita | ⭐ Sí |
| GET | `/v1/visitas/profesores/{profesor_id}/visitas` | Visitas de un profesor | ⭐ Sí |
| POST | `/v1/visitas` | Crear visita | ⭐ Sí |
| PUT | `/v1/visitas/{visita_id}` | Actualizar visita | |
| DELETE | `/v1/visitas/{visita_id}` | Eliminar visita (solo director/admin) | |

#### GET /v1/visitas

- **Query:**  
  - `profesorId`, `fechaDesde`, `fechaHasta` (YYYY-MM-DD), `nivelLogro`, `ie`  
  - `page`, `limit`  
  - `sortBy`: default `"fecha"`  
  - `sortOrder`: `"asc"` | `"desc"` (default `"desc"`)  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": "uuid",
        "profesorId": "uuid",
        "profesor": {
          "id": "uuid",
          "nombre": "string",
          "apellido": "string",
          "foto": "string | null"
        },
        "fecha": "YYYY-MM-DD",
        "hora": "HH:mm",
        "nivelLogroTotal": 3.2,
        "rubricas": [
          {
            "id": "string",
            "nombre": "string",
            "nivel": 1,
            "observaciones": "string | null"
          }
        ],
        "datosDocente": { ... },
        "archivoUrl": "string | null",
        "createdAt": "string | null",
        "updatedAt": "string | null",
        "createdBy": { "id", "nombre", "apellido" } | null
      }
    ],
    "pagination": { "page", "limit", "total", "totalPages" }
  }
}
```

#### GET /v1/visitas/{visita_id}

- **Respuesta 200:** Un solo objeto visita (misma forma que cada elemento de `visitas` arriba).

#### GET /v1/visitas/profesores/{profesor_id}/visitas

- **Query:** `page`, `limit`, `sortBy` (default `"fecha"`), `sortOrder` (default `"desc"`).  
- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "profesor": {
      "id": "uuid",
      "nombre": "string",
      "apellido": "string"
    },
    "visitas": [ ... ],
    "pagination": { ... }
  }
}
```

#### POST /v1/visitas

- **Request (JSON):**
```json
{
  "profesorId": "uuid",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "datosDocente": {
    "nombreCompleto": "string",
    "dni": "string",
    "cargoLaboral": "string",
    "especialidad": "string",
    "ie": "string",
    "nivelEducativo": "string",
    "grado": "string",
    "seccion": "string",
    "areasCurriculares": "string",
    "fechaVisita": "YYYY-MM-DD",
    "horaInicio": "HH:mm",
    "horaFin": "HH:mm"
  },
  "rubricas": [
    {
      "id": "string (id de rúbrica del template)",
      "nombre": "string | null",
      "nivel": 1,
      "observaciones": "string | null"
    }
  ],
  "archivoId": "uuid | null"
}
```
- **Validación:** `rubricas` mínimo 1 elemento; `nivel` entre 1 y 4.  
- **Respuesta 201:** `data` = visita creada (misma forma que GET por id).

#### PUT /v1/visitas/{visita_id}

- **Request (JSON):** Todos opcionales: `fecha`, `hora`, `datosDocente`, `rubricas`, `archivoId`. Mismas formas que en POST.  
- **Respuesta 200:** `data` = visita actualizada.

#### DELETE /v1/visitas/{visita_id}

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": null,
  "message": "Visita eliminada exitosamente"
}
```

---

### Visitas programadas

Base: **`/v1/visitas-programadas`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| GET | `/v1/visitas-programadas` | Listar visitas programadas | ⭐ Sí |
| GET | `/v1/visitas-programadas/{visita_id}` | Obtener una visita programada | |
| POST | `/v1/visitas-programadas` | Crear una o varias visitas programadas | ⭐ Sí |
| PUT | `/v1/visitas-programadas/{visita_id}` | Actualizar visita programada | |
| DELETE | `/v1/visitas-programadas/{visita_id}` | Eliminar (solo director/admin) | |

#### GET /v1/visitas-programadas

- **Query:**  
  - `profesorId`, `fechaDesde`, `fechaHasta` (YYYY-MM-DD), `confirmada` (bool), `ie`  
  - `page`, `limit`  
  - `sortBy`: default `"fecha"`  
  - `sortOrder`: default `"asc"`  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "visitas": [
      {
        "id": "uuid",
        "profesorId": "uuid | null",
        "profesor": { ... } | null,
        "profesorNombre": "string | null",
        "fecha": "YYYY-MM-DD",
        "hora": "HH:mm",
        "ie": "string",
        "salon": "string",
        "confirmada": false,
        "notas": "string | null",
        "createdAt": "string | null",
        "updatedAt": "string | null"
      }
    ],
    "pagination": { ... }
  }
}
```

#### GET /v1/visitas-programadas/{visita_id}

- **Respuesta 200:** Un solo objeto visita programada (misma forma que arriba).

#### POST /v1/visitas-programadas

Acepta **una visita** o **varias** (bulk).

**Opción A — Una visita (objeto):**
```json
{
  "profesorId": "uuid | null",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "ie": "string",
  "salon": "string",
  "notas": "string | null"
}
```
- **Validación:** fecha debe ser futura.

**Opción B — Varias visitas (array):**
```json
{
  "visitas": [
    {
      "profesorId": "uuid | null",
      "fecha": "YYYY-MM-DD",
      "hora": "HH:mm",
      "ie": "string",
      "salon": "string",
      "notas": "string | null"
    }
  ]
}
```

- **Respuesta 201 — una visita:** `data` = objeto visita programada creada.  
- **Respuesta 201 — bulk:**  
```json
{
  "success": true,
  "data": {
    "created": 5,
    "visitas": [ ... ]
  }
}
```

#### PUT /v1/visitas-programadas/{visita_id}

- **Request (JSON):** Campos opcionales: `profesorId`, `fecha`, `hora`, `ie`, `salon`, `confirmada`, `notas`.  
- **Respuesta 200:** `data` = visita programada actualizada.

#### DELETE /v1/visitas-programadas/{visita_id}

- **Respuesta 200:** mensaje de eliminación exitosa.

---

### Archivos

Base: **`/v1/archivos`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| POST | `/v1/archivos/upload` | Subir archivo (observación/agenda) | ⭐ Sí |
| POST | `/v1/archivos/upload-agenda` | Subir agenda y extraer fechas con IA | ⭐ Sí |
| GET | `/v1/archivos/{archivo_id}` | Metadatos o descarga | |
| DELETE | `/v1/archivos/{archivo_id}` | Eliminar archivo (solo director/admin) | |

#### POST /v1/archivos/upload

- **Content-Type:** `multipart/form-data`  
- **Body (form):**  
  - `file` (requerido): archivo (PDF, JPEG, PNG). Límite 10 MB.  
  - `tipo` (requerido): `"observacion"` | `"agenda"`  
  - `profesorId` (opcional): UUID del profesor asociado (para tipo observación)  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "string",
    "url": "string (ej. /static/...)",
    "tipo": "observacion | agenda",
    "tamaño": 12345,
    "mimeType": "application/pdf | image/...",
    "uploadedAt": "string | null",
    "uploadedBy": { "id", "nombre", "apellido" } | null
  }
}
```
- **Error 400:** si `tipo` no es válido.

#### POST /v1/archivos/upload-agenda

- **Content-Type:** `multipart/form-data`  
- **Body (form):** solo `file` (requerido).  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "archivoId": "uuid",
    "archivoUrl": "string",
    "fechasExtraidas": [
      {
        "profesorId": "uuid | null",
        "profesorNombre": "string",
        "ie": "string",
        "salon": "string",
        "fecha": "YYYY-MM-DD",
        "hora": "HH:mm",
        "confianza": 0.95
      }
    ],
    "procesado": true,
    "totalFechas": 5
  }
}
```
Si falla el procesamiento con IA, `procesado` será `false` y `fechasExtraidas` puede estar vacío (el archivo igual se sube).

#### GET /v1/archivos/{archivo_id}

- **Query:** `download` (bool, default false).  
  - `download=false`: devuelve metadatos (misma forma que `data` de upload).  
  - `download=true`: devuelve el archivo (stream) con headers de descarga.  

#### DELETE /v1/archivos/{archivo_id}

- **Respuesta 200:** mensaje de eliminación exitosa.

---

### IA (autocompletar visita)

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| POST | `/v1/visitas/ai/autocompletar` | Autocompletar datos de visita desde documento | ⭐ Sí |

#### POST /v1/visitas/ai/autocompletar

- **Request (JSON):**
```json
{
  "profesorId": "uuid",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "archivoId": "uuid",
  "contextoVisita": "string | null",
  "notasUsuario": "string | null"
}
```

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "datosDocente": {
      "nombreCompleto": "string",
      "dni": "string",
      "cargoLaboral": "string",
      "especialidad": "string",
      "ie": "string",
      "nivelEducativo": "string",
      "grado": "string",
      "seccion": "string",
      "areasCurriculares": "string",
      "fechaVisita": "YYYY-MM-DD",
      "horaInicio": "HH:mm",
      "horaFin": "HH:mm"
    },
    "rubricas": [
      {
        "id": "string",
        "nombre": "string",
        "nivel": 1,
        "observaciones": "string | null"
      }
    ],
    "confianza": {
      "datosDocente": 0.9,
      "rubricas": {
        "involucra": 0.85,
        "razonamiento": 0.9,
        "evalua": 0.88,
        "respeto": 0.92,
        "comportamiento": 0.87
      },
      "general": 0.88
    },
    "advertencias": [
      {
        "campo": "string",
        "mensaje": "string",
        "tipo": "string"
      }
    ],
    "textoEstructurado": "string | null"
  }
}
```
- **Errores:** 404 (archivo no encontrado), 500 (AI_PROCESSING_ERROR).

---

### Rúbricas (plantilla)

Base: **`/v1/rubricas`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| GET | `/v1/rubricas` | Obtener plantilla de rúbricas | ⭐ Sí |

#### GET /v1/rubricas

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "rubricas": [
      {
        "id": "string",
        "nombre": "string",
        "descripcion": "string",
        "niveles": {
          "nivel1": "En inicio",
          "nivel2": "En proceso",
          "nivel3": "Satisfactorio",
          "nivel4": "Destacado"
        }
      }
    ]
  }
}
```
Estos `id` y `nombre` son los que se usan al crear/actualizar visitas y en la respuesta de autocompletar.

---

### Estadísticas

Base: **`/v1/estadisticas`**

| Método | Ruta | Descripción | Importante |
|--------|------|-------------|------------|
| GET | `/v1/estadisticas` | Estadísticas generales | ⭐ Sí |
| GET | `/v1/estadisticas/profesores/{profesor_id}` | Estadísticas por profesor | ⭐ Sí |

#### GET /v1/estadisticas

- **Query:** `ie`, `fechaDesde`, `fechaHasta` (opcionales).  

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "totalVisitas": 0,
    "totalProfesores": 0,
    "totalVisitasProgramadas": 0,
    "visitasPorNivel": {
      "nivel1": 0,
      "nivel2": 0,
      "nivel3": 0,
      "nivel4": 0
    },
    "visitasPorMes": [
      {
        "mes": "YYYY-MM",
        "total": 0,
        "nivelPromedio": 0.0
      }
    ],
    "visitasPendientesConfirmar": 0,
    "promedioNivelLogro": 0.0,
    "rubricasPromedio": {
      "involucra": 0.0,
      "razonamiento": 0.0,
      "evalua": 0.0,
      "respeto": 0.0,
      "comportamiento": 0.0
    }
  }
}
```

#### GET /v1/estadisticas/profesores/{profesor_id}

- **Respuesta 200:**  
```json
{
  "success": true,
  "data": {
    "profesor": { ... },
    "totalVisitas": 0,
    "visitasPorNivel": { "nivel1", "nivel2", "nivel3", "nivel4" },
    "promedioNivelLogro": 0.0,
    "evolucion": [
      {
        "fecha": "YYYY-MM-DD",
        "nivelLogro": 0.0
      }
    ],
    "rubricasPromedio": { ... },
    "ultimaVisita": "string | null",
    "proximaVisitaProgramada": "string | null"
  }
}
```

---

## 5. Flujo recomendado para el frontend

1. **Login:** `POST /v1/auth/login` → guardar `token`, `refreshToken` y `user`.  
2. **Peticiones:** enviar `Authorization: Bearer <token>` en todas las rutas protegidas.  
3. **Renovar token:** cuando el backend devuelva 401, usar `POST /v1/auth/refresh` con `refreshToken` y actualizar `token`.  
4. **Rúbricas:** al cargar el módulo de visitas, llamar `GET /v1/rubricas` para rellenar criterios y niveles.  
5. **Agenda:** subir PDF con `POST /v1/archivos/upload-agenda` y usar `fechasExtraidas` para crear visitas programadas en bloque.  
6. **Crear visita:**  
   - Opcional: subir documento con `POST /v1/archivos/upload` (tipo `observacion`) y usar `archivoId`.  
   - Opcional: autocompletar con `POST /v1/visitas/ai/autocompletar` (archivo + profesor + fecha/hora).  
   - Enviar formulario con `POST /v1/visitas`.  
7. **Listados:** usar `GET /v1/visitas`, `GET /v1/visitas-programadas`, `GET /v1/profesores` con filtros y paginación.  
8. **Dashboard:** `GET /v1/estadisticas` y `GET /v1/estadisticas/profesores/{id}`.

---

## 6. Archivos estáticos

Las URLs de archivos subidos (campo `url` en respuestas de archivos) son relativas al servidor, por ejemplo:

`http://localhost:8000/static/<path>`

Pueden usarse directamente como `src` de imágenes o enlaces de descarga.

---

*Documento generado a partir del código del backend. Para la definición OpenAPI exacta, usar `GET /openapi.json` o la documentación interactiva en `/docs`.*
