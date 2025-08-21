import { Request, Response } from 'express';
import { JiraService } from '../services/jira_service';
import { ContactFormData, ContactApiResponse } from '../types';

export class LandingController {
  constructor(private jiraService: JiraService) {}

  async createTicketFromLanding(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, company, message } = req.body;

      // Validate required fields
      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      // Prepare form data
      const formData: ContactFormData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : undefined,
        company: company ? company.trim() : undefined,
        message: message ? message.trim() : 'Contact from landing page form',
        source: 'landing-page'
      };

      console.log('Creating ticket from landing page:', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone ? '***' : 'Not provided'
      });

      // Create ticket in Jira
      const jiraResponse = await this.jiraService.createContactIssue(formData);

      console.log('Ticket created successfully:', jiraResponse.key);

      const response: ContactApiResponse = {
        success: true,
        jiraIssue: {
          id: jiraResponse.id,
          key: jiraResponse.key,
          url: `${process.env.JIRA_BASE_URL}/browse/${jiraResponse.key}`
        }
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('Error creating ticket from landing page:', error);
      
      let errorMessage = 'Failed to create ticket';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      const response: ContactApiResponse = {
        success: false,
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async validateLandingForm(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, company } = req.body;

      const errors: string[] = [];

      // Validate name
      if (!name || name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
      }

      // Validate email
      if (!email) {
        errors.push('Email is required');
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          errors.push('Invalid email format');
        }
      }

      // Validate phone (optional but if provided must be valid)
      if (phone && phone.trim()) {
        const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
        if (!phoneRegex.test(phone.trim())) {
          errors.push('Invalid phone format');
        }
      }

      // Validate company (optional)
      if (company && company.trim().length < 2) {
        errors.push('Company name must be at least 2 characters long');
      }

      if (errors.length > 0) {
        res.status(400).json({
          success: false,
          errors: errors
        });
        return;
      }

      res.json({
        success: true,
        message: 'Form validation passed'
      });

    } catch (error) {
      console.error('Error validating landing form:', error);
      res.status(500).json({
        success: false,
        error: 'Validation failed'
      });
    }
  }

  async getLandingFormFields(req: Request, res: Response): Promise<void> {
    try {
      // Return information about form fields
      const formFields = {
        required: ['name', 'email'],
        optional: ['phone', 'company', 'message'],
        validation: {
          name: {
            minLength: 2,
            maxLength: 100,
            description: 'Full name of the contact'
          },
          email: {
            pattern: 'email',
            description: 'Valid email address'
          },
          phone: {
            pattern: 'phone',
            description: 'Phone number (optional)',
            example: '+1 (555) 123-4567'
          },
          company: {
            minLength: 2,
            maxLength: 100,
            description: 'Company name (optional)'
          },
          message: {
            maxLength: 1000,
            description: 'Additional message (optional)'
          }
        }
      };

      res.json({
        success: true,
        formFields
      });

    } catch (error) {
      console.error('Error getting form fields:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get form fields'
      });
    }
  }

  async createTicket(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, phone, company, message } = req.body;

      // Validate required fields
      if (!name || !email) {
        res.status(400).json({
          success: false,
          error: 'Name and email are required'
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      // Prepare form data
      const formData: ContactFormData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone ? phone.trim() : undefined,
        company: company ? company.trim() : undefined,
        message: message ? message.trim() : 'Contact from API',
        source: 'api'
      };

      console.log('Creating ticket from API:', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone ? '***' : 'Not provided'
      });

      // Create ticket in Jira
      const jiraResponse = await this.jiraService.createContactIssue(formData);

      console.log('Ticket created successfully:', jiraResponse.key);

      const response: ContactApiResponse = {
        success: true,
        jiraIssue: {
          id: jiraResponse.id,
          key: jiraResponse.key,
          url: `${process.env.JIRA_BASE_URL}/browse/${jiraResponse.key}`
        }
      };

      res.status(201).json(response);

    } catch (error) {
      console.error('Error creating ticket from API:', error);
      
      let errorMessage = 'Failed to create ticket';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      const response: ContactApiResponse = {
        success: false,
        error: errorMessage
      };

      res.status(500).json(response);
    }
  }

  async testJiraConnection(req: Request, res: Response): Promise<void> {
    try {
      console.log('Testing Jira connection...');
      
      const testResult = await this.jiraService.testConnection();
      
      console.log('Jira connection test successful:', testResult);
      
      res.json({
        success: true,
        message: 'Jira connection successful',
        project: testResult
      });

    } catch (error) {
      console.error('Jira connection test failed:', error);
      
      let errorMessage = 'Failed to connect to Jira';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async getJiraFields(req: Request, res: Response): Promise<void> {
    try {
      console.log('Getting Jira fields...');
      
      const fields = await this.jiraService.getFields();
      
      console.log('Jira fields retrieved successfully');
      
      res.json({
        success: true,
        message: 'Jira fields retrieved successfully',
        fields: fields
      });

    } catch (error) {
      console.error('Failed to get Jira fields:', error);
      
      let errorMessage = 'Failed to get Jira fields';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }

  async getCreateIssueMetadata(req: Request, res: Response): Promise<void> {
    try {
      console.log('Getting create issue metadata...');
      
      const metadata = await this.jiraService.getCreateIssueMetadata();
      
      console.log('Create issue metadata retrieved successfully');
      
      res.json({
        success: true,
        message: 'Create issue metadata retrieved successfully',
        metadata: metadata
      });

    } catch (error) {
      console.error('Failed to get create issue metadata:', error);
      
      let errorMessage = 'Failed to get create issue metadata';
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      res.status(500).json({
        success: false,
        error: errorMessage
      });
    }
  }
}
