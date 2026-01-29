const Analytics = require('../models/Analytics');

/**
 * Analytics Controller
 * Handles analytics requests for hosts and admin
 */

/**
 * Get host analytics
 * GET /api/analytics/host
 */
exports.getHostAnalytics = async (req, res) => {
  try {
    const analytics = await Analytics.getHostAnalytics(req.userId);
    res.json({ analytics });
  } catch (error) {
    console.error('Get host analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

/**
 * Get admin analytics
 * GET /api/analytics/admin
 */
exports.getAdminAnalytics = async (req, res) => {
  try {
    // Check if user is admin (you can add this check in middleware)
    const dashboard = await Analytics.getAdminDashboard();
    const trends = await Analytics.getWeeklyTrends();
    const userStats = await Analytics.getUserStats();
    
    res.json({ dashboard, trends, userStats });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch admin analytics' });
  }
};
