const User = require('../models/User');

/**
 * Admin Authorization Middleware
 * Verifies user has admin privileges
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user || !user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    next();
  } catch (error) {
    console.error('Admin check error:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

module.exports = isAdmin;
