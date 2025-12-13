# Resumen Completo del Proyecto: Visitas Claras (ObservaDoc)

## 📋 Información General

**Nombre del Proyecto:** Visitas Claras / ObservaDoc  
**Tipo:** Aplicación Web Frontend  
**Stack Tecnológico:** React + TypeScript + Vite  
**Framework UI:** shadcn/ui + Tailwind CSS  
**Estado:** Proyecto Frontend Completo (Sin Backend)

---

## 🎯 Propósito del Proyecto

ObservaDoc es una plataforma web diseñada para gestionar observaciones pedagógicas y visitas a docentes en instituciones educativas. Permite a directores y supervisores:

- Registrar observaciones de clases con rúbricas estandarizadas
- Programar y gestionar visitas a docentes
- Visualizar el historial de observaciones por profesor
- Calcular niveles de logro basados en rúbricas educativas

---

## 🏗️ Arquitectura del Proyecto

### **Tipo de Aplicación: Frontend Puro**

**⚠️ IMPORTANTE:** Este proyecto es **100% frontend**. No existe backend, API, base de datos o servidor. Todo el estado se maneja en memoria usando React Context y datos mock.

**Características:**
- ✅ Estado gestionado con React Context (`AppContext`)
- ✅ Datos mock estáticos en `src/data/mockData.ts`
- ✅ Sin persistencia de datos (se pierden al recargar)
- ✅ Sin autenticación real (login simulado)
- ✅ Sin llamadas HTTP/API
- ✅ Sin base de datos

---

## 📁 Estructura de Directorios

```
visitas-claras/
├── public/                    # Archivos estáticos
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
│
├── src/
│   ├── components/            # Componentes React
│   │   ├── calendario/        # Componentes del calendario
│   │   │   ├── CalendarioMensual.tsx
│   │   │   ├── ModalConfirmacion.tsx
│   │   │   └── SubirAgenda.tsx
│   │   │
│   │   ├── layout/            # Layout y navegación
│   │   │   ├── Layout.tsx
│   │   │   └── Navbar.tsx
│   │   │
│   │   ├── observaciones/     # Componentes de observaciones
│   │   │   ├── FormularioObservacion.tsx
│   │   │   └── HistorialVisitas.tsx
│   │   │
│   │   ├── profesores/        # Componentes de profesores
│   │   │   ├── ProfesorCard.tsx
│   │   │   ├── ProfesorPanel.tsx
│   │   │   └── ProfesorSearch.tsx
│   │   │
│   │   └── ui/                # Componentes UI (shadcn/ui)
│   │       ├── button.tsx
│   │       ├── input.tsx
│   │       ├── card.tsx
│   │       └── ... (40+ componentes UI)
│   │
│   ├── context/               # Context API de React
│   │   └── AppContext.tsx     # Estado global de la aplicación
│   │
│   ├── data/                  # Datos mock
│   │   └── mockData.ts        # Profesores, visitas, rúbricas
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   │
│   ├── lib/                   # Utilidades
│   │   └── utils.ts           # Funciones helper (cn, etc.)
│   │
│   ├── pages/                 # Páginas/Views
│   │   ├── Index.tsx          # Página de inicio (Login)
│   │   ├── Login.tsx          # Componente de login
│   │   ├── Observaciones.tsx  # Gestión de observaciones
│   │   ├── Calendario.tsx     # Calendario de visitas
│   │   ├── Historial.tsx      # Historial general
│   │   ├── Ayuda.tsx          # Centro de ayuda
│   │   └── NotFound.tsx       # Página 404
│   │
│   ├── types/                 # Definiciones TypeScript
│   │   └── index.ts           # Interfaces y tipos
│   │
│   ├── App.tsx                # Componente raíz con routing
│   ├── main.tsx               # Punto de entrada
│   ├── index.css              # Estilos globales
│   └── vite-env.d.ts          # Tipos de Vite
│
├── package.json               # Dependencias y scripts
├── vite.config.ts             # Configuración de Vite
├── tailwind.config.ts         # Configuración de Tailwind
├── tsconfig.json              # Configuración TypeScript
└── README.md                  # Documentación básica
```

---

## 🛠️ Stack Tecnológico

### **Core**
- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.8.3** - Tipado estático
- **Vite 5.4.19** - Build tool y dev server

### **Routing**
- **React Router DOM 6.30.1** - Navegación SPA

### **UI Framework**
- **shadcn/ui** - Componentes UI basados en Radix UI
- **Tailwind CSS 3.4.17** - Framework CSS utility-first
- **Radix UI** - Componentes primitivos accesibles
- **Lucide React** - Iconos

### **Estado y Datos**
- **React Context API** - Estado global
- **TanStack Query 5.83.0** - Configurado pero no usado (sin API)

### **Formularios**
- **React Hook Form 7.61.1** - Manejo de formularios
- **Zod 3.25.76** - Validación de esquemas
- **@hookform/resolvers** - Integración Zod + React Hook Form

### **Utilidades**
- **date-fns 3.6.0** - Manipulación de fechas
- **clsx** - Utilidad para clases CSS condicionales
- **tailwind-merge** - Merge de clases Tailwind

### **Otros**
- **Sonner** - Sistema de notificaciones toast
- **Recharts** - Gráficos (incluido pero no usado)

---

## 📊 Modelos de Datos

### **Tipos Principales** (`src/types/index.ts`)

#### `Profesor`
```typescript
{
  id: string;
  nombre: string;
  apellido: string;
  foto: string;        // URL de imagen
  ie: string;          // Institución Educativa
  salon: string;       // Ej: "3ro A"
}
```

#### `Visita`
```typescript
{
  id: string;
  profesorId: string;
  fecha: string;       // ISO date string
  hora: string;       // HH:mm
  nivelLogroTotal: number;  // 1-4
  rubricas: Rubrica[];
  datosDocente: DatosDocente;
}
```

#### `VisitaProgramada`
```typescript
{
  id: string;
  profesorId: string;
  profesorNombre: string;
  fecha: string;
  hora: string;
  ie: string;
  salon: string;
  confirmada: boolean;
}
```

#### `Rubrica`
```typescript
{
  id: string;
  nombre: string;
  nivel: 1 | 2 | 3 | 4 | null;
  observaciones: string;
}
```

#### `DatosDocente`
```typescript
{
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
```

### **Rúbricas del Sistema**

El sistema evalúa 5 rúbricas obligatorias:

1. **Involucra activamente** - Participación de estudiantes
2. **Razonamiento crítico** - Promoción de pensamiento creativo
3. **Evalúa el progreso** - Retroalimentación y monitoreo
4. **Ambiente de respeto** - Comunicación respetuosa
5. **Regula comportamiento** - Gestión formativa del aula

**Niveles de Logro:**
- **I** - En inicio
- **II** - En proceso
- **III** - Satisfactorio
- **IV** - Destacado

El nivel total se calcula como el promedio de las rúbricas evaluadas.

---

## 🔄 Flujo de la Aplicación

### **1. Autenticación (Simulada)**
- Página inicial (`/`) muestra `Login.tsx`
- No hay validación real, solo redirige a `/observaciones`
- Usuario simulado: "Director"

### **2. Navegación Principal**
- **Navbar** con 4 secciones principales:
  - Observaciones
  - Calendario
  - Historial
  - Ayuda

### **3. Página: Observaciones** (`/observaciones`)
- **Búsqueda de profesores** por nombre
- **Selección de profesor** → muestra `ProfesorPanel`
- **Panel de profesor** muestra:
  - Información del docente
  - Historial de visitas anteriores
  - Formulario para nueva observación

### **4. Formulario de Observación**
- **Subida de archivo** (PDF/imagen) - simulado
- **Sección 1:** Datos del docente e IE
- **Sección 2:** Evaluación de 5 rúbricas obligatorias
  - Selección de nivel (I-IV) por rúbrica
  - Campo de observaciones por rúbrica
  - Cálculo automático del nivel total
- **Sección 3:** Guardar en historial

### **5. Página: Calendario** (`/calendario`)
- **Calendario mensual** con visitas programadas
- **Subir agenda** desde archivo (simulado)
- **Lista de visitas pendientes** de confirmar
- **Lista de visitas confirmadas**
- **Modal de confirmación** para visitas

### **6. Página: Historial** (`/historial`)
- **Estadísticas generales:**
  - Total de visitas
  - Visitas por nivel (IV, III, ≤II)
- **Lista de todas las visitas** ordenadas por fecha
- **Información por visita:**
  - Foto y nombre del profesor
  - Fecha, hora, IE
  - Resumen de rúbricas
  - Badge de nivel total

### **7. Página: Ayuda** (`/ayuda`)
- **FAQ** con preguntas frecuentes
- **Contacto:** Chat, email, teléfono (simulado)

---

## 🎨 Sistema de Diseño

### **Tema y Colores**
- **Modo:** Soporta dark mode (configurado pero no implementado)
- **Paleta:** Colores HSL con variables CSS
- **Colores principales:**
  - Primary (azul)
  - Success (verde)
  - Warning (amarillo/naranja)
  - Destructive (rojo)
  - Muted (grises)

### **Componentes UI**
- **40+ componentes** de shadcn/ui
- **Estilo:** Moderno, limpio, accesible
- **Responsive:** Mobile-first design
- **Animaciones:** Transiciones suaves, fade-in, slide-up

### **Clases CSS Personalizadas**
- `card-flat` - Tarjeta plana
- `card-elevated` - Tarjeta con sombra
- `btn-primary` - Botón primario
- `level-i`, `level-ii`, `level-iii`, `level-iv` - Badges de nivel
- `upload-zone` - Zona de carga de archivos

---

## 🔧 Gestión de Estado

### **AppContext** (`src/context/AppContext.tsx`)

**Estado Global:**
```typescript
{
  profesores: Profesor[];              // Lista de profesores
  visitas: Visita[];                   // Visitas registradas
  visitasProgramadas: VisitaProgramada[];  // Visitas futuras
}
```

**Funciones:**
- `agregarVisita(visita)` - Añade nueva visita al historial
- `agregarVisitaProgramada(visita)` - Programa nueva visita
- `confirmarVisitaProgramada(id)` - Marca visita como confirmada
- `getVisitasByProfesor(id)` - Obtiene visitas de un profesor
- `getProfesorById(id)` - Busca profesor por ID

**⚠️ Limitación:** El estado se pierde al recargar la página (no hay persistencia).

---

## 📦 Datos Mock

### **Profesores** (`src/data/mockData.ts`)
- 5 profesores de ejemplo
- Datos: nombre, apellido, foto (Unsplash), IE, salón

### **Visitas Iniciales**
- 3 visitas de ejemplo con:
  - Evaluaciones completas de rúbricas
  - Datos del docente
  - Niveles de logro variados

### **Visitas Programadas**
- 3 visitas programadas de ejemplo
- Algunas confirmadas, otras pendientes

### **Template de Rúbricas**
- Definiciones de las 5 rúbricas obligatorias
- Descripciones y nombres completos

---

## 🚀 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo (puerto 8080)
npm run build        # Build de producción
npm run build:dev    # Build en modo desarrollo
npm run lint         # Linter ESLint
npm run preview      # Preview del build
```

---

## 🔍 Funcionalidades Implementadas

### ✅ Completamente Implementadas

1. **Sistema de Login** (simulado)
   - Interfaz de login
   - Redirección automática

2. **Búsqueda de Profesores**
   - Búsqueda por nombre/apellido
   - Selección de profesor

3. **Registro de Observaciones**
   - Formulario completo con 2 secciones
   - Evaluación de 5 rúbricas
   - Cálculo automático de nivel total
   - Subida de archivos (simulada)

4. **Calendario de Visitas**
   - Vista mensual
   - Navegación entre meses
   - Indicadores de visitas
   - Confirmación de visitas

5. **Subida de Agenda**
   - Carga de archivo (simulada)
   - Extracción de fechas (simulada)
   - Confirmación y edición de fechas

6. **Historial de Visitas**
   - Lista completa de visitas
   - Estadísticas generales
   - Filtrado por profesor
   - Visualización de rúbricas

7. **Navegación**
   - Navbar responsive
   - Routing con React Router
   - Página 404

8. **Centro de Ayuda**
   - FAQ
   - Información de contacto

### ⚠️ Funcionalidades Simuladas (No Funcionales)

1. **Autenticación**
   - No hay validación real
   - No hay sesiones
   - No hay roles de usuario

2. **Persistencia de Datos**
   - No hay base de datos
   - No hay localStorage/sessionStorage
   - Los datos se pierden al recargar

3. **Subida de Archivos**
   - No se procesan archivos reales
   - No se extraen datos de documentos
   - Solo simula la carga

4. **Notificaciones**
   - No hay sistema de notificaciones real
   - No hay emails
   - No hay recordatorios automáticos

---

## 🚫 Lo que NO tiene el Proyecto (Backend)

### **No hay:**
- ❌ API REST o GraphQL
- ❌ Servidor backend (Node.js, Python, etc.)
- ❌ Base de datos (PostgreSQL, MongoDB, etc.)
- ❌ Autenticación real (JWT, OAuth, etc.)
- ❌ Procesamiento de archivos real
- ❌ Servicios de almacenamiento (S3, etc.)
- ❌ WebSockets o tiempo real
- ❌ Servicios de email
- ❌ Sistema de notificaciones push

### **Para convertir en aplicación completa necesitarías:**
1. **Backend API** (Node.js/Express, Python/FastAPI, etc.)
2. **Base de datos** (PostgreSQL, MongoDB, etc.)
3. **Autenticación** (JWT, OAuth2, etc.)
4. **Almacenamiento de archivos** (S3, Cloudinary, etc.)
5. **Procesamiento de documentos** (OCR, parsing de PDFs)
6. **Sistema de notificaciones** (Email, SMS, push)
7. **Variables de entorno** para configuración

---

## 📝 Notas Técnicas

### **Configuración de Vite**
- Puerto: 8080
- Alias `@` apunta a `./src`
- Plugin React SWC para compilación rápida
- Component tagger de Lovable (solo en desarrollo)

### **TypeScript**
- Configuración estricta
- Path aliases configurados
- Tipos para React y Vite

### **Tailwind CSS**
- Configuración personalizada
- Variables CSS para temas
- Sombras personalizadas
- Animaciones personalizadas

### **React Router**
- Rutas definidas en `App.tsx`
- Rutas protegidas: No implementadas
- 404: Página NotFound

---

## 🎯 Casos de Uso Principales

1. **Director registra observación**
   - Busca profesor → Selecciona → Sube documento → Completa rúbricas → Guarda

2. **Director programa visitas**
   - Sube agenda anual → Confirma fechas → Visitas aparecen en calendario

3. **Director confirma visita**
   - Ve calendario → Selecciona visita pendiente → Confirma

4. **Director consulta historial**
   - Ve estadísticas → Revisa visitas por profesor → Analiza tendencias

---

## 🔐 Seguridad

**⚠️ Estado Actual:** No hay medidas de seguridad implementadas.

**Faltantes:**
- Autenticación real
- Autorización por roles
- Validación de datos en backend
- Sanitización de inputs
- Protección CSRF
- Rate limiting
- Encriptación de datos sensibles

---

## 📈 Posibles Mejoras Futuras

1. **Backend y Persistencia**
   - Implementar API REST
   - Base de datos para profesores y visitas
   - Autenticación real

2. **Funcionalidades**
   - Exportar reportes (PDF, Excel)
   - Gráficos y estadísticas avanzadas
   - Búsqueda avanzada y filtros
   - Edición de visitas existentes

3. **UX/UI**
   - Modo oscuro funcional
   - Mejoras en responsive
   - Animaciones más fluidas
   - Feedback visual mejorado

4. **Integraciones**
   - Procesamiento real de documentos (OCR)
   - Notificaciones por email
   - Sincronización con calendarios externos
   - Integración con sistemas educativos

---

## 📚 Dependencias Principales

### **Producción**
- `react`, `react-dom` - Core de React
- `react-router-dom` - Routing
- `@tanstack/react-query` - Data fetching (no usado)
- `react-hook-form`, `zod` - Formularios y validación
- `date-fns` - Manejo de fechas
- `lucide-react` - Iconos
- `sonner` - Notificaciones toast
- Componentes Radix UI - Primitivos accesibles

### **Desarrollo**
- `vite` - Build tool
- `typescript` - Tipado
- `tailwindcss` - CSS framework
- `eslint` - Linter
- `@vitejs/plugin-react-swc` - Plugin React

---

## 🏁 Conclusión

**ObservaDoc (Visitas Claras)** es una aplicación frontend completa y funcional para la gestión de observaciones pedagógicas. El proyecto demuestra:

✅ **Arquitectura frontend sólida** con React + TypeScript  
✅ **UI moderna y accesible** con shadcn/ui  
✅ **Experiencia de usuario fluida** con navegación intuitiva  
✅ **Código bien estructurado** y tipado  

**Limitación principal:** Es un prototipo frontend sin backend. Para producción necesitaría:
- Backend API
- Base de datos
- Autenticación real
- Persistencia de datos

El proyecto está listo para ser conectado a un backend cuando sea necesario.

---

**Fecha de Análisis:** Enero 2025  
**Versión del Proyecto:** 0.0.0  
**Estado:** Frontend Completo / Backend Pendiente

