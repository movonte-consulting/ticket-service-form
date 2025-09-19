# Ticket and Project Management System - Ticket Service Form

## Executive Summary

The **Ticket Service Form** is a REST API developed in Node.js and TypeScript that automates ticket creation in Jira from contact forms and web applications. The system provides a comprehensive solution for Jira project management with dynamic active project switching capabilities, automatic ticket creation, and service health monitoring.

## System Architecture

### Main Technologies

- **Backend**: Node.js 18+ with TypeScript
- **Framework**: Express.js
- **Database**: Jira Cloud (REST API)
- **Security**: Helmet, CORS configured
- **Logging**: Morgan for request monitoring
- **Deployment**: Amazon EC2 with Cloudflare DNS

### Project Structure

```
ticket-service/
├── src/
│   ├── controllers/          # API Controllers
│   │   ├── health_controller.ts
│   │   ├── project_controller.ts
│   │   └── ticket_controller.ts
│   ├── services/            # Business Services
│   │   ├── jira_service.ts
│   │   └── project_manager.ts
│   └── types/               # Type Definitions
│       └── index.ts
├── public/                  # Static Files
├── examples/               # Usage Examples
├── app.ts                  # Entry Point
└── package.json
```

## Main Features

### 1. Jira Project Management

The system implements a **ProjectManager** singleton that allows:

- **Dynamic active project switching** without server restart
- **Intelligent cache** of available projects (TTL: 5 minutes)
- **Project search** by name, key or description
- **Real-time connection validation** with Jira
- **Configuration updates** for authentication and base URL

#### Project Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/current` | Gets the current active project |
| POST | `/api/projects/set-active` | Changes the active project |
| GET | `/api/projects/available` | Lists all available projects |
| GET | `/api/projects/search?query=` | Searches projects by criteria |
| GET | `/api/projects/:projectKey` | Gets details of a specific project |
| GET | `/api/projects/validate-connection` | Validates connection with Jira |
| GET | `/api/projects/status` | Gets the ProjectManager status |
| POST | `/api/projects/update-auth` | Updates authentication credentials |
| POST | `/api/projects/update-base-url` | Updates the Jira base URL |

### 2. Automatic Ticket Creation

The system creates tickets in Jira with the following structure:

#### Ticket Fields
- **Project**: Dynamically configured by the ProjectManager
- **Type**: Task (configurable)
- **Priority**: Medium (configurable)
- **Summary**: "Web Contact: [Name] - [Company]"
- **Description**: ADF (Atlassian Document Format) with:
  - Complete contact information
  - User message
  - Creation timestamp
  - Contact source
- **Labels**: `contacto-web`, `lead`

#### Ticket Creation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tickets/create` | Creates ticket from external API |
| POST | `/api/tickets/landing` | Creates ticket from web form |
| GET | `/api/tickets/test-jira` | Tests connection with Jira |
| GET | `/api/tickets/jira-fields` | Gets Jira custom fields |
| GET | `/api/tickets/create-metadata` | Gets metadata for issue creation |

### 3. Web Contact Form

The system includes an integrated HTML form accessible at `/landing-form` with:

- **Client and server-side validation**
- **Required fields**: Name, Email
- **Optional fields**: Phone, Company, Message
- **Email format validation**
- **Direct integration with ticket API**

### 4. System Monitoring and Health

#### Health Checks
- **Main endpoint**: `GET /health`
- **Alternative endpoint**: `GET /api/tickets/health`
- **Response**: Service status, version and available endpoints

#### Logging and Monitoring
- **HTTP request logs** with Morgan
- **Detailed Jira error logs**
- **CORS and security monitoring**
- **Complete ticket creation traceability**

## System Configuration

### Required Environment Variables

#### Server Configuration
```env
PORT=3000
NODE_ENV=production
```

#### CORS Configuration
```env
ALLOWED_ORIGINS=https://movonte.com,https://form.movonte.com,http://localhost:3000
```

#### Jira Configuration (Required)
```env
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
```

### Minimum Configuration for Operation
```env
PORT=3000
NODE_ENV=production
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
```

## Security and Validations

### Implemented Security Measures

1. **CORS Configured**: Only authorized domains can access the API
2. **Helmet**: Security headers configured
3. **Input Validation**: All endpoints validate input data
4. **Secure Authentication**: API tokens handled securely
5. **Rate Limiting**: Protection against abuse (configurable)

### Data Validations

- **Email**: Valid format required
- **Name**: Minimum 2 characters
- **Phone**: Optional format but validated if provided
- **Company**: Minimum 2 characters if provided
- **Message**: Maximum 1000 characters

## API Usage

### Example: Create Ticket from Landing Page

```bash
curl -X POST https://form.movonte.com/api/tickets/landing \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@company.com",
    "phone": "+1 555 123 4567",
    "company": "ABC Company",
    "message": "I need help with my account"
  }'
```

### Success Response
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

### Example: Change Active Project

```bash
curl -X POST https://form.movonte.com/api/projects/set-active \
  -H "Content-Type: application/json" \
  -d '{
    "projectKey": "SUPPORT"
  }'
```

## Deployment and Operations

### Deployment Infrastructure

#### Amazon EC2
- **Instance**: EC2 with Node.js 18+ configured
- **Operating System**: Ubuntu/Linux
- **Process Management**: PM2 for Node.js process management
- **Configuration**: Environment variables configured on the server

#### Cloudflare DNS
- **Main Domain**: `form.movonte.com`
- **DNS Configuration**: A record pointing to EC2 IP
- **SSL/TLS**: Automatic SSL certificate from Cloudflare
- **CDN**: Global content acceleration

#### Frontend Integration
- **Main Frontend**: `movonte.com`
- **Backend API**: `form.movonte.com`
- **CORS configured**: To allow requests from `movonte.com`
- **Architecture**: Separation of responsibilities between frontend and backend

### Network Architecture

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

#### Request Flow
1. **User** accesses `movonte.com` (frontend)
2. **Frontend** makes AJAX requests to `form.movonte.com` (backend)
3. **Backend** processes and creates tickets in Jira
4. **Response** returns to frontend with confirmation

### Deployment Process

1. **Manual deployment** on EC2 instance
2. **Environment variables configuration** on the server
3. **Process management** with PM2
4. **Real-time log monitoring**
5. **DNS updates** through Cloudflare

### Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm start

# Watch mode
npm run dev:watch
```

## Use Cases

### 1. Web Form Integration
- **Contact forms** on `movonte.com`
- **Marketing landing pages** integrated
- **Customer support applications** from the main frontend

### 2. Process Automation
- Automatic ticket creation from chatbots
- CRM system integration
- Customer service workflows

### 3. Multi-Project Management
- Dynamic switching between projects from different departments
- Centralized management of multiple Jira instances
- Project administration without service restart

## Monitoring and Maintenance

### Available Logs
- **HTTP Requests**: All incoming requests
- **CORS Errors**: Unauthorized access attempts
- **Ticket Creation**: Detailed logs of each ticket created
- **Jira Errors**: Complete diagnosis of connection failures

### Health Metrics
- **Connection status** with Jira
- **Current active project**
- **Number of available projects**
- **Last cache update** of projects

## Troubleshooting

#### Common Issues
1. **CORS Error**: Verify domains in `ALLOWED_ORIGINS`
2. **Jira Authentication Error**: Validate credentials and permissions
3. **Project Not Found**: Verify that the project exists and is accessible
4. **Custom Fields**: Query metadata with `/api/tickets/create-metadata`

---

**Developed by Movonte**  
**Version**: 1.0.0  
**License**: Internal Movonte
