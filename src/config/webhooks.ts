/**
 * Webhook configuration for n8n workflow integration
 * Each module has its own dedicated webhook URL for isolated processing
 */

export interface WebhookConfig {
  invoice: string;
  kdr: string;
  ga: string;
  kdri: string;
}

// Default webhook URLs - these should be configured via environment variables
// or updated with your actual n8n workflow webhook URLs
const webhookConfig: WebhookConfig = {
  invoice: import.meta.env.VITE_INVOICE_WEBHOOK_URL || 'https://n8n.srv1009033.hstgr.cloud/webhook/invoice',
  kdr: import.meta.env.VITE_KDR_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdr',
  ga: import.meta.env.VITE_GA_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ga',
  kdri: import.meta.env.VITE_KDRI_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdri',
};

/**
 * Get the webhook URL for a specific module
 */
export function getWebhookUrl(module: keyof WebhookConfig): string {
  return webhookConfig[module];
}

/**
 * Send a message to the webhook and return the response
 * Routes through Vercel API endpoints for proper handling
 */
export async function sendToWebhook(
  module: keyof WebhookConfig,
  message: string,
  files?: File[],
  sessionId?: string
): Promise<{ success: boolean; response: string; error?: string }> {
  try {
    // Use Vercel API endpoint instead of direct webhook URL
    const apiUrl = '/api/webhook/chat';

    // Create FormData to support file uploads
    const formData = new FormData();
    formData.append('message', message);
    formData.append('module', module);

    // Add session ID for chat isolation
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }

    // Add timestamp for tracking
    formData.append('timestamp', new Date().toISOString());

    // Add files if present
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        formData.append('files', file);
      });
    }

    // Send to Vercel API endpoint
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - browser will set it automatically with boundary for FormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed: ${response.status} ${response.statusText}`);
    }

    // Parse response
    const data = await response.json();

    return {
      success: data.success || true,
      response: data.response || data.message || 'Message processed successfully',
    };
  } catch (error) {
    console.error('Webhook error:', error);

    // Provide user-friendly error message
    let errorMessage = 'Failed to process message. Please try again.';

    if (error instanceof Error) {
      if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Could not connect to the server. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. The n8n workflow may be taking too long to respond.';
      } else if (error.message.includes('404')) {
        errorMessage = 'Webhook not found. Please verify the n8n workflow is published and the URL is correct.';
      } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
        errorMessage = 'Server error. Please check if the n8n workflow has any errors.';
      }
    }

    return {
      success: false,
      response: errorMessage,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate a unique session ID for chat isolation
 * This ensures each user's chat remains completely isolated
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}
