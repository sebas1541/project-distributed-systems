# Smart Planner AI

**Asistente inteligente para planificar, organizar y optimizar tu tiempo**

## Equipo
- Natalia Bernal
- Sebastián Cañón Castellanos

## Objetivo

Desarrollar una aplicación web distribuida e inteligente que permita gestionar tareas, recordatorios y eventos mediante lenguaje natural, con análisis automatizado de productividad y generación de reportes personalizados.

## Arquitectura

### Microservicios
- **Auth Service**: Autenticación y gestión de usuarios (JWT)
- **Task Service**: CRUD de tareas y gestión de eventos
- **NLP Service**: Procesamiento de lenguaje natural con LangChain
- **Scheduler Service**: Recordatorios y tareas programadas

### Infraestructura
- **API Gateway**: Traefik con load balancing
- **Message Broker**: RabbitMQ para comunicación asíncrona
- **Databases**: PostgreSQL (datos) + Redis (cache)
- **Frontend**: React + TypeScript + Vite + Tailwind CSS

## Inicio Rápido

### Prerequisitos
- Docker & Docker Compose
- Node.js 20+ (para desarrollo local)
- pnpm (opcional, recomendado)

### Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd project-distributed-systems
```

2. Crear archivo de variables de entorno:
```bash
cp .env.example .env
```

3. Levantar los servicios con Docker:
```bash
docker-compose up -d
```

### Acceso a los Servicios

- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **Auth Service**: http://localhost/api/auth
- **Task Service**: http://localhost/api/tasks

## Estructura del Proyecto

```
project-distributed-systems/
├── services/
│   ├── auth-service/        # Servicio de autenticación
│   ├── task-service/        # Servicio de gestión de tareas
│   ├── nlp-service/         # Servicio de procesamiento NLP
│   └── scheduler-service/   # Servicio de recordatorios
├── client/                  # Frontend React
├── shared/                  # Código compartido entre servicios
├── docker-compose.yml       # Orquestación de servicios
└── README.md
```

## Desarrollo

### Desarrollo Local de un Microservicio

```bash
cd services/auth-service
npm install
npm run start:dev
```

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f auth-service

# Reconstruir un servicio
docker-compose up -d --build auth-service

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes
docker-compose down -v
```

## Cronograma

| Semana | Actividad |
|--------|-----------|
| 7-13 oct | Entorno base Docker (NestJS, RabbitMQ) |
| 14-20 oct | Frontend React + Tailwind |
| 21-27 oct | Backend + API Gateway + RabbitMQ |
| 28 oct-3 nov | Servicio NLP (LangChain) |
| 4-10 nov | Servicio Scheduler |
| 11-17 nov | Task Insights (CrewAI) |
| 18-24 nov | Integración final y presentación |

## Enlaces

- [Diagrama de Arquitectura](https://drive.google.com/file/d/1EG13F8j1EkPJFaTDMNI6yVMAld80QVIJ/view?usp=sharing)

## Licencia

