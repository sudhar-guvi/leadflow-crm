module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Health check
  if (req.url === '/api/health' || req.url === '/health') {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      mongodb_uri_set: !!process.env.MONGODB_URI,
      message: 'API is working!'
    });
    return;
  }

  // For now, return a placeholder for other routes
  res.status(200).json({
    message: 'LeadFlow CRM API',
    version: '1.0.0',
    endpoints: [
      'GET /api/health - Health check',
      'GET /api/leads - Get all leads',
      'POST /api/leads - Create lead',
      'GET /api/dashboard/summary - Dashboard stats'
    ],
    note: 'Please set MONGODB_URI environment variable to enable full functionality'
  });
};
