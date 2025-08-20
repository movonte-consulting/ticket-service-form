import axios from 'axios';
import { JiraIssueRequest, JiraResponse, ContactFormData } from '../types';
import process from 'process';
import { Buffer } from 'buffer';

export class JiraService {
  private baseUrl: string;
  private auth: string;
  private projectKey: string;

  constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || 'https://movonte.atlassian.net';
    this.projectKey = process.env.JIRA_PROJECT_KEY || 'CONTACT';
    
    const email = process.env.JIRA_EMAIL || '';
    const token = process.env.JIRA_API_TOKEN || '';
    this.auth = Buffer.from(`${email}:${token}`).toString('base64');
  }

  async createContactIssue(formData: ContactFormData): Promise<JiraResponse> {
    try {
      const fields: JiraIssueRequest['fields'] = {
        project: {
          key: this.projectKey
        },
        summary: `Web Contact: ${formData.name} - ${formData.company || 'No company'}`,
        description: this.formatContactDescriptionADF(formData),
        issuetype: {
          name: 'Task'
        },
        priority: {
          name: 'Medium'
        },
        labels: ['contacto-web', 'lead']
      };

      // Mapear campos personalizados disponibles en el proyecto TI
      const emailFieldId = 'customfield_10044';
      const phoneFieldId = 'customfield_10088';
      const firstNameFieldId = 'customfield_10103';
      const lastNameFieldId = 'customfield_10104';
      const contactFieldId = 'customfield_10288';
      const customerFieldId = 'customfield_10155';
      const organizationFieldId = 'customfield_10002';
      const detailsFieldId = 'customfield_10090';

      // Separar nombre completo en nombre y apellido
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Agregar campos personalizados
      (fields as any)[emailFieldId] = formData.email;
      
      if (formData.phone) {
        (fields as any)[phoneFieldId] = formData.phone;
      }
      
      (fields as any)[firstNameFieldId] = firstName;
      (fields as any)[lastNameFieldId] = lastName;
      (fields as any)[contactFieldId] = formData.name;
      (fields as any)[customerFieldId] = formData.name;
      
      if (formData.company) {
        (fields as any)[organizationFieldId] = [formData.company];
      }
      
      // Agregar detalles adicionales
      const details = `Mensaje: ${formData.message}\nOrigen: ${formData.source || 'API'}`;
      (fields as any)[detailsFieldId] = details;

      console.log('Creating ticket with custom fields for project TI');
      console.log('Project Key:', this.projectKey);

      const issueData: JiraIssueRequest = { fields };

      console.log('Sending to Jira:', JSON.stringify(issueData, null, 2));

      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue`,
        issueData,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Jira API Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      if (error.response?.data) {
        console.error('Jira Error Response:', JSON.stringify(error.response.data, null, 2));
      }
      
      throw error;
    }
  }

  async testConnection(): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/rest/api/3/project/${this.projectKey}`,
      {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  }

  async getFields(): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/rest/api/3/field`,
      {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      }
    );

    // Filtrar solo campos personalizados
    const customFields = response.data.filter((field: any) => field.custom);
    
    return customFields.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.schema?.type || 'unknown'
    }));
  }

  async getCreateIssueMetadata(): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/rest/api/3/issue/createmeta`,
      {
        params: {
          projectKeys: this.projectKey,
          expand: 'projects.issuetypes.fields'
        },
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  }

  async addCommentToIssue(issueKey: string, commentText: string): Promise<any> {
    try {
      console.log(`Adding comment to issue ${issueKey}: ${commentText}`);
      
      const commentData = {
        body: {
          version: 1,
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: commentText
                }
              ]
            }
          ]
        }
      };

      const response = await axios.post(
        `${this.baseUrl}/rest/api/3/issue/${issueKey}/comment`,
        commentData,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        }
      );

      console.log(`Comment added successfully to ${issueKey}`);
      return response.data;
    } catch (error) {
      console.error(`Error adding comment to ${issueKey}:`, error);
      throw error;
    }
  }

  private formatContactDescriptionADF(formData: ContactFormData) {
    const lines = [
      `New contact from website`,
      `Name: ${formData.name}`,
      `Email: ${formData.email}`,
      `Company: ${formData.company || 'Not specified'}`,
      `Phone: ${formData.phone || 'Not provided'}`,
      `Source: ${formData.source || 'Web form'}`,
      '',
      `Message:`,
      `${formData.message}`,
      '',
      `---`,
      `Ticket automatically created on ${new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' })}`
    ];

    // Convert plain lines to minimal ADF document with paragraphs
    return {
      version: 1 as const,
      type: 'doc' as const,
      content: lines.map((text) => ({
        type: 'paragraph' as const,
        content: text
          ? [{ type: 'text' as const, text }]
          : undefined
      }))
    };
  }
}