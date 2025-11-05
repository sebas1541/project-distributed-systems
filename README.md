# Smart Planner AI

Gestor de tareas potenciado con IA, con entrada de voz y procesamiento de lenguaje natural.

**Equipo**: Natalia Bernal, Sebastián Cañón Castellanos

## Características

- Voz a Tarea: Habla para crear tareas (Whisper.cpp + Ollama LLM)
- Sincronización con Google Calendar automática
- Autenticación JWT
- Gestión de Tareas: CRUD con prioridades y fechas límite
- Arquitectura de Microservicios con RabbitMQ
- Diseño Responsive

## Inicio Rápido

### 1. Instalar Ollama

**macOS:**
```bash
brew install ollama
ollama serve
ollama pull llama3.1:8b
```

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama serve
ollama pull llama3.1:8b
```

**Windows:**
1. Descargar el instalador de [ollama.com/download](https://ollama.com/download)
2. Ejecutar el instalador
3. Abrir PowerShell y ejecutar:
```powershell
ollama pull llama3.1:8b
```

### 2. Iniciar Backend
```bash
git clone https://github.com/sebas1541/project-distributed-systems
cd project-distributed-systems
cp .env.example .env  # Editar con tus contraseñas
docker-compose up -d --build
```

### 3. Iniciar Frontend
```bash
cd frontend
npm install
npm run dev
```

Abrir http://localhost:3000

## Arquitectura

### Servicios
- **Auth** (3001): Autenticación JWT
- **Task** (3002): CRUD de tareas
- **AI** (3003): Whisper + Ollama NLP
- **Scheduler** (3004): Google Calendar sync
- **Frontend** (3000): Next.js

### Traefik (API Gateway)
```
localhost:3000 → Traefik (puerto 80)
  /api/auth/*      → Servicio Auth
  /api/tasks/*     → Servicio Task
  /api/ai/*        → Servicio AI
  /api/scheduler/* → Servicio Scheduler
```

### Flujo RabbitMQ
```
Voz → Servicio AI → Whisper → Ollama
  ↓
Extraer datos de tarea (título, fecha, prioridad)
  ↓
Publicar a cola RabbitMQ "task.create"
  ↓
Servicio Task consume → Guardar en PostgreSQL
  ↓
Publicar eventos: task.created / task.updated / task.deleted
  ↓
Servicio Scheduler consume → Sincronizar con Google Calendar
```

**Colas**: 
- `task-service-task-create` - Crear tareas desde voz
- `scheduler-service-task-created` - Sincronizar tareas nuevas
- `scheduler-service-task-updated` - Actualizar eventos
- `scheduler-service-task-deleted` - Eliminar eventos

**Exchange**: `tasks` (topic)  
**Routing Keys**: `task.create`, `task.created`, `task.updated`, `task.deleted`

## Modelos IA

- **Whisper**: `ggml-small.bin` (465MB) - En Docker
- **Ollama**: `llama3.1:8b` (4.9GB) - En Mac en `localhost:11434`

## Comandos

```bash
# Reconstruir servicio
docker-compose up -d --build ai-service

# Ver logs
docker-compose logs -f

# Reiniciar todo
docker-compose down -v && docker system prune -f && docker-compose up -d --build

# Interfaz RabbitMQ
open http://localhost:15672
```

## Solución de Problemas

**Servicios no inician:**
```bash
docker-compose logs
docker-compose down -v && docker-compose up -d --build
```

**Ollama no funciona:**
```bash
brew services restart ollama
ps aux | grep ollama
```

## Stack Tecnológico

**Backend**: NestJS, TypeScript, PostgreSQL, Redis, RabbitMQ  
**Frontend**: Next.js 15, React 19, Tailwind CSS  
**IA**: Whisper.cpp, Ollama, Llama 3.1  
**Infra**: Docker, Traefik

## Enlaces

- [Diagrama de Arquitectura](https://drive.google.com/file/d/1EG13F8j1EkPJFaTDMNI6yVMAld80QVIJ/view?usp=sharing)
- [Propuesta del Proyecto](https://docs.google.com/document/d/1fnxLbS5zKIFwdc8Tz4KnoruemRsnryi9glD7_ytSo5Y/edit)
