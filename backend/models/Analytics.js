const pool = require('../database/db');

/**
 * Analytics Model
 * Handles all analytics queries for hosts and admin
 */
class Analytics {
  /**
   * Get host analytics for current month
   */
  static async getHostAnalytics(userId) {
    const query = `
      WITH current_month_bookings AS (
        SELECT *
        FROM bookings
        WHERE user_id = $1
          AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
          AND EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE)
      ),
      follow_ups AS (
        SELECT COUNT(*) FILTER (WHERE follow_up_done = TRUE) as completed,
               COUNT(*) as total
        FROM bookings
        WHERE user_id = $1
          AND (
            last_contacted_at IS NULL 
            OR last_contacted_at < NOW() - INTERVAL '48 hours'
          )
          AND status NOT IN ('Checked Out')
      )
      SELECT 
        (SELECT COUNT(*) FROM current_month_bookings) as total_bookings_this_month,
        (SELECT COALESCE(SUM(deposit_amount), 0) FROM current_month_bookings) as total_deposits_this_month,
        (SELECT completed FROM follow_ups) as follow_ups_completed,
        (SELECT total FROM follow_ups) as follow_ups_total,
        CASE 
          WHEN (SELECT total FROM follow_ups) > 0 
          THEN ROUND(((SELECT completed FROM follow_ups)::numeric / (SELECT total FROM follow_ups)::numeric * 100), 1)
          ELSE 0 
        END as follow_up_completion_rate
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get admin analytics - active hosts per week
   */
  static async getActiveHostsThisWeek() {
    const query = `
      SELECT COUNT(DISTINCT id) as active_hosts
      FROM users
      WHERE last_login_at >= NOW() - INTERVAL '7 days'
        AND is_admin = FALSE
    `;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].active_hosts);
  }

  /**
   * Get bookings added this week
   */
  static async getBookingsThisWeek() {
    const query = `
      SELECT COUNT(*) as bookings_this_week
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].bookings_this_week);
  }

  /**
   * Get deposits recorded this week
   */
  static async getDepositsThisWeek() {
    const query = `
      SELECT COALESCE(SUM(deposit_amount), 0) as deposits_this_week
      FROM bookings
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `;
    
    const result = await pool.query(query);
    return parseFloat(result.rows[0].deposits_this_week);
  }

  /**
   * Get follow-ups completed this week
   */
  static async getFollowUpsCompletedThisWeek() {
    const query = `
      SELECT COUNT(*) as follow_ups_completed
      FROM bookings
      WHERE follow_up_done = TRUE
        AND updated_at >= NOW() - INTERVAL '7 days'
    `;
    
    const result = await pool.query(query);
    return parseInt(result.rows[0].follow_ups_completed);
  }

  /**
   * Get comprehensive admin dashboard data
   */
  static async getAdminDashboard() {
    const [
      activeHosts,
      bookingsThisWeek,
      depositsThisWeek,
      followUpsCompleted
    ] = await Promise.all([
      this.getActiveHostsThisWeek(),
      this.getBookingsThisWeek(),
      this.getDepositsThisWeek(),
      this.getFollowUpsCompletedThisWeek()
    ]);

    const avgBookingsPerHost = activeHosts > 0 ? (bookingsThisWeek / activeHosts).toFixed(1) : 0;
    const avgRevenuePerHost = activeHosts > 0 ? (depositsThisWeek / activeHosts).toFixed(2) : 0;

    return {
      activeHosts,
      bookingsThisWeek,
      depositsThisWeek: parseFloat(depositsThisWeek.toFixed(2)),
      followUpsCompleted,
      avgBookingsPerHost: parseFloat(avgBookingsPerHost),
      avgRevenuePerHost: parseFloat(avgRevenuePerHost)
    };
  }

  /**
   * Get weekly trends for last 4 weeks
   */
  static async getWeeklyTrends() {
    const query = `
      WITH weeks AS (
        SELECT 
          date_trunc('week', created_at) as week_start,
          COUNT(*) as bookings,
          COALESCE(SUM(deposit_amount), 0) as deposits
        FROM bookings
        WHERE created_at >= NOW() - INTERVAL '4 weeks'
        GROUP BY week_start
        ORDER BY week_start DESC
        LIMIT 4
      )
      SELECT 
        to_char(week_start, 'Mon DD') as week_label,
        bookings,
        deposits
      FROM weeks
      ORDER BY week_start ASC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Get individual user stats for admin dashboard
   */
  static async getUserStats() {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.business_name,
        u.business_type,
        u.last_login_at,
        u.subscription_status,
        u.trial_expires_at,
        CASE 
          WHEN u.trial_expires_at IS NOT NULL AND u.trial_expires_at < CURRENT_TIMESTAMP THEN true 
          ELSE false 
        END as trial_expired,
        COUNT(b.id) as total_bookings,
        COUNT(CASE WHEN b.created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as bookings_this_week,
        COALESCE(SUM(b.deposit_amount), 0) as total_deposits,
        COALESCE(SUM(CASE WHEN b.created_at >= NOW() - INTERVAL '7 days' THEN b.deposit_amount ELSE 0 END), 0) as deposits_this_week,
        COUNT(CASE WHEN b.follow_up_done = TRUE AND b.updated_at >= NOW() - INTERVAL '7 days' THEN 1 END) as follow_ups_this_week,
        MAX(b.created_at) as last_booking_date
      FROM users u
      LEFT JOIN bookings b ON u.id = b.user_id
      WHERE u.is_admin = FALSE
      GROUP BY u.id, u.email, u.business_name, u.business_type, u.last_login_at, u.subscription_status, u.trial_expires_at
      ORDER BY total_bookings DESC, u.last_login_at DESC
    `;
    
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Analytics;
