import { Request, Response } from 'express';
import { JiraService } from '../services/jira_service';
import { GiveawayFormData, ContactApiResponse } from '../types';

// Handles entries for a specific contest/promo (currently the Jira Life
// Podcast Giveaway on the WorkLedger page). Kept separate from
// LandingController so giveaway traffic can never accidentally fall back
// to the shared contact project.
export class GiveawayController {
  constructor(private jiraService: JiraService) {}

  async createGiveawayTicket(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, company, entitlement, source } = req.body;

      if (!name || !email || !entitlement) {
        res.status(400).json({
          success: false,
          error: 'Name, email and entitlement are required'
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
        return;
      }

      const formData: GiveawayFormData = {
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        company: company ? String(company).trim() : undefined,
        entitlement: String(entitlement).trim(),
        source: source ? String(source).trim() : 'workledger.html'
      };

      console.log('Creating giveaway ticket:', {
        name: formData.name,
        email: formData.email,
        company: formData.company,
        entitlement: formData.entitlement
      });

      const jiraResponse = await this.jiraService.createGiveawayIssue(formData);

      console.log('Giveaway ticket created successfully:', jiraResponse.key);

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
      console.error('Error creating giveaway ticket:', error);

      let errorMessage = 'Failed to create giveaway ticket';
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
}
