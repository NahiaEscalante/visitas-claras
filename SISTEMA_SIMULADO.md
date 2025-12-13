# Sistema Backend Simulado - ObservaDoc

## 📋 Descripción

Este proyecto incluye un **sistema completo de backend simulado** que funciona sin necesidad de un servidor real. Todo está implementado en el frontend usando servicios mock que simulan llamadas API con delays realistas, autenticación, y persistencia de datos.

---

## 🔐 Sistema de Autenticación Simulado

### Usuarios Disponibles

El sistema incluye varios usuarios de prueba con diferentes roles:

#### Directores
- **Email:** `director@ejemplo.edu.pe`
- **Password:** `director123`
- **Rol:** Director
- **IE:** IE San Martín

- **Email:** `director.losandes@ejemplo.edu.pe`
- **Password:** `director123`
- **Rol:** Director
- **IE:** IE Los Andes

#### Supervisores
- **Email:** `supervisor@ejemplo.edu.pe`
- **Password:** `supervisor123`
- **Rol:** Supervisor
- **IE:** IE San Martín

- **Email:** `supervisor.santarosa@ejemplo.edu.pe`
- **Password:** `supervisor123`
- **Rol:** Supervisor
- **IE:** IE Santa Rosa

#### Administrador
- **Email:** `admin@ejemplo.edu.pe`
- **Password:** `admin123`
- **Rol:** Admin
- **IE:** (Sin restricción)

#### Profesores
- **Email:** `profesor.maria@ejemplo.edu.pe`
- **Password:** `profesor123`
- **Rol:** Profesor
- **IE:** IE San Martín

### Características del Sistema de Autenticación

✅ **Login con validación de credenciales**  
✅ **Tokens JWT simulados** (guardados en localStorage)  
✅ **Sesiones persistentes** (con opción "Recordarme")  
✅ **Logout funcional**  
✅ **Protección de rutas** (solo usuarios autenticados pueden acceder)  
✅ **Información de usuario en Navbar** (nombre, rol, IE)

---

## 🔌 API Mock Simulada

### Endpoints Disponibles

Todos los endpoints están completamente simulados con delays realistas:

#### 1. **Upload de Archivos**
- **Endpoint:** `POST /archivos/upload`
- **Delay:** 800-2000ms
- **Funcionalidad:** Simula la subida de archivos (PDF, imágenes)
- **Respuesta:** ID del archivo, URL, metadatos

#### 2. **Autocompletado con IA**
- **Endpoint:** `POST /visitas/ai/autocompletar`
- **Delay:** 2000-4000ms (simula procesamiento de IA)
- **Funcionalidad:** Analiza documentos y autocompleta formularios
- **Características:**
  - Extrae datos del docente automáticamente
  - Evalúa rúbricas con niveles sugeridos
  - Calcula confianza de los datos extraídos
  - Genera advertencias para campos con baja confianza

#### 3. **Crear Visita**
- **Endpoint:** `POST /visitas`
- **Delay:** 500-1200ms
- **Funcionalidad:** Guarda nuevas observaciones
- **Validaciones:** Verifica que el profesor existe y que hay al menos una rúbrica evaluada

### Características del Mock API

✅ **Delays realistas** (simula latencia de red)  
✅ **Errores simulados** (5% de probabilidad para testing)  
✅ **Validaciones completas** (como un backend real)  
✅ **Persistencia en localStorage** (los datos se mantienen entre recargas)  
✅ **Sincronización automática** con el contexto de React

---

## 💾 Persistencia de Datos

### Datos que se Persisten

Los siguientes datos se guardan en `localStorage` y persisten entre recargas:

- ✅ **Sesión de usuario** (`auth_token`, `refresh_token`, `user_id`)
- ✅ **Visitas registradas** (`mock_visitas`)
- ✅ **Visitas programadas** (`mock_visitas_programadas`)

### Datos que NO se Persisten

- ❌ **Archivos subidos** (solo existen durante la sesión actual)
- ❌ **Datos temporales** (estado de formularios, etc.)

### Limpiar Datos

Para resetear todos los datos simulados:

```javascript
// En la consola del navegador
localStorage.clear();
location.reload();
```

---

## 🎯 Flujo de Uso

### 1. Iniciar Sesión

1. Ir a la página principal (`/`)
2. Ingresar credenciales de prueba (ver arriba)
3. Opcional: Marcar "Recordarme" para sesión persistente
4. Click en "Ingresar"

### 2. Registrar Observación

1. Ir a "Observaciones"
2. Buscar un profesor
3. Seleccionar modo:
   - **Manual:** Completar formulario manualmente
   - **IA:** Subir documento y dejar que la IA complete el formulario
4. Revisar y ajustar datos (especialmente si hay advertencias)
5. Guardar visita

### 3. Ver Calendario

1. Ir a "Calendario"
2. Ver visitas programadas
3. Confirmar visitas pendientes

### 4. Consultar Historial

1. Ir a "Historial"
2. Ver todas las visitas registradas
3. Ver estadísticas generales

---

## 🔧 Arquitectura Técnica

### Estructura de Archivos

```
src/
├── data/
│   ├── mockUsers.ts          # Usuarios de prueba
│   └── mockData.ts           # Datos iniciales (profesores, visitas)
├── services/
│   ├── auth.ts               # Servicio de autenticación simulado
│   └── mockApi.ts            # Servicio de API mock completo
├── api/
│   ├── config.ts             # Configuración de API
│   ├── http.ts               # Wrapper HTTP (usa mock si no hay API)
│   └── endpoints.ts           # Endpoints (usa mock si no hay API)
└── context/
    └── AppContext.tsx         # Contexto con usuario actual y datos
```

### Cómo Funciona

1. **Autenticación:**
   - `auth.ts` simula login/logout
   - Tokens JWT simulados se guardan en localStorage
   - `AppContext` mantiene el estado del usuario actual

2. **API Mock:**
   - `mockApi.ts` contiene todas las funciones que simulan endpoints
   - Cada función tiene delays realistas
   - Los datos se guardan en memoria y localStorage

3. **Integración:**
   - `endpoints.ts` detecta si hay API real configurada
   - Si no hay API, usa automáticamente el mock
   - Los componentes no necesitan cambios

---

## 🚀 Activar Backend Real (Futuro)

Cuando tengas un backend real, simplemente configura la variable de entorno:

```env
VITE_API_BASE_URL=https://api.observadoc.edu.pe/v1
```

El sistema automáticamente:
- ✅ Dejará de usar el mock
- ✅ Hará llamadas HTTP reales
- ✅ Mantendrá toda la funcionalidad

**No se requieren cambios en el código de los componentes.**

---

## 🧪 Testing

### Simular Errores

El sistema tiene un 5% de probabilidad de simular errores aleatorios. Para testing, puedes modificar `shouldSimulateError()` en `mockApi.ts`.

### Resetear Datos

```javascript
// En la consola
import { resetMockData } from '@/services/mockApi';
resetMockData();
```

### Ver Datos Actuales

```javascript
// En la consola
console.log('Visitas:', JSON.parse(localStorage.getItem('mock_visitas')));
console.log('Usuario:', JSON.parse(localStorage.getItem('user_id')));
```

---

## 📝 Notas Importantes

1. **Los archivos subidos NO se persisten** - Solo existen durante la sesión actual
2. **Los delays son aleatorios** - Para simular comportamiento real de red
3. **Los errores son simulados** - Para testing de manejo de errores
4. **Los datos se sincronizan** - Entre mock API y React Context automáticamente

---

## ✅ Funcionalidades Completas

- ✅ Sistema de autenticación completo
- ✅ Múltiples usuarios con diferentes roles
- ✅ Protección de rutas
- ✅ Upload de archivos simulado
- ✅ Autocompletado con IA simulado
- ✅ Creación de visitas
- ✅ Persistencia de datos
- ✅ Sincronización automática
- ✅ Manejo de errores
- ✅ Delays realistas

---

**El sistema está completamente funcional y listo para usar sin necesidad de backend.**

