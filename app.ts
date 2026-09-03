import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { LandingController } from './src/controllers/ticket_controller';
import { HealthController } from './src/controllers/health_controller';
import { ProjectController } from './src/controllers/project_controller';
import { GiveawayController } from './src/controllers/giveaway_controller';
import { JiraService } from './src/services/jira_service';
import { HubSpotService } from './src/services/hubspot_service';


class TicketService {
  private app: express.Application;
  private port: number;

  constructor() {
    this.port = parseInt(process.env.PORT || '3000');
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    }));

    // CORS configuration - centralized and secure
    this.setupCORS();

    // Logging
    this.app.use(morgan('combined'));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Static files
    this.app.use(express.static('public'));
  }

  private setupCORS(): void {
    // Define allowed origins once
    const allowedOrigins = this.getAllowedOrigins();
    
    if (process.env.NODE_ENV === 'development') {
      // In development, allow all origins
      this.app.use(cors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept']
      }));
      console.log('CORS: Development mode - allowing all origins');
    } else {
      // In production, use strict CORS configuration
      this.app.use(cors({
        origin: (origin, callback) => {
          console.log('CORS check for origin:', origin);
          
          // Allow requests without origin (like development tools, Postman, etc.)
          if (!origin) {
            console.log('CORS: Allowing request without origin (development tool)');
            return callback(null, true);
          }
          
          // Check if origin is explicitly allowed
          if (this.isOriginAllowed(origin, allowedOrigins)) {
            console.log('CORS: Origin allowed:', origin);
            return callback(null, true);
          }
          
          console.log('CORS blocked origin:', origin);
          console.log('CORS allowed origins:', allowedOrigins);
          callback(new Error('Not allowed by CORS'));
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Origin', 'Accept'],
        preflightContinue: false,
        optionsSuccessStatus: 204
      }));
    }
  }

  private getAllowedOrigins(): string[] {
    return process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [
      'https://chat-grvb.onrender.com',
      'https://movonte.com',
      'https://movonte-consulting.github.io',
      'http://localhost:3000','http://3.136.35.172',
      'https://ticket-service.onrender.com'
    ];
  }

  private isOriginAllowed(origin: string, allowedOrigins: string[]): boolean {
    // Check exact match first
    if (allowedOrigins.includes(origin)) {
      return true;
    }
    
    // Check wildcard patterns
    return allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace('*', '.*');
        const regex = new RegExp(pattern);
        return regex.test(origin);
      }
      return false;
    });
  }

  private setupRoutes(): void {
    // Initialize services
    const jiraService = new JiraService();
    const hubspotService = new HubSpotService();

    // Initialize controllers
    const ticketController = new LandingController(jiraService, hubspotService);
    const projectController = new ProjectController(jiraService);
    const giveawayController = new GiveawayController(jiraService);
    const healthController = new HealthController();

    // Health routes
    this.app.get('/health', healthController.healthCheck.bind(healthController));
    this.app.get('/api/tickets/health', healthController.healthCheck.bind(healthController));

    // Ticket routes
    this.app.post('/api/tickets/create', ticketController.createTicket.bind(ticketController));
    this.app.post('/api/tickets/landing', ticketController.createTicketFromLanding.bind(ticketController));
    this.app.get('/api/tickets/test-jira', ticketController.testJiraConnection.bind(ticketController));
    this.app.get('/api/tickets/test-hubspot', ticketController.testHubSpotConnection.bind(ticketController));
    this.app.get('/api/tickets/jira-fields', ticketController.getJiraFields.bind(ticketController));
    this.app.get('/api/tickets/create-metadata', ticketController.getCreateIssueMetadata.bind(ticketController));

    // Giveaway routes — always routed to JIRA_GIVEAWAY_PROJECT_KEY, never the
    // shared contact project. Kept as its own route/controller/service method
    // so it can't be affected by the ProjectManager singleton's active project.
    this.app.post('/api/tickets/giveaway', giveawayController.createGiveawayTicket.bind(giveawayController));

    // Project management routes
    this.app.get('/api/projects/current', projectController.getCurrentProject.bind(projectController));
    this.app.post('/api/projects/set-active', projectController.setActiveProject.bind(projectController));
    this.app.get('/api/projects/available', projectController.getAvailableProjects.bind(projectController));
    this.app.get('/api/projects/search', projectController.searchProjects.bind(projectController));
    this.app.get('/api/projects/:projectKey', projectController.getProjectDetails.bind(projectController));
    this.app.get('/api/projects/validate-connection', projectController.validateConnection.bind(projectController));
    this.app.get('/api/projects/status', projectController.getStatus.bind(projectController));
    this.app.post('/api/projects/update-auth', projectController.updateAuthConfig.bind(projectController));
    this.app.post('/api/projects/update-base-url', projectController.updateBaseUrl.bind(projectController));

    // Landing page form
    this.app.get('/landing-form', (req, res) => {
      res.sendFile('landing-form.html', { root: './public' });
    });

    // Default route
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Ticket Service - Movonte',
        version: '1.0.0',
        status: 'running',
        endpoints: {
          health: '/health',
          createTicket: 'POST /api/tickets/create',
          landingForm: 'POST /api/tickets/landing',
          giveaway: 'POST /api/tickets/giveaway',
          testJira: 'GET /api/tickets/test-jira',
          testHubSpot: 'GET /api/tickets/test-hubspot',
          jiraFields: 'GET /api/tickets/jira-fields',
          // Project management endpoints
          currentProject: 'GET /api/projects/current',
          setActiveProject: 'POST /api/projects/set-active',
          availableProjects: 'GET /api/projects/available',
          searchProjects: 'GET /api/projects/search',
          projectDetails: 'GET /api/projects/:projectKey',
          validateConnection: 'GET /api/projects/validate-connection',
          projectStatus: 'GET /api/projects/status'
        }
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: {
          health: 'GET /health',
          createTicket: 'POST /api/tickets/create',
          landingForm: 'POST /api/tickets/landing',
          giveaway: 'POST /api/tickets/giveaway',
          testJira: 'GET /api/tickets/test-jira',
          testHubSpot: 'GET /api/tickets/test-hubspot',
          jiraFields: 'GET /api/tickets/jira-fields',
          // Project management endpoints
          currentProject: 'GET /api/projects/current',
          setActiveProject: 'POST /api/projects/set-active',
          availableProjects: 'GET /api/projects/available',
          searchProjects: 'GET /api/projects/search',
          projectDetails: 'GET /api/projects/:projectKey',
          validateConnection: 'GET /api/projects/validate-connection',
          projectStatus: 'GET /api/projects/status'
        }
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Global error handler:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public start(): void {
    this.app.listen(this.port, () => {
      console.log('\n🎫 Ticket Service started successfully!');
      console.log(`🚀 Server running on port ${this.port}`);
      console.log(`📡 URL: http://localhost:${this.port}`);
      console.log('\n📋 Available endpoints:');
      console.log(`   Health Check: http://localhost:${this.port}/health`);
      console.log(`   Create Ticket: POST http://localhost:${this.port}/api/tickets/create`);
      console.log(`   Landing Form: POST http://localhost:${this.port}/api/tickets/landing`);
      console.log(`   Giveaway Entry: POST http://localhost:${this.port}/api/tickets/giveaway`);
      console.log(`   Test Jira: http://localhost:${this.port}/api/tickets/test-jira`);
      console.log(`   Test HubSpot: http://localhost:${this.port}/api/tickets/test-hubspot`);
      console.log(`   Landing Page: http://localhost:${this.port}/landing-form`);
      console.log(`\n🔗 HubSpot sync: ${process.env.HUBSPOT_ACCESS_TOKEN ? 'enabled' : 'disabled (missing HUBSPOT_ACCESS_TOKEN)'}`);
      console.log('\n📊 Project Management endpoints:');
      console.log(`   Current Project: http://localhost:${this.port}/api/projects/current`);
      console.log(`   Set Active Project: POST http://localhost:${this.port}/api/projects/set-active`);
      console.log(`   Available Projects: http://localhost:${this.port}/api/projects/available`);
      console.log(`   Search Projects: http://localhost:${this.port}/api/projects/search`);
      console.log(`   Project Details: http://localhost:${this.port}/api/projects/:projectKey`);
      console.log(`   Validate Connection: http://localhost:${this.port}/api/projects/validate-connection`);
      console.log(`   Project Status: http://localhost:${this.port}/api/projects/status`);
      console.log('\n✅ Service ready to create tickets and manage projects\n');
    });
  }
}

// Start the service
const ticketService = new TicketService();
ticketService.start();
