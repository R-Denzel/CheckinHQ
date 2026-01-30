-- Railway Database Migration - Run in Railway Shell
-- Copy and paste this into Railway's database shell or backend service terminal

-- Add trial_expires_at column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 days');

-- Add subscription_status column  
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'trial';

-- Add constraint for valid subscription statuses
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'valid_subscription_status'
  ) THEN
    ALTER TABLE users 
    ADD CONSTRAINT valid_subscription_status 
    CHECK (subscription_status IN ('trial', 'active', 'expired'));
  END IF;
END $$;

-- Update existing users with trial period
UPDATE users 
SET trial_expires_at = created_at + INTERVAL '30 days',
    subscription_status = CASE 
      WHEN created_at + INTERVAL '30 days' > CURRENT_TIMESTAMP THEN 'trial'
      ELSE 'expired'
    END
WHERE trial_expires_at IS NULL;

-- Verify migration
SELECT 
  'Migration Complete!' as status,
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE subscription_status = 'trial') as trial_users,
  COUNT(*) FILTER (WHERE subscription_status = 'active') as active_users,
  COUNT(*) FILTER (WHERE subscription_status = 'expired') as expired_users
FROM users
WHERE is_admin = false;
