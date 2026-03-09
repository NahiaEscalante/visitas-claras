# API Contract (Backend ↔ Frontend)

**Proyecto:** Visitas Claras API

Este documento es el **contrato técnico oficial** entre el frontend y el backend. Está derivado del código del backend FastAPI ubicado en `criteria_backend/backend/app`.

---

## 1. VISIÓN GENERAL

### 1.1 Base URLs

El backend declara explícitamente los servers OpenAPI en `app/main.py`:

- **Producción**
  - `https://api.visitas-claras.com`
- **Desarrollo local**
  - `http://localhost:8000`

### 1.2 Versionado / Prefijo global

- **Prefijo global de API:** `/v1`
- Todos los endpoints descritos en este documento se entienden con el prefijo `/v1`.

Ejemplo:
- Ruta declarada en router: `/auth/login`
- Ruta real: `POST /v1/auth/login`

### 1.3 Formato global de requests

#### 1.3.1 Content-Type
- Endpoints JSON: `Content-Type: application/json`
- Subida de archivos: `Content-Type: multipart/form-data`
- Descarga de archivos: response binario (`application/octet-stream`)

#### 1.3.2 Encoding / charset
- JSON estándar UTF-8.

#### 1.3.3 Convención de nombres (nomenclatura)

El backend utiliza un `alias_generator` Pydantic (`to_camel`) en `app/schemas/base.py`:
- Internamente los modelos usan `snake_case`.
- En la API (JSON) **se exponen por defecto en `camelCase`**.

Sin embargo, hay endpoints que construyen manualmente respuestas con claves camelCase (por ejemplo `profesorId`, `createdAt`) y no dependen 100% del aliasing automático. En este contrato se documenta **lo que efectivamente retorna/espera el backend**.

#### 1.3.4 Envelope estándar de respuesta

Casi todas las respuestas siguen un envelope:

##### Respuesta exitosa
```json
{
  "success": true,
  "data": { }
}
```

Variantes:
- Listados: `data` suele ser `array`.
- Paginación (solo en `GET /visitas`): incluye `pagination`.
- Algunos endpoints usan `message` además de `success` (ej. logout).

##### Respuesta de error (global)
Para errores de negocio (`BusinessError`), validación (`422`) y HTTP exceptions (`401/403/404/...`), el backend retorna:

```json
{
  "success": false,
  "error": {
    "code": "<STRING>",
    "message": "<STRING>",
    "details": { }
  }
}
```

Notas:
- `error.details` **solo aparece si el backend lo incluye**.
- `details` puede ser `null`/omitido.

### 1.4 Headers globales

#### 1.4.1 Headers para endpoints protegidos
- `Authorization: Bearer <access_token>`

#### 1.4.2 Headers recomendados para endpoints JSON
- `Content-Type: application/json`
- `Accept: application/json`

### 1.5 CORS

CORS está configurado con `allow_methods=["*"]`, `allow_headers=["*"]`, `allow_credentials=True`.

`allow_origins` incluye:
- `https://visitas-claras.com`
- `https://www.visitas-claras.com`
- `https://api.visitas-claras.com`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://0.0.0.0:8000`

### 1.6 Códigos HTTP utilizados y significado en este proyecto

- **200 OK**
  - Operación exitosa (GET/POST/PUT/PATCH en muchos casos).
- **201 Created**
  - Recurso creado exitosamente (ej. `POST /profesores`, `POST /visitas`, `POST /visitas-programadas`).
- **204 No Content**
  - Operación exitosa sin body (ej. `DELETE /visitas-programadas/{id}`).
- **400 Bad Request**
  - Errores de negocio / validación manual (`BusinessError` por defecto) o `HTTPException` levantada con 400.
- **401 Unauthorized**
  - No autenticado (token faltante, inválido o expirado). El handler global normaliza el payload.
- **403 Forbidden**
  - No autorizado (si FastAPI/Starlette produce 403). En este proyecto no hay RBAC explícito en routers, pero el handler lo contempla.
- **404 Not Found**
  - Recurso inexistente.
- **409 Conflict**
  - Conflictos de negocio (ej. conflicto al programar visita).
- **422 Unprocessable Entity**
  - Validación de schema Pydantic (request body / query params) por FastAPI.
- **Otros códigos**
  - Se devuelven como `HTTP_ERROR` con `message=str(detail)` si se disparan `StarletteHTTPException` con otros status.

---

## 2. SISTEMA DE AUTENTICACIÓN (PRIORIDAD MÁXIMA)

### 2.1 Resumen de arquitectura

- **Tipo de autenticación:** Bearer Token (`Authorization: Bearer ...`).
- **Access token:** JWT (JWS) firmado con `HS256` (configurable) usando `python-jose`.
- **Refresh token:** JWT con claim `typ: "refresh"` y claim `jti`. Además, el refresh token se **persiste en DB** en tabla `refresh_tokens` como **hash SHA256** (no se guarda el token en claro).
- **Protección de endpoints:**
  - Routers protegidos usan `dependencies=[Depends(get_current_user_id)]`.
  - `get_current_user_id` valida el JWT de `Authorization` y extrae `sub`.

### 2.2 Configuración relevante (Settings)

En `app/core/config.py`:

- `jwt_secret` (string)
- `jwt_algorithm` (default `HS256`)
- `access_token_expires_seconds` (default `3600`)
- `refresh_token_expires_seconds` (default `60*60*24*7` = 7 días)

**Importante:**
- En código, el `access_token` se crea con expiración `settings.access_token_expires_seconds`.
- En `login`, el campo `expiresIn` devuelto **no coincide necesariamente** con el `exp` del access token:
  - Si `rememberMe=true`: `expiresIn = 60*60*24*7`.
  - Si `rememberMe` es `null`/`false`: `expiresIn = 3600`.
  - El `JWT exp` del access token sigue `access_token_expires_seconds` salvo que se llame a `create_access_token(..., expires_seconds=...)` (no ocurre en login).
  - Por lo tanto, el frontend debe tratar `expiresIn` como un hint/contrato de UI, pero la autoridad real es el backend al validar `exp`.

### 2.3 Cómo se envía el token en cada request

Para rutas protegidas:
- Header obligatorio:

```http
Authorization: Bearer <ACCESS_TOKEN_JWT>
```

No se aceptan tokens por query param ni por body para autenticación.

### 2.4 Estructura del JWT

#### 2.4.1 Access token
Generado en `app/core/security.py:create_access_token`.

Payload:
- `sub` (string): **user_id** (UUID en string)
- `iat` (int): epoch seconds
- `exp` (int): epoch seconds

No incluye `typ`.

#### 2.4.2 Refresh token
Generado en `app/core/security.py:create_refresh_token`.

Payload:
- `sub` (string): user_id (UUID string)
- `iat` (int)
- `exp` (int)
- `typ` (string): **"refresh"**
- `jti` (string): random token URL-safe

### 2.5 Persistencia, rotación e invalidación de refresh tokens

Tabla `refresh_tokens` (`app/models/refresh_token.py`):
- `id` (UUID)
- `user_id` (UUID) (index)
- `token_hash` (string) (unique, index)
- `expires_at` (datetime tz)
- `revoked_at` (datetime tz, nullable)
- `created_at` (datetime tz)
- `replaced_by_token_id` (UUID nullable)

#### 2.5.1 Hash del refresh token
Se calcula con:

- `hash = sha256(f"{jwt_secret}:{refresh_token}")`

Esto significa:
- Si cambia `jwt_secret`, los refresh tokens existentes **no podrán validarse** (hash distinto).

#### 2.5.2 Rotación (refresh)
Al refrescar sesión:
- Se valida el JWT (`decode_token`).
- Se valida que `typ == "refresh"`.
- Se calcula `token_hash` y se busca el registro en DB.
- Se valida:
  - exista
  - `revoked_at is None`
  - `expires_at > now`
- Se crea:
  - nuevo `access token`
  - nuevo `refresh token`
  - se inserta nuevo registro `refresh_tokens`
  - se revoca el viejo marcando `revoked_at=now` y `replaced_by_token_id=<new_id>`

### 2.6 Flujo completo de login (paso a paso)

1. Frontend envía `POST /v1/auth/login` con JSON (email + password + rememberMe opcional).
2. Backend:
   - (opcional) si `seed_dev_user=true`, asegura un usuario demo.
   - Busca usuario por email.
   - Verifica password:
     - Normaliza con `sha256(password)`.
     - Verifica contra `bcrypt` (`passlib`).
   - Verifica que `user.activo` sea `true`.
3. Backend genera:
   - `access token` JWT.
   - `refresh token` JWT.
4. Backend persiste refresh token en DB (hash) con expiración `refresh_token_expires_seconds`.
5. Backend devuelve `200` con `success=true` y `data` conteniendo tokens, `expiresIn` y `user`.

### 2.7 Qué devuelve el login (estructura exacta)

Response model: `AuthResponse`.

```json
{
  "success": true,
  "data": {
    "token": "<access_jwt>",
    "refreshToken": "<refresh_jwt>",
    "expiresIn": 3600,
    "user": {
      "id": "<uuid>",
      "email": "director@ejemplo.edu.pe",
      "nombre": "string",
      "apellido": "string",
      "rol": "string",
      "ie": "string | null",
      "foto": "string | null",
      "activo": true,
      "createdAt": "<datetime>",
      "updatedAt": "<datetime>"
    }
  }
}
```

Notas:
- `expiresIn` depende del `rememberMe` enviado.
- `createdAt` y `updatedAt` son datetimes serializados por FastAPI (ISO 8601).

### 2.8 Tokens temporales

En este backend existen:
- **Access token** (JWT) de corta duración (`access_token_expires_seconds`, default 1 hora).
- **Refresh token** (JWT) de duración mayor (`refresh_token_expires_seconds`, default 7 días) + persistencia en DB + rotación.

No hay un sistema adicional de “token temporal” separado del refresh token en el código analizado.

### 2.9 Qué pasa cuando un token expira (response exacto)

#### 2.9.1 Access token expirado / inválido / ausente
`get_current_user_id` lanza `HTTPException(status_code=401)`.
El handler global (`errors/handlers.py`) responde:

- **HTTP 401**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "No autenticado"
  }
}
```

#### 2.9.2 Refresh token inválido / expirado / revocado
`auth_service.refresh_session` lanza `BusinessError` con status 401.
Ejemplos de `code/message`:
- `INVALID_REFRESH_TOKEN` / `Refresh token inválido`
- `INVALID_REFRESH_TOKEN` / `Refresh token revocado`
- `INVALID_REFRESH_TOKEN` / `Refresh token expirado`

Respuesta (HTTP 401):
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token expirado"
  }
}
```

### 2.10 Flujo de refresh de token

Endpoint: `POST /v1/auth/refresh`

- Request:
  - `refreshToken` en el body JSON.
- Response:
  - Mismo shape que login (token + refreshToken nuevo + expiresIn + user).
- Efecto:
  - Rotación: el refresh token previo queda revocado.

### 2.11 Flujo de logout

Endpoint: `POST /v1/auth/logout`

- Requiere `Authorization: Bearer <access_token>`.
- Backend revoca **todos** los refresh tokens del usuario (`revoked_at`), dejando inválidos futuros refresh.
- No invalida access token inmediatamente (por diseño JWT stateless), pero el frontend debe descartarlo.

### 2.12 Rutas públicas vs protegidas

#### Públicas (no requieren Authorization)
- `POST /v1/auth/login`
- `POST /v1/auth/refresh`

#### Protegidas (requieren Authorization Bearer)
- `POST /v1/auth/logout`
- `GET /v1/auth/me`
- Todas las rutas bajo:
  - `/v1/profesores`
  - `/v1/visitas`
  - `/v1/visitas-programadas`
  - `/v1/calendar-chat`
  - `/v1/archivos`
  - `/v1/ia`
  - `/v1/stats`
  - `/v1/evaluaciones`

---

## 3. DOCUMENTACIÓN DE CADA ENDPOINT

Convenciones en esta sección:
- **Base URL** asumida: `https://api.visitas-claras.com` (prod) o `http://localhost:8000` (local).
- Todos los paths incluyen el prefijo `/v1`.

### 3.1 Authentication

#### [POST] /v1/auth/login
- **Descripción:** Autentica por email+password y crea una sesión entregando `access token` + `refresh token`.
- **Autenticación requerida:** No.
- **Headers requeridos:**
  - `Content-Type: application/json`
- **Body (Request):**
```json
{
  "email": "string (EmailStr)",
  "password": "string",
  "rememberMe": "boolean | null" 
}
```
- **Validaciones:**
  - `email` debe ser email válido (`pydantic.EmailStr`).
  - `password` string (sin reglas adicionales en schema).
- **Response exitoso:** `200` con `AuthResponse` (ver §2.7).
- **Responses de error:**
  - `422 VALIDATION_ERROR`: schema inválido.
  - `400 INVALID_CREDENTIALS`: email o password incorrectos.
  - `400 USER_INACTIVE`: usuario existe pero `activo=false`.
- **Ejemplo Request:**
```json
{
  "email": "director@ejemplo.edu.pe",
  "password": "director123",
  "rememberMe": true
}
```
- **Ejemplo Response (200):**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": 604800,
    "user": {
      "id": "0c4b...",
      "email": "director@ejemplo.edu.pe",
      "nombre": "Director",
      "apellido": "Demo",
      "rol": "director",
      "ie": null,
      "foto": null,
      "activo": true,
      "createdAt": "2026-01-01T00:00:00Z",
      "updatedAt": "2026-01-01T00:00:00Z"
    }
  }
}
```

#### [POST] /v1/auth/refresh
- **Descripción:** Intercambia un `refreshToken` válido por un nuevo `access token` y un nuevo `refresh token` (rotación).
- **Autenticación requerida:** No (no usa `Authorization`).
- **Headers requeridos:**
  - `Content-Type: application/json`
- **Body (Request):**
```json
{
  "refreshToken": "string"
}
```
- **Response exitoso:** `200` `AuthResponse`.
- **Responses de error:**
  - `422 VALIDATION_ERROR`: schema inválido.
  - `401 INVALID_REFRESH_TOKEN`: token inválido, revocado o expirado.
- **Ejemplo Response error (401):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token revocado"
  }
}
```

#### [POST] /v1/auth/logout
- **Descripción:** Cierra sesión revocando todos los refresh tokens del usuario.
- **Autenticación requerida:** Sí (Bearer access token).
- **Headers requeridos:**
  - `Authorization: Bearer <access_token>`
- **Body:** ninguno.
- **Response exitoso:** `200`
```json
{
  "success": true,
  "message": "Sesión cerrada exitosamente"
}
```
- **Responses de error:**
  - `401 UNAUTHENTICATED`: token faltante/invalid/expirado.

#### [GET] /v1/auth/me
- **Descripción:** Devuelve el usuario autenticado.
- **Autenticación requerida:** Sí (Bearer access token).
- **Headers requeridos:**
  - `Authorization: Bearer <access_token>`
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "string",
    "nombre": "string",
    "apellido": "string",
    "rol": "string",
    "ie": "string | null",
    "foto": "string | null",
    "activo": true,
    "createdAt": "datetime",
    "updatedAt": "datetime"
  }
}
```
- **Errors:**
  - `401 UNAUTHENTICATED`

---

### 3.2 Profesores

Todas las rutas requieren auth Bearer.

#### [GET] /v1/profesores
- **Descripción:** Lista profesores. Permite búsqueda y filtros.
- **Autenticación requerida:** Sí.
- **Headers requeridos:**
  - `Authorization: Bearer <access_token>`
- **Query params:**
  - `search` (string, opcional): texto a buscar (nombre/apellido, incluye matching con tokens y unaccent).
  - `ie` (string, opcional): filtra por institución educativa exacta.
  - `activo` (boolean, opcional): filtra por activo.
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "nombre": "string",
      "apellido": "string",
      "foto": "string",
      "ie": "string",
      "salon": "string",
      "dni": "string | null",
      "especialidad": "string | null",
      "cargoLaboral": "string | null",
      "nivelEducativo": "string | null",
      "grado": "string | null",
      "seccion": "string | null",
      "areasCurriculares": "string | null",
      "celular": "string | null",
      "activo": true,
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```
- **Notas de nulabilidad:**
  - `foto` en DB puede ser `null`, pero el servicio retorna `""` si es null.
- **Errors:**
  - `401 UNAUTHENTICATED`

#### [GET] /v1/profesores/{id}
- **Descripción:** Obtiene un profesor por UUID.
- **Autenticación requerida:** Sí.
- **URL params:**
  - `id` (string, requerido): UUID.
- **Response exitoso:** `200` (mismo shape de un Profesor).
- **Errors:**
  - `404 PROFESOR_NOT_FOUND`
  - `400 VALIDATION_ERROR` si UUID inválido.
  - `401 UNAUTHENTICATED`

#### [POST] /v1/profesores
- **Descripción:** Crea un profesor.
- **Autenticación requerida:** Sí.
- **Body (Request):**
```json
{
  "nombre": "string",
  "apellido": "string",
  "foto": "string | null",
  "ie": "string",
  "salon": "string",
  "dni": "string | null",
  "especialidad": "string | null",
  "cargoLaboral": "string | null",
  "nivelEducativo": "string | null",
  "grado": "string | null",
  "seccion": "string | null",
  "areasCurriculares": "string | null",
  "celular": "string | null"
}
```
- **Validaciones de negocio:**
  - `nombre`, `apellido`, `ie`, `salon` no pueden ser vacíos (strip).
- **Response exitoso:** `201` con profesor creado.
- **Errors:**
  - `400 VALIDATION_ERROR` si faltan campos requeridos (vacíos).
  - `422 VALIDATION_ERROR` si body no cumple schema.
  - `401 UNAUTHENTICATED`

---

### 3.3 Visitas

Todas las rutas requieren auth Bearer.

#### [GET] /v1/visitas
- **Descripción:** Lista visitas con filtros y paginación.
- **Autenticación requerida:** Sí.
- **Query params (con alias):**
  - `profesorId` (string UUID, opcional)
  - `fechaInicio` (date `YYYY-MM-DD`, opcional)
  - `fechaFin` (date `YYYY-MM-DD`, opcional)
  - `limit` (int, opcional, default `50`, min `1`, max `100`)
  - `offset` (int, opcional, default `0`, min `0`)
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "profesorId": "uuid",
      "observadorId": "uuid",
      "fecha": "YYYY-MM-DD",
      "hora": "HH:mm (string)",
      "nivelLogroTotal": 1,
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
      "observacionGeneral": "string | null",
      "archivoId": "uuid | null",
      "createdAt": "datetime",
      "updatedAt": "datetime",
      "rubricas": [
        {
          "id": "uuid",
          "visitaId": "uuid",
          "rubricaId": "string",
          "nivel": "int | null",
          "observaciones": "string",
          "createdAt": "datetime"
        }
      ]
    }
  ],
  "pagination": {
    "total": 0,
    "limit": 50,
    "offset": 0
  }
}
```
- **Errors:**
  - `422 VALIDATION_ERROR` por query params (ej limit fuera de rango)
  - `400 VALIDATION_ERROR` si `profesorId` UUID inválido (BusinessError desde service).
  - `401 UNAUTHENTICATED`

#### [POST] /v1/visitas
- **Descripción:** Crea una visita y sus rúbricas asociadas. Calcula `nivelLogroTotal` como promedio redondeado de niveles no-null; si no hay niveles, usa `1`.
- **Autenticación requerida:** Sí.
- **Headers:**
  - `Authorization: Bearer <access_token>`
  - `Content-Type: application/json`
- **Body (Request):**
```json
{
  "profesorId": "uuid",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm (string)",
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
      "id": "string (se acepta en schema pero NO se usa para crear; el backend genera UUID)",
      "rubricaId": "string",
      "nivel": "int | null",
      "observaciones": "string"
    }
  ],
  "archivoId": "uuid | null",
  "iaSuggestionId": "uuid | null"
}
```
- **Validaciones de negocio:**
  - `profesorId` debe existir en DB; si no existe: `VALIDATION_ERROR`.
  - Si `iaSuggestionId` viene:
    - Debe existir y pertenecer al mismo `created_by` (observador) y `profesor_id`.
    - Si no: `VALIDATION_ERROR` (`iaSuggestionId inválido`).
- **Response exitoso:** `201`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profesorId": "uuid",
    "fecha": "YYYY-MM-DD",
    "hora": "HH:mm",
    "nivelLogroTotal": 1,
    "rubricas": [
      {
        "id": "uuid",
        "rubricaId": "string",
        "nivel": "int | null",
        "observaciones": "string",
        "createdAt": "datetime"
      }
    ],
    "datosDocente": { "...": "..." },
    "archivoUrl": null,
    "createdAt": "datetime"
  }
}
```
- **Errors:**
  - `400 VALIDATION_ERROR` por UUID inválidos o reglas anteriores.
  - `422 VALIDATION_ERROR` por schema.
  - `401 UNAUTHENTICATED`

#### [GET] /v1/visitas/{id}
- **Descripción:** Obtiene una visita por id e incluye rúbricas e info IA opcional.
- **Autenticación requerida:** Sí.
- **URL params:**
  - `id` (uuid)
- **Response exitoso:** `200`
  - Incluye `ia` **solo si** `iaSuggestionId` existe y la sugerencia está en DB.
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "profesorId": "uuid",
    "observadorId": "uuid",
    "fecha": "YYYY-MM-DD",
    "hora": "HH:mm",
    "nivelLogroTotal": 1,
    "datosDocente": { "...": "..." },
    "observacionGeneral": "string | null",
    "archivoId": "uuid | null",
    "createdAt": "datetime",
    "updatedAt": "datetime",
    "rubricas": [ { "...": "..." } ],
    "ia": {
      "suggestionId": "uuid",
      "payload": { }
    }
  }
}
```
- **Errors:**
  - `404 VISITA_NOT_FOUND`
  - `400 VALIDATION_ERROR` si UUID inválido
  - `401 UNAUTHENTICATED`

---

### 3.4 Visitas Programadas

Todas las rutas requieren auth Bearer.

Modelo de status (según servicio):
- `pending`
- `active`
- `done`
- `canceled`

#### [GET] /v1/visitas-programadas
- **Descripción:** Lista visitas programadas del observador autenticado.
- **Autenticación requerida:** Sí.
- **Query params:**
  - `fecha` (date, opcional)
  - `desde` (date, opcional)
  - `hasta` (date, opcional)
  - `profesorId` (uuid, opcional)
  - `confirmada` (bool, opcional)
  - `cancelada` (bool, opcional)
  - `ie` (string, opcional)
  - `status` (string, opcional)
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "profesorId": "uuid",
      "profesorNombre": "string",
      "observadorId": "uuid | null",
      "fecha": "YYYY-MM-DD",
      "hora": "HH:mm",
      "duracionMinutos": 90,
      "status": "pending",
      "ie": "string",
      "salon": "string",
      "confirmada": false,
      "cancelada": false,
      "motivoCancelacion": "string | null",
      "notas": "string | null",
      "createdAt": "datetime",
      "updatedAt": "datetime"
    }
  ]
}
```
- **Errors:**
  - `400 VALIDATION_ERROR` si UUID inválidos
  - `401 UNAUTHENTICATED`

#### [GET] /v1/visitas-programadas/{id}
- **Descripción:** Obtiene una visita programada por id (solo si pertenece al observador autenticado).
- **Autenticación requerida:** Sí.
- **Errors:**
  - `404 VISITA_PROGRAMADA_NOT_FOUND`

#### [POST] /v1/visitas-programadas
- **Descripción:** Crea una visita programada.
- **Body:**
```json
{
  "profesorId": "uuid",
  "profesorNombre": "string",
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "ie": "string",
  "salon": "string",
  "confirmada": "bool | null",
  "duracionMinutos": "int | null"
}
```
- **Defaults:**
  - `duracionMinutos` default 90 si `null`.
  - `confirmada` default `false` si `null`.
  - `status` inicial: `pending`.
- **Errores:**
  - `409 VISITA_PROGRAMADA_CONFLICT` si el profesor ya tiene visita en misma fecha/hora (no cancelada, status pending/active).
  - `400 VALIDATION_ERROR` UUID inválido.

#### [PUT] /v1/visitas-programadas/{id}
- **Descripción:** Actualiza campos editables.
- **Body:**
```json
{
  "fecha": "YYYY-MM-DD | null",
  "hora": "HH:mm | null",
  "duracionMinutos": "int | null",
  "confirmada": "bool | null",
  "notas": "string | null"
}
```
- **Reglas:**
  - Si la visita está cancelada: `400 VISITA_PROGRAMADA_CANCELED`.
  - Si cambia fecha/hora, se valida conflicto (409).

#### [PUT] /v1/visitas-programadas/{id}/confirmar
- **Descripción:** Marca `confirmada=true`.
- **Errores:**
  - `400 VISITA_PROGRAMADA_CANCELED` si cancelada.

#### [PUT] /v1/visitas-programadas/{id}/cancelar
- **Descripción:** Cancela la visita (`cancelada=true`, `status=canceled`).
- **Body:**
```json
{
  "motivoCancelacion": "string | null",
  "notas": "string | null"
}
```

#### [PUT] /v1/visitas-programadas/{id}/reprogramar
- **Descripción:** Reprograma fecha/hora (y opcional duración). Si status era `done` o `canceled`, vuelve a `pending`.
- **Body:**
```json
{
  "fecha": "YYYY-MM-DD",
  "hora": "HH:mm",
  "duracionMinutos": "int | null"
}
```
- **Errores:**
  - `409 VISITA_PROGRAMADA_CONFLICT`
  - `400 VISITA_PROGRAMADA_CANCELED` si cancelada.

#### [PUT] /v1/visitas-programadas/{id}/finalizar
- **Descripción:** Finaliza una visita activa (`status=done`).
- **Body:**
```json
{ "notas": "string | null" }
```
- **Errores:**
  - `400 VISITA_PROGRAMADA_INVALID_STATUS` si status != `active`.
  - `400 VISITA_PROGRAMADA_CANCELED` si cancelada.

#### [DELETE] /v1/visitas-programadas/{id}
- **Descripción:** Elimina definitivamente la visita programada (solo si pertenece al observador).
- **Response exitoso:** `204` (sin body).
- **Errores:**
  - `404 VISITA_PROGRAMADA_NOT_FOUND`

---

### 3.5 Archivos

Todas las rutas requieren auth Bearer.

#### [POST] /v1/archivos/upload
- **Descripción:** Sube un archivo y crea un registro en DB.
- **Autenticación requerida:** Sí.
- **Headers requeridos:**
  - `Authorization: Bearer <access_token>`
  - `Content-Type: multipart/form-data`
- **Body (multipart/form-data):**
  - `file` (archivo, requerido)
  - `tipo` (string, requerido)
    - Valores permitidos: `observacion`, `documento`, `foto`
  - `profesorId` (string UUID, opcional)
- **Restricciones:**
  - Tamaño máximo: **10MB**
  - Extensiones permitidas: `.pdf`, `.png`, `.jpg`, `.jpeg`, `.webp`
  - MIME permitido: `application/pdf`, `image/png`, `image/jpeg`, `image/jpg`, `image/webp`
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "nombre": "string",
    "url": "/v1/archivos/<uuid>",
    "tipo": "observacion|documento|foto",
    "size": 123,
    "mimeType": "string",
    "uploadedAt": "datetime"
  }
}
```
- **Errores (`BusinessError`):**
  - `400 INVALID_FILE` (tipo/mime/extensión/tamaño)
  - `400 VALIDATION_ERROR` UUID inválido (`profesorId`).

#### [GET] /v1/archivos
- **Descripción:** Lista archivos con filtros y paginación simple.
- **Query params:**
  - `tipo` (string, opcional; si se envía debe estar en {observacion,documento,foto})
  - `profesor_id` (string uuid, opcional) *(nota: en router no hay alias declarado)*
  - `limit` (int, opcional default 50; el service lo clampa 1..200)
  - `offset` (int, opcional default 0)
- **Response:** `200` con `data: Archivo[]`.
- **Errores:**
  - `400 VALIDATION_ERROR` si tipo inválido.

#### [GET] /v1/archivos/{id}
- **Descripción:** Descarga el archivo por id.
- **Autenticación requerida:** Sí.
- **Response exitoso:** archivo binario
  - `Content-Type: application/octet-stream`
  - `Content-Disposition: attachment; filename="<nombre>"`
- **Errores:**
  - `404 ARCHIVO_NOT_FOUND`

---

### 3.6 IA

Todas las rutas requieren auth Bearer.

#### [POST] /v1/ia/autocompletar
- **Descripción:** Procesa un archivo (PDF/imagen) con Gemini, genera una sugerencia IA, y crea una evaluación en estado `draft`. Devuelve datos para autocompletar.
- **Autenticación requerida:** Sí.
- **Body:**
```json
{
  "profesorId": "uuid",
  "observadorId": "uuid",
  "fecha": "string",
  "hora": "string",
  "archivoId": "uuid",
  "contextoVisita": "string | null",
  "notasUsuario": "string | null"
}
```
- **Notas importantes:**
  - Aunque el request incluye `observadorId`, el router también obtiene `user_id` del token y lo usa como `created_by` al llamar al servicio IA.
  - Requiere configurar `GEMINI_API_KEY` (ver §6.3).
- **Response exitoso:** `200`
```json
{
  "success": true,
  "data": {
    "evaluacionId": "uuid",
    "estado": "draft",
    "requiereConfirmacionHumana": true,
    "datosDocente": { "..." },
    "rubricas": [ { "..." } ],
    "observacionGeneral": "string | null",
    "explicacionesRubricas": [ { "rubricaId": "string", "razon": "string", "extractos": ["string"] } ],
    "sugerenciasMejora": ["string"] | null,
    "puntajeTotal": "int | null"
  }
}
```
- **Errores:**
  - `400 VALIDATION_ERROR` si UUID inválidos.
  - `404 ARCHIVO_NOT_FOUND` si no existe o el path está fuera de storage.
  - `400 INVALID_FILE` si mime no permitido.
  - Excepciones internas de IA pueden propagarse como 500 (no hay handler custom para ellas).

---

### 3.7 Calendar Chat

Todas las rutas requieren auth Bearer.

Payloads posibles (`CalendarChatPayload`):
- `ask`
- `info`
- `proposal`
- `result`

#### [POST] /v1/calendar-chat/message
- **Descripción:** Envía un mensaje del usuario al asistente de calendario. Puede pedir más datos (`ask`), dar info (`info`) o proponer acciones (`proposal`).
- **Body:**
```json
{
  "text": "string",
  "conversationId": "string | null",
  "archivoId": "string | null"
}
```
- **Response 200:**
  - `data.type` determina el shape.

Ejemplo `ask`:
```json
{
  "success": true,
  "data": {
    "type": "ask",
    "message": "¿Para qué hora?",
    "missingFields": ["hora"]
  }
}
```

Ejemplo `proposal`:
```json
{
  "success": true,
  "data": {
    "type": "proposal",
    "message": "Confirmas estos cambios?",
    "proposalId": "uuid",
    "actions": [
      {
        "actionType": "create",
        "profesorId": "uuid",
        "profesorNombre": "string",
        "fecha": "YYYY-MM-DD",
        "hora": "HH:mm",
        "duracionMinutos": 90,
        "ie": "string",
        "salon": "string",
        "confirmada": false
      }
    ],
    "buttons": [
      {"id": "confirm", "label": "Confirmar"},
      {"id": "cancel", "label": "Cancelar"}
    ]
  }
}
```

- **Errores relevantes (`BusinessError`):**
  - `404 PROFESOR_NOT_FOUND` si no encuentra profesor por query.
  - `400 CALENDAR_CHAT_AMBIGUOUS_PROFESOR` puede ocurrir internamente, pero el servicio lo transforma en un `ask` con lista de candidatos en mensaje; en algunos casos puede retornar error si no es manejado.
  - `400 AI_PROCESSING_ERROR` si la IA devuelve payload inválido.

#### [POST] /v1/calendar-chat/confirm
- **Descripción:** Confirma y ejecuta una `proposal` previamente generada.
- **Body:**
```json
{ "proposalId": "string" }
```
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "type": "result",
    "message": "Cambios aplicados",
    "results": [
      {
        "actionType": "create",
        "ok": true,
        "data": { }
      }
    ]
  }
}
```
- **Errores:**
  - `400 CALENDAR_CHAT_INVALID_PROPOSAL` si la propuesta ya no está `proposed`.
  - Errores de negocio de acciones (`VISITA_PROGRAMADA_CONFLICT`, `VISITA_PROGRAMADA_NOT_FOUND`, etc.).

#### [POST] /v1/calendar-chat/cancel
- **Descripción:** Cancela una `proposal`.
- **Body:**
```json
{ "proposalId": "string" }
```
- **Response:**
  - `info`.

---

### 3.8 Estadísticas

#### [GET] /v1/stats/visitas
- **Descripción:** Devuelve métricas agregadas de visitas.
- **Query params:**
  - `fechaInicio` (date, opcional)
  - `fechaFin` (date, opcional)
  - `ie` (string, opcional)
- **Response 200:**
```json
{
  "success": true,
  "data": {
    "totalVisitas": 0,
    "nivelIV": 0,
    "nivelIII": 0,
    "porMejorar": 0,
    "porInstitucion": [
      {"ie": "string", "total": 0, "promedio": 0.0}
    ]
  }
}
```
- **Notas:**
  - `porInstitucion` puede ser `[]` (si no hay datos) o `null` según el schema; el servicio siempre retorna una lista (posiblemente vacía).

---

### 3.9 Evaluaciones

Todas las rutas requieren auth Bearer.

#### [GET] /v1/evaluaciones/{evaluacion_id}
- **Descripción:** Obtiene una evaluación por id.
- **Response 200:**
  - Ver schema `EvaluacionResponse`.
- **Errores:**
  - `404 NOT_FOUND` (router levanta `HTTPException(404, "Evaluación no encontrada")`)

#### [PATCH] /v1/evaluaciones/{evaluacion_id}
- **Descripción:** Actualiza parcialmente una evaluación **solo si está en estado `draft`**.
- **Body (campos opcionales):**
```json
{
  "observacionGeneral": "string | null",
  "explicacionesRubricas": [
    {"rubricaId": "string", "razon": "string", "extractos": ["string"] | null}
  ] | null,
  "sugerenciasMejora": ["string"] | null,
  "puntajeTotal": "int | null",
  "rubricas": [
    {"id": "uuid", "rubricaId": "string", "nivel": "int | null", "observaciones": "string"}
  ] | null
}
```
- **Reglas de negocio:**
  - Si estado != `draft`: error 400 con detail `"Solo se pueden editar evaluaciones en estado draft"`.
- **Errores (tal como está implementado):**
  - Si `ValueError`: `HTTP 400` con `detail` string.
  - Para otros errores: `HTTP 404` con `detail="Evaluación no encontrada"`.
  - Estos errores pasan por handler StarletteHTTPException:
    - `400` => `HTTP_ERROR` con `message` igual al `detail`.
    - `404` => `NOT_FOUND`/"Recurso no encontrado" (handler global sobreescribe detalle).

#### [PATCH] /v1/evaluaciones/{evaluacion_id}/confirmar
- **Descripción:** Confirma una evaluación `draft` (`estado=confirmed`, setea `confirmadoPorId` y `fechaConfirmacion`).
- **Body:** `{}` (schema vacío).
- **Errores:**
  - Igual patrón que update: `400` por ValueError, `404` genérico.

---

## 4. MODELOS DE DATOS

Esta sección describe entidades principales según modelos SQLAlchemy.

### 4.1 User (`users`)
Campos (ver `app/models/user.py`):
- `id` UUID (PK)
- `email` string (unique, index, no null)
- `password_hash` string (no null)
- `nombre` string (no null)
- `apellido` string (no null)
- `rol` string (no null)
- `ie` string (nullable)
- `foto` string (nullable)
- `activo` bool (default true)
- `created_at`, `updated_at` (TimestampMixin)

### 4.2 RefreshToken (`refresh_tokens`)
- Ver §2.5.

### 4.3 Profesor (`profesores`)
- `id` UUID
- `nombre` string (no null)
- `apellido` string (no null)
- `foto` string (nullable)
- `ie` string (no null)
- `salon` string (no null)
- `dni` string (nullable)
- `especialidad` string (nullable)
- `cargo_laboral` string (nullable)
- `nivel_educativo` string (nullable)
- `grado` string (nullable)
- `seccion` string (nullable)
- `areas_curriculares` string (nullable)
- `celular` string (nullable)
- `activo` bool
- timestamps

### 4.4 Archivo (`archivos`)
- `id` UUID
- `nombre` string
- `url` string (en el servicio actualmente es `"/v1/archivos/{id}"`)
- `storage_path` string
- `tipo` string
- `size` int (bytes)
- `mime_type` string
- `uploaded_at` datetime tz
- `profesor_id` uuid nullable

### 4.5 IASuggestion (`ia_suggestions`)
- `id` UUID
- `created_by` UUID
- `profesor_id` UUID
- `archivo_id` UUID
- `model` string
- `payload_json` JSONB
- timestamps

### 4.6 Visita (`visitas`)
- `id` UUID
- `profesor_id` UUID
- `observador_id` UUID
- `fecha` date
- `hora` string(5)
- `nivel_logro_total` int
- `observacion_general` text nullable
- `archivo_id` uuid nullable
- `ia_suggestion_id` uuid nullable
- `datos_docente_json` JSONB (no null)
- timestamps

### 4.7 RubricaEval (`rubricas_eval`)
- `id` UUID
- `visita_id` UUID
- `rubrica_id` string
- `nivel` int nullable
- `observaciones` string
- timestamps

### 4.8 VisitaProgramada (`visitas_programadas`)
- `id` UUID
- `profesor_id` UUID
- `profesor_nombre` string
- `observador_id` UUID nullable (pero en servicios se setea siempre al crear)
- `fecha` date
- `hora` string(5)
- `duracion_minutos` int default 90
- `status` string default `pending`
- `ie` string
- `salon` string
- `confirmada` bool default false
- `cancelada` bool default false
- `motivo_cancelacion` string nullable
- `notas` text nullable
- timestamps

### 4.9 Evaluacion (`evaluaciones`) y EvaluacionRubrica (`evaluacion_rubricas`)

`Evaluacion`:
- `id` UUID
- `profesor_id` UUID
- `observador_id` UUID
- `archivo_id` UUID nullable
- `estado` enum/string: `draft|confirmed`
- `requiere_confirmacion_humana` bool default true
- `datos_docente_json` JSONB
- `observacion_general` text nullable
- `explicaciones_rubricas` JSONB nullable
- `sugerencias_mejora` JSONB nullable
- `puntaje_total` int nullable
- `ia_confianza` JSONB nullable
- `ia_advertencias` JSONB nullable
- `ia_texto_estructurado` text nullable
- `confirmado_por_id` UUID nullable
- `fecha_confirmacion` datetime nullable
- `contexto_visita` text nullable
- `notas_usuario` text nullable
- timestamps
- relación `rubricas` (1:N)

`EvaluacionRubrica`:
- `id` UUID
- `evaluacion_id` UUID (FK con cascade delete)
- `rubrica_id` string
- `nivel` int nullable
- `observaciones` string
- timestamps

---

## 5. MANEJO DE ERRORES GLOBAL

### 5.1 Formato estándar del objeto de error

Ver §1.3.4.

### 5.2 Errores de validación de FastAPI (422)

Cuando falla la validación Pydantic (body/query/path), el backend devuelve:

- **HTTP 422**
- `code = "VALIDATION_ERROR"`
- `message = "Schema validation error"`
- `details.errors` contiene lista sanitizada:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Schema validation error",
    "details": {
      "errors": [
        {
          "loc": ["body", "email"],
          "msg": "value is not a valid email address",
          "type": "value_error",
          "input": "...",
          "ctx": {"...": "..."}
        }
      ]
    }
  }
}
```

### 5.3 Errores de autenticación (401)

Siempre normalizados a:
```json
{
  "success": false,
  "error": {"code": "UNAUTHENTICATED", "message": "No autenticado"}
}
```

### 5.4 Errores de autorización (403)

Normalizados a:
```json
{
  "success": false,
  "error": {"code": "FORBIDDEN", "message": "No autorizado"}
}
```

### 5.5 Errores de not found (404)

Normalizados a:
```json
{
  "success": false,
  "error": {"code": "NOT_FOUND", "message": "Recurso no encontrado"}
}
```

**Nota importante:** aunque algunos endpoints levantan `HTTPException(404, detail="...")`, el handler global reemplaza el payload por `NOT_FOUND` genérico.

### 5.6 Lista de códigos de error custom (observados en código)

Esta lista incluye códigos usados explícitamente (no exhaustiva si existen ramas no leídas):

- `INVALID_CREDENTIALS`
- `USER_INACTIVE`
- `INVALID_REFRESH_TOKEN`
- `VALIDATION_ERROR`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `HTTP_ERROR`
- `ARCHIVO_NOT_FOUND`
- `INVALID_FILE`
- `PROFESOR_NOT_FOUND`
- `VISITA_NOT_FOUND`
- `VISITA_PROGRAMADA_NOT_FOUND`
- `VISITA_PROGRAMADA_CONFLICT`
- `VISITA_PROGRAMADA_CANCELED`
- `VISITA_PROGRAMADA_INVALID_STATUS`
- `AI_PROCESSING_ERROR`
- `CALENDAR_CHAT_AMBIGUOUS_PROFESOR`
- `CALENDAR_CHAT_INVALID_PROPOSAL`
- `NOT_IMPLEMENTED`

---

## 6. NOTAS PARA EL FRONTEND

### 6.1 Orden recomendado de implementación

1. **Auth**
   - Implementar `login` + persistencia de `token` y `refreshToken`.
   - Implementar interceptor para `Authorization: Bearer`.
   - Implementar refresh automático con `POST /auth/refresh` cuando el backend responda 401.
   - Implementar logout.

2. **Entidades base**
   - Profesores
   - Archivos (upload + download)

3. **Flujos core**
   - Visitas programadas
   - Visitas

4. **IA + Evaluaciones**
   - Autocompletar (requiere archivo y Gemini API key configurada en backend)
   - Edición/confirmación de evaluación

5. **Calendar Chat**
   - Modelar correctamente los payloads discriminados por `type`.

### 6.2 Comportamientos no obvios / trampas

- **401 siempre devuelve `UNAUTHENTICATED` genérico** (no devuelve detalle `Unauthorized`).
- **404 por HTTPException se normaliza a `NOT_FOUND` genérico**, aunque el router ponga un detail específico.
- **`expiresIn` en login** puede diferir del `exp` real del JWT de access token (ver §2.2).
- En `GET /archivos`, el query param para profesor está como `profesor_id` (snake) en router, mientras otros endpoints usan alias `profesorId`.
- `GET /archivos/{id}` no devuelve JSON, devuelve binario.

### 6.3 Variables de entorno relevantes

Backend (`.env`):
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_ALGORITHM`
- `ACCESS_TOKEN_EXPIRES_SECONDS`
- `REFRESH_TOKEN_EXPIRES_SECONDS`
- `STORAGE_LOCAL_PATH`
- `GEMINI_API_KEY` (**requerida** para IA)
- `GEMINI_MODEL`

Frontend típicamente necesita:
- `VITE_API_BASE_URL` (o equivalente): `http://localhost:8000` en local, `https://api.visitas-claras.com` en prod.

---

## Estado del documento

Este contrato fue generado desde el código del backend presente en el workspace al momento de su creación. Si se agregan/modifican routers, schemas o servicios, este documento debe actualizarse.
