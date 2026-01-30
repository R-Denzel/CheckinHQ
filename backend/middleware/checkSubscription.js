const User = require('../models/User');

/**
 * Trial/Subscription Check Middleware
 * Blocks access to features if trial expired and no active subscription
 */
const checkSubscription = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Admin users bypass subscription checks
    if (user.is_admin) {
      return next();
    }
    
    // If user doesn't have trial fields yet (migration pending), allow access temporarily
    // but this should not happen in production after migration
    if (user.trial_expires_at === undefined || user.subscription_status === undefined) {
      console.warn(`User ${user.id} missing subscription fields - allowing access temporarily`);
      return next();
    }
    
    const now = new Date();
    const trialExpired = new Date(user.trial_expires_at) < now;
    
    // Check if trial expired and no active subscription
    if (trialExpired && user.subscription_status !== 'active') {
      return res.status(403).json({ 
        error: 'Subscription required',
        message: 'Your CheckinHQ trial has ended. Please subscribe to continue managing bookings.',
        trialExpired: true,
        subscriptionStatus: user.subscription_status,
        trialExpiresAt: user.trial_expires_at
      });
    }
    
    // Attach subscription info to request for potential use in controllers
    req.subscriptionStatus = user.subscription_status;
    req.trialExpiresAt = user.trial_expires_at;
    req.trialExpired = trialExpired;
    
    next();
  } catch (error) {
    console.error('Subscription check error:', error);
    // On database errors, block access (fail closed for security)
    return res.status(500).json({ 
      error: 'Unable to verify subscription status. Please try again.'
    });
  }
};

module.exports = checkSubscription;
