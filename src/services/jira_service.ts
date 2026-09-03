import axios from 'axios';
import { JiraIssueRequest, JiraResponse, ContactFormData } from '../types';
import { ProjectManager } from './project_manager';

export class JiraService {
  private projectManager: ProjectManager;

  constructor() {
    this.projectManager = ProjectManager.getInstance();
  }

  async createContactIssue(formData: ContactFormData): Promise<JiraResponse> {
    try {
      const currentProjectKey = this.projectManager.getCurrentProjectKey();
      const fields: JiraIssueRequest['fields'] = {
        project: {
          key: currentProjectKey
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

      // Only use basic fields that always work
      console.log('Creating ticket with basic fields only');
      console.log('Project Key:', currentProjectKey);
      console.log('Customer info will be in description only');

      const issueData: JiraIssueRequest = { fields };

      console.log('Sending to Jira:', JSON.stringify(issueData, null, 2));

      const response = await axios.post(
        `${this.projectManager.getBaseUrl()}/rest/api/3/issue`,
        issueData,
        {
          headers: {
            'Authorization': `Basic ${this.projectManager.getAuth()}`,
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
    const currentProjectKey = this.projectManager.getCurrentProjectKey();
    const response = await axios.get(
      `${this.projectManager.getBaseUrl()}/rest/api/3/project/${currentProjectKey}`,
      {
        headers: {
          'Authorization': `Basic ${this.projectManager.getAuth()}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  }

  async getFields(): Promise<any> {
    const response = await axios.get(
      `${this.projectManager.getBaseUrl()}/rest/api/3/field`,
      {
        headers: {
          'Authorization': `Basic ${this.projectManager.getAuth()}`,
          'Accept': 'application/json'
        }
      }
    );

    // Filter only custom fields
    const customFields = response.data.filter((field: any) => field.custom);
    
    return customFields.map((field: any) => ({
      id: field.id,
      name: field.name,
      type: field.schema?.type || 'unknown'
    }));
  }

  async getCreateIssueMetadata(): Promise<any> {
    const currentProjectKey = this.projectManager.getCurrentProjectKey();
    const response = await axios.get(
      `${this.projectManager.getBaseUrl()}/rest/api/3/issue/createmeta`,
      {
        params: {
          projectKeys: currentProjectKey,
          expand: 'projects.issuetypes.fields'
        },
        headers: {
          'Authorization': `Basic ${this.projectManager.getAuth()}`,
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
        `${this.projectManager.getBaseUrl()}/rest/api/3/issue/${issueKey}/comment`,
        commentData,
        {
          headers: {
            'Authorization': `Basic ${this.projectManager.getAuth()}`,
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

  /**
   * Obtiene el ProjectManager para gestión de proyectos
   */
  public getProjectManager(): ProjectManager {
    return this.projectManager;
  }

  /**
   * Obtiene el proyecto activo actual
   */
  public getCurrentProject() {
    return this.projectManager.getCurrentProject();
  }

  /**
   * Obtiene la clave del proyecto activo
   */
  public getCurrentProjectKey(): string {
    return this.projectManager.getCurrentProjectKey();
  }
}