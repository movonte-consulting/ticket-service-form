# Ticket Service Form - Movonte

> A robust Node.js API for automated Jira ticket creation from web forms and applications

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18+-lightgrey.svg)](https://expressjs.com/)
[![Jira](https://img.shields.io/badge/Jira-Cloud-orange.svg)](https://www.atlassian.com/software/jira)

## Quick Start

```bash
# Clone and install
git clone [repository-url]
cd ticket-service-form
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Jira credentials

# Run development server
npm run dev
```

**Live Demo**: [form.movonte.com](https://form.movonte.com)

## What This Does

This service automatically creates Jira tickets when users submit contact forms on your website. It's designed to streamline customer support and lead management by eliminating manual ticket creation.

### Key Capabilities

- **Automatic Ticket Creation** - Converts form submissions to Jira issues
- **Dynamic Project Management** - Switch between Jira projects without restart
- **Enterprise Security** - CORS, Helmet, input validation
- **Real-time Monitoring** - Health checks and detailed logging
- **Multi-domain Support** - Works with multiple frontend applications

## Architecture

```
Frontend (movonte.com) → API (form.movonte.com) → Jira Cloud
```

### Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with middleware stack
- **Integration**: Jira Cloud REST API
- **Security**: Helmet, CORS, input validation
- **Deployment**: Amazon EC2 + Cloudflare DNS
- **Process Management**: PM2

## Configuration

### Required Environment Variables

```env
# Server
PORT=3000
NODE_ENV=production

# Jira Integration
JIRA_BASE_URL=https://movonte.atlassian.net
JIRA_PROJECT_KEY=IT
JIRA_EMAIL=ticket-service@movonte.com
JIRA_API_TOKEN=your-jira-api-token

# HubSpot Integration (optional)
HUBSPOT_ACCESS_TOKEN=your-hubspot-private-app-token
HUBSPOT_BASE_URL=https://api.hubapi.com
HUBSPOT_TIMEOUT_MS=8000

# Giveaway/contest entries (POST /api/tickets/giveaway) always go to this
# project, independent of JIRA_PROJECT_KEY / the active project set via
# /api/projects/set-active. Required for that endpoint to work — it errors
# out instead of silently falling back to the shared contact project.
JIRA_GIVEAWAY_PROJECT_KEY=your-giveaway-project-key

# CORS (comma-separated)
ALLOWED_ORIGINS=https://movonte.com,https://form.movonte.com,http://localhost:3000
```

### Jira Setup Requirements

1. **API Token**: Generate from [Atlassian Account Settings](https://id.atlassian.com/manage-profile/security/api-tokens)
2. **Project Permissions**: User needs "Create Issues" permission
3. **Custom Fields**: Optional, for enhanced ticket data

### HubSpot Setup Requirements

`POST /api/tickets/create` also registers the contact in the HubSpot CRM, so a
single form submission produces both a Jira ticket and a HubSpot contact.

1. **Private App**: Create one in HubSpot (Settings → Integrations → Private Apps)
2. **Scopes**: `crm.objects.contacts.write` is the only one required — creating
   and updating are both writes, and `/api/tickets/test-hubspot` validates the
   token through the private-app token-info endpoint rather than reading contacts
3. **Token**: Copy it into `HUBSPOT_ACCESS_TOKEN` in `.env` (note: `.env.save` is
   a tracked backup copy, the app only reads `.env`)

Behaviour notes:

- If `HUBSPOT_ACCESS_TOKEN` is empty the sync is skipped and only the Jira ticket is created.
- HubSpot failures never break the ticket: the error is logged and returned in
  `hubspotContact.error`, while the response still reports the created issue.
- Contacts are matched by email — an existing contact is updated instead of duplicated.
- The form's `name` field is split into `firstname` / `lastname`; `lifecyclestage`
  is only set on creation so existing contacts don't get moved backwards.
- This is a server-to-server sync without the tracking cookie, so contacts land
  with *Original source = Offline sources*. Campaign attribution would require
  installing the HubSpot tracking script on the landing and forwarding the
  `hubspotutk` cookie — out of scope for now.

## API Reference

### Core Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/tickets/landing` | Create ticket from web form |
| `POST` | `/api/tickets/create` | Create ticket from API **+ sync contact to HubSpot** |
| `POST` | `/api/tickets/giveaway` | Create a giveaway/contest entry — always in `JIRA_GIVEAWAY_PROJECT_KEY`, never the shared contact project |
| `GET` | `/health` | Service health check |
| `GET` | `/api/tickets/test-jira` | Test Jira connection |
| `GET` | `/api/tickets/test-hubspot` | Test HubSpot connection |

### Project Management

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/projects/current` | Get active project |
| `POST` | `/api/projects/set-active` | Switch active project |
| `GET` | `/api/projects/available` | List all projects |
| `GET` | `/api/projects/search?query=` | Search projects |

## Usage Examples

### JavaScript/TypeScript Integration

```javascript
// Create ticket from frontend
const response = await fetch('https://form.movonte.com/api/tickets/landing', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@company.com',
    phone: '+1 555 123 4567',
    company: 'ABC Corp',
    message: 'Need help with integration'
  })
});

const result = await response.json();
console.log('Ticket created:', result.jiraIssue.key);
```

### cURL Examples

```bash
# Create ticket
curl -X POST https://form.movonte.com/api/tickets/landing \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "company": "Tech Solutions",
    "message": "Interested in your services"
  }'

# Switch project
curl -X POST https://form.movonte.com/api/projects/set-active \
  -H "Content-Type: application/json" \
  -d '{"projectKey": "SUPPORT"}'
```

## Development

### Available Scripts

```bash
npm run dev          # Development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start           # Production server
npm run dev:watch   # Development with file watching
```

### Project Structure

```
src/
├── controllers/     # Request handlers
│   ├── health_controller.ts
│   ├── project_controller.ts
│   └── ticket_controller.ts
├── services/        # Business logic
│   ├── jira_service.ts
│   └── project_manager.ts
└── types/          # TypeScript definitions
    └── index.ts
```

### Adding New Features

1. **New Endpoint**: Add route in `app.ts` and controller method
2. **Jira Integration**: Extend `JiraService` class
3. **Project Management**: Use `ProjectManager` singleton
4. **Types**: Update `src/types/index.ts`

## Deployment

### Production Setup (EC2)

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Deploy application
git clone [repository-url]
cd ticket-service-form
npm install
npm run build

# Configure environment variables
nano .env

# Start with PM2
pm2 start dist/app.js --name ticket-service
pm2 save
pm2 startup
```

### Cloudflare Configuration

1. **DNS**: Point `form.movonte.com` to EC2 IP
2. **SSL**: Enable "Full (strict)" SSL mode
3. **Caching**: Configure page rules for API endpoints

## Monitoring

### Health Checks

```bash
# Service status
curl https://form.movonte.com/health

# Jira connection
curl https://form.movonte.com/api/tickets/test-jira
```

### Logs

- **PM2 Logs**: `pm2 logs ticket-service`
- **Application Logs**: Console output with Morgan middleware
- **Error Tracking**: Detailed Jira API error responses

## Security Features

- **CORS Protection**: Only authorized domains can access API
- **Input Validation**: All endpoints validate request data
- **Security Headers**: Helmet middleware for HTTP security
- **Rate Limiting**: Configurable request throttling
- **Secure Tokens**: Jira API tokens handled securely

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| CORS errors | Check `ALLOWED_ORIGINS` environment variable |
| Jira auth fails | Verify API token and email in `.env` |
| Project not found | Ensure project key exists and user has access |
| Custom fields missing | Use `/api/tickets/create-metadata` to get field IDs |

### Debug Mode

```bash
# Enable debug logging
NODE_ENV=development npm run dev
```

## Performance

- **Response Time**: < 2s for ticket creation
- **Concurrent Requests**: Handles 100+ simultaneous requests
- **Cache**: Project data cached for 5 minutes
- **Error Recovery**: Automatic retry for transient Jira API failures

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

Internal project of Movonte. All rights reserved.

---

**Need Help?** Check the [API Documentation](https://form.movonte.com/) or create an issue in the repository.