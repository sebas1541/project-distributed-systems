# Smart Planner AI

**Asistente inteligente para planificar, organizar y optimizar tu tiempo con IA**

## Equipo
- Natalia Bernal
- Sebastián Cañón Castellanos

## Objetivo

Desarrollar una aplicación web distribuida e inteligente que permita gestionar tareas, recordatorios y eventos mediante **lenguaje natural y voz**, con análisis automatizado de productividad y generación de reportes personalizados.

## 🎯 Características Principales

- ✅ **Autenticación JWT** con gestión de usuarios
- ✅ **Gestión de tareas** completa (CRUD)
- ✅ **Creación de tareas por voz** con IA (Whisper + LLM)
- ✅ **Procesamiento de lenguaje natural** para extraer información
- ✅ **Arquitectura de microservicios** distribuida
- ✅ **Comunicación asíncrona** con RabbitMQ
- ✅ **Diseño responsive** para móvil y desktop

## Arquitectura

### Microservicios
- **Auth Service** (Port 3001): Autenticación y gestión de usuarios (JWT)
- **Task Service** (Port 3002): CRUD de tareas y gestión de eventos
- **AI Service** (Port 3003): Transcripción de voz (Whisper.cpp) y procesamiento NLP
- **Frontend** (Port 3000): Next.js 15 + React 19 + TypeScript + Tailwind CSS

### Infraestructura
- **API Gateway**: Traefik con load balancing y routing
- **Message Broker**: RabbitMQ para comunicación asíncrona entre servicios
- **Databases**: PostgreSQL (datos) + Redis (cache y sesiones)
- **AI Models**: 
  - Whisper.cpp (transcripción de voz)
  - Ollama + Llama 3.2 (procesamiento NLP - próximamente)

## 🚀 Inicio Rápido

### Prerequisitos

**Obligatorios:**
- Docker & Docker Compose
- Node.js 20+ (para desarrollo local del frontend)
- Git

**Para macOS (recomendado):**
```bash
# Instalar Homebrew si no lo tienes
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Instalar Docker Desktop
brew install --cask docker

# Instalar Node.js
brew install node
```

### Instalación Completa

#### 1. Clonar el repositorio
```bash
git clone https://github.com/sebas1541/project-distributed-systems
cd project-distributed-systems
```

#### 2. Configurar variables de entorno
```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar el archivo .env con tus valores
nano .env
```

Variables importantes:
```env
# PostgreSQL
POSTGRES_USER=smartplanner
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=smartplanner

# Redis
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_USER=smartplanner
RABBITMQ_PASSWORD=your_rabbitmq_password

# JWT
JWT_SECRET=your_very_secure_jwt_secret_key_here

# Frontend
NEXT_PUBLIC_API_URL=http://localhost
```

#### 3. Levantar los servicios backend con Docker

```bash
# Construir y levantar todos los servicios
docker-compose up -d

# Ver logs para verificar que todo funciona
docker-compose logs -f

# Verificar que los contenedores están corriendo
docker ps
```

Deberías ver estos contenedores corriendo:
- `smartplanner-traefik`
- `smartplanner-postgres`
- `smartplanner-redis`
- `smartplanner-rabbitmq`
- `smartplanner-auth-service`
- `smartplanner-task-service`
- `smartplanner-ai-service`

#### 4. Levantar el frontend (Next.js)

```bash
# Instalar dependencias
cd frontend
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará disponible en http://localhost:3000

### Verificar que todo funciona

```bash
# Health check de los servicios
curl http://localhost/api/auth/health
curl http://localhost/api/tasks/health
curl http://localhost/api/ai/health

# RabbitMQ Management UI
open http://localhost:15672
# Usuario: smartplanner
# Contraseña: (la que pusiste en .env)
```

## 🎤 Configuración de IA (Whisper + Ollama)

### Whisper.cpp (Transcripción de Voz)

Whisper.cpp ya está **compilado dentro del contenedor Docker** del AI Service. No necesitas hacer nada adicional - funciona automáticamente cuando usas el botón de voz en la aplicación.

**Cómo funciona:**
1. El usuario graba audio en el navegador
2. Se envía como WebM al AI Service
3. ffmpeg convierte WebM → WAV (16kHz mono)
4. Whisper.cpp transcribe el audio a texto
5. El texto se devuelve al frontend

**Modelo usado:** `ggml-base.bin` (141MB) - balance entre velocidad y precisión

### Ollama (NLP - Próximamente)

Para procesamiento de lenguaje natural (extraer información de tareas del texto):

```bash
# Instalar Ollama (macOS)
brew install ollama

# Iniciar el servicio
ollama serve

# En otra terminal, descargar el modelo
ollama pull llama3.2:3b

# Verificar que funciona
curl http://localhost:11434/api/tags
```

El AI Service se conectará automáticamente a `http://host.docker.internal:11434`

## 📱 Uso de la Aplicación

### 1. Registro e Inicio de Sesión

1. Abre http://localhost:3000
2. Haz clic en "Regístrate"
3. Completa el formulario con tus datos
4. Inicia sesión con tu correo y contraseña

### 2. Gestión de Tareas

**Crear tarea manualmente:**
1. Ve a la sección "Tareas"
2. Haz clic en "Nueva Tarea"
3. Completa el formulario
4. Guarda la tarea

**Crear tarea por voz:**
1. Haz clic en el botón de micrófono (esquina inferior derecha)
2. Permite el acceso al micrófono
3. Di tu tarea, ejemplo: "Crear una tarea para comprar leche mañana con prioridad alta"
4. Haz clic en "Detener"
5. La transcripción aparecerá en un alert
6. (Próximamente: se creará automáticamente la tarea)

### 3. Prioridades y Estados

- **Prioridades**: Baja, Media, Alta
- **Estados**: Pendiente, En Progreso, Completada
- **Fechas**: Asigna fechas límite para recordatorios

## 🛠️ Desarrollo

### Estructura del Proyecto

```
project-distributed-systems/
├── services/
│   ├── auth-service/        # NestJS - Autenticación JWT
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   ├── task-service/        # NestJS - Gestión de tareas
│   │   ├── src/
│   │   ├── Dockerfile
│   │   └── package.json
│   └── ai-service/          # NestJS - IA (Whisper + NLP)
│       ├── src/
│       │   ├── transcribe/  # Whisper.cpp integration
│       │   └── health.controller.ts
│       ├── whisper.cpp/     # Compilado en Docker
│       ├── Dockerfile.local
│       └── package.json
├── frontend/                # Next.js 15 + React 19
│   ├── app/                 # App Router
│   │   ├── page.tsx         # Home
│   │   ├── login/           # Login page
│   │   └── tasks/           # Tasks page
│   ├── components/
│   │   ├── VoiceTaskButton.tsx
│   │   ├── VoiceRecordingModal.tsx
│   │   └── ui/              # shadcn/ui components
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── aiApi.ts         # AI Service client
│   └── package.json
├── shared/                  # Código compartido
│   ├── types/               # TypeScript types
│   └── rabbitmq.config.ts
├── docker-compose.yml       # Orquestación de servicios
├── .env                     # Variables de entorno
└── README.md
```

### Desarrollo Local de un Microservicio

```bash
# Ejemplo: Auth Service
cd services/auth-service

# Instalar dependencias
npm install

# Iniciar en modo desarrollo (hot reload)
npm run start:dev

# El servicio estará en http://localhost:3001
```

### Desarrollo del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Modo desarrollo con hot reload
npm run dev

# Build para producción
npm run build

# Iniciar producción
npm start
```

### Comandos Docker Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f ai-service

# Reconstruir un servicio específico
docker-compose up -d --build ai-service

# Reconstruir todo desde cero
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra la base de datos)
docker-compose down -v

# Ver estado de los contenedores
docker ps

# Entrar a un contenedor
docker exec -it smartplanner-ai-service sh

# Ver uso de recursos
docker stats
```

### Testing

```bash
# Test del AI Service con archivo de audio
curl -X POST -F "audio=@/path/to/audio.webm" http://localhost/api/ai/transcribe

# Test de autenticación
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Test de tareas (requiere token JWT)
curl -X GET http://localhost/api/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Troubleshooting

### El contenedor de AI Service no inicia

```bash
# Ver logs detallados
docker-compose logs ai-service

# Verificar que Whisper.cpp se compiló correctamente
docker exec -it smartplanner-ai-service ls -la /app/whisper.cpp/build/bin/

# Reconstruir el servicio
docker-compose up -d --build ai-service
```

### Error de conexión a PostgreSQL

```bash
# Verificar que PostgreSQL está corriendo
docker ps | grep postgres

# Ver logs de PostgreSQL
docker-compose logs postgres

# Resetear la base de datos (CUIDADO: borra datos)
docker-compose down -v
docker-compose up -d postgres
```

### Frontend no se conecta al backend

1. Verificar que Traefik está corriendo: `docker ps | grep traefik`
2. Verificar la variable `NEXT_PUBLIC_API_URL` en `.env` (debe ser `http://localhost`)
3. Verificar que los servicios backend están corriendo: `docker ps`
4. Probar directamente: `curl http://localhost/api/auth/health`

### Error de hidratación en Next.js

Este error puede aparecer si tienes extensiones de navegador (Grammarly, LanguageTool) que modifican el DOM. Soluciones:

1. Desactiva extensiones en modo desarrollo
2. Usa ventana privada/incógnito
3. El error no afecta la funcionalidad

### El micrófono no funciona

1. Verifica que diste permisos de micrófono al navegador
2. Usa HTTPS en producción (el navegador requiere HTTPS para acceder al micrófono)
3. En desarrollo, `localhost` debería funcionar

## 📚 Tecnologías Utilizadas

### Backend
- **NestJS** - Framework Node.js para microservicios
- **TypeScript** - Type safety
- **PostgreSQL** - Base de datos relacional
- **Redis** - Cache y sesiones
- **RabbitMQ** - Message broker
- **JWT** - Autenticación
- **Docker** - Containerización

### Frontend
- **Next.js 15** - React framework con App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Component library
- **Lucide Icons** - Icon library

### IA y ML
- **Whisper.cpp** - Transcripción de voz (C++ optimizado)
- **ffmpeg** - Conversión de audio
- **Ollama** - Runtime para LLMs locales
- **Llama 3.2** - Modelo de lenguaje (próximamente)

### Infraestructura
- **Traefik** - API Gateway y reverse proxy
- **Docker Compose** - Orquestación de servicios

## 🌐 Acceso a los Servicios

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Frontend | http://localhost:3000 | Aplicación web Next.js |
| API Gateway | http://localhost | Traefik (enrutamiento) |
| Auth Service | http://localhost/api/auth | Autenticación y usuarios |
| Task Service | http://localhost/api/tasks | Gestión de tareas |
| AI Service | http://localhost/api/ai | Transcripción y NLP |
| RabbitMQ UI | http://localhost:15672 | Management console |
| Traefik Dashboard | http://localhost:8080 | Monitoring (si está habilitado) |

## 📖 API Documentation

### Auth Service

**POST /api/auth/register**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Task Service

**GET /api/tasks** - Obtener todas las tareas (requiere auth)

**POST /api/tasks** - Crear tarea
```json
{
  "title": "Comprar leche",
  "description": "Ir al supermercado",
  "priority": "high",
  "dueDate": "2025-10-31T15:00:00Z"
}
```

**PATCH /api/tasks/:id** - Actualizar tarea

**DELETE /api/tasks/:id** - Eliminar tarea

### AI Service

**POST /api/ai/transcribe** - Transcribir audio
```bash
curl -X POST -F "audio=@recording.webm" http://localhost/api/ai/transcribe
```

## 🚀 Próximas Características

- [ ] Integración completa de Ollama para NLP
- [ ] Creación automática de tareas desde voz
- [ ] Notificaciones push
- [ ] Recordatorios programados
- [ ] Análisis de productividad
- [ ] Reportes personalizados
- [ ] Integración con calendarios (Google Calendar, Outlook)
- [ ] Modo offline con sincronización
- [ ] App móvil nativa

## 📄 Enlaces

- [Diagrama de Arquitectura](https://drive.google.com/file/d/1EG13F8j1EkPJFaTDMNI6yVMAld80QVIJ/view?usp=sharing)
- [Documento de propuesta del proyecto](https://docs.google.com/document/d/1fnxLbS5zKIFwdc8Tz4KnoruemRsnryi9glD7_ytSo5Y/edit?tab=t.0)

## 👥 Contribuciones

Este es un proyecto académico para el curso de Sistemas Distribuidos. 

## 📝 Licencia

MIT License - ver archivo LICENSE para detalles

