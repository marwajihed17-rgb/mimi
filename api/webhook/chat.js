/**
 * Vercel Serverless Function for Chat Webhook
 * POST /api/webhook/chat
 */

const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Configure multer for serverless
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Webhook URLs configuration
const WEBHOOK_URLS = {
  invoice: process.env.VITE_INVOICE_WEBHOOK_URL || 'https://n8n.srv1009033.hstgr.cloud/webhook/invoice',
  kdr: process.env.VITE_KDR_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdr',
  ga: process.env.VITE_GA_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ga',
  kdri: process.env.VITE_KDRI_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdri',
};

// Helper to parse multipart form data in serverless
const runMiddleware = (req, res, fn) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
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
    // Run multer middleware
    await runMiddleware(req, res, upload.array('files', 10));

    const { message, module, sessionId, timestamp } = req.body;

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

    // Create FormData for n8n webhook
    const formData = new FormData();
    formData.append('message', message);
    formData.append('module', module);
    formData.append('sessionId', sessionId || `session_${Date.now()}`);
    formData.append('timestamp', timestamp || new Date().toISOString());

    // Add files if present
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        formData.append(`file_${index}`, file.buffer, {
          filename: file.originalname,
          contentType: file.mimetype
        });
      });
      formData.append('fileCount', req.files.length.toString());
    }

    // Forward to n8n webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
    }

    // Parse and return n8n response
    const data = await response.json();

    res.status(200).json({
      success: true,
      response: data.message || data.response || 'Message processed successfully',
      data: data
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process message',
      response: 'Sorry, I encountered an error processing your message. Please try again.'
    });
  }
};
