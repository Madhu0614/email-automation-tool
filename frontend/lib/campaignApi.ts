const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface CampaignStep {
  id: string;
  subject: string;
  body: string;
  delay_days: number;
}

export interface CampaignSchedule {
  start_date: string;
  start_time: string;
  timezone: string;
  send_days: string[];
  send_time_start: string;
  send_time_end: string;
  max_emails_per_day: number;
  pause_between_emails: number;
  follow_up_delay: number;
  enable_smart_timing: boolean;
  respect_recipient_timezone: boolean;
  pause_on_weekends: boolean;
  auto_resume_after_pause: boolean;
  tracking_enabled: boolean;
  unsubscribe_link: string;
  reply_handling: string;
}

export interface CampaignCreate {
  campaign_name: string;
  email_list_filename: string;
  email_steps: CampaignStep[];
  campaign_schedule: CampaignSchedule;
  sender_accounts: string[];
}

export interface Campaign {
  id: string;
  campaign_name: string;
  email_list_filename: string;
  email_steps: CampaignStep[];
  campaign_schedule: CampaignSchedule;
  sender_accounts: string[];
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed';
  created_at: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  current_step: number;
}

export interface CampaignStatus {
  campaign_id: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  current_step: number;
  next_send_time?: string;
}

class CampaignApi {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      if (!response.ok) {
        let errorData;
        let errorText;
        
        try {
          errorText = await response.text();
          console.log('Raw error response text:', errorText);
          
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { raw_text: errorText };
          }
        } catch {
          errorData = { error: 'Could not read response' };
        }
        
        console.error('API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData,
          errorText: errorText,
          url: url
        });
        
        // Handle different error formats
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        console.log('Raw errorData:', errorData);
        console.log('errorData type:', typeof errorData);
        console.log('errorData keys:', Object.keys(errorData || {}));
        
        if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (Array.isArray(errorData)) {
          errorMessage = errorData.map((err: any) => {
            if (typeof err === 'string') return err;
            if (err.msg) return err.msg;
            if (err.message) return err.message;
            if (err.loc) return `${err.loc.join('.')}: ${err.msg || err.message || 'Validation error'}`;
            return JSON.stringify(err);
          }).join(', ');
        } else if (errorData && typeof errorData === 'object') {
          // Handle Pydantic validation errors - check for 'detail' array
          if (errorData.detail && Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => {
              if (err.loc) {
                const location = err.loc.join('.');
                return `${location}: ${err.msg || 'Validation error'}`;
              }
              return err.msg || JSON.stringify(err);
            }).join(', ');
          } else if (errorData.length && errorData.length > 0) {
            errorMessage = errorData.map((err: any) => {
              if (err.loc) return `${err.loc.join('.')}: ${err.msg || 'Validation error'}`;
              return err.msg || JSON.stringify(err);
            }).join(', ');
          } else {
            // Try to extract meaningful error from object
            const errorKeys = Object.keys(errorData);
            if (errorKeys.length > 0) {
              const firstKey = errorKeys[0];
              const firstValue = errorData[firstKey];
              if (typeof firstValue === 'string') {
                errorMessage = firstValue;
              } else if (Array.isArray(firstValue)) {
                errorMessage = firstValue.join(', ');
              } else {
                errorMessage = JSON.stringify(errorData);
              }
            } else {
              errorMessage = JSON.stringify(errorData);
            }
          }
        }
        
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Create a new campaign
  async createCampaign(campaignData: CampaignCreate): Promise<{ message: string; campaign_id: string; status: string }> {
    return this.request('/api/campaigns/create', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  // Get all campaigns
  async getCampaigns(): Promise<Campaign[]> {
    return this.request('/api/campaigns');
  }

  // Get specific campaign
  async getCampaign(campaignId: string): Promise<Campaign> {
    return this.request(`/api/campaigns/${campaignId}`);
  }

  // Start a campaign
  async startCampaign(campaignId: string): Promise<{ message: string; campaign_id: string; status: string }> {
    return this.request(`/api/campaigns/${campaignId}/start`, {
      method: 'POST',
    });
  }

  // Pause a campaign
  async pauseCampaign(campaignId: string): Promise<{ message: string }> {
    return this.request(`/api/campaigns/${campaignId}/pause`, {
      method: 'POST',
    });
  }

  // Resume a campaign
  async resumeCampaign(campaignId: string): Promise<{ message: string }> {
    return this.request(`/api/campaigns/${campaignId}/resume`, {
      method: 'POST',
    });
  }

  // Delete a campaign
  async deleteCampaign(campaignId: string): Promise<{ message: string }> {
    return this.request(`/api/campaigns/${campaignId}`, {
      method: 'DELETE',
    });
  }

  // Get email accounts for sender selection
  async getEmailAccounts(): Promise<any[]> {
    return this.request('/email/accounts');
  }

  // Validate CSV file structure
  async validateCsvFile(filename: string): Promise<any> {
    return this.request(`/api/csv/validate/${filename}`);
  }

  // Get CSV preview
  async getCsvPreview(filename: string, numRows: number = 5): Promise<any[]> {
    return this.request(`/api/csv/preview/${filename}?rows=${numRows}`);
  }

  // Debug method to validate campaign data
  async debugValidateCampaign(campaignData: any): Promise<any> {
    return this.request('/api/debug/validate-campaign', {
      method: 'POST',
      body: JSON.stringify(campaignData),
    });
  }

  // Debug method to check database status
  async debugDatabaseStatus(): Promise<any> {
    return this.request('/api/debug/database-status');
  }

  // Debug method to test validation error structure
  async debugTestValidation(): Promise<any> {
    return this.request('/api/debug/test-validation', {
      method: 'POST',
    });
  }
}

// Export a singleton instance
export const campaignApi = new CampaignApi();

// Export the class for testing or custom instances
export default CampaignApi; 