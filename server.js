/**
 * HTTP Endpoint Server for Chat Webhook Integration
 * This server receives HTTP requests and forwards them to n8n webhooks
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook URLs configuration
const WEBHOOK_URLS = {
  invoice: process.env.VITE_INVOICE_WEBHOOK_URL || 'https://n8n.srv1009033.hstgr.cloud/webhook/invoice',
  kdr: process.env.VITE_KDR_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdr',
  ga: process.env.VITE_GA_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/ga',
  kdri: process.env.VITE_KDRI_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/kdri',
};

/**
 * Main chat endpoint
 * POST /webhook/chat
 *
 * Body:
 * {
 *   "message": "User message text",
 *   "module": "invoice|kdr|ga|kdri",
 *   "sessionId": "unique-session-id",
 *   "timestamp": "ISO timestamp"
 * }
 *
 * Optional: Files can be uploaded using multipart/form-data
 */
app.post('/webhook/chat', upload.array('files', 10), async (req, res) => {
  try {
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

    res.json({
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
});

/**
 * Health check endpoint
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    endpoints: {
      chat: '/webhook/chat'
    }
  });
});

/**
 * Get webhook configuration
 * GET /webhook/config
 */
app.get('/webhook/config', (req, res) => {
  res.json({
    modules: Object.keys(WEBHOOK_URLS),
    endpoints: {
      chat: {
        url: '/webhook/chat',
        method: 'POST',
        contentType: 'application/json or multipart/form-data',
        requiredFields: ['message', 'module'],
        optionalFields: ['sessionId', 'timestamp', 'files']
      }
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Chat Webhook HTTP Endpoint Server                        ║
╚════════════════════════════════════════════════════════════╝

🚀 Server running on: http://localhost:${PORT}

📍 Endpoints:
   • POST   /webhook/chat    - Main chat endpoint
   • GET    /health          - Health check
   • GET    /webhook/config  - Configuration info

📦 Configured modules:
${Object.keys(WEBHOOK_URLS).map(m => `   • ${m}`).join('\n')}

✅ Ready to receive requests!
  `);
});

module.exports = app;
