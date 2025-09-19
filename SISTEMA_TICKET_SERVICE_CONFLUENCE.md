# Sistema de Gestión de Tickets y Proyectos - Ticket Service Form

## Resumen Ejecutivo

El **Ticket Service Form** es una API REST desarrollada en Node.js y TypeScript que automatiza la creación de tickets en Jira desde formularios de contacto y aplicaciones web. El sistema proporciona una solución integral para la gestión de proyectos Jira con capacidades de cambio dinámico de proyectos activos, creación automática de tickets y monitoreo de salud del servicio.

## Arquitectura del Sistema

### Tecnologías Principales

- **Backend**: Node.js 18+ con TypeScript
- **Framework**: Express.js
- **Base de Datos**: Jira Cloud (API REST)
- **Seguridad**: Helmet, CORS configurado
- **Logging**: Morgan para monitoreo de peticiones
- **Despliegue**: Amazon EC2 con Cloudflare DNS

### Estructura del Proyecto

```
ticket-service/
├── src/
│   ├── controllers/          # Controladores de API
│   │   ├── health_controller.ts
│   │   ├── project_controller.ts
│   │   └── ticket_controller.ts
│   ├── services/            # Servicios de negocio
│   │   ├── jira_service.ts
│   │   └── project_manager.ts
│   └── types/               # Definiciones de tipos
│       └── index.ts
├── public/                  # Archivos estáticos
├── examples/               # Ejemplos de uso
├── app.ts                  # Punto de entrada
└── package.json
```

## Funcionalidades Principales

### 1. Gestión de Proyectos Jira

El sistema implementa un **ProjectManager** singleton que permite:

- **Cambio dinámico de proyectos activos** sin reinicio del servidor
- **Cache inteligente** de proyectos disponibles (TTL: 5 minutos)
- **Búsqueda de proyectos** por nombre, clave o descripción
- **Validación de conexión** con Jira en tiempo real
- **Actualización de configuración** de autenticación y URL base

#### Endpoints de Gestión de Proyectos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/projects/current` | Obtiene el proyecto activo actual |
| POST | `/api/projects/set-active` | Cambia el proyecto activo |
| GET | `/api/projects/available` | Lista todos los proyectos disponibles |
| GET | `/api/projects/search?query=` | Busca proyectos por criterio |
| GET | `/api/projects/:projectKey` | Obtiene detalles de un proyecto específico |
| GET | `/api/projects/validate-connection` | Valida la conexión con Jira |
| GET | `/api/projects/status` | Obtiene el estado del ProjectManager |
| POST | `/api/projects/update-auth` | Actualiza credenciales de autenticación |
| POST | `/api/projects/update-base-url` | Actualiza la URL base de Jira |

### 2. Creación Automática de Tickets

El sistema crea tickets en Jira con la siguiente estructura:

#### Campos del Ticket
- **Proyecto**: Configurado dinámicamente por el ProjectManager
- **Tipo**: Task (configurable)
- **Prioridad**: Medium (configurable)
- **Resumen**: "Web Contact: [Nombre] - [Empresa]"
- **Descripción**: Formato ADF (Atlassian Document Format) con:
  - Información de contacto completa
  - Mensaje del usuario
  - Timestamp de creación
  - Fuente del contacto
- **Etiquetas**: `contacto-web`, `lead`

#### Endpoints de Creación de Tickets

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/tickets/create` | Crea ticket desde API externa |
| POST | `/api/tickets/landing` | Crea ticket desde formulario web |
| GET | `/api/tickets/test-jira` | Prueba la conexión con Jira |
| GET | `/api/tickets/jira-fields` | Obtiene campos personalizados de Jira |
| GET | `/api/tickets/create-metadata` | Obtiene metadatos para creación de issues |

### 3. Formulario de Contacto Web

El sistema incluye un formulario HTML integrado accesible en `/landing-form` con:

- **Validación del lado del cliente y servidor**
- **Campos requeridos**: Nombre, Email
- **Campos opcionales**: Teléfono, Empresa, Mensaje
- **Validación de formato de email**
- **Integración directa con la API de tickets**

### 4. Monitoreo y Salud del Sistema

#### Health Checks
- **Endpoint principal**: `GET /health`
- **Endpoint alternativo**: `GET /api/tickets/health`
- **Respuesta**: Estado del servicio, versión y endpoints disponibles

#### Logging y Monitoreo
- **Logs de peticiones HTTP** con Morgan
- **Logs detallados de errores** de Jira
- **Monitoreo de CORS** y seguridad
- **Trazabilidad completa** de creación de tickets

## Configuración del Sistema

### Variables de Entorno Requeridas

#### Configuración del Servidor
```env
PORT=3000
NODE_ENV=production
```

#### Configuración de CORS
```env
ALLOWED_ORIGINS=https://movonte.com,https://form.movonte.com,http://localhost:3000
```

#### Configuración de Jira (Obligatoria)
```env
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
```

### Configuración Mínima para Funcionamiento
```env
PORT=3000
NODE_ENV=production
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
```

## Seguridad y Validaciones

### Medidas de Seguridad Implementadas

1. **CORS Configurado**: Solo dominios autorizados pueden acceder a la API
2. **Helmet**: Headers de seguridad configurados
3. **Validación de Entrada**: Todos los endpoints validan datos de entrada
4. **Autenticación Segura**: Tokens de API manejados de forma segura
5. **Rate Limiting**: Protección contra abuso (configurable)

### Validaciones de Datos

- **Email**: Formato válido requerido
- **Nombre**: Mínimo 2 caracteres
- **Teléfono**: Formato opcional pero validado si se proporciona
- **Empresa**: Mínimo 2 caracteres si se proporciona
- **Mensaje**: Máximo 1000 caracteres

## API de Uso

### Ejemplo: Crear Ticket desde Landing Page

```bash
curl -X POST https://form.movonte.com/api/tickets/landing \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Juan Pérez",
    "email": "juan@empresa.com",
    "phone": "+52 55 1234 5678",
    "company": "Empresa ABC",
    "message": "Necesito ayuda con mi cuenta"
  }'
```

### Respuesta Exitosa
```json
{
  "success": true,
  "jiraIssue": {
    "id": "12345",
    "key": "IT-123",
    "url": "https://movonte.atlassian.net/browse/IT-123"
  }
}
```

### Ejemplo: Cambiar Proyecto Activo

```bash
curl -X POST https://form.movonte.com/api/projects/set-active \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "SUPPORT"
  }'
```

## Despliegue y Operación

### Infraestructura de Despliegue

#### Amazon EC2
- **Instancia**: EC2 con Node.js 18+ configurado
- **Sistema operativo**: Ubuntu/Linux
- **Gestión de procesos**: PM2 para gestión de procesos Node.js
- **Configuración**: Variables de entorno configuradas en el servidor

#### Cloudflare DNS
- **Dominio principal**: `form.movonte.com`
- **Configuración DNS**: A record apuntando a la IP de EC2
- **SSL/TLS**: Certificado SSL automático de Cloudflare
- **CDN**: Aceleración de contenido global

#### Integración con Frontend
- **Frontend principal**: `movonte.com`
- **API Backend**: `form.movonte.com`
- **CORS configurado**: Para permitir peticiones desde `movonte.com`
- **Arquitectura**: Separación de responsabilidades entre frontend y backend

### Arquitectura de Red

```
Internet
    ↓
Cloudflare CDN
    ↓
form.movonte.com (DNS)
    ↓
Amazon EC2 Instance
    ↓
Node.js Application (Port 3000)
    ↓
Jira Cloud API
```

#### Flujo de Peticiones
1. **Usuario** accede a `movonte.com` (frontend)
2. **Frontend** hace peticiones AJAX a `form.movonte.com` (backend)
3. **Backend** procesa y crea tickets en Jira
4. **Respuesta** regresa al frontend con confirmación

### Proceso de Despliegue

1. **Despliegue manual** en instancia EC2
2. **Configuración de variables de entorno** en el servidor
3. **Gestión de procesos** con PM2
4. **Monitoreo de logs** en tiempo real
5. **Actualización de DNS** a través de Cloudflare

### Comandos de Desarrollo

```bash
# Desarrollo
npm run dev

# Compilación
npm run build

# Producción
npm start

# Modo watch
npm run dev:watch
```

## Casos de Uso

### 1. Integración con Formularios Web
- **Formularios de contacto** en `movonte.com`
- **Landing pages de marketing** integradas
- **Aplicaciones de soporte al cliente** desde el frontend principal

### 2. Automatización de Procesos
- Creación automática de tickets desde chatbots
- Integración con sistemas CRM
- Workflows de atención al cliente

### 3. Gestión Multi-Proyecto
- Cambio dinámico entre proyectos de diferentes departamentos
- Gestión centralizada de múltiples instancias de Jira
- Administración de proyectos sin reinicio de servicios

## Monitoreo y Mantenimiento

### Logs Disponibles
- **Peticiones HTTP**: Todas las peticiones entrantes
- **Errores de CORS**: Intentos de acceso no autorizados
- **Creación de tickets**: Logs detallados de cada ticket creado
- **Errores de Jira**: Diagnóstico completo de fallos de conexión

### Métricas de Salud
- **Estado de conexión** con Jira
- **Proyecto activo** actual
- **Número de proyectos** disponibles
- **Última actualización** del cache de proyectos

## Soporte y Documentación

### Recursos Adicionales
- **Ejemplos de uso**: Archivo `examples/project_management_example.js`
- **Formulario de prueba**: Accesible en `https://form.movonte.com/landing-form`
- **Documentación de API**: Endpoint raíz `https://form.movonte.com/` con lista completa de endpoints
- **Frontend principal**: `https://movonte.com` (integración con formularios)

### Resolución de Problemas

#### Problemas Comunes
1. **Error de CORS**: Verificar dominios en `ALLOWED_ORIGINS`
2. **Error de autenticación Jira**: Validar credenciales y permisos
3. **Proyecto no encontrado**: Verificar que el proyecto existe y es accesible
4. **Campos personalizados**: Consultar metadatos con `/api/tickets/create-metadata`

#### Contacto de Soporte
Para reportar problemas o solicitar nuevas funcionalidades, crear un issue en el repositorio del proyecto.

---

**Desarrollado por Movonte**  
**Versión**: 1.0.0  
**Licencia**: Interna de Movonte
