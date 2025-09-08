import { Request, Response } from 'express';
import { JiraService } from '../services/jira_service';
import { ProjectManagerResponse } from '../types';

export class ProjectController {
  constructor(private jiraService: JiraService) {}

  /**
   * Obtiene el proyecto activo actual
   */
  async getCurrentProject(req: Request, res: Response): Promise<void> {
    try {
      const projectManager = this.jiraService.getProjectManager();
      const currentProject = projectManager.getCurrentProject();

      if (!currentProject) {
        res.status(404).json({
          success: false,
          error: 'No hay proyecto activo configurado'
        });
        return;
      }

      const response: ProjectManagerResponse = {
        success: true,
        message: 'Proyecto activo obtenido exitosamente',
        currentProject: currentProject
      };

      res.json(response);
    } catch (error) {
      console.error('Error obteniendo proyecto activo:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Cambia el proyecto activo
   */
  async setActiveProject(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey } = req.body;

      if (!projectKey) {
        res.status(400).json({
          success: false,
          error: 'La clave del proyecto (projectKey) es requerida'
        });
        return;
      }

      const projectManager = this.jiraService.getProjectManager();
      const result = await projectManager.setActiveProject(projectKey);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('Error cambiando proyecto activo:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtiene todos los proyectos disponibles
   */
  async getAvailableProjects(req: Request, res: Response): Promise<void> {
    try {
      const projectManager = this.jiraService.getProjectManager();
      const result = await projectManager.getAvailableProjects();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error obteniendo proyectos disponibles:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Busca proyectos por nombre o clave
   */
  async searchProjects(req: Request, res: Response): Promise<void> {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'El parámetro de búsqueda (query) es requerido'
        });
        return;
      }

      const projectManager = this.jiraService.getProjectManager();
      const result = await projectManager.searchProjects(query);

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error buscando proyectos:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtiene los detalles de un proyecto específico
   */
  async getProjectDetails(req: Request, res: Response): Promise<void> {
    try {
      const { projectKey } = req.params;

      if (!projectKey) {
        res.status(400).json({
          success: false,
          error: 'La clave del proyecto (projectKey) es requerida'
        });
        return;
      }

      const projectManager = this.jiraService.getProjectManager();
      const project = await projectManager.getProjectDetails(projectKey);

      if (project) {
        const response: ProjectManagerResponse = {
          success: true,
          message: `Detalles del proyecto ${projectKey} obtenidos exitosamente`,
          currentProject: project
        };
        res.json(response);
      } else {
        res.status(404).json({
          success: false,
          error: `Proyecto '${projectKey}' no encontrado`
        });
      }
    } catch (error) {
      console.error('Error obteniendo detalles del proyecto:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Valida la conexión con Jira
   */
  async validateConnection(req: Request, res: Response): Promise<void> {
    try {
      const projectManager = this.jiraService.getProjectManager();
      const result = await projectManager.validateConnection();

      if (result.success) {
        res.json(result);
      } else {
        res.status(500).json(result);
      }
    } catch (error) {
      console.error('Error validando conexión:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Obtiene el estado del ProjectManager
   */
  async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const projectManager = this.jiraService.getProjectManager();
      const result = projectManager.getStatus();

      res.json(result);
    } catch (error) {
      console.error('Error obteniendo estado del ProjectManager:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Actualiza la configuración de autenticación
   */
  async updateAuthConfig(req: Request, res: Response): Promise<void> {
    try {
      const { email, token } = req.body;

      if (!email || !token) {
        res.status(400).json({
          success: false,
          error: 'Email y token son requeridos'
        });
        return;
      }

      const projectManager = this.jiraService.getProjectManager();
      projectManager.updateAuthConfig(email, token);

      const response: ProjectManagerResponse = {
        success: true,
        message: 'Configuración de autenticación actualizada exitosamente'
      };

      res.json(response);
    } catch (error) {
      console.error('Error actualizando configuración de autenticación:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }

  /**
   * Actualiza la URL base de Jira
   */
  async updateBaseUrl(req: Request, res: Response): Promise<void> {
    try {
      const { baseUrl } = req.body;

      if (!baseUrl) {
        res.status(400).json({
          success: false,
          error: 'La URL base es requerida'
        });
        return;
      }

      const projectManager = this.jiraService.getProjectManager();
      projectManager.updateBaseUrl(baseUrl);

      const response: ProjectManagerResponse = {
        success: true,
        message: `URL base actualizada a: ${baseUrl}`
      };

      res.json(response);
    } catch (error) {
      console.error('Error actualizando URL base:', error);
      
      const response: ProjectManagerResponse = {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };

      res.status(500).json(response);
    }
  }
}
