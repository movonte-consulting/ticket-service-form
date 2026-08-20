import axios from 'axios';
import { ContactFormData, HubSpotContactResult, HubSpotConnectionResult } from '../types';

/**
 * Servicio para registrar los contactos del formulario en el CRM de HubSpot.
 *
 * Usa la API de Contacts v3 con un token de Private App. El envío es
 * complementario al ticket de Jira: ningún error de HubSpot debe romper
 * la creación del ticket, por eso ningún método de esta clase lanza
 * excepciones (siempre devuelven un HubSpotContactResult).
 *
 * Nota: este envío es server-to-server, sin cookie de tracking, por lo que
 * los contactos quedan con "Original source = Offline sources" en HubSpot.
 * La atribución de campañas requiere instalar el script de tracking en la
 * landing y reenviar la cookie hubspotutk; queda fuera de este alcance.
 */
export class HubSpotService {
  /** Scopes mínimos que necesita la Private App para sincronizar contactos */
  private static readonly REQUIRED_SCOPES = ['crm.objects.contacts.write'];

  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.HUBSPOT_BASE_URL || 'https://api.hubapi.com';
    this.accessToken = process.env.HUBSPOT_ACCESS_TOKEN || '';
    this.timeout = Number(process.env.HUBSPOT_TIMEOUT_MS) || 8000;
  }

  /**
   * Indica si el servicio tiene credenciales para operar.
   * Sin token configurado el envío se omite en silencio.
   */
  public isEnabled(): boolean {
    return this.accessToken.length > 0;
  }

  /**
   * Crea o actualiza el contacto en HubSpot a partir de los datos del formulario.
   * Nunca lanza: los errores se devuelven dentro del resultado.
   */
  public async upsertContact(formData: ContactFormData): Promise<HubSpotContactResult> {
    if (!this.isEnabled()) {
      console.log('HubSpot deshabilitado (falta HUBSPOT_ACCESS_TOKEN), se omite el envío');
      return { success: false, skipped: true, error: 'HubSpot no configurado' };
    }

    try {
      const contactId = await this.createContact(formData);
      console.log(`Contacto creado en HubSpot: ${contactId}`);
      return { success: true, contactId, created: true };
    } catch (error: any) {
      const existingId = this.extractExistingContactId(error);

      // 409: el contacto ya existe, se actualiza en lugar de crearlo
      if (existingId) {
        try {
          await this.updateContact(existingId, formData);
          console.log(`Contacto actualizado en HubSpot: ${existingId}`);
          return { success: true, contactId: existingId, created: false };
        } catch (updateError: any) {
          return this.buildErrorResult('actualizando el contacto en', updateError);
        }
      }

      return this.buildErrorResult('creando el contacto en', error);
    }
  }

  /**
   * Verifica que el token de HubSpot sea válido y tenga los scopes necesarios.
   *
   * Consulta el endpoint de información del token en lugar de leer contactos:
   * así la validación no obliga a conceder el scope de lectura, que la
   * sincronización no necesita (crear y actualizar son ambas escritura).
   */
  public async testConnection(): Promise<HubSpotConnectionResult> {
    if (!this.isEnabled()) {
      return { success: false, skipped: true, error: 'HubSpot no configurado' };
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/oauth/v2/private-apps/get/access-token-info`,
        { tokenKey: this.accessToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeout
        }
      );

      const scopes: string[] = response.data.scopes || [];
      const missingScopes = HubSpotService.REQUIRED_SCOPES.filter(
        (scope) => !scopes.includes(scope)
      );

      return {
        success: missingScopes.length === 0,
        hubId: response.data.hubId,
        scopes,
        missingScopes,
        error: missingScopes.length
          ? `Al token le faltan scopes: ${missingScopes.join(', ')}`
          : undefined
      };
    } catch (error: any) {
      return this.buildErrorResult('validando la conexión con', error);
    }
  }

  private async createContact(formData: ContactFormData): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/crm/v3/objects/contacts`,
      {
        properties: {
          ...this.mapFormToProperties(formData),
          // Solo al crear: no se toca el ciclo de vida de un contacto existente
          lifecyclestage: 'lead'
        }
      },
      {
        headers: this.buildHeaders(),
        timeout: this.timeout
      }
    );

    return response.data.id;
  }

  private async updateContact(contactId: string, formData: ContactFormData): Promise<void> {
    await axios.patch(
      `${this.baseUrl}/crm/v3/objects/contacts/${contactId}`,
      { properties: this.mapFormToProperties(formData) },
      {
        headers: this.buildHeaders(),
        timeout: this.timeout
      }
    );
  }

  /**
   * Mapea los campos del formulario a propiedades por defecto de HubSpot.
   * Se omiten las propiedades vacías para no borrar datos de un contacto existente.
   */
  private mapFormToProperties(formData: ContactFormData): Record<string, string> {
    const { firstName, lastName } = this.splitName(formData.name);

    const properties: Record<string, string> = {
      email: formData.email,
      firstname: firstName
    };

    if (lastName) properties.lastname = lastName;
    if (formData.phone) properties.phone = formData.phone;
    if (formData.company) properties.company = formData.company;
    if (formData.message) properties.message = formData.message;

    return properties;
  }

  /**
   * Separa el campo único "name" del formulario en nombre y apellidos.
   */
  private splitName(name: string): { firstName: string; lastName: string } {
    const parts = name.trim().split(/\s+/);

    return {
      firstName: parts[0] || name,
      lastName: parts.slice(1).join(' ')
    };
  }

  /**
   * Extrae el ID del contacto existente cuando HubSpot responde 409 (duplicado).
   */
  private extractExistingContactId(error: any): string | undefined {
    if (error.response?.status !== 409) {
      return undefined;
    }

    const message: string = error.response?.data?.message || '';
    const match = message.match(/Existing ID:\s*(\d+)/i);

    return match ? match[1] : undefined;
  }

  private buildHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private buildErrorResult(action: string, error: any): HubSpotContactResult & HubSpotConnectionResult {
    const status = error.response?.status;
    const details = error.response?.data;

    console.error(`Error ${action} HubSpot:`, {
      status,
      statusText: error.response?.statusText,
      data: details
    });

    const message = details?.message || error.message || 'Error desconocido';

    return {
      success: false,
      error: status ? `HubSpot ${status}: ${message}` : message
    };
  }
}
