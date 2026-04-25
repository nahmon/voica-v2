-- 020_payments.sql
-- Orders (일회성 크레딧 충전)
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id text NOT NULL,
  amount integer NOT NULL CHECK (amount > 0),
  credits integer NOT NULL CHECK (credits > 0),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'FAILED')),
  toss_payment_key text,
  toss_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_user_read" ON orders FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_orders_user ON orders(user_id, created_at DESC);

-- Credits (크레딧 잔액)
CREATE TABLE IF NOT EXISTS credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0 CHECK (balance >= 0),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credits_user_read" ON credits FOR SELECT USING (auth.uid() = user_id);

-- Credit transactions (적립/차감 로그)
CREATE TABLE IF NOT EXISTS credit_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('purchase', 'usage', 'refund')),
  order_id text REFERENCES orders(id),
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_tx_user_read" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_credit_tx_user ON credit_transactions(user_id, created_at DESC);

-- Subscriptions (월 구독)
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id text NOT NULL DEFAULT 'pro_monthly',
  billing_key text NOT NULL,
  customer_key text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'past_due', 'unpaid', 'canceled')),
  amount integer NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  retry_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_user_read" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE INDEX idx_subscriptions_renewal ON subscriptions(current_period_end)
  WHERE status IN ('active', 'past_due') AND cancel_at_period_end = false;

-- Payment attempts (정기결제 시도 로그)
CREATE TABLE IF NOT EXISTS payment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id),
  order_id text,
  amount integer NOT NULL,
  status text NOT NULL CHECK (status IN ('succeeded', 'failed')),
  toss_payment_key text,
  error_code text,
  error_message text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_attempts_user_read" ON payment_attempts FOR SELECT USING (auth.uid() = user_id);

-- RPC: 크레딧 원자적 적립
CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_amount integer, p_order_id text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO credits (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = credits.balance + p_amount,
        updated_at = now();

  INSERT INTO credit_transactions (user_id, amount, type, order_id, description)
  VALUES (p_user_id, p_amount, 'purchase', p_order_id, '크레딧 충전');
END;
$$;
