-- Allow 'cancelled' status on subscription_payments
alter table subscription_payments
  drop constraint if exists subscription_payments_status_check;

alter table subscription_payments
  add constraint subscription_payments_status_check
  check (status in ('pending', 'done', 'failed', 'cancelled'));
