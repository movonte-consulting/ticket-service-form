import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { LandingController } from './src/controllers/ticket_controller';
import { HealthController } from './src/controllers/health_controller';
import { JiraService } from './src/services/jira_service';


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
      'http://localhost:3000',
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
    
    // Initialize controllers
    const ticketController = new LandingController(jiraService);
    const healthController = new HealthController();

    // Health routes
    this.app.get('/health', healthController.healthCheck.bind(healthController));
    this.app.get('/api/tickets/health', healthController.healthCheck.bind(healthController));

    // Ticket routes
    this.app.post('/api/tickets/create', ticketController.createTicket.bind(ticketController));
    this.app.post('/api/tickets/landing', ticketController.createTicketFromLanding.bind(ticketController));
    this.app.get('/api/tickets/test-jira', ticketController.testJiraConnection.bind(ticketController));
    this.app.get('/api/tickets/jira-fields', ticketController.getJiraFields.bind(ticketController));
    this.app.get('/api/tickets/create-metadata', ticketController.getCreateIssueMetadata.bind(ticketController));

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
          testJira: 'GET /api/tickets/test-jira',
          jiraFields: 'GET /api/tickets/jira-fields'
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
          testJira: 'GET /api/tickets/test-jira',
          jiraFields: 'GET /api/tickets/jira-fields'
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
      console.log(`   Test Jira: http://localhost:${this.port}/api/tickets/test-jira`);
      console.log(`   Landing Page: http://localhost:${this.port}/landing-form`);
      console.log('\n✅ Service ready to create tickets\n');
    });
  }
}

// Start the service
const ticketService = new TicketService();
ticketService.start();
