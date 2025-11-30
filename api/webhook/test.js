/**
 * Vercel Serverless Function for Testing n8n Webhook Connectivity
 * GET /api/webhook/test?module=invoice
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const module = req.query.module || 'invoice';

  if (!WEBHOOK_URLS[module]) {
    return res.status(400).json({
      success: false,
      error: 'Valid module is required (invoice, kdr, ga, kdri)'
    });
  }

  const webhookUrl = WEBHOOK_URLS[module];
  const results = {
    module,
    webhookUrl,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Basic connectivity
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const formData = new FormData();
    formData.append('message', 'Test connection from Vercel');
    formData.append('module', module);
    formData.append('sessionId', `test_${Date.now()}`);
    formData.append('timestamp', new Date().toISOString());

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    results.tests.connectivity = {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    };

    // Try to read response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      results.tests.response = {
        success: true,
        contentType: 'application/json',
        data: data
      };
    } else {
      const text = await response.text();
      results.tests.response = {
        success: true,
        contentType: contentType || 'text/plain',
        data: text.substring(0, 500) // Limit to 500 chars
      };
    }

  } catch (error) {
    results.tests.connectivity = {
      success: false,
      error: error.message,
      errorName: error.name,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }

  res.status(200).json(results);
};
