# Ticket Service - Movonte

REST API service for automatic ticket creation in Jira from contact forms and web applications.

## Description

This service allows creating tickets in Jira automatically through REST endpoints. It's designed to integrate with contact forms, landing pages, and other applications that require creating support or contact tickets.

## Features

-  Automatic ticket creation in Jira
-  Form validation
-  CORS support configured
-  REST endpoints for integration
-  Integrated contact form
-  Health checks and monitoring
-  Detailed logging
-  Robust error handling

## Technologies

- **Backend**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: Jira Cloud (via REST API)
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Deployment**: Render

## Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Jira Cloud account with API permissions

### Local Installation

```bash
# Clone repository
git clone [repository-url]
cd ticket-service

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# Compile TypeScript
npm run build

# Run in development
npm run dev

# Run in production
npm start
```

## Environment Variables

### Server Configuration
```env
PORT=3000
NODE_ENV=production
```

### CORS Configuration
```env
ALLOWED_ORIGINS=https://chat-grvb.onrender.com,https://movonte.com,https://movonte-consulting.github.io,http://localhost:3000
```

### Jira Configuration (Required)
```env
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
```

### Jira Custom Fields
```env
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```

### Minimum Variables to Function
```env
PORT=3000
NODE_ENV=production
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token
JIRA_FIELD_EMAIL=customfield_10044
JIRA_FIELD_PHONE=customfield_10088
JIRA_FIELD_FIRST_NAME=customfield_10103
JIRA_FIELD_LAST_NAME=customfield_10104
JIRA_FIELD_CONTACT=customfield_10288
JIRA_FIELD_CUSTOMER=customfield_10155
JIRA_FIELD_ORGANIZATION=customfield_10002
```

## Endpoints

### Health Check
```
GET /health
GET /api/tickets/health
```

### Create Ticket
```
POST /api/tickets/create
POST /api/tickets/landing
```

### Jira Information
```
GET /api/tickets/test-jira
GET /api/tickets/jira-fields
GET /api/tickets/create-metadata
```

### Contact Form
```
GET /landing-form
```

## API Usage

### Create ticket from landing page

```bash
curl -X POST https://ticket-service-4olw.onrender.com/api/tickets/landing \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1 (555) 123-4567",
    "company": "ABC Company",
    "message": "I need help with my account"
  }'
```

### Create ticket from API

```bash
curl -X POST https://ticket-service-4olw.onrender.com/api/tickets/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+1 (555) 987-6543",
    "company": "XYZ Corp",
    "message": "Urgent technical issue"
  }'
```

## API Responses

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

### Error Response
```json
{
  "success": false,
  "error": "Name and email are required"
}
```

## Jira Configuration

### Required Permissions
- Create issues in the specified project
- Access to custom fields
- Read permissions in the project

### Custom Fields Configuration
The custom field IDs must be configured in environment variables. To obtain these IDs:

1. Go to Jira > Administration > Schemes
2. Find the project scheme
3. Identify custom fields and their IDs

## Deployment

### Render
1. Connect repository to Render
2. Configure environment variables
3. Automatic deploy on each push

### Environment Variables in Render
Configure all environment variables listed above in the Render dashboard.

## Development

### Available Scripts
```bash
npm run dev          # Run in development mode
npm run build        # Compile TypeScript
npm start           # Run in production
npm run test        # Run tests
```

### Project Structure
```
ticket-service/
├── src/
│   ├── controllers/     # API controllers
│   ├── services/        # Business services
│   └── types/          # Type definitions
├── public/             # Static files
├── app.ts             # Entry point
└── package.json
```

## Monitoring and Logs

The service includes detailed logging for:
- HTTP requests
- CORS errors
- Ticket creation
- Jira connection errors

Logs are available in the Render console.

## Security

- CORS configured for specific domains
- Security headers with Helmet
- Input validation on all endpoints
- Secure API token handling

## Support

To report issues or request new features, create an issue in the project repository.

## License

Internal project of Movonte .
