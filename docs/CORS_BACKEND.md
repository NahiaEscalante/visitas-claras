# CORS en el backend (observadoc_api)

Si el frontend (Vite en `http://localhost:5173`) recibe **400 Bad Request** en la petición **OPTIONS** a `/v1/auth/login`, el backend no está respondiendo bien al preflight CORS.

## Qué hacer en el backend

El servidor debe:

1. **Responder a OPTIONS** con **200** (o 204), no con 400.
2. Incluir en la respuesta los headers:
   - `Access-Control-Allow-Origin` (origen del frontend, ej. `http://localhost:5173` o `*` en desarrollo)
   - `Access-Control-Allow-Methods` (ej. `GET, POST, PUT, DELETE, PATCH, OPTIONS`)
   - `Access-Control-Allow-Headers` (ej. `Content-Type, Authorization`)
   - Opcional: `Access-Control-Max-Age` para cachear el preflight

---

## Ejemplo con FastAPI

Añade el middleware **antes** de registrar las rutas:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS: permitir origen del frontend (ajusta en producción)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ],  # o ["*"] solo en desarrollo
    allow_credentials=True,
    allow_methods=["*"],           # GET, POST, OPTIONS, etc.
    allow_headers=["*"],           # Content-Type, Authorization, etc.
)
```

Con esto, las peticiones **OPTIONS** que envía el navegador se responden con 200 y los headers CORS correctos, y el **POST /v1/auth/login** podrá ejecutarse.

---

## Comprobar

Tras reiniciar el backend:

- `OPTIONS /v1/auth/login` → **200** (no 400)
- En la respuesta deben aparecer headers `Access-Control-Allow-*`.

Si el backend no es FastAPI, el mismo comportamiento se puede implementar con el middleware CORS de tu framework o manejando OPTIONS a mano y añadiendo los headers en cada respuesta.
