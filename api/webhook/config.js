/**
 * Vercel Serverless Function for Webhook Configuration
 * GET /api/webhook/config
 */

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

  res.status(200).json({
    modules: Object.keys(WEBHOOK_URLS),
    endpoints: {
      chat: {
        url: '/api/webhook/chat',
        method: 'POST',
        contentType: 'application/json or multipart/form-data',
        requiredFields: ['message', 'module'],
        optionalFields: ['sessionId', 'timestamp', 'files']
      }
    }
  });
};
