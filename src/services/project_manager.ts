import axios from 'axios';
import { Buffer } from 'buffer';
import { JiraProject, ProjectConfig, ProjectManagerResponse } from '../types';

/**
 * Singleton class para gestionar proyectos Jira activos
 * Permite cambiar dinámicamente el proyecto activo sin reiniciar el servidor
 */
export class ProjectManager {
  private static instance: ProjectManager;
  private currentProject: JiraProject | undefined = undefined;
  private baseUrl: string;
  private auth: string;
  private availableProjects: JiraProject[] = [];
  private lastProjectsUpdate: Date | null = null;
  private readonly PROJECTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

  private constructor() {
    this.baseUrl = process.env.JIRA_BASE_URL || 'https://movonte.atlassian.net';
    
    const email = process.env.JIRA_EMAIL || '';
    const token = process.env.JIRA_API_TOKEN || '';
    this.auth = Buffer.from(`${email}:${token}`).toString('base64');
    
    // Inicializar con el proyecto por defecto
    this.initializeDefaultProject();
  }

  /**
   * Obtiene la instancia singleton del ProjectManager
   */
  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Inicializa el proyecto por defecto desde las variables de entorno
   */
  private async initializeDefaultProject(): Promise<void> {
    const defaultProjectKey = process.env.JIRA_PROJECT_KEY || 'DEV';
    try {
      await this.setActiveProject(defaultProjectKey);
      console.log(`ProjectManager inicializado con proyecto por defecto: ${defaultProjectKey}`);
    } catch (error) {
      console.error('Error inicializando proyecto por defecto:', error);
    }
  }

  /**
   * Obtiene el proyecto activo actual
   */
  public getCurrentProject(): JiraProject | undefined {
    return this.currentProject;
  }

  /**
   * Obtiene la clave del proyecto activo
   */
  public getCurrentProjectKey(): string {
    return this.currentProject?.key || process.env.JIRA_PROJECT_KEY || 'DEV';
  }

  /**
   * Obtiene la URL base de Jira
   */
  public getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Obtiene la autenticación para las peticiones a Jira
   */
  public getAuth(): string {
    return this.auth;
  }

  /**
   * Establece un proyecto como activo
   */
  public async setActiveProject(projectKey: string): Promise<ProjectManagerResponse> {
    try {
      console.log(`Cambiando proyecto activo a: ${projectKey}`);
      
      // Verificar si el proyecto existe
      const project = await this.getProjectDetails(projectKey);
      
      if (!project) {
        return {
          success: false,
          error: `Proyecto '${projectKey}' no encontrado`
        };
      }

      // Establecer como proyecto activo
      this.currentProject = project;
      
      console.log(`Proyecto activo cambiado exitosamente a: ${project.name} (${project.key})`);
      
      return {
        success: true,
        message: `Proyecto activo cambiado a: ${project.name} (${project.key})`,
        currentProject: project
      };
    } catch (error) {
      console.error(`Error cambiando proyecto activo a ${projectKey}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Obtiene los detalles de un proyecto específico
   */
  public async getProjectDetails(projectKey: string): Promise<JiraProject | undefined> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/project/${projectKey}`,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error) {
      console.error(`Error obteniendo detalles del proyecto ${projectKey}:`, error);
      return undefined;
    }
  }

  /**
   * Obtiene todos los proyectos disponibles (con cache)
   */
  public async getAvailableProjects(): Promise<ProjectManagerResponse> {
    try {
      // Verificar si el cache es válido
      const now = new Date();
      if (this.lastProjectsUpdate && 
          (now.getTime() - this.lastProjectsUpdate.getTime()) < this.PROJECTS_CACHE_TTL &&
          this.availableProjects.length > 0) {
        return {
          success: true,
          message: 'Proyectos obtenidos desde cache',
          availableProjects: this.availableProjects,
          currentProject: this.currentProject
        };
      }

      console.log('Obteniendo lista de proyectos desde Jira...');
      
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/project`,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json'
          },
          params: {
            expand: 'description,lead,url,avatarUrls'
          }
        }
      );

      this.availableProjects = response.data;
      this.lastProjectsUpdate = now;

      console.log(`Se encontraron ${this.availableProjects.length} proyectos`);

      return {
        success: true,
        message: `Se encontraron ${this.availableProjects.length} proyectos`,
        availableProjects: this.availableProjects,
        currentProject: this.currentProject
      };
    } catch (error) {
      console.error('Error obteniendo proyectos disponibles:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Busca proyectos por nombre o clave
   */
  public async searchProjects(query: string): Promise<ProjectManagerResponse> {
    try {
      const projectsResponse = await this.getAvailableProjects();
      
      if (!projectsResponse.success || !projectsResponse.availableProjects) {
        return projectsResponse;
      }

      const queryLower = query.toLowerCase();
      const filteredProjects = projectsResponse.availableProjects.filter(project => 
        project.name.toLowerCase().includes(queryLower) ||
        project.key.toLowerCase().includes(queryLower) ||
        (project.description && project.description.toLowerCase().includes(queryLower))
      );

      return {
        success: true,
        message: `Se encontraron ${filteredProjects.length} proyectos que coinciden con '${query}'`,
        availableProjects: filteredProjects,
        currentProject: this.currentProject
      };
    } catch (error) {
      console.error(`Error buscando proyectos con query '${query}':`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Valida la conexión con Jira
   */
  public async validateConnection(): Promise<ProjectManagerResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/rest/api/3/myself`,
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json'
          }
        }
      );

      return {
        success: true,
        message: `Conexión exitosa con Jira. Usuario: ${response.data.displayName}`,
        currentProject: this.currentProject
      };
    } catch (error) {
      console.error('Error validando conexión con Jira:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error de conexión'
      };
    }
  }

  /**
   * Actualiza la configuración de autenticación
   */
  public updateAuthConfig(email: string, token: string): void {
    this.auth = Buffer.from(`${email}:${token}`).toString('base64');
    // Limpiar cache de proyectos para forzar actualización
    this.availableProjects = [];
    this.lastProjectsUpdate = null;
    console.log('Configuración de autenticación actualizada');
  }

  /**
   * Actualiza la URL base de Jira
   */
  public updateBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
    // Limpiar cache de proyectos para forzar actualización
    this.availableProjects = [];
    this.lastProjectsUpdate = null;
    console.log(`URL base de Jira actualizada a: ${baseUrl}`);
  }

  /**
   * Obtiene información del estado actual del ProjectManager
   */
  public getStatus(): ProjectManagerResponse {
    return {
      success: true,
      message: 'Estado del ProjectManager',
      currentProject: this.currentProject,
      availableProjects: this.availableProjects.length > 0 ? this.availableProjects : undefined
    };
  }
}

