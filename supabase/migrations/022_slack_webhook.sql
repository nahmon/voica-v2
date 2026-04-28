-- 022_slack_webhook.sql
-- Add Slack Incoming Webhook URL per interview for session completion notifications
ALTER TABLE interviews ADD COLUMN IF NOT EXISTS slack_webhook_url text;
