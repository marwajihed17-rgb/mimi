/**
 * Vercel Serverless Function for Chat Webhook
 * POST /api/webhook/chat
 */

const FormData = require('form-data');
const fetch = require('node-fetch');

// Webhook URLs configuration
const WEBHOOK_URLS = {
  invoice: process.env.VITE_INVOICE_WEBHOOK_URL || 'https://n8n.srv1009033.hstgr.cloud/webhook/invoice',
  kdr: process.env.VITE_KDR_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdr',
  ga: process.env.VITE_GA_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ga',
  kdri: process.env.VITE_KDRI_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdri',
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    // Vercel automatically parses the body for JSON and form data
    const { message, module, sessionId, timestamp } = req.body;

    console.log('Received webhook request:', { module, messageLength: message?.length, sessionId });

    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    if (!module || !WEBHOOK_URLS[module]) {
      return res.status(400).json({
        success: false,
        error: 'Valid module is required (invoice, kdr, ga, kdri)'
      });
    }

    // Get the webhook URL for the specified module
    const webhookUrl = WEBHOOK_URLS[module];
    console.log('Forwarding to webhook URL:', webhookUrl);

    // Create FormData for n8n webhook
    const formData = new FormData();
    formData.append('message', message);
    formData.append('module', module);
    formData.append('sessionId', sessionId || `session_${Date.now()}`);
    formData.append('timestamp', timestamp || new Date().toISOString());

    // Note: File uploads from browser FormData to serverless functions require special handling
    // For now, we'll support text-based messages. File upload support can be added with
    // additional configuration using libraries like 'busboy' or 'formidable' if needed.

    // Forward to n8n webhook with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData,
        headers: formData.getHeaders(),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('n8n response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error('Webhook request failed:', response.status, response.statusText, errorText);
        throw new Error(`n8n webhook returned ${response.status}: ${response.statusText}. ${errorText}`);
      }

      // Parse and return n8n response
      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { message: text };
      }

      console.log('n8n response received:', { hasMessage: !!data.message, hasResponse: !!data.response });

      res.status(200).json({
        success: true,
        response: data.message || data.response || 'Message processed successfully',
        data: data
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);

      if (fetchError.name === 'AbortError') {
        console.error('Webhook request timeout');
        throw new Error('The n8n webhook took too long to respond (timeout after 25 seconds). Please check your n8n workflow.');
      }
      throw fetchError;
    }

  } catch (error) {
    console.error('Webhook error:', error);

    // Provide more helpful error messages
    let userMessage = 'Sorry, I encountered an error processing your message.';

    if (error.message.includes('timeout')) {
      userMessage = 'The request timed out. Please check if your n8n workflow is running and responsive.';
    } else if (error.message.includes('ECONNREFUSED')) {
      userMessage = 'Could not connect to n8n. Please verify the webhook URL is correct and n8n is accessible.';
    } else if (error.message.includes('404')) {
      userMessage = 'The n8n webhook was not found. Please check the webhook URL configuration.';
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      userMessage = 'n8n encountered an error. Please check your workflow for errors.';
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message',
      response: userMessage,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};
