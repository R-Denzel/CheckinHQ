const crypto = require('crypto');
const pesapalService = require('../services/pesapalService');
const User = require('../models/User');
const pool = require('../database/db');

/**
 * Payment Controller
 * Handles Pesapal payment processing
 */

/**
 * Initialize subscription payment
 * POST /api/payments/subscribe
 */
exports.initializePayment = async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const { plan } = req.body; // 'monthly' or 'yearly'
    
    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Define pricing (you can adjust these)
    const pricing = {
      monthly: { amount: 1000, currency: 'KES', description: 'CheckinHQ Monthly Subscription' },
      yearly: { amount: 10000, currency: 'KES', description: 'CheckinHQ Yearly Subscription' }
    };

    const selectedPlan = pricing[plan] || pricing.monthly;
    
    // Generate unique order ID
    const orderId = `CHECKIN-${userId}-${Date.now()}`;
    
    // Get or register IPN
    let ipnId = process.env.PESAPAL_IPN_ID;
    if (!ipnId) {
      const ipnList = await pesapalService.getIPNList();
      if (ipnList && ipnList.length > 0) {
        ipnId = ipnList[0].ipn_id;
      } else {
        const ipnData = await pesapalService.registerIPN();
        ipnId = ipnData?.ipn_id;
      }
    }

    // Create payment order
    const orderResult = await pesapalService.submitOrderRequest({
      orderId,
      amount: selectedPlan.amount,
      currency: selectedPlan.currency,
      description: selectedPlan.description,
      email: user.email,
      phone: user.phone_number || '',
      firstName: user.business_name || 'Customer',
      lastName: '',
      callbackUrl: `${process.env.FRONTEND_URL}/subscription?payment=success`,
      ipnId
    });

    // Store payment record in database
    await pool.query(
      `INSERT INTO payments (user_id, order_id, order_tracking_id, amount, currency, status, plan_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [userId, orderId, orderResult.orderTrackingId, selectedPlan.amount, selectedPlan.currency, 'pending', plan]
    );

    console.log(`✓ Payment initialized for user ${userId}:`, orderId);

    res.json({
      success: true,
      orderId,
      orderTrackingId: orderResult.orderTrackingId,
      redirectUrl: orderResult.redirectUrl, // Send user here to pay
      amount: selectedPlan.amount,
      currency: selectedPlan.currency
    });
  } catch (error) {
    console.error('Error initializing payment:', error);
    res.status(500).json({ error: error.message || 'Failed to initialize payment' });
  }
};

/**
 * Pesapal IPN (Instant Payment Notification) Handler
 * GET /api/payments/pesapal-ipn
 */
exports.handleIPN = async (req, res) => {
  try {
    const { OrderTrackingId, OrderMerchantReference } = req.query;
    
    console.log('📬 Pesapal IPN received:', { OrderTrackingId, OrderMerchantReference });

    if (!OrderTrackingId) {
      return res.status(400).send('Missing OrderTrackingId');
    }

    // Get transaction status from Pesapal
    const transaction = await pesapalService.getTransactionStatus(OrderTrackingId);
    
    if (!transaction.success) {
      console.error('✗ Failed to verify transaction:', OrderTrackingId);
      return res.status(200).send('OK'); // Still return 200 to stop Pesapal retries
    }

    console.log('Transaction status:', transaction.status);

    // Update payment record
    const paymentResult = await pool.query(
      `UPDATE payments 
       SET status = $1, 
           payment_method = $2,
           confirmation_code = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE order_tracking_id = $4
       RETURNING user_id, plan_type`,
      [
        transaction.status.toLowerCase(),
        transaction.paymentMethod,
        transaction.confirmation_code,
        OrderTrackingId
      ]
    );

    if (paymentResult.rows.length === 0) {
      console.warn('⚠️  Payment record not found:', OrderTrackingId);
      return res.status(200).send('OK');
    }

    const payment = paymentResult.rows[0];

    // If payment completed, activate subscription
    if (transaction.status.toLowerCase() === 'completed') {
      const planMonths = payment.plan_type === 'yearly' ? 12 : 1;
      const expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + planMonths);

      await pool.query(
        `UPDATE users 
         SET subscription_status = 'active',
             subscription_expires_at = $1
         WHERE id = $2`,
        [expiryDate, payment.user_id]
      );

      console.log(`✅ Subscription activated for user ${payment.user_id} until ${expiryDate}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error handling IPN:', error);
    res.status(200).send('OK'); // Always return 200 to prevent Pesapal retry spam
  }
};

/**
 * Verify payment status (called by frontend)
 * GET /api/payments/verify/:orderTrackingId
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderTrackingId } = req.params;
    const userId = req.userId;

    // Get payment from database
    const result = await pool.query(
      `SELECT * FROM payments WHERE order_tracking_id = $1 AND user_id = $2`,
      [orderTrackingId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const payment = result.rows[0];

    // If still pending, check with Pesapal
    if (payment.status === 'pending') {
      const transaction = await pesapalService.getTransactionStatus(orderTrackingId);
      
      if (transaction.success && transaction.status.toLowerCase() === 'completed') {
        // Update payment and activate subscription
        await pool.query(
          `UPDATE payments 
           SET status = 'completed',
               payment_method = $1,
               confirmation_code = $2
           WHERE order_tracking_id = $3`,
          [transaction.paymentMethod, transaction.confirmation_code, orderTrackingId]
        );

        const planMonths = payment.plan_type === 'yearly' ? 12 : 1;
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + planMonths);

        await pool.query(
          `UPDATE users 
           SET subscription_status = 'active',
               subscription_expires_at = $1
           WHERE id = $2`,
          [expiryDate, userId]
        );

        payment.status = 'completed';
      }
    }

    res.json({
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      planType: payment.plan_type
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
};

module.exports = {
  initializePayment: exports.initializePayment,
  handleIPN: exports.handleIPN,
  verifyPayment: exports.verifyPayment
};
