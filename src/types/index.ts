// Shared types for the entire application

// === Chatbot Types ===
export interface JiraWebhookPayload {
    webhookEvent: string;
    issue: {
      id: string;
      key: string;
      fields: {
        summary: string;
        description?: string;
        status: {
          name: string;
        };
      };
    };
    comment?: {
      id: string;
      body: string;
      author: {
        displayName: string;
        emailAddress: string;
      };
      created: string;
    };
  }
  
  export interface ChatThread {
    threadId: string;
    jiraIssueKey: string;
    lastActivity: Date;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  }
  
  export interface ChatbotResponse {
    success: boolean;
    threadId: string;
    response?: string;
    error?: string;
  }

  // === Atlassian Document Format (ADF) minimal types ===
  export interface AtlassianTextNode {
    type: 'text';
    text: string;
    marks?: Array<{ type: string }>;
  }

  export interface AtlassianHardBreakNode {
    type: 'hardBreak';
  }

  export interface AtlassianParagraphNode {
    type: 'paragraph';
    content?: Array<AtlassianTextNode | AtlassianHardBreakNode>;
  }

  export interface AtlassianDocument {
    version: 1;
    type: 'doc';
    content: Array<AtlassianParagraphNode>;
  }
  
  // === Contact Form Types ===
  export interface ContactFormData {
    name: string;
    email: string;
    company?: string;
    phone?: string;
    message: string;
    source?: string;
  }
  
  export interface ContactApiResponse {
    success: boolean;
    jiraIssue?: {
      id: string;
      key: string;
      url: string;
    };
    error?: string;
    fallbackEmail?: boolean;
  }
  
  // === Jira Types ===
  export interface JiraIssueRequest {
    fields: {
      project: {
        key: string;
      };
      summary: string;
      description: string | AtlassianDocument;
      issuetype: {
        name: string;
      };
      priority?: {
        name: string;
      };
      labels?: string[];
      // Campos personalizados de Jira (Proyecto TI)
      customfield_10044?: string; // Email
      customfield_10088?: string; // Phone number
      customfield_10103?: string; // First name
      customfield_10104?: string; // Last name
      customfield_10288?: string; // Contact
      customfield_10155?: string; // Customer
      customfield_10002?: string[]; // Organizations
      customfield_10090?: string; // Details
      [key: string]: unknown; // Allows adding dynamic custom fields
    };
  }
  
  export interface JiraResponse {
    id: string;
    key: string;
    self: string;
  }
  
  // === Email Types ===
  export interface EmailRequest {
    to: string | string[];
    subject: string;
    message: string;
    cc?: string | string[];
    bcc?: string | string[];
    attachments?: Array<{
      filename: string;
      content: string | any; // Buffer type
      contentType?: string;
    }>;
    template?: 'jira_update' | 'chat_summary' | 'contact_form' | 'plain';
    templateData?: any;
  }
  
  export interface EmailResponse {
    success: boolean;
    messageId?: string;
    error?: string;
  }

  // === Project Management Types ===
  export interface JiraProject {
    id: string;
    key: string;
    name: string;
    description?: string;
    projectTypeKey: string;
    lead?: {
      accountId: string;
      displayName: string;
    };
    url?: string;
    avatarUrls?: {
      '16x16': string;
      '24x24': string;
      '32x32': string;
      '48x48': string;
    };
  }

  export interface ProjectConfig {
    projectKey: string;
    projectName: string;
    baseUrl: string;
    email: string;
    token: string;
    customFields?: {
      [key: string]: string;
    };
  }

  export interface ProjectManagerResponse {
    success: boolean;
    message?: string;
    error?: string;
    currentProject?: JiraProject;
    availableProjects?: JiraProject[];
  }