/**
 * Vercel Serverless Function for Authentication
 * POST /api/auth/login
 *
 * This endpoint acts as a proxy for Google Sheets authentication
 * to avoid CORS issues when fetching from the client
 */

const fetch = require('node-fetch');

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
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Get Google Sheets URL from environment
    const sheetUrl = process.env.VITE_GOOGLE_SHEET_URL;

    if (!sheetUrl) {
      console.error('VITE_GOOGLE_SHEET_URL not configured');
      return res.status(500).json({
        success: false,
        error: 'Authentication service not configured'
      });
    }

    // Fetch the CSV data from Google Sheets
    const response = await fetch(sheetUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch authentication data: ${response.status}`);
    }

    const csv = await response.text();

    // Parse CSV
    const parseCsv = (text) => {
      const lines = text.split('\n').filter((l) => l.trim().length > 0);
      const rows = [];
      for (const line of lines) {
        const cells = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuotes = !inQuotes;
            }
          } else if (ch === ',' && !inQuotes) {
            cells.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        cells.push(cur.trim());
        rows.push(cells);
      }
      return rows;
    };

    const normalizeModule = (m) => {
      const k = m.trim().toLowerCase();
      if (k.includes('invoice')) return 'invoice';
      if (k.includes('kdr invoicing')) return 'kdri';
      if (k.includes('kdr processing')) return 'kdr';
      if (k === 'kdr') return 'kdr';
      if (k.includes('ga')) return 'ga';
      return '';
    };

    const rows = parseCsv(csv);
    const dataRows = rows.slice(1); // Skip header row

    // Find matching user
    const match = dataRows.find((r) => {
      const u = r[1] || '';
      const p = r[2] || '';
      return u.toLowerCase() === username.toLowerCase() && p === password;
    });

    if (!match) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Extract and normalize modules
    const rawModules = (match[3] || '')
      .split(',')
      .map((m) => normalizeModule(m))
      .filter(Boolean);

    const modules = Array.from(new Set(rawModules));

    // Return success with user data
    res.status(200).json({
      success: true,
      username: match[1] || username,
      modules: modules
    });

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed. Please try again.'
    });
  }
};
