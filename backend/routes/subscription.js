const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const isAdmin = require('../middleware/isAdmin');
const User = require('../models/User');

/**
 * Subscription Routes
 */

// Get current user's subscription status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const now = new Date();
    const trialExpired = user.trial_expires_at && new Date(user.trial_expires_at) < now;
    const daysRemaining = user.trial_expires_at 
      ? Math.ceil((new Date(user.trial_expires_at) - now) / (1000 * 60 * 60 * 24))
      : 0;
    
    res.json({
      subscriptionStatus: user.subscription_status,
      trialExpiresAt: user.trial_expires_at,
      trialExpired,
      daysRemaining: daysRemaining > 0 ? daysRemaining : 0,
      hasActiveAccess: user.is_admin || user.subscription_status === 'active' || !trialExpired
    });
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    res.status(500).json({ error: 'Failed to fetch subscription status' });
  }
});

// Admin: Activate subscription for a user
router.post('/activate/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = require('../database/db');
    
    await pool.query(
      `UPDATE users SET subscription_status = 'active' WHERE id = $1`,
      [userId]
    );
    
    res.json({ message: 'Subscription activated successfully' });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

// Admin: Deactivate subscription for a user
router.post('/deactivate/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = require('../database/db');
    
    await pool.query(
      `UPDATE users SET subscription_status = 'expired' WHERE id = $1`,
      [userId]
    );
    
    res.json({ message: 'Subscription deactivated successfully' });
  } catch (error) {
    console.error('Error deactivating subscription:', error);
    res.status(500).json({ error: 'Failed to deactivate subscription' });
  }
});

// Admin: Toggle subscription for a user
router.post('/toggle/:userId', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const pool = require('../database/db');
    
    // Get current status
    const userResult = await pool.query(
      'SELECT subscription_status FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const currentStatus = userResult.rows[0].subscription_status;
    const newStatus = currentStatus === 'active' ? 'expired' : 'active';
    
    await pool.query(
      'UPDATE users SET subscription_status = $1 WHERE id = $2',
      [newStatus, userId]
    );
    
    res.json({ 
      message: `Subscription ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
      newStatus 
    });
  } catch (error) {
    console.error('Error toggling subscription:', error);
    res.status(500).json({ error: 'Failed to toggle subscription' });
  }
});

// Admin: Get all users with subscription info
router.get('/users', authMiddleware, isAdmin, async (req, res) => {
  try {
    const pool = require('../database/db');
    
    const result = await pool.query(`
      SELECT 
        id, 
        email, 
        business_name, 
        subscription_status, 
        trial_expires_at,
        created_at,
        CASE 
          WHEN trial_expires_at < CURRENT_TIMESTAMP THEN true 
          ELSE false 
        END as trial_expired
      FROM users 
      WHERE is_admin = false
      ORDER BY created_at DESC
    `);
    
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;
