const axios = require('axios');

/**
 * Pesapal Payment Service (API 3.0)
 * Handles M-Pesa, Airtel Money, Card payments
 */

const PESAPAL_BASE_URL = process.env.PESAPAL_ENV === 'production'
  ? 'https://pay.pesapal.com/v3'
  : 'https://cybqa.pesapal.com/pesapalv3';

let accessToken = null;
let tokenExpiry = null;

/**
 * Get OAuth Access Token
 */
const getAccessToken = async () => {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Auth/RequestToken`,
      {
        consumer_key: process.env.PESAPAL_CONSUMER_KEY,
        consumer_secret: process.env.PESAPAL_CONSUMER_SECRET
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    accessToken = response.data.token;
    // Token expires in ~5 minutes, refresh after 4 minutes
    tokenExpiry = Date.now() + (4 * 60 * 1000);
    
    console.log('✓ Pesapal access token obtained');
    return accessToken;
  } catch (error) {
    console.error('✗ Failed to get Pesapal token:', error.response?.data || error.message);
    throw new Error('Payment system authentication failed');
  }
};

/**
 * Register IPN (Webhook) URL
 * This tells Pesapal where to send payment notifications
 */
const registerIPN = async () => {
  try {
    const token = await getAccessToken();
    const ipnUrl = `${process.env.BACKEND_URL || 'https://checkinhq-backend-production.up.railway.app'}/api/payments/pesapal-ipn`;

    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/URLSetup/RegisterIPN`,
      {
        url: ipnUrl,
        ipn_notification_type: 'GET' // Pesapal sends GET requests
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✓ Pesapal IPN registered:', response.data);
    return response.data;
  } catch (error) {
    // IPN might already be registered, that's OK
    console.warn('⚠️  Pesapal IPN registration:', error.response?.data?.message || error.message);
    return null;
  }
};

/**
 * Get list of registered IPNs
 */
const getIPNList = async () => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${PESAPAL_BASE_URL}/api/URLSetup/GetIpnList`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('✗ Failed to get IPN list:', error.response?.data || error.message);
    return [];
  }
};

/**
 * Submit Order Request (Create Payment)
 */
const submitOrderRequest = async (orderDetails) => {
  try {
    const token = await getAccessToken();
    
    const payload = {
      id: orderDetails.orderId, // Your unique order ID
      currency: orderDetails.currency || 'KES',
      amount: orderDetails.amount,
      description: orderDetails.description,
      callback_url: orderDetails.callbackUrl, // Where to redirect after payment
      notification_id: orderDetails.ipnId, // IPN ID from registerIPN
      billing_address: {
        email_address: orderDetails.email,
        phone_number: orderDetails.phone || '',
        country_code: 'KE',
        first_name: orderDetails.firstName || '',
        last_name: orderDetails.lastName || '',
        line_1: '',
        line_2: '',
        city: '',
        state: '',
        postal_code: '',
        zip_code: ''
      }
    };

    const response = await axios.post(
      `${PESAPAL_BASE_URL}/api/Transactions/SubmitOrderRequest`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✓ Pesapal order created:', response.data.order_tracking_id);
    return {
      success: true,
      orderTrackingId: response.data.order_tracking_id,
      merchantReference: response.data.merchant_reference,
      redirectUrl: response.data.redirect_url // User pays here
    };
  } catch (error) {
    console.error('✗ Failed to create Pesapal order:', error.response?.data || error.message);
    throw new Error('Failed to initialize payment');
  }
};

/**
 * Get Transaction Status
 */
const getTransactionStatus = async (orderTrackingId) => {
  try {
    const token = await getAccessToken();
    
    const response = await axios.get(
      `${PESAPAL_BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );

    return {
      success: true,
      status: response.data.payment_status_description, // 'Completed', 'Failed', 'Pending'
      amount: response.data.amount,
      currency: response.data.currency,
      paymentMethod: response.data.payment_method,
      merchantReference: response.data.merchant_reference,
      confirmation_code: response.data.confirmation_code
    };
  } catch (error) {
    console.error('✗ Failed to get transaction status:', error.response?.data || error.message);
    return {
      success: false,
      status: 'Unknown'
    };
  }
};

module.exports = {
  getAccessToken,
  registerIPN,
  getIPNList,
  submitOrderRequest,
  getTransactionStatus
};
